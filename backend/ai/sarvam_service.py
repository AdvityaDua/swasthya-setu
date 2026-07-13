import os
import requests
import json
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class SarvamService:
    """
    Service for integrating Sarvam AI for Speech-to-Text and Text-to-Speech.
    """
    STT_URL = "https://api.sarvam.ai/speech-to-text-translate"
    STT_NATIVE_URL = "https://api.sarvam.ai/speech-to-text"
    TTS_URL = "https://api.sarvam.ai/text-to-speech"
    
    def __init__(self):
        self.api_key = getattr(settings, 'SARVAM_API_KEY', os.environ.get('SARVAM_API_KEY'))
        if not self.api_key:
            logger.warning("SARVAM_API_KEY is not configured.")
            
    def speech_to_text(self, file_path: str) -> str:
        """
        Converts Indic speech (audio file) to English text using Sarvam AI.
        """
        if not self.api_key:
            return ""
            
        try:
            headers = {
                "api-subscription-key": self.api_key
            }
            # The prompt is optional, but helps guide the transcription context
            data = {
                "prompt": "medical consultation, swasthya setu, doctor, patient, symptoms",
                "model": "saaras:v2.5"
            }
            with open(file_path, "rb") as f:
                filename = os.path.basename(file_path)
                mime_type = "audio/ogg" if filename.endswith(".ogg") else "audio/wav"
                files = {"file": (filename, f, mime_type)}
                response = requests.post(self.STT_URL, headers=headers, data=data, files=files)
            
            response.raise_for_status()
            result = response.json()
            return result.get("transcript", "")
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"Sarvam STT HTTP Error: {e.response.text}")
            print(f"Sarvam STT HTTP Error details: {e.response.text}")
            return ""
        except Exception as e:
            logger.error(f"Sarvam STT Error: {e}")
            return ""

    def speech_to_text_native(self, file_path: str) -> tuple[str, str]:
        """
        Converts Indic speech to native text and returns the detected language code.
        Returns: (transcript, language_code) e.g. ("नमस्ते", "hi-IN")
        """
        if not self.api_key:
            return "", "hi-IN"
            
        try:
            headers = {
                "api-subscription-key": self.api_key
            }
            data = {
                "prompt": "medical consultation, swasthya setu, doctor, patient, symptoms",
                "model": "saarika:v2.5"
            }
            with open(file_path, "rb") as f:
                filename = os.path.basename(file_path)
                mime_type = "audio/ogg" if filename.endswith(".ogg") else "audio/wav"
                files = {"file": (filename, f, mime_type)}
                response = requests.post(self.STT_NATIVE_URL, headers=headers, data=data, files=files)
            
            response.raise_for_status()
            result = response.json()
            # Sarvam returns language_code (e.g. 'hi-IN')
            return result.get("transcript", ""), result.get("language_code", "hi-IN")
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"Sarvam STT Native HTTP Error: {e.response.text}")
            print(f"Sarvam STT Native HTTP Error details: {e.response.text}")
            return "", "hi-IN"
        except Exception as e:
            logger.error(f"Sarvam STT Native Error: {e}")
            return "", "hi-IN"

    def text_to_speech(self, text: str, target_language_code: str = "hi-IN", speaker: str = "priya") -> str:
        """
        Converts text to an Indic language speech audio (Base64 WAV string).
        Returns the base64 audio string.
        """
        if not self.api_key:
            return ""
            
        try:
            headers = {
                "api-subscription-key": self.api_key,
                "Content-Type": "application/json"
            }
            payload = {
                "inputs": [text],
                "target_language_code": target_language_code,
                "speaker": speaker,
                "pace": 1.0,
                "speech_sample_rate": 8000,
                "enable_preprocessing": True,
                "model": "bulbul:v3"
            }
            
            response = requests.post(self.TTS_URL, headers=headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            audios = data.get("audios", [])
            if audios:
                return audios[0] # Returns base64 encoded wav string
            return ""
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"Sarvam TTS HTTP Error: {e.response.text}")
            print(f"Sarvam TTS HTTP Error details: {e.response.text}")
            return ""
        except Exception as e:
            logger.error(f"Sarvam TTS Error: {e}")
            return ""
