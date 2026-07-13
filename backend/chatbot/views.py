import base64
import os
import tempfile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .mcp_server import ask_chatbot
from core.models import PatientProfile, User
from .audio_utils import convert_wav_to_ogg_opus
from ai.sarvam_service import SarvamService

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def query_chatbot(request):
    """
    Endpoint for users to interact with the AI assistant.
    The AI uses the Model Context Protocol to fetch reports and data dynamically.
    """
    user = request.user
    message = request.data.get('message')
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    if not message:
        return Response({"error": "Message is required"}, status=400)
    
    # Determine which patient ID to restrict data access to
    patient_id = None
    
    if user.role == 'PATIENT':
        # Patients can only query their own data
        try:
            patient = PatientProfile.objects.get(user=user)
            patient_id = str(patient.id)
        except PatientProfile.DoesNotExist:
            return Response({"error": "Patient profile not found"}, status=404)
    else:
        # Doctors/Practitioners need to specify the patient they are querying about
        patient_id = request.data.get('patient_id')
        if not patient_id:
            return Response({"error": "patient_id is required for practitioners/doctors"}, status=400)
            
    try:
        reply = ask_chatbot(patient_id, message, latitude, longitude)
        return Response({"reply": reply})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def whatsapp_webhook(request):
    """
    Webhook for WhatsApp bot.
    Receives voice note base64, processes with Sarvam AI STT,
    sends to Gemini, and returns TTS base64.
    """
    phone = request.data.get('phone')
    audio_base64 = request.data.get('audio_base64')
    mime_type = request.data.get('mime_type', '')
    text = request.data.get('text')

    if not phone:
        return Response({"error": "Phone number required"}, status=400)

    # Normalize phone: if it starts with 91, strip it. WhatsApp sends like 919999999999
    if phone.startswith('91') and len(phone) == 12:
        normalized_phone = phone[2:]
    else:
        normalized_phone = phone

    print(f"WHATSAPP WEBHOOK RECEIVED - Raw Phone: {phone} | Normalized: {normalized_phone}")

    try:
        # Robust lookup: Check exact match first, then fallback to last 10 digits
        user = User.objects.filter(phone=normalized_phone).first()
        if not user:
            # Fallback: find any user whose phone ends with the last 10 digits of the normalized phone
            last_10 = normalized_phone[-10:] if len(normalized_phone) >= 10 else normalized_phone
            user = User.objects.filter(phone__endswith=last_10).first()

        if not user:
            return Response({"reply_text": "We could not find a Swasthya Setu account linked to this phone number."})
            
        if user.role != 'PATIENT':
            return Response({"reply_text": "This service is only for patients."})
            
        patient = user.patient_profile
        patient_id = str(patient.id)
        
        # Determine language for TTS and Gemini
        lang_code = user.preferred_language
        lang_map = {
            'en': 'English', 'hi': 'Hindi', 'ta': 'Tamil', 'te': 'Telugu',
            'bn': 'Bengali', 'mr': 'Marathi', 'gu': 'Gujarati', 'kn': 'Kannada',
            'ml': 'Malayalam', 'pa': 'Punjabi', 'or': 'Odia', 'as': 'Assamese', 'ur': 'Urdu'
        }
        language_name = lang_map.get(lang_code, 'English')
        sarvam_lang_code = f"{lang_code}-IN"
        
    except Exception as e:
        print(f"Error finding user: {e}")
        return Response({"reply_text": "We could not find a Swasthya Setu account linked to this phone number."})

    user_message = ""
    sarvam = SarvamService()
    
    if text:
        user_message = text
    elif audio_base64:
        # 1. Decode audio and save to temp file
        audio_data = base64.b64decode(audio_base64)
        ext = ".ogg" if "ogg" in mime_type else ".wav"
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_audio:
            temp_audio.write(audio_data)
            temp_audio_path = temp_audio.name
            
        # 2. STT via Sarvam AI
        try:
            transcribed_text, detected_lang = sarvam.speech_to_text_native(temp_audio_path)
            user_message = transcribed_text
            
            # Dynamically override the language based on the spoken audio!
            if detected_lang:
                sarvam_lang_code = detected_lang
                lang_prefix = detected_lang.split('-')[0]
                language_name = lang_map.get(lang_prefix, language_name)
        finally:
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)

    if not user_message:
        return Response({"reply_text": "Could not understand the audio. Please try again."})

    # 3. Get Gemini Reply
    try:
        reply_text = ask_chatbot(patient_id, user_message, voice_mode=True, language_name=language_name)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"reply_text": "The medical agent encountered an error."})

    # 6. Synthesize audio reply
    reply_audio_base64 = sarvam.text_to_speech(reply_text, target_language_code=sarvam_lang_code)

    response_data = {
        "reply_text": reply_text
    }
    if reply_audio_base64:
        processed_audio, mime_type = convert_wav_to_ogg_opus(reply_audio_base64)
        response_data["reply_audio_base64"] = processed_audio
        response_data["mime_type"] = mime_type

    return Response(response_data)
