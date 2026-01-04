from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from PIL import Image
import io
from core.models import (
    User,
    PatientProfile,
    PractitionerProfile,
    DiagnosticTest,
    AIInferenceResult,
    Referral
)
from rest_framework_simplejwt.tokens import RefreshToken


def get_test_image():
    file = io.BytesIO()
    image = Image.new("RGB", (100, 100))
    image.save(file, "JPEG")
    file.name = "test.jpg"
    file.seek(0)
    return file


class PractitionerBaseTestCase(APITestCase):

    def setUp(self):
        # Practitioner user
        self.practitioner_user = User.objects.create_user(
            phone="8888888888",
            password="password123",
            full_name="Test Practitioner",
            email="practitioner@test.com",
            role="PRACTITIONER"
        )
        self.practitioner_profile = PractitionerProfile.objects.create(
            user=self.practitioner_user,
            designation="Lab Technician",
            diagnostic_center_name="Test Center",
            center_location="Delhi",
            experience_years=3
        )

        # Patient user
        self.patient_user = User.objects.create_user(
            phone="9999999999",
            password="password123",
            full_name="Test Patient",
            email="patient@test.com",
            role="PATIENT"
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            address="Test Address",
            emergency_contact="7777777777"
        )

        # Auth
        token = RefreshToken.for_user(self.practitioner_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token.access_token}"
        )


class PatientLookupTest(PractitionerBaseTestCase):

    def test_lookup_patient_by_phone(self):
        response = self.client.get(
            "/api/practitioner/patient-search/?phone=9999999999"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)


class DiagnosticTestCreateTest(PractitionerBaseTestCase):

    def test_practitioner_can_create_test(self):
        payload = {
            "patient": self.patient_profile.id,
            "test_type": "TB"
        }

        response = self.client.post(
            "/api/practitioner/tests/create/",
            payload,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(DiagnosticTest.objects.exists())


from django.core.files.uploadedfile import SimpleUploadedFile


class DiagnosticImageUploadTest(PractitionerBaseTestCase):

    def setUp(self):
        super().setUp()
        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            practitioner=self.practitioner_profile,
            test_type="TB",
            status="UPLOADED"
        )

    def test_upload_image(self):
        image = get_test_image()

        response = self.client.post(
            f"/api/practitioner/tests/{self.test.id}/upload/",
            {"image": image},
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test.refresh_from_db()
        self.assertTrue(self.test.raw_image)
        
        
class ClinicalContextTest(PractitionerBaseTestCase):

    def setUp(self):
        super().setUp()
        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            practitioner=self.practitioner_profile,
            test_type="TB",
            status="UPLOADED"
        )

    def test_add_clinical_context(self):
        payload = {
            "symptoms": {"cough": True, "fever": True},
            "vitals": {"bp": "120/80"}
        }

        response = self.client.post(
            f"/api/practitioner/tests/{self.test.id}/context/",
            payload,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class RunAITest(PractitionerBaseTestCase):

    def setUp(self):
        super().setUp()
        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            practitioner=self.practitioner_profile,
            test_type="TB",
            status="UPLOADED"
        )

    def test_run_ai(self):
        response = self.client.post(
            f"/api/practitioner/tests/{self.test.id}/run-ai/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(AIInferenceResult.objects.exists())


class ViewAIResultTest(PractitionerBaseTestCase):

    def setUp(self):
        super().setUp()
        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            practitioner=self.practitioner_profile,
            test_type="TB",
            status="AI_DONE"
        )

        AIInferenceResult.objects.create(
            test=self.test,
            model_name="TB",
            risk_score=0.8,
            risk_level="HIGH",
            confidence=0.9
        )

    def test_view_ai_result(self):
        response = self.client.get(
            f"/api/practitioner/tests/{self.test.id}/ai-result/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["risk_level"], "HIGH")


class ReferralCreateTest(PractitionerBaseTestCase):

    def setUp(self):
        super().setUp()
        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            practitioner=self.practitioner_profile,
            test_type="TB",
            status="AI_DONE"
        )

    def test_create_referral(self):
        payload = {
            "urgency": "HIGH",
            "reason": "High TB risk"
        }

        response = self.client.post(
            f"/api/practitioner/tests/{self.test.id}/refer/",
            payload,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Referral.objects.exists())