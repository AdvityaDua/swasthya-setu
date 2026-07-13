import os
import sys
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from core.models import User, PatientProfile, DoctorProfile, DiagnosticTest, MeetingTranscript, ConsultationRequest
from ai.rag import index_diagnostic_test, index_transcript, query_rag, init_pinecone_index
from chatbot.mcp_server import ask_chatbot
import uuid

def run_e2e_test():
    print("--- Starting E2E RAG & Chatbot Test ---")
    
    # 1. Ensure Pinecone index exists
    print("1. Initializing Pinecone index...")
    index = init_pinecone_index()
    if not index:
        print("❌ Failed to initialize Pinecone index. Check API Key.")
        return
    
    # 2. Create Fake Data
    print("\n2. Creating fake records in the database...")
    
    # Create a unique phone number for the fake user
    fake_phone = f"9999{str(uuid.uuid4().int)[:6]}"
    
    user, created = User.objects.get_or_create(
        phone=fake_phone,
        defaults={
            'password': 'testpassword123',
            'full_name': 'Fake Test Patient',
            'role': 'PATIENT'
        }
    )
    
    patient, created = PatientProfile.objects.get_or_create(
        user=user,
        defaults={
            'date_of_birth': '1990-01-01',
            'blood_group': 'O+',
            'known_allergies': 'Penicillin, Peanuts',
            'chronic_conditions': 'Asthma'
        }
    )
    print(f"✅ Created/Found Fake Patient: {patient.id}")

    # Create Fake Doctor
    doc_user, _ = User.objects.get_or_create(
        phone=f"8888{str(uuid.uuid4().int)[:6]}",
        defaults={'password': 'doc', 'full_name': 'Dr. Fake', 'role': 'DOCTOR'}
    )
    doctor, _ = DoctorProfile.objects.get_or_create(
        user=doc_user,
        defaults={'specialization': 'GENERAL', 'hospital_name': 'Test', 'registration_number': f'REG{uuid.uuid4().hex[:6]}', 'years_of_experience': 5}
    )

    # Create a Fake Consultation for the transcript
    consultation = ConsultationRequest.objects.create(
        patient=patient,
        doctor=doctor,
        status='SCHEDULED',
        scheduled_time='2024-01-01T10:00:00Z',
        meet_link='https://meet.google.com/abc-defg-hij'
    )

    # Create a Fake Meeting Transcript
    transcript = MeetingTranscript.objects.create(
        consultation=consultation,
        transcript_text="Doctor: Hello, how are you feeling today?\nPatient: I've been having some chest pain and shortness of breath lately.\nDoctor: Let's do some tests to check your heart and asthma levels.",
    )
    print(f"✅ Created Fake Meeting Transcript: {transcript.id}")

    # Create a Fake Diagnostic Test
    diag_test = DiagnosticTest.objects.create(
        patient=patient,
        test_type='Cardiac Marker Blood Test',
        status='COMPLETED'
    )
    print(f"✅ Created Fake Diagnostic Test: {diag_test.id}")

    # 3. Index data into Pinecone
    print("\n3. Indexing records into Pinecone via Gemini Embeddings...")
    index_transcript(transcript.id)
    index_diagnostic_test(diag_test.id)
    print("✅ Records indexed successfully.")

    # Give Pinecone a few seconds to update its index (eventual consistency)
    print("Waiting 10 seconds for Pinecone index to become available...")
    time.sleep(10)

    # 4. Test direct RAG query
    print("\n4. Testing Direct RAG Query...")
    query = "What symptoms did the patient mention?"
    print(f"Querying: '{query}'")
    results = query_rag(query, patient_id=str(patient.id), top_k=2)
    if results:
        print("✅ Direct RAG Results found:")
        for idx, res in enumerate(results):
            print(f"   [{idx+1}] {res[:100]}...")
    else:
        print("❌ No results found from RAG. (Pinecone might need more time or embedding failed)")

    # 5. Test Chatbot Agent (MCP)
    print("\n5. Testing Chatbot Agent (Gemini Tool Calling)...")
    prompt = "Can you check my records and tell me what symptoms I mentioned in my recent meeting? Also, what are my known allergies?"
    print(f"User Prompt: '{prompt}'")
    
    try:
        reply = ask_chatbot(str(patient.id), prompt)
        print("\n🤖 Chatbot Reply:")
        print("-" * 40)
        print(reply)
        print("-" * 40)
        print("✅ Chatbot Test Completed successfully.")
    except Exception as e:
        print(f"❌ Chatbot failed with error: {e}")

    # Cleanup
    print("\nCleaning up fake records...")
    diag_test.delete()
    transcript.delete()
    consultation.delete()
    doctor.delete()
    doc_user.delete()
    patient.delete()
    user.delete()
    print("✅ Cleanup complete.")

if __name__ == "__main__":
    run_e2e_test()
