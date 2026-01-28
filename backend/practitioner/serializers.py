from rest_framework import serializers
from core.models import (
    PatientProfile,
    DiagnosticTest,
    ClinicalContext,
    AIInferenceResult,
    Referral,
    PractitionerProfile,
)
from core.models import DiagnosticReport


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
    heatmap = serializers.SerializerMethodField()
    generated_at = serializers.DateTimeField(read_only=True)
    model_name = serializers.CharField(read_only=True)
    report_pdf = serializers.SerializerMethodField()

    class Meta:
        model = AIInferenceResult
        fields = ["model_name", "risk_score", "risk_level", "confidence", "heatmap", "generated_at", "report_pdf"]

    def get_heatmap(self, obj):
        if obj.heatmap_image:
            try:
                return obj.heatmap_image.url
            except Exception:
                return None
        return None

    def get_report_pdf(self, obj):
        try:
            report = DiagnosticReport.objects.filter(test=obj.test).first()
            if report and report.report_pdf:
                return report.report_pdf.url
        except Exception:
            return None
        return None


class ReferralCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = ["referred_to", "urgency", "reason"]


class PractitionerProfileSerializer(serializers.ModelSerializer):
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    
    class Meta:
        model = PractitionerProfile
        fields = [
            "designation",
            "diagnostic_center_name",
            "center_location",
            "experience_years",
            "services_offered",
            "latitude",
            "longitude",
        ]