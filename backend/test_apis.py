import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.conf import settings
from ai.rag import get_pinecone_client, init_pinecone_index, get_gemini_embedding
from ai.sarvam_client import get_sarvam_client

def test_keys():
    print("--- Testing API Keys ---")
    
    # 1. Test Pinecone
    print("\n1. Testing Pinecone API Key...")
    try:
        pc = get_pinecone_client()
        if pc:
            indexes = pc.list_indexes().names()
            print(f"✅ Pinecone connection successful! Available indexes: {indexes}")
        else:
            print("❌ Pinecone client failed to initialize (Key might be missing).")
    except Exception as e:
        print(f"❌ Pinecone error: {e}")

    # 2. Test Gemini
    print("\n2. Testing Gemini API Key...")
    try:
        embedding = get_gemini_embedding("This is a test document to check embeddings.")
        if embedding and len(embedding) > 0:
            print(f"✅ Gemini connection successful! Embedding generated with dimension {len(embedding)}.")
        else:
            print("❌ Gemini embedding returned empty.")
    except Exception as e:
        print(f"❌ Gemini error: {e}")

    # 3. Test Sarvam
    print("\n3. Testing Sarvam API Key...")
    try:
        sc = get_sarvam_client()
        # Just creating the client verifies if the variable is loaded, but Sarvam SDK might not auth immediately.
        if getattr(settings, 'SARVAM_API_KEY', os.environ.get('SARVAM_API_KEY')):
            print("✅ Sarvam AI Client initialized (Key is present in environment).")
        else:
            print("❌ Sarvam API Key not found in environment.")
    except Exception as e:
        print(f"❌ Sarvam error: {e}")

if __name__ == "__main__":
    test_keys()
