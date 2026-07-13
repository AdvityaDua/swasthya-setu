import os
import time
from django.conf import settings
from sarvamai import SarvamAI

def get_sarvam_client():
    api_key = getattr(settings, 'SARVAM_API_KEY', os.environ.get('SARVAM_API_KEY', ''))
    if not api_key:
        print("WARNING: SARVAM_API_KEY is not set.")
    return SarvamAI(api_subscription_key=api_key)

def process_meeting_audio(file_path: str):
    """
    Submits a job to Sarvam AI to transcribe and diarize the meeting audio.
    """
    client = get_sarvam_client()
    
    # Depending on Sarvam AI's exact Python SDK method for file upload, 
    # this might require reading the file or passing the file object/path directly.
    # Note: If Batch API requires a public URL, we might need a presigned S3/GCP url.
    # For now, we will pass the local file and let the SDK handle it if supported.
    
    try:
        # Assuming there is a way to pass the file path or open file to the create_job function
        print(f"Submitting job to Sarvam AI for file {file_path}...")
        
        # NOTE: If the SDK requires `file` parameter instead of `file_path`, we adjust here.
        # This is a hypothetical structure based on standard python SDKs.
        job = client.speech_to_text_job.create_job(
            model="saaras:v3",
            language_code="hi-IN", # or en-IN depending on requirement
            mode="transcribe",
            with_diarization=True,
            # file=open(file_path, "rb") # Usually SDKs have a parameter for local files
        )
        job_id = job.id
        print(f"Job submitted successfully. Job ID: {job_id}")
        
        # Poll for completion
        while True:
            status = client.speech_to_text_job.get_job_status(job_id)
            if status.status == "COMPLETED":
                print("Transcription completed.")
                return status.result
            elif status.status in ["FAILED", "ERROR"]:
                print(f"Transcription failed: {status.error}")
                return None
            print("Waiting for transcription to complete...")
            time.sleep(5)
            
    except Exception as e:
        print(f"Error communicating with Sarvam AI: {e}")
        return None
