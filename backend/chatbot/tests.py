from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from core.models import User, PatientProfile
import json
from unittest.mock import patch

class ChatbotEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create a patient user
        self.patient_user = User.objects.create_user(
            phone='1234567890', 
            password='testpassword',
            full_name='Test Patient',
            role='PATIENT'
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            address='123 Test St'
        )
        
        # Create a doctor user
        self.doctor_user = User.objects.create_user(
            phone='0987654321', 
            password='testpassword',
            full_name='Test Doctor',
            role='DOCTOR'
        )

        self.url = reverse('query_chatbot')

    def test_unauthenticated_access(self):
        response = self.client.post(self.url, {'message': 'Hello'})
        self.assertEqual(response.status_code, 401)

    def test_missing_message(self):
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    @patch('chatbot.views.ask_chatbot')
    def test_patient_access_success(self, mock_ask_chatbot):
        mock_ask_chatbot.return_value = "This is a mocked response."
        
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.post(self.url, {'message': 'What is my history?'})
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['reply'], "This is a mocked response.")
        
        # Verify the mock was called with the patient's ID
        mock_ask_chatbot.assert_called_once_with(str(self.patient_profile.id), 'What is my history?')

    @patch('chatbot.views.ask_chatbot')
    def test_doctor_missing_patient_id(self, mock_ask_chatbot):
        self.client.force_authenticate(user=self.doctor_user)
        # Doctor query without specifying patient_id
        response = self.client.post(self.url, {'message': 'Tell me about the patient'})
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('patient_id is required', response.data['error'])
        mock_ask_chatbot.assert_not_called()

    @patch('chatbot.views.ask_chatbot')
    def test_doctor_with_patient_id(self, mock_ask_chatbot):
        mock_ask_chatbot.return_value = "Mocked doctor response."
        
        self.client.force_authenticate(user=self.doctor_user)
        # Doctor specifying a patient
        response = self.client.post(self.url, {
            'message': 'Tell me about the patient', 
            'patient_id': str(self.patient_profile.id)
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['reply'], "Mocked doctor response.")
        mock_ask_chatbot.assert_called_once_with(str(self.patient_profile.id), 'Tell me about the patient')
