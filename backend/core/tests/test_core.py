from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from PIL import Image
import io

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

def get_test_image():
    file = io.BytesIO()
    image = Image.new("RGB", (100, 100))
    image.save(file, "JPEG")
    file.name = "test.jpg"
    file.seek(0)
    return file

def generate_image():
    file = io.BytesIO()
    image = Image.new("RGB", (128, 128))
    image.save(file, "JPEG")
    file.name = "scan.jpg"
    file.seek(0)
    return file


class PractitionerPatientIntegrationTest(APITestCase):

    def setUp(self):
        self.patient = User.objects.create_user(
            phone="900000001",
            password="pass",
            full_name="Patient",
            email="patient@test.com",
            role="PATIENT"
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient,
            address="Addr",
            emergency_contact="999"
        )

        self.practitioner = User.objects.create_user(
            phone="900000002",
            password="pass",
            full_name="Practitioner",
            email="prac@test.com",
            role="PRACTITIONER"
        )
        self.practitioner_profile = PractitionerProfile.objects.create(
            user=self.practitioner,
            designation="Lab",
            diagnostic_center_name="Center",
            center_location="Delhi",
            experience_years=3
        )

        token = RefreshToken.for_user(self.practitioner)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token.access_token}"
        )

    def test_practitioner_can_find_patient_and_create_test(self):
        # lookup
        res = self.client.get(
            f"/api/practitioner/patient-search/?phone={self.patient.phone}"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

        # create test
        res = self.client.post(
            "/api/practitioner/tests/create/",
            {"patient": self.patient_profile.id, "test_type": "TB"},
            format="json"
        )
        self.assertEqual(res.status_code, 201)

        test = DiagnosticTest.objects.first()
        self.assertEqual(test.patient, self.patient_profile)
    

class PractitionerDiagnosticIntegrationTest(APITestCase):

    def setUp(self):
        self.patient = User.objects.create_user(
            phone="900000003",
            password="pass",
            full_name="Patient",
            email="p@test.com",
            role="PATIENT"
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient,
            address="Addr",
            emergency_contact="999"
        )

        self.practitioner = User.objects.create_user(
            phone="900000004",
            password="pass",
            full_name="Practitioner",
            email="prac@test.com",
            role="PRACTITIONER"
        )
        self.practitioner_profile = PractitionerProfile.objects.create(
            user=self.practitioner,
            designation="Lab",
            diagnostic_center_name="Center",
            center_location="Delhi",
            experience_years=3
        )

        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            practitioner=self.practitioner_profile,
            test_type="TB",
            status="UPLOADED"
        )

        token = RefreshToken.for_user(self.practitioner)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token.access_token}"
        )

    def test_full_diagnostic_lifecycle(self):
        # upload image
        res = self.client.post(
            f"/api/practitioner/tests/{self.test.id}/upload/",
            {"image": get_test_image()},
            format="multipart"
        )
        self.assertEqual(res.status_code, 200)

        # add context
        res = self.client.post(
            f"/api/practitioner/tests/{self.test.id}/context/",
            {"symptoms": {"cough": True}},
            format="json"
        )
        self.assertEqual(res.status_code, 200)

        # run AI
        res = self.client.post(
            f"/api/practitioner/tests/{self.test.id}/run-ai/"
        )
        self.assertEqual(res.status_code, 200)

        self.assertTrue(
            AIInferenceResult.objects.filter(test=self.test).exists()
        )


class PractitionerDoctorReferralIntegrationTest(APITestCase):

    def setUp(self):
        self.doctor = User.objects.create_user(
            phone="900000005",
            password="pass",
            full_name="Doctor",
            email="doc@test.com",
            role="DOCTOR"
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor,
            specialization="TB",
            hospital_name="Hospital",
            registration_number="DOC1",
            years_of_experience=10
        )

        self.practitioner = User.objects.create_user(
            phone="900000006",
            password="pass",
            full_name="Practitioner",
            email="prac@test.com",
            role="PRACTITIONER"
        )
        self.practitioner_profile = PractitionerProfile.objects.create(
            user=self.practitioner,
            designation="Lab",
            diagnostic_center_name="Center",
            center_location="Delhi",
            experience_years=3
        )

        self.patient = User.objects.create_user(
            phone="900000007",
            password="pass",
            full_name="Patient",
            email="p@test.com",
            role="PATIENT"
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient,
            address="Addr",
            emergency_contact="999"
        )

        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            practitioner=self.practitioner_profile,
            test_type="TB",
            status="AI_DONE"
        )

        token = RefreshToken.for_user(self.practitioner)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token.access_token}"
        )

    def test_practitioner_can_refer_to_doctor(self):
        res = self.client.post(
            f"/api/practitioner/tests/{self.test.id}/refer/",
            {
                "referred_to": self.doctor_profile.id,
                "urgency": "HIGH",
                "reason": "High TB risk"
            },
            format="json"
        )
        self.assertEqual(res.status_code, 200)

        referral = Referral.objects.get(test=self.test)
        self.assertEqual(referral.referred_to, self.doctor_profile)


class DoctorReviewIntegrationTest(APITestCase):

    def setUp(self):
        self.doctor = User.objects.create_user(
            phone="900000008",
            password="pass",
            full_name="Doctor",
            email="doc@test.com",
            role="DOCTOR"
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor,
            specialization="TB",
            hospital_name="Hospital",
            registration_number="DOC2",
            years_of_experience=12
        )

        self.patient = User.objects.create_user(
            phone="900000009",
            password="pass",
            full_name="Patient",
            email="p@test.com",
            role="PATIENT"
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient,
            address="Addr",
            emergency_contact="999"
        )

        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            test_type="TB",
            status="AI_DONE"
        )

        self.referral = Referral.objects.create(
            test=self.test,
            referred_to=self.doctor_profile,
            urgency="HIGH",
            status="PENDING"
        )

        token = RefreshToken.for_user(self.doctor)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token.access_token}"
        )

    def test_doctor_review_changes_system_state(self):
        res = self.client.post(
            f"/api/doctor/referrals/{self.referral.id}/review/",
            {"decision": "CONFIRM"},
            format="json"
        )
        self.assertEqual(res.status_code, 200)

        self.referral.refresh_from_db()
        self.assertEqual(self.referral.status, "REVIEWED")



class PatientVisibilityIntegrationTest(APITestCase):

    def setUp(self):
        self.patient = User.objects.create_user(
            phone="900000010",
            password="pass",
            full_name="Patient",
            email="p@test.com",
            role="PATIENT"
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient,
            address="Addr",
            emergency_contact="999"
        )

        self.test = DiagnosticTest.objects.create(
            patient=self.patient_profile,
            test_type="TB",
            status="AI_DONE"
        )

        AIInferenceResult.objects.create(
            test=self.test,
            model_name="TB",
            risk_score=0.9,
            risk_level="HIGH",
            confidence=0.95
        )

        token = RefreshToken.for_user(self.patient)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token.access_token}"
        )

    def test_patient_can_see_final_result(self):
        res = self.client.get("/api/patient/tests/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data[0]["risk_level"], "HIGH")


class FullSystemEndToEndTest(APITestCase):
    """
    This test validates the COMPLETE Swasthya-Setu pipeline:
    Patient → Practitioner → AI → Doctor → Patient
    """

    def test_complete_system_flow(self):

        # =========================
        # 1. CREATE USERS
        # =========================

        patient = User.objects.create_user(
            phone="9111111111",
            password="pass123",
            full_name="Final Patient",
            email="final_patient@test.com",
            role="PATIENT"
        )
        patient_profile = PatientProfile.objects.create(
            user=patient,
            address="Patient Addr",
            emergency_contact="999"
        )

        practitioner = User.objects.create_user(
            phone="9222222222",
            password="pass123",
            full_name="Final Practitioner",
            email="final_prac@test.com",
            role="PRACTITIONER"
        )
        practitioner_profile = PractitionerProfile.objects.create(
            user=practitioner,
            designation="Lab Tech",
            diagnostic_center_name="Final Diagnostics",
            center_location="Delhi",
            experience_years=6
        )

        doctor = User.objects.create_user(
            phone="9333333333",
            password="pass123",
            full_name="Final Doctor",
            email="final_doctor@test.com",
            role="DOCTOR"
        )
        doctor_profile = DoctorProfile.objects.create(
            user=doctor,
            specialization="TB",
            hospital_name="Final Hospital",
            registration_number="DOC-FINAL",
            years_of_experience=18
        )

        # =========================
        # 2. PRACTITIONER FLOW
        # =========================

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(practitioner).access_token}"
        )

        # Patient search
        res = self.client.get(
            f"/api/practitioner/patient-search/?phone={patient.phone}"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

        # Create test
        res = self.client.post(
            "/api/practitioner/tests/create/",
            {"patient": patient_profile.id, "test_type": "TB"},
            format="json"
        )
        self.assertEqual(res.status_code, 201)
        test_id = res.data["test_id"]

        # Upload image
        res = self.client.post(
            f"/api/practitioner/tests/{test_id}/upload/",
            {"image": generate_image()},
            format="multipart"
        )
        self.assertEqual(res.status_code, 200)

        # Clinical context
        res = self.client.post(
            f"/api/practitioner/tests/{test_id}/context/",
            {"symptoms": {"cough": True, "fever": True}},
            format="json"
        )
        self.assertEqual(res.status_code, 200)

        # Run AI
        res = self.client.post(
            f"/api/practitioner/tests/{test_id}/run-ai/"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["risk_level"], "HIGH")

        # Refer to doctor
        res = self.client.post(
            f"/api/practitioner/tests/{test_id}/refer/",
            {
                "referred_to": doctor_profile.id,
                "urgency": "HIGH",
                "reason": "High TB probability"
            },
            format="json"
        )
        self.assertEqual(res.status_code, 200)

        referral = Referral.objects.get(test__id=test_id)
        self.assertEqual(referral.status, "PENDING")

        # =========================
        # 3. DOCTOR FLOW
        # =========================

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(doctor).access_token}"
        )

        # View referrals
        res = self.client.get("/api/doctor/referrals/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

        # View case
        res = self.client.get(
            f"/api/doctor/cases/{test_id}/"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["ai_result"]["risk_level"], "HIGH")

        # Review AI
        res = self.client.post(
            f"/api/doctor/referrals/{referral.id}/review/",
            {
                "decision": "CONFIRM",
                "notes": "Confirmed by doctor"
            },
            format="json"
        )
        self.assertEqual(res.status_code, 200)

        referral.refresh_from_db()
        self.assertEqual(referral.status, "REVIEWED")

        # Close referral
        res = self.client.post(
            f"/api/doctor/referrals/{referral.id}/close/"
        )
        self.assertEqual(res.status_code, 200)

        referral.refresh_from_db()
        self.assertEqual(referral.status, "CLOSED")

        # =========================
        # 4. PATIENT FLOW
        # =========================

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(patient).access_token}"
        )

        # Patient views tests
        res = self.client.get("/api/patient/tests/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["risk_level"], "HIGH")

        # Patient views test detail
        res = self.client.get(
            f"/api/patient/tests/{test_id}/"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(
            res.data["ai_result"]["risk_level"], "HIGH"
        )

        # =========================
        # 5. FINAL SYSTEM ASSERTIONS
        # =========================

        test = DiagnosticTest.objects.get(id=test_id)

        self.assertTrue(
            AIInferenceResult.objects.filter(test=test).exists()
        )
        self.assertTrue(
            DoctorReview.objects.filter(referral=referral).exists()
        )
        self.assertEqual(test.status, "REFERRED")