from rest_framework import serializers
from core.models import PatientProfile, DiagnosticTest, AIInferenceResult, Appointment, Referral

class PatientProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.full_name')
    email = serializers.EmailField(source='user.email')
    abha_id = serializers.CharField(source='user.abha_id')

    class Meta:
        model = PatientProfile
        fields = [
            'name',
            'email',
            'abha_id',
            'blood_group',
            'chronic_conditions',
            'emergency_contact',
            'address',
        ]


class PatientTestListSerializer(serializers.ModelSerializer):
    risk_level = serializers.SerializerMethodField()

    class Meta:
        model = DiagnosticTest
        fields = [
            'id',
            'test_type',
            'test_date',
            'status',
            'risk_level',
        ]

    def get_risk_level(self, obj):
        if hasattr(obj, 'aiinferenceresult'):
            return obj.aiinferenceresult.risk_level
        return None


class PatientTestDetailSerializer(serializers.ModelSerializer):
    ai_result = serializers.SerializerMethodField()

    class Meta:
        model = DiagnosticTest
        fields = [
            'id',
            'test_type',
            'test_date',
            'status',
            'ai_result',
        ]

    def get_ai_result(self, obj):
        if not hasattr(obj, 'aiinferenceresult'):
            return None

        ai = obj.aiinferenceresult
        return {
            'risk_level': ai.risk_level,
            'risk_score': ai.risk_score,
            'confidence': ai.confidence,
            'heatmap_url': ai.heatmap_image.url if ai.heatmap_image else None,
        }


class PatientAppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'appointment_type',
            'mode',
            'scheduled_time',
            'status',
            'doctor_name',
        ]

    def get_doctor_name(self, obj):
        if obj.doctor:
            return obj.doctor.user.full_name
        return None


class PatientAppointmentCreateSerializer(serializers.Serializer):
    appointment_type = serializers.ChoiceField(choices=['DIAGNOSTIC', 'CONSULTATION'])
    scheduled_time = serializers.DateTimeField()
    

class PatientReferralSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Referral
        fields = [
            'id',
            'urgency',
            'status',
            'doctor_name',
            'created_at',
        ]

    def get_doctor_name(self, obj):
        if obj.referred_to:
            return obj.referred_to.user.full_name
        return None