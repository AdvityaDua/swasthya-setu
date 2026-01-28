from google.oauth2 import service_account
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import os
import logging

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/calendar']


def get_calendar_service():
    """
    Initialize and return Google Calendar API service using service account credentials.
    """
    try:
        credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        if not credentials_path:
            logger.error("GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
            return None

        credentials = service_account.Credentials.from_service_account_file(
            credentials_path, scopes=SCOPES
        )

        service = build('calendar', 'v3', credentials=credentials)
        return service
    except Exception as e:
        logger.error(f"Failed to initialize Google Calendar service: {str(e)}")
        return None


def create_consultation_event(doctor_email, patient_email, patient_name, scheduled_time, consultation_request_id):
    """
    Create a Google Calendar event with Google Meet for a doctor-patient consultation.
    
    Args:
        doctor_email (str): Doctor's email address
        patient_email (str): Patient's email address
        patient_name (str): Patient's full name
        scheduled_time (datetime): When the consultation is scheduled
        consultation_request_id (str): ID of the ConsultationRequest for reference
    
    Returns:
        dict: Contains 'meet_link' and 'calendar_event_id' on success, or error details
    """
    service = get_calendar_service()
    if not service:
        return {
            'success': False,
            'error': 'Failed to initialize Google Calendar service'
        }

    try:
        # Prepare event details
        event_title = f"Consultation: {patient_name}"
        event_description = f"Online medical consultation with patient {patient_name}\nConsultation Request ID: {consultation_request_id}"
        
        # Set end time to 30 minutes after start
        end_time = scheduled_time + timedelta(minutes=30)

        event = {
            'summary': event_title,
            'description': event_description,
            'start': {
                'dateTime': scheduled_time.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'attendees': [
                {'email': doctor_email, 'responseStatus': 'accepted'},
                {'email': patient_email, 'responseStatus': 'needsAction'},
            ],
            'conferenceData': {
                'createRequest': {
                    'requestId': f'consultation-{consultation_request_id}',
                    'conferenceSolution': {
                        'key': {
                            'type': 'hangoutsMeet'
                        }
                    }
                }
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'popup', 'minutes': 15},  # 15 minutes before
                ]
            }
        }

        # Create event on doctor's calendar
        created_event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1,
            sendNotifications=True
        ).execute()

        # Extract Google Meet link
        meet_link = None
        if 'conferenceData' in created_event and 'entryPoints' in created_event['conferenceData']:
            for entry_point in created_event['conferenceData']['entryPoints']:
                if entry_point.get('entryPointType') == 'video':
                    meet_link = entry_point.get('uri')
                    break

        if not meet_link:
            logger.warning(f"No Meet link found in event {created_event.get('id')}")
            meet_link = created_event.get('hangoutLink')

        return {
            'success': True,
            'meet_link': meet_link,
            'calendar_event_id': created_event.get('id'),
            'event': created_event
        }

    except Exception as e:
        logger.error(f"Failed to create Google Calendar event: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def cancel_consultation_event(calendar_event_id, doctor_email=None):
    """
    Cancel a Google Calendar event for a consultation.
    
    Args:
        calendar_event_id (str): Google Calendar event ID to cancel
        doctor_email (str): Doctor's email (optional, uses primary calendar if not provided)
    
    Returns:
        dict: Success status and details
    """
    service = get_calendar_service()
    if not service:
        return {
            'success': False,
            'error': 'Failed to initialize Google Calendar service'
        }

    try:
        service.events().delete(
            calendarId='primary',
            eventId=calendar_event_id,
            sendNotifications=True
        ).execute()

        return {
            'success': True,
            'message': f'Event {calendar_event_id} cancelled successfully'
        }

    except Exception as e:
        logger.error(f"Failed to cancel Google Calendar event: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def update_consultation_event(calendar_event_id, scheduled_time=None, status=None):
    """
    Update an existing consultation event (e.g., reschedule or change status).
    
    Args:
        calendar_event_id (str): Google Calendar event ID
        scheduled_time (datetime): New scheduled time (optional)
        status (str): New status (optional)
    
    Returns:
        dict: Success status and updated event details
    """
    service = get_calendar_service()
    if not service:
        return {
            'success': False,
            'error': 'Failed to initialize Google Calendar service'
        }

    try:
        # Get existing event
        event = service.events().get(
            calendarId='primary',
            eventId=calendar_event_id
        ).execute()

        # Update time if provided
        if scheduled_time:
            end_time = scheduled_time + timedelta(minutes=30)
            event['start'] = {
                'dateTime': scheduled_time.isoformat(),
                'timeZone': 'Asia/Kolkata',
            }
            event['end'] = {
                'dateTime': end_time.isoformat(),
                'timeZone': 'Asia/Kolkata',
            }

        # Update event
        updated_event = service.events().update(
            calendarId='primary',
            eventId=calendar_event_id,
            body=event,
            sendNotifications=True
        ).execute()

        return {
            'success': True,
            'event': updated_event
        }

    except Exception as e:
        logger.error(f"Failed to update Google Calendar event: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
