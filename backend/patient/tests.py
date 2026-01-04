from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from core.models import (
    User,
    PatientProfile,
    PractitionerProfile,
    DiagnosticTest,
    AIInferenceResult,
    Appointment,
    Referral
)
from rest_framework_simplejwt.tokens import RefreshToken


class PatientBaseTestCase(APITestCase):

    def setUp(self):
        # Create patient user
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
            emergency_contact="8888888888"
        )

        # Auth token
        token = RefreshToken.for_user(self.patient_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token.access_token}"
        )
        
class PatientProfileTest(PatientBaseTestCase):

    def test_patient_can_view_own_profile(self):
        response = self.client.get("/api/patient/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Test Patient")
        self.assertEqual(response.data["email"], "patient@test.com")

class PatientTestListTest(PatientBaseTestCase):

    def setUp(self):
        super().setUp()

        # Create dummy test
        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            test_type="TB",
            status="AI_DONE",
            test_date=timezone.now()
        )

        AIInferenceResult.objects.create(
            test=self.test,
            model_name="TB_MODEL",
            risk_score=0.82,
            risk_level="HIGH",
            confidence=0.9
        )

    def test_patient_can_view_tests(self):
        response = self.client.get("/api/patient/tests/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["risk_level"], "HIGH")


class PatientTestDetailTest(PatientBaseTestCase):

    def setUp(self):
        super().setUp()

        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            test_type="BREAST_CANCER",
            status="AI_DONE"
        )

        AIInferenceResult.objects.create(
            test=self.test,
            model_name="BREAST_MODEL",
            risk_score=0.12,
            risk_level="LOW",
            confidence=0.95
        )

    def test_patient_can_view_test_detail(self):
        response = self.client.get(f"/api/patient/tests/{self.test.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["ai_result"]["risk_level"], "LOW")


class PatientAppointmentTest(PatientBaseTestCase):

    def setUp(self):
        super().setUp()

        Appointment.objects.create(
            patient=self.patient_profile,
            appointment_type="CONSULTATION",
            mode="ONLINE",
            scheduled_time=timezone.now() + timedelta(days=1),
            status="BOOKED"
        )

    def test_patient_can_view_appointments(self):
        response = self.client.get("/api/patient/appointments/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["status"], "BOOKED")
    

class PatientBookAppointmentTest(PatientBaseTestCase):

    def test_patient_can_book_appointment(self):
        payload = {
            "appointment_type": "DIAGNOSTIC",
            "scheduled_time": (
                timezone.now() + timedelta(days=2)
            ).isoformat()
        }

        response = self.client.post(
            "/api/patient/appointments/book/",
            payload,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            Appointment.objects.filter(
                patient=self.patient_profile
            ).exists()
        )

class PatientReferralTest(PatientBaseTestCase):

    def setUp(self):
        super().setUp()

        test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            test_type="TB",
            status="REFERRED"
        )

        Referral.objects.create(
            test=test,
            urgency="HIGH",
            status="PENDING"
        )

    def test_patient_can_view_referrals(self):
        response = self.client.get("/api/patient/referrals/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)