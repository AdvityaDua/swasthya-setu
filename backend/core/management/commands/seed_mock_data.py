from django.core.management.base import BaseCommand
from django.utils import timezone
import random

from core.models import (
    User,
    PatientProfile,
    PractitionerProfile,
    DoctorProfile,
    DiagnosticTest,
    AIInferenceResult,
    Referral,
)
from doctor.models import DoctorReview


class Command(BaseCommand):
    help = "Seed mock data for Swasthya-Setu backend"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Seeding mock data..."))

        # =====================================================
        # USERS
        # =====================================================

        patient, _ = User.objects.get_or_create(
            phone="9000000001",
            defaults={
                "full_name": "Mock Patient",
                "email": "patient@mock.com",
                "role": "PATIENT",
            }
        )
        patient.set_password("password123")
        patient.save()

        practitioner, _ = User.objects.get_or_create(
            phone="9000000002",
            defaults={
                "full_name": "Mock Practitioner",
                "email": "practitioner@mock.com",
                "role": "PRACTITIONER",
            }
        )
        practitioner.set_password("password123")
        practitioner.save()

        doctor, _ = User.objects.get_or_create(
            phone="9000000003",
            defaults={
                "full_name": "Mock Doctor",
                "email": "doctor@mock.com",
                "role": "DOCTOR",
            }
        )
        doctor.set_password("password123")
        doctor.save()

        # =====================================================
        # PROFILES
        # =====================================================

        patient_profile, _ = PatientProfile.objects.get_or_create(
            user=patient,
            defaults={
                "address": "Mock Address, Delhi",
                "emergency_contact": "9999999999"
            }
        )

        practitioner_profile, _ = PractitionerProfile.objects.get_or_create(
            user=practitioner,
            defaults={
                "designation": "Lab Technician",
                "diagnostic_center_name": "Mock Diagnostics Center",
                "center_location": "Delhi",
                "experience_years": 5
            }
        )

        doctor_profile, _ = DoctorProfile.objects.get_or_create(
            user=doctor,
            defaults={
                "specialization": "TB",
                "hospital_name": "Mock Government Hospital",
                "registration_number": "DOC-MOCK-001",
                "years_of_experience": 15
            }
        )

        # =====================================================
        # DIAGNOSTIC TEST
        # =====================================================

        diagnostic_test, _ = DiagnosticTest.objects.get_or_create(
            patient=patient_profile,
            practitioner=practitioner_profile,
            test_type="TB",
            defaults={
                "status": "AI_DONE"
            }
        )

        # =====================================================
        # AI INFERENCE RESULT
        # =====================================================

        ai_result, _ = AIInferenceResult.objects.get_or_create(
            test=diagnostic_test,
            defaults={
                "model_name": "TB_AI_Model_v1",
                "risk_score": round(random.uniform(0.7, 0.95), 2),
                "risk_level": "HIGH",
                "confidence": round(random.uniform(0.85, 0.98), 2)
            }
        )

        # =====================================================
        # REFERRAL (Practitioner → Doctor)
        # =====================================================

        referral, _ = Referral.objects.get_or_create(
            test=diagnostic_test,
            defaults={
                "referred_by": practitioner_profile,
                "referred_to": doctor_profile,
                "urgency": "HIGH",
                "status": "PENDING"
            }
        )

        # =====================================================
        # DOCTOR REVIEW (FIXED)
        # =====================================================

        DoctorReview.objects.get_or_create(
            referral=referral,
            doctor=doctor_profile,   # ✅ REQUIRED FIELD
            defaults={
                "decision": "CONFIRM",
                "notes": "Mock review: AI result confirmed by doctor.",
                "reviewed_at": timezone.now()
            }
        )

        # =====================================================
        # DONE
        # =====================================================

        self.stdout.write(self.style.SUCCESS("Mock data seeded successfully."))