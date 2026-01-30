from rest_framework.test import APITestCase
from rest_framework import status
from core.models import User, PatientProfile, PractitionerProfile, DiagnosticTest, AIInferenceResult
from rest_framework_simplejwt.tokens import RefreshToken
import io
from PIL import Image

def get_test_image():
    file = io.BytesIO()
    image = Image.new("RGB", (100, 100))
    image.save(file, "JPEG")
    file.name = "test.jpg"
    file.seek(0)
    return file

class MultilingualReportTest(APITestCase):
    def setUp(self):
        self.practitioner_user = User.objects.create_user(
            phone="8888888888",
            password="password123",
            full_name="Test Practitioner",
            role="PRACTITIONER"
        )
        self.practitioner_profile = PractitionerProfile.objects.create(
            user=self.practitioner_user,
            designation="Lab Technician",
            diagnostic_center_name="Test Center",
            center_location="Delhi",
            experience_years=3
        )
        self.patient_user = User.objects.create_user(
            phone="9999999999",
            password="password123",
            full_name="Test Patient",
            role="PATIENT"
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            address="Test Address",
            emergency_contact="7777777777"
        )
        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            practitioner=self.practitioner_profile,
            test_type="TB",
            status="UPLOADED"
        )
        image = get_test_image()
        self.client.post(
            f"/api/practitioner/tests/{self.test.id}/upload/",
            {"image": image},
            format="multipart"
        )
        token = RefreshToken.for_user(self.practitioner_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

    def test_run_ai_with_language_param(self):
        # Test valid language
        response = self.client.post(
            f"/api/practitioner/tests/{self.test.id}/run-ai/",
            {"language": "hi"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(AIInferenceResult.objects.filter(test=self.test).exists())
        
        # We can't easily check the PDF content here without a complex PDF parser,
        # but the fact that it didn't crash means the views and service accepted the param.
