from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import (
    User,
    PatientProfile,
    PractitionerProfile,
    DoctorProfile,
    DiagnosticTest,
    AIInferenceResult,
    Referral
)
from doctor.models import DoctorReview


class DoctorBaseTestCase(APITestCase):

    def setUp(self):
        # Doctor
        self.doctor_user = User.objects.create_user(
            phone="7777777777",
            password="password123",
            full_name="Dr Test",
            email="doctor@test.com",
            role="DOCTOR"
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            specialization="TB",
            hospital_name="Test Hospital",
            registration_number="DOC123",
            years_of_experience=10
        )

        # Practitioner
        self.practitioner_user = User.objects.create_user(
            phone="8888888888",
            password="password123",
            full_name="Practitioner",
            email="prac@test.com",
            role="PRACTITIONER"
        )
        self.practitioner_profile = PractitionerProfile.objects.create(
            user=self.practitioner_user,
            designation="Lab Tech",
            diagnostic_center_name="Center",
            center_location="Delhi",
            experience_years=4
        )

        # Patient
        self.patient_user = User.objects.create_user(
            phone="9999999999",
            password="password123",
            full_name="Patient",
            email="patient@test.com",
            role="PATIENT"
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            address="Address",
            emergency_contact="6666666666"
        )

        # Diagnostic Test
        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            practitioner=self.practitioner_profile,
            test_type="TB",
            status="AI_DONE"
        )

        AIInferenceResult.objects.create(
            test=self.test,
            model_name="TB",
            risk_score=0.85,
            risk_level="HIGH",
            confidence=0.92
        )

        # Referral
        self.referral = Referral.objects.create(
            test=self.test,
            referred_by=self.practitioner_profile,
            referred_to=self.doctor_profile,
            urgency="HIGH",
            status="PENDING"
        )

        # Auth
        token = RefreshToken.for_user(self.doctor_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token.access_token}"
        )
        
class DoctorReferralListTest(DoctorBaseTestCase):

    def test_doctor_can_view_assigned_referrals(self):
        response = self.client.get("/api/doctor/referrals/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["urgency"], "HIGH")


class DoctorCaseDetailTest(DoctorBaseTestCase):

    def test_doctor_can_view_case_details(self):
        response = self.client.get(
            f"/api/doctor/cases/{self.test.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["test_type"], "TB")
        self.assertEqual(
            response.data["ai_result"]["risk_level"], "HIGH"
        )


class DoctorReviewTest(DoctorBaseTestCase):

    def test_doctor_can_submit_review(self):
        payload = {
            "decision": "CONFIRM",
            "notes": "AI result looks correct"
        }

        response = self.client.post(
            f"/api/doctor/referrals/{self.referral.id}/review/",
            payload,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            DoctorReview.objects.filter(referral=self.referral).exists()
        )

        self.referral.refresh_from_db()
        self.assertEqual(self.referral.status, "REVIEWED")


class DoctorCloseReferralTest(DoctorBaseTestCase):

    def test_doctor_can_close_referral(self):
        response = self.client.post(
            f"/api/doctor/referrals/{self.referral.id}/close/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.referral.refresh_from_db()
        self.assertEqual(self.referral.status, "CLOSED")


class DoctorPermissionTest(APITestCase):

    def test_non_doctor_cannot_access(self):
        user = User.objects.create_user(
            phone="1111111111",
            password="password123",
            full_name="Patient",
            email="x@test.com",
            role="PATIENT"
        )
        token = RefreshToken.for_user(user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token.access_token}"
        )

        response = self.client.get("/api/doctor/referrals/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


