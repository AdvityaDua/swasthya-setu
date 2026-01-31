from rest_framework import serializers
from core.models import Referral, DoctorProfile
from doctor.models import DoctorReview

class DoctorReferralListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(
        source="test.patient.user.full_name"
    )
    test_id = serializers.CharField(source="test.id")
    test_type = serializers.CharField(source="test.test_type")
    referred_by_name = serializers.CharField(source="referred_by.user.full_name", allow_null=True)
    referred_by_center = serializers.CharField(source="referred_by.diagnostic_center_name", allow_null=True)

    class Meta:
        model = Referral
        fields = [
            "id",
            "test_id",
            "patient_name",
            "test_type",
            "urgency",
            "status",
            "created_at",
            "referred_by_name",
            "referred_by_center",
        ]


from core.models import DiagnosticTest


class DoctorCaseDetailSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(
        source="patient.user.full_name"
    )
    clinical_context = serializers.SerializerMethodField()
    referral_id = serializers.SerializerMethodField()
    patient_id = serializers.CharField(source="patient.id") # For scheduling
    patient_age = serializers.IntegerField(source="patient.age", read_only=True) # Assuming property exists or handle via method
    patient_gender = serializers.CharField(source="patient.gender", read_only=True)
    ai_result = serializers.SerializerMethodField()
    review_details = serializers.SerializerMethodField()

    class Meta:
        model = DiagnosticTest
        fields = [
            "id",
            "referral_id",
            "test_type",
            "test_date",
            "status",
            "patient_name",
            "patient_id",
            "patient_age",
            "patient_gender",
            "raw_image",
            "ai_result",
            "clinical_context",
            "review_details",
        ]

    classes = ["Pneumonia", "Covid-19", "Normal"] # Example classes

    def get_ai_result(self, obj):
        if not hasattr(obj, "aiinferenceresult"):
            return None
        ai = obj.aiinferenceresult
        request = self.context.get('request')
        
        heatmap_url = ai.heatmap_image.url if ai.heatmap_image else None
        if heatmap_url and request:
            heatmap_url = request.build_absolute_uri(heatmap_url)
            
        return {
            "risk_level": ai.risk_level,
            "risk_score": ai.risk_score,
            "confidence": ai.confidence,
            "prediction_label": ai.prediction_label,
            "heatmap_image": heatmap_url
        }

    def get_clinical_context(self, obj):
        if not hasattr(obj, "clinicalcontext"):
            return None
        context = obj.clinicalcontext
        return {
            "symptoms": context.symptoms,
            "vitals": context.vitals,
            "history": context.auto_history_snapshot
        }

    def get_review_details(self, obj):
        if hasattr(obj, "referral") and hasattr(obj.referral, "doctor_review"):
            review = obj.referral.doctor_review
            return {
                "decision": review.decision,
                "notes": review.notes,
                "reviewed_at": review.reviewed_at
            }
        return None

    def get_referral_id(self, obj):
        if hasattr(obj, "referral"):
            return obj.referral.id
        return None


class DoctorReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorReview
        fields = ["decision", "notes"]


class DoctorReviewedCaseSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="referral.test.patient.user.full_name")
    test_type = serializers.CharField(source="referral.test.test_type")
    test_id = serializers.CharField(source="referral.test.id")
    referral_id = serializers.CharField(source="referral.id")
    
    class Meta:
        model = DoctorReview
        fields = [
            "id",
            "referral_id",
            "test_id",
            "patient_name",
            "test_type",
            "decision",
            "notes",
            "reviewed_at"
        ]


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
    doctor_id = serializers.CharField(source="id")
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