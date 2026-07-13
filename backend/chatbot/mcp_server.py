import json
import math
import os
from django.conf import settings
from django.utils.dateparse import parse_datetime
from google import genai
from google.genai import types

from core.models import (
    PatientProfile, DoctorProfile, PractitionerProfile, 
    DiagnosticTest, MeetingTranscript, Appointment, ConsultationRequest, Referral
)
from ai.rag import query_rag

# --- Helper Functions ---

def get_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Radius of the earth in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# --- MCP Tools ---

def get_patient_details(patient_id: str) -> str:
    """Fetches the basic profile information and medical history for a patient."""
    try:
        patient = PatientProfile.objects.select_related('user').get(id=patient_id)
        data = {
            "name": patient.user.full_name,
            "date_of_birth": str(patient.date_of_birth),
            "blood_group": patient.blood_group,
            "known_allergies": patient.known_allergies,
            "chronic_conditions": patient.chronic_conditions,
            "medical_history": patient.medical_history,
        }
        return json.dumps(data)
    except PatientProfile.DoesNotExist:
        return json.dumps({"error": "Patient not found"})

def search_patient_records(patient_id: str, query: str) -> str:
    """Searches through the patient's diagnostic tests, AI results, and meeting transcripts using RAG to answer specific questions."""
    results = query_rag(query, patient_id=patient_id, top_k=3)
    if not results:
        return json.dumps({"result": "No relevant records found."})
    return json.dumps({"result": "\n\n".join(results)})

def get_my_appointments(patient_id: str) -> str:
    """Fetches all upcoming and past diagnostic Appointments and online ConsultationRequests for the patient."""
    try:
        patient = PatientProfile.objects.get(id=patient_id)
        
        appointments = Appointment.objects.filter(patient=patient).order_by('-scheduled_time')
        consultations = ConsultationRequest.objects.filter(patient=patient).order_by('-created_at')

        app_list = [{
            "type": "Diagnostic Appointment",
            "practitioner": app.practitioner.diagnostic_center_name if app.practitioner else "Unknown",
            "scheduled_time": str(app.scheduled_time),
            "status": app.status,
            "mode": app.mode
        } for app in appointments]

        cons_list = [{
            "type": "Online Consultation",
            "doctor": f"Dr. {cons.doctor.user.full_name}" if cons.doctor else "Unknown",
            "scheduled_time": str(cons.scheduled_time) if cons.scheduled_time else "TBD",
            "status": cons.status,
            "meet_link": cons.meet_link
        } for cons in consultations]

        return json.dumps({"appointments": app_list, "consultations": cons_list})
    except PatientProfile.DoesNotExist:
        return json.dumps({"error": "Patient not found"})

def book_diagnostic_appointment(patient_id: str, practitioner_id: str, scheduled_time: str) -> str:
    """
    Books a physical diagnostic appointment for the patient. 
    `scheduled_time` must be ISO 8601 string (e.g. '2024-01-01T10:00:00Z').
    """
    try:
        patient = PatientProfile.objects.get(id=patient_id)
        practitioner = PractitionerProfile.objects.get(id=practitioner_id)
        parsed_time = parse_datetime(scheduled_time)
        
        if not parsed_time:
            return json.dumps({"error": "Invalid time format. Use ISO 8601."})

        appointment = Appointment.objects.create(
            patient=patient,
            practitioner=practitioner,
            appointment_type='DIAGNOSTIC',
            mode='IN_PERSON',
            scheduled_time=parsed_time,
            status='BOOKED'
        )
        return json.dumps({"success": True, "appointment_id": str(appointment.id), "status": "BOOKED"})
    except Exception as e:
        return json.dumps({"error": str(e)})

def request_virtual_consultation(patient_id: str, doctor_id: str, scheduled_time: str) -> str:
    """
    Requests an online virtual consultation with a specific doctor.
    `scheduled_time` must be ISO 8601 string.
    """
    try:
        patient = PatientProfile.objects.get(id=patient_id)
        doctor = DoctorProfile.objects.get(id=doctor_id)
        parsed_time = parse_datetime(scheduled_time)
        
        if not parsed_time:
            return json.dumps({"error": "Invalid time format. Use ISO 8601."})

        cons = ConsultationRequest.objects.create(
            patient=patient,
            doctor=doctor,
            status='PENDING',
            scheduled_time=parsed_time
        )
        return json.dumps({"success": True, "consultation_id": str(cons.id), "status": "PENDING", "message": "Request sent to doctor for approval."})
    except Exception as e:
        return json.dumps({"error": str(e)})

def find_nearby_doctors(specialization: str, latitude: float = 0.0, longitude: float = 0.0) -> str:
    """
    Finds doctors by specialization (e.g., 'GENERAL', 'TB', 'PNEUMONIA', 'BREAST_CANCER'). 
    If latitude and longitude are provided, sorts them by closest distance in kilometers.
    """
    doctors = DoctorProfile.objects.filter(specialization__icontains=specialization, user__is_active=True).select_related('user')
    
    results = []
    for doc in doctors:
        dist = None
        if latitude and longitude and doc.latitude and doc.longitude:
            dist = get_haversine_distance(latitude, longitude, float(doc.latitude), float(doc.longitude))
            
        results.append({
            "doctor_id": str(doc.id),
            "name": f"Dr. {doc.user.full_name}",
            "specialization": doc.specialization,
            "hospital": doc.hospital_name,
            "experience_years": doc.years_of_experience,
            "teleconsult_available": doc.is_teleconsult_available,
            "distance_km": dist
        })

    if latitude and longitude:
        results.sort(key=lambda x: x['distance_km'] if x['distance_km'] is not None else float('inf'))

    return json.dumps({"doctors": results[:10]}) # Limit to top 10

def find_nearby_practitioners(latitude: float = 0.0, longitude: float = 0.0) -> str:
    """Finds nearby diagnostic centers/practitioners. Sorts by distance if lat/lon provided."""
    practitioners = PractitionerProfile.objects.filter(user__is_active=True).select_related('user')
    
    results = []
    for p in practitioners:
        dist = None
        if latitude and longitude and p.latitude and p.longitude:
            dist = get_haversine_distance(latitude, longitude, float(p.latitude), float(p.longitude))
            
        results.append({
            "practitioner_id": str(p.id),
            "center_name": p.diagnostic_center_name,
            "location": p.center_location,
            "services": p.services_offered,
            "distance_km": dist
        })

    if latitude and longitude:
        results.sort(key=lambda x: x['distance_km'] if x['distance_km'] is not None else float('inf'))

    return json.dumps({"practitioners": results[:10]})

def get_reports_status(patient_id: str) -> str:
    """Fetches a structured list of all diagnostic tests and their current status (e.g., AI_DONE, CLOSED)."""
    try:
        patient = PatientProfile.objects.get(id=patient_id)
        tests = DiagnosticTest.objects.filter(patient=patient).order_by('-created_at')
        
        results = []
        for t in tests:
            data = {
                "test_id": str(t.id),
                "type": t.test_type,
                "status": t.status,
                "date": str(t.created_at)
            }
            results.append(data)
            
        return json.dumps({"tests": results})
    except PatientProfile.DoesNotExist:
        return json.dumps({"error": "Patient not found"})

def get_active_referrals(patient_id: str) -> str:
    """Checks if the patient has any active referrals to specialists."""
    try:
        patient = PatientProfile.objects.get(id=patient_id)
        referrals = Referral.objects.filter(test__patient=patient).select_related('referred_to', 'referred_by')
        
        results = []
        for r in referrals:
            results.append({
                "referral_id": str(r.id),
                "urgency": r.urgency,
                "status": r.status,
                "reason": r.reason,
                "referred_to_doctor": f"Dr. {r.referred_to.user.full_name}" if r.referred_to else "Pending Assignment",
                "referred_by_center": r.referred_by.diagnostic_center_name if r.referred_by else "Unknown"
            })
            
        return json.dumps({"referrals": results})
    except PatientProfile.DoesNotExist:
        return json.dumps({"error": "Patient not found"})

# Array of all our new tools
AGENT_TOOLS = [
    get_patient_details,
    search_patient_records,
    get_my_appointments,
    book_diagnostic_appointment,
    request_virtual_consultation,
    find_nearby_doctors,
    find_nearby_practitioners,
    get_reports_status,
    get_active_referrals
]

def ask_chatbot(patient_id: str, user_message: str, latitude: float = None, longitude: float = None, voice_mode: bool = False, language_name: str = 'English') -> str:
    """Main entrypoint for the chatbot endpoint."""
    api_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY', ''))
    client = genai.Client(api_key=api_key)
    
    # System instruction context
    loc_string = f"\nThe user's current GPS Location is Latitude: {latitude}, Longitude: {longitude}. NEVER ask the user for their location or coordinates. If they ask for nearby centers/doctors, strictly use these coordinates in your tool calls." if latitude and longitude else "\nUser location is unknown. Do not ask for their coordinates, just leave lat/lon as 0.0 in tool calls."
    lang_string = f"\nCRITICAL: You MUST formulate your final answer strictly in {language_name}."
    
    if voice_mode:
        sys_instruction = (
            f"You are a helpful, conversational, and empathetic medical assistant speaking to a patient on a voice call/voice note. "
            f"The user is asking about patient ID: {patient_id}. "
            f"IMPORTANT RULES:\n"
            f"1. Keep your responses EXTREMELY concise, ideally under 2 sentences (Maximum 400 characters!).\n"
            f"2. NEVER use Markdown formatting (like **, *, #) or emojis, because your response will be read aloud by a text-to-speech engine.\n"
            f"3. Speak naturally, conversationally, and empathetically, as a human doctor would on a phone call.\n"
            f"4. Do not provide links or buttons.\n"
            f"5. When calling tools, ALWAYS use patient_id = '{patient_id}'.\n"
            f"{loc_string}{lang_string}"
        )
    else:
        sys_instruction = (
            f"You are a helpful and professional medical assistant for Swasthya Setu. "
            f"The user is currently authenticated and asking about patient ID: {patient_id}. "
            f"IMPORTANT RULES:\n"
            f"1. When calling tools, ALWAYS use patient_id = '{patient_id}' unless you are specifically looking up another entity.\n"
            f"2. Never disclose other patients' data.\n"
            f"3. Help the user book appointments, find doctors, and understand their reports.\n"
            f"4. If you recommend a doctor or a diagnostic center, ALWAYS include a markdown link button to help them view it. For centers use [View Center on Map](/patient/practitioners) and for doctors use [View Doctor](/patient/doctors)."
            f"{loc_string}{lang_string}"
        )
    
    chat = client.chats.create(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            tools=AGENT_TOOLS,
            system_instruction=sys_instruction,
            temperature=0.4
        )
    )
    
    # Send message and let Gemini autonomously use tools
    try:
        response = chat.send_message(user_message)
        return response.text
    except Exception as e:
        print(f"Error in ask_chatbot: {e}")
        return "I'm sorry, I encountered an error while processing your request."
