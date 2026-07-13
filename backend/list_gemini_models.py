import os
import sys
import django
from google import genai

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.conf import settings

def list_models():
    api_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY'))
    if not api_key:
        print("No GEMINI_API_KEY found.")
        return
        
    try:
        client = genai.Client(api_key=api_key)
        models = client.models.list()
        
        print("Available models:")
        for m in models:
            print(f"- {m.name}")
            if hasattr(m, 'supported_generation_methods'):
                print(f"  Methods: {m.supported_generation_methods}")
    except Exception as e:
        print(f"Error fetching models: {e}")

if __name__ == "__main__":
    list_models()
