import os
import uuid
from google import genai
from pinecone import Pinecone, ServerlessSpec
from django.conf import settings
from core.models import DiagnosticTest, MeetingTranscript

PINECONE_INDEX_NAME = "swasthya-setu-index"
EMBEDDING_MODEL = "gemini-embedding-2" # Gemini embedding model

def get_pinecone_client():
    api_key = getattr(settings, 'PINECONE_API_KEY', os.environ.get('PINECONE_API_KEY', ''))
    if not api_key:
        print("WARNING: PINECONE_API_KEY is not set.")
        return None
    return Pinecone(api_key=api_key)

def init_pinecone_index():
    pc = get_pinecone_client()
    if not pc:
        return None
    
    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=3072, # Gemini embeddings dimension
            metric='cosine',
            spec=ServerlessSpec(
                cloud='aws',
                region='us-east-1' # Change based on your pinecone setup
            )
        )
    return pc.Index(PINECONE_INDEX_NAME)

def get_gemini_embedding(text):
    api_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY', ''))
    if not api_key:
        print("WARNING: GEMINI_API_KEY is not set.")
        return []
    
    client = genai.Client(api_key=api_key)
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
    )
    return result.embeddings[0].values

def index_diagnostic_test(test_id):
    index = init_pinecone_index()
    if not index:
        return

    try:
        test = DiagnosticTest.objects.select_related('patient', 'aiinferenceresult', 'diagnosticreport').get(id=test_id)
        
        # Build document text
        text_content = f"Diagnostic Test for {test.patient.user.full_name}.\n"
        text_content += f"Type: {test.test_type}\nStatus: {test.status}\n"
        
        if hasattr(test, 'aiinferenceresult'):
            ai = test.aiinferenceresult
            text_content += f"AI Risk Level: {ai.risk_level}, Score: {ai.risk_score}, Confidence: {ai.confidence}\n"
            
        if hasattr(test, 'diagnosticreport'):
            text_content += f"Final Risk Level: {test.diagnosticreport.final_risk_level}\n"

        embedding = get_gemini_embedding(text_content)
        if embedding:
            index.upsert(
                vectors=[
                    {
                        "id": f"test_{test.id}",
                        "values": embedding,
                        "metadata": {
                            "type": "diagnostic_test",
                            "patient_id": str(test.patient.id),
                            "test_id": str(test.id),
                            "content": text_content
                        }
                    }
                ]
            )
            print(f"Indexed Diagnostic Test {test.id}")
    except DiagnosticTest.DoesNotExist:
        pass

def index_transcript(transcript_id):
    index = init_pinecone_index()
    if not index:
        return

    try:
        transcript = MeetingTranscript.objects.select_related('consultation__patient').get(id=transcript_id)
        text_content = f"Meeting Transcript for Patient: {transcript.consultation.patient.user.full_name}\n"
        text_content += f"Date: {transcript.created_at}\n"
        text_content += f"Transcript:\n{transcript.transcript_text}\n"

        embedding = get_gemini_embedding(text_content)
        if embedding:
            index.upsert(
                vectors=[
                    {
                        "id": f"transcript_{transcript.id}",
                        "values": embedding,
                        "metadata": {
                            "type": "meeting_transcript",
                            "patient_id": str(transcript.consultation.patient.id),
                            "transcript_id": str(transcript.id),
                            "content": text_content
                        }
                    }
                ]
            )
            print(f"Indexed Transcript {transcript.id}")
    except MeetingTranscript.DoesNotExist:
        pass

def query_rag(query_text, patient_id=None, top_k=5):
    index = init_pinecone_index()
    if not index:
        return []

    # Get query embedding
    client = genai.Client(api_key=getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY', '')))
    query_result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=query_text,
    )
    query_embedding = query_result.embeddings[0].values

    filter_dict = {}
    if patient_id:
        filter_dict["patient_id"] = str(patient_id)

    response = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        filter=filter_dict if filter_dict else None
    )

    results = [match['metadata']['content'] for match in response['matches'] if 'metadata' in match]
    return results
