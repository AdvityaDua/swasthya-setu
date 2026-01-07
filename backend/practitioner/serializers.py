from rest_framework import serializers
from core.models import (
    PatientProfile,
    DiagnosticTest,
    ClinicalContext,
    AIInferenceResult,
    Referral
)


class PatientLookupSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.full_name")
    phone = serializers.CharField(source="user.phone")
    abha_id = serializers.CharField(source="user.abha_id")

    class Meta:
        model = PatientProfile
        fields = ["id", "name", "phone", "abha_id"]


class DiagnosticTestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosticTest
        fields = ["patient", "test_type"]


class DiagnosticImageUploadSerializer(serializers.Serializer):
    image = serializers.FileField()


class ClinicalContextSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalContext
        fields = ["symptoms", "vitals"]


class AIResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInferenceResult
        fields = ["risk_score", "risk_level", "confidence"]


class ReferralCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = ["referred_to", "urgency", "reason"]


