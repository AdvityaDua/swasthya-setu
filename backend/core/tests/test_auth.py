from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

from core.models import User


class AuthAPITestCase(APITestCase):

    def setUp(self):
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'

        self.user_data = {
            "full_name": "Test User",
            "phone": "9999999999",
            "email": "testuser@example.com",
            "role": "PATIENT",
            "abha_id": "ABHA123456",
            "password": "StrongPassword123"
        }

    # -------------------------
    # REGISTER TESTS
    # -------------------------

    def test_user_registration_success(self):
        """User should be created successfully"""
        response = self.client.post(
            self.register_url,
            self.user_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(phone="9999999999").exists())

        data = response.json()
        self.assertEqual(data["name"], self.user_data["full_name"])
        self.assertEqual(data["role"], self.user_data["role"])
        self.assertEqual(data["email"], self.user_data["email"])

    def test_user_registration_missing_password(self):
        """Registration should fail without password"""
        payload = self.user_data.copy()
        payload.pop("password")

        response = self.client.post(
            self.register_url,
            payload,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_duplicate_phone(self):
        """Duplicate phone numbers should not be allowed"""
        self.client.post(self.register_url, self.user_data, format='json')
        response = self.client.post(self.register_url, self.user_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------
    # LOGIN TESTS
    # -------------------------

    def test_user_login_success(self):
        """User should be able to login with correct credentials"""
        self.client.post(self.register_url, self.user_data, format='json')

        login_payload = {
            "phone": self.user_data["phone"],
            "password": self.user_data["password"]
        }

        response = self.client.post(
            self.login_url,
            login_payload,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        print(data)
        self.assertIn("access", data)
        self.assertEqual(data["name"], self.user_data["full_name"])
        self.assertEqual(data["role"], self.user_data["role"])
        self.assertEqual(data["phone"], self.user_data["phone"])

    def test_user_login_invalid_password(self):
        """Login should fail with wrong password"""
        self.client.post(self.register_url, self.user_data, format='json')

        response = self.client.post(
            self.login_url,
            {
                "phone": self.user_data["phone"],
                "password": "WrongPassword"
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_login_missing_fields(self):
        """Login should fail if phone or password is missing"""
        response = self.client.post(
            self.login_url,
            {"phone": self.user_data["phone"]},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)