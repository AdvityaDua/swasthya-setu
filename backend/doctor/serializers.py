from rest_framework import serializers
from core.models import Referral, DoctorProfile
from doctor.models import DoctorReview

class DoctorReferralListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(
        source="test.patient.user.full_name"
    )
    test_type = serializers.CharField(source="test.test_type")

    class Meta:
        model = Referral
        fields = [
            "id",
            "patient_name",
            "test_type",
            "urgency",
            "status",
            "created_at",
        ]


from core.models import DiagnosticTest


class DoctorCaseDetailSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(
        source="patient.user.full_name"
    )
    ai_result = serializers.SerializerMethodField()

    class Meta:
        model = DiagnosticTest
        fields = [
            "id",
            "test_type",
            "test_date",
            "status",
            "patient_name",
            "ai_result",
        ]

    def get_ai_result(self, obj):
        if not hasattr(obj, "aiinferenceresult"):
            return None
        ai = obj.aiinferenceresult
        return {
            "risk_level": ai.risk_level,
            "risk_score": ai.risk_score,
            "confidence": ai.confidence,
        }


class DoctorReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorReview
        fields = ["decision", "notes"]


class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = [
            "specialization",
            "hospital_name",
            "registration_number",
            "years_of_experience",
            "is_teleconsult_available",
            "latitude",
            "longitude",
            "availability_timings",
        ]


class DoctorListSerializer(serializers.ModelSerializer):
    doctor_id = serializers.CharField(source="user.id")
    name = serializers.CharField(source="user.full_name")
    
    class Meta:
        model = DoctorProfile
        fields = [
            "doctor_id",
            "name",
            "specialization",
            "hospital_name",
            "years_of_experience",
            "is_teleconsult_available",
            "latitude",
            "longitude",
        ]