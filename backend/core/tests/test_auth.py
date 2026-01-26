from rest_framework.test import APITestCase
from rest_framework import status

from core.models import User, PatientProfile, DoctorProfile, PractitionerProfile


class AuthAPITestCase(APITestCase):

    def setUp(self):
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'

        self.patient_data = {
            "full_name": "Test Patient",
            "phone": "9999999999",
            "email": "patient@example.com",
            "role": "PATIENT",
            "abha_id": "ABHA123456",
            "password": "StrongPassword123",
            "patient_profile_data": {
                "emergency_contact": "8888888888",
                "address": "123 Test Address",
            },
        }

        self.doctor_data = {
            "full_name": "Dr. Test Doctor",
            "phone": "8888888888",
            "email": "doctor@example.com",
            "role": "DOCTOR",
            "abha_id": None,
            "password": "StrongPassword123",
            "doctor_profile_data": {
                "specialization": "TB",
                "hospital_name": "Test Hospital",
                "registration_number": "DOC-REG-001",
                "years_of_experience": 10,
                "is_teleconsult_available": True,
            },
        }

        self.practitioner_data = {
            "full_name": "Test Practitioner",
            "phone": "7777777777",
            "email": "practitioner@example.com",
            "role": "PRACTITIONER",
            "abha_id": None,
            "password": "StrongPassword123",
            "practitioner_profile_data": {
                "designation": "Lab Technician",
                "diagnostic_center_name": "City Diagnostic Lab",
                "center_location": "456 Center Street",
                "experience_years": 5,
            },
        }

    # -------------------------
    # REGISTER TESTS
    # -------------------------

    def test_registration_patient_success(self):
        """PATIENT registration creates user and PatientProfile"""
        response = self.client.post(
            self.register_url,
            self.patient_data,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(phone="9999999999").exists())

        user = User.objects.get(phone="9999999999")
        self.assertEqual(user.role, "PATIENT")
        self.assertTrue(PatientProfile.objects.filter(user=user).exists())
        profile = user.patient_profile
        self.assertEqual(profile.emergency_contact, "8888888888")
        self.assertEqual(profile.address, "123 Test Address")

        data = response.json()
        self.assertEqual(data["name"], self.patient_data["full_name"])
        self.assertEqual(data["role"], "PATIENT")
        self.assertEqual(data["email"], self.patient_data["email"])

    def test_registration_doctor_success(self):
        """DOCTOR registration creates user and DoctorProfile"""
        response = self.client.post(
            self.register_url,
            self.doctor_data,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(phone="8888888888").exists())

        user = User.objects.get(phone="8888888888")
        self.assertEqual(user.role, "DOCTOR")
        self.assertTrue(DoctorProfile.objects.filter(user=user).exists())
        profile = user.doctor_profile
        self.assertEqual(profile.specialization, "TB")
        self.assertEqual(profile.hospital_name, "Test Hospital")
        self.assertEqual(profile.registration_number, "DOC-REG-001")
        self.assertEqual(profile.years_of_experience, 10)
        self.assertTrue(profile.is_teleconsult_available)

        data = response.json()
        self.assertEqual(data["name"], self.doctor_data["full_name"])
        self.assertEqual(data["role"], "DOCTOR")
        self.assertEqual(data["email"], self.doctor_data["email"])

    def test_registration_practitioner_success(self):
        """PRACTITIONER registration creates user and PractitionerProfile"""
        response = self.client.post(
            self.register_url,
            self.practitioner_data,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(phone="7777777777").exists())

        user = User.objects.get(phone="7777777777")
        self.assertEqual(user.role, "PRACTITIONER")
        self.assertTrue(PractitionerProfile.objects.filter(user=user).exists())
        profile = user.practitioner_profile
        self.assertEqual(profile.designation, "Lab Technician")
        self.assertEqual(profile.diagnostic_center_name, "City Diagnostic Lab")
        self.assertEqual(profile.center_location, "456 Center Street")
        self.assertEqual(profile.experience_years, 5)

        data = response.json()
        self.assertEqual(data["name"], self.practitioner_data["full_name"])
        self.assertEqual(data["role"], "PRACTITIONER")
        self.assertEqual(data["email"], self.practitioner_data["email"])

    def test_user_registration_missing_password(self):
        """Registration should fail without password"""
        payload = self.patient_data.copy()
        payload.pop("password")
        response = self.client.post(
            self.register_url,
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_duplicate_phone(self):
        """Duplicate phone numbers should not be allowed"""
        self.client.post(self.register_url, self.patient_data, format='json')
        response = self.client.post(self.register_url, self.patient_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_missing_patient_profile(self):
        """PATIENT registration should fail without patient_profile_data"""
        payload = {
            "full_name": "Test User",
            "phone": "1111111111",
            "email": "noprofile@example.com",
            "role": "PATIENT",
            "password": "StrongPassword123",
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_missing_doctor_profile(self):
        """DOCTOR registration should fail without doctor_profile_data"""
        payload = {
            "full_name": "Dr. No Profile",
            "phone": "6666666666",
            "role": "DOCTOR",
            "password": "StrongPassword123",
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_missing_practitioner_profile(self):
        """PRACTITIONER registration should fail without practitioner_profile_data"""
        payload = {
            "full_name": "Practitioner No Profile",
            "phone": "5555555555",
            "role": "PRACTITIONER",
            "password": "StrongPassword123",
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------
    # LOGIN TESTS
    # -------------------------

    def test_user_login_success(self):
        """User should be able to login with correct credentials"""
        self.client.post(self.register_url, self.patient_data, format='json')

        login_payload = {
            "phone": self.patient_data["phone"],
            "password": self.patient_data["password"],
        }

        response = self.client.post(
            self.login_url,
            login_payload,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("access", data)
        self.assertEqual(data["name"], self.patient_data["full_name"])
        self.assertEqual(data["role"], self.patient_data["role"])
        self.assertEqual(data["phone"], self.patient_data["phone"])

    def test_user_login_invalid_password(self):
        """Login should fail with wrong password"""
        self.client.post(self.register_url, self.patient_data, format='json')

        response = self.client.post(
            self.login_url,
            {
                "phone": self.patient_data["phone"],
                "password": "WrongPassword",
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_login_missing_fields(self):
        """Login should fail if phone or password is missing"""
        response = self.client.post(
            self.login_url,
            {"phone": self.patient_data["phone"]},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)