from datetime import date
from rest_framework import serializers
from django.utils import timezone
from core.models import PatientProfile, DiagnosticTest, AIInferenceResult, Appointment, Referral, DiagnosticReport, ConsultationRequest, DoctorProfile

BLOOD_GROUP_CHOICES = ("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
SURGERY_STATUS = ("never", "former", "current")
ALCOHOL_STATUS = ("never", "occasional", "regular")
ACTIVITY_LEVEL = ("low", "moderate", "high")
CONDITION_STATUS = ("ACTIVE", "RESOLVED")


def parse_iso_date(s):
    if isinstance(s, date):
        return s
    if not isinstance(s, str):
        raise serializers.ValidationError("Date must be a string in YYYY-MM-DD format.")
    try:
        return date.fromisoformat(s)
    except ValueError:
        raise serializers.ValidationError("Invalid date format. Use YYYY-MM-DD.")


class PatientProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.full_name", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    abha_id = serializers.CharField(source="user.abha_id", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)
    created_at = serializers.DateTimeField(source="user.created_at", read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            "name", "phone", "email", "abha_id", "role", "created_at",
            "date_of_birth", "blood_group", "emergency_contact", "address",
            "known_allergies", "chronic_conditions",
            "past_surgeries", "current_medications", "lifestyle_indicators",
            "medical_history",
        ]


class PatientProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = [
            "date_of_birth", "blood_group", "emergency_contact", "address",
            "known_allergies", "chronic_conditions",
            "past_surgeries", "current_medications", "lifestyle_indicators",
            "medical_history",
        ]
        extra_kwargs = {f: {"required": False} for f in fields}

    def validate_date_of_birth(self, v):
        if v is None:
            return v
        d = v if isinstance(v, date) else (date.fromisoformat(str(v)) if isinstance(v, str) else v)
        if d >= timezone.now().date():
            raise serializers.ValidationError("Date of birth must be in the past.")
        return d

    def validate_blood_group(self, v):
        if not v:
            return v
        if v not in BLOOD_GROUP_CHOICES:
            raise serializers.ValidationError(
                "Blood group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-."
            )
        return v

    def validate_emergency_contact(self, v):
        if v is None:
            return v
        s = str(v).strip()
        if not s:
            raise serializers.ValidationError("Emergency contact cannot be empty.")
        if not s.isdigit():
            raise serializers.ValidationError("Emergency contact must be numeric.")
        if len(s) < 10 or len(s) > 15:
            raise serializers.ValidationError("Emergency contact must be 10–15 digits.")
        return s

    def validate_address(self, v):
        if v is None:
            return v
        if str(v).strip() == "":
            raise serializers.ValidationError("Address cannot be empty.")
        return v

    def validate_past_surgeries(self, v):
        if v is None:
            return v
        if not isinstance(v, list):
            raise serializers.ValidationError("past_surgeries must be a list.")
        today = timezone.now().date()
        for i, item in enumerate(v):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    f"past_surgeries[{i}]: each item must be an object."
                )
            proc = item.get("procedure")
            if not proc or not str(proc).strip():
                raise serializers.ValidationError(
                    f"past_surgeries[{i}]: 'procedure' is required and must be non-empty."
                )
            d = item.get("date")
            if d is None:
                raise serializers.ValidationError(
                    f"past_surgeries[{i}]: 'date' is required."
                )
            dt = parse_iso_date(d)
            if dt >= today:
                raise serializers.ValidationError(
                    f"past_surgeries[{i}]: 'date' must be in the past."
                )
        return v

    def validate_current_medications(self, v):
        if v is None:
            return v
        if not isinstance(v, list):
            raise serializers.ValidationError("current_medications must be a list.")
        for i, item in enumerate(v):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    f"current_medications[{i}]: each item must be an object."
                )
            if "name" not in item or item.get("name") is None:
                raise serializers.ValidationError(
                    f"current_medications[{i}]: 'name' is required."
                )
            if "ongoing" not in item:
                raise serializers.ValidationError(
                    f"current_medications[{i}]: 'ongoing' (boolean) is required."
                )
            if not isinstance(item["ongoing"], bool):
                raise serializers.ValidationError(
                    f"current_medications[{i}]: 'ongoing' must be true or false."
                )
            sd = item.get("start_date")
            if sd is not None and sd != "":
                parse_iso_date(sd)
        return v

    def validate_lifestyle_indicators(self, v):
        if v is None:
            return v
        if not isinstance(v, dict):
            raise serializers.ValidationError("lifestyle_indicators must be an object.")
        smoking = v.get("smoking")
        if smoking is not None and isinstance(smoking, dict):
            s = smoking.get("status")
            if s is not None and s not in SURGERY_STATUS:
                raise serializers.ValidationError(
                    "lifestyle_indicators.smoking.status must be: never, former, or current."
                )
        alcohol = v.get("alcohol")
        if alcohol is not None and isinstance(alcohol, dict):
            s = alcohol.get("status")
            if s is not None and s not in ALCOHOL_STATUS:
                raise serializers.ValidationError(
                    "lifestyle_indicators.alcohol.status must be: never, occasional, or regular."
                )
        pa = v.get("physical_activity")
        if pa is not None and isinstance(pa, dict):
            lv = pa.get("level")
            if lv is not None and lv not in ACTIVITY_LEVEL:
                raise serializers.ValidationError(
                    "lifestyle_indicators.physical_activity.level must be: low, moderate, or high."
                )
        sh = v.get("sleep_hours_avg")
        if sh is not None:
            try:
                n = float(sh) if not isinstance(sh, (int, float)) else sh
                if n < 0 or n > 24:
                    raise serializers.ValidationError(
                        "lifestyle_indicators.sleep_hours_avg must be between 0 and 24."
                    )
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    "lifestyle_indicators.sleep_hours_avg must be a number."
                )
        return v

    def validate_medical_history(self, v):
        if v is None:
            return v
        if not isinstance(v, dict):
            raise serializers.ValidationError("medical_history must be an object.")

        # conditions
        conditions = v.get("conditions")
        if conditions is not None:
            if not isinstance(conditions, list):
                raise serializers.ValidationError("medical_history.conditions must be a list.")
            for i, item in enumerate(conditions):
                if not isinstance(item, dict):
                    raise serializers.ValidationError(
                        f"medical_history.conditions[{i}] must be an object."
                    )
                name = item.get("name")
                if not name or not str(name).strip():
                    raise serializers.ValidationError(
                        f"medical_history.conditions[{i}].name is required."
                    )
                status = item.get("status")
                if status is not None and status not in CONDITION_STATUS:
                    raise serializers.ValidationError(
                        f"medical_history.conditions[{i}].status must be ACTIVE or RESOLVED."
                    )
                diag = item.get("diagnosed_date")
                if diag:
                    parse_iso_date(diag)
                res = item.get("resolved_date")
                if res:
                    parse_iso_date(res)

        # surgeries
        surgeries = v.get("surgeries")
        if surgeries is not None:
            if not isinstance(surgeries, list):
                raise serializers.ValidationError("medical_history.surgeries must be a list.")
            for i, item in enumerate(surgeries):
                if not isinstance(item, dict):
                    raise serializers.ValidationError(
                        f"medical_history.surgeries[{i}] must be an object."
                    )
                proc = item.get("procedure")
                if not proc or not str(proc).strip():
                    raise serializers.ValidationError(
                        f"medical_history.surgeries[{i}].procedure is required."
                    )
                dt = item.get("date")
                if not dt:
                    raise serializers.ValidationError(
                        f"medical_history.surgeries[{i}].date is required."
                    )
                parse_iso_date(dt)

        return v


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
    referral = serializers.SerializerMethodField()
    report = serializers.SerializerMethodField()

    class Meta:
        model = DiagnosticTest
        fields = [
            'id',
            'test_type',
            'test_date',
            'status',
            'ai_result',
            'referral',
            'report',
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

    def get_referral(self, obj):
        # One-to-one from DiagnosticTest -> Referral
        from core.models import Referral  # local import to avoid circulars

        try:
            referral = obj.referral
        except Referral.DoesNotExist:
            return None

        data = {
            'urgency': referral.urgency,
            'status': referral.status,
            'created_at': referral.created_at,
            'doctor_name': referral.referred_to.user.full_name if referral.referred_to else None,
        }

        doctor_review = getattr(referral, 'doctor_review', None)
        if doctor_review is not None:
            data['doctor_review'] = {
                'decision': doctor_review.decision,
                'notes': doctor_review.notes,
                'reviewed_at': doctor_review.reviewed_at,
            }

        return data

    def get_report(self, obj):
        # Presence of DiagnosticReport and download path for patient endpoint
        try:
            _ = obj.diagnosticreport
        except DiagnosticReport.DoesNotExist:
            return None

        return {
            'available': True,
            'download_path': f"/api/patient/reports/{obj.id}/",
        }


class PatientAppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    practitioner_name = serializers.SerializerMethodField()
    practitioner_center = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'appointment_type',
            'mode',
            'scheduled_time',
            'status',
            'doctor_name',
            'practitioner_name',
            'practitioner_center',
        ]

    def get_doctor_name(self, obj):
        if obj.doctor:
            return obj.doctor.user.full_name
        return None

    def get_practitioner_name(self, obj):
        if obj.practitioner:
            return obj.practitioner.user.full_name
        return None

    def get_practitioner_center(self, obj):
        if obj.practitioner:
            return obj.practitioner.diagnostic_center_name
        return None


class PatientAppointmentCreateSerializer(serializers.Serializer):
    appointment_type = serializers.ChoiceField(choices=['DIAGNOSTIC'])
    scheduled_time = serializers.DateTimeField()
    practitioner_id = serializers.UUIDField(required=True)

    def validate_practitioner_id(self, value):
        if value:
            from core.models import PractitionerProfile
            try:
                PractitionerProfile.objects.get(user__id=value)
            except PractitionerProfile.DoesNotExist:
                raise serializers.ValidationError("Practitioner not found.")
        return value
    

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


class DoctorListSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    specialization = serializers.CharField()
    hospital_name = serializers.CharField()
    years_of_experience = serializers.IntegerField()
    availability_timings = serializers.JSONField(allow_null=True)
    is_teleconsult_available = serializers.BooleanField()

    def to_representation(self, instance):
        """Convert DoctorProfile instance to serialized data"""
        return {
            'id': instance.user.id,
            'name': instance.user.full_name,
            'specialization': instance.get_specialization_display(),
            'specialization_code': instance.specialization,
            'hospital_name': instance.hospital_name,
            'years_of_experience': instance.years_of_experience,
            'availability_timings': instance.availability_timings or {},
            'is_teleconsult_available': instance.is_teleconsult_available,
        }


class ConsultationRequestSerializer(serializers.ModelSerializer):
    """Serialize ConsultationRequest with related doctor and patient info"""
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    doctor_email = serializers.CharField(source='doctor.user.email', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.get_specialization_display', read_only=True)
    doctor_hospital = serializers.CharField(source='doctor.hospital_name', read_only=True)
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    patient_email = serializers.CharField(source='patient.user.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ConsultationRequest
        fields = [
            'id', 'patient', 'doctor', 'status', 'status_display',
            'requested_at', 'scheduled_time', 'meet_link', 'calendar_event_id',
            'doctor_name', 'doctor_email', 'doctor_specialization', 'doctor_hospital',
            'patient_name', 'patient_email', 'created_at'
        ]
        read_only_fields = ['id', 'requested_at', 'created_at', 'meet_link', 'calendar_event_id']


class ConsultationRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating consultation requests from patient side"""
    doctor_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ConsultationRequest
        fields = ['doctor_id']

    def validate_doctor_id(self, value):
        """Validate that doctor exists"""
        try:
            doctor = DoctorProfile.objects.get(user_id=value)
        except DoctorProfile.DoesNotExist:
            raise serializers.ValidationError("Doctor not found")
        return value

    def create(self, validated_data):
        """Create a new consultation request"""
        doctor = DoctorProfile.objects.get(user_id=validated_data['doctor_id'])
        patient = self.context['request'].user.patient_profile
        
        # Check if there's already a pending consultation request
        existing = ConsultationRequest.objects.filter(
            patient=patient,
            doctor=doctor,
            status__in=['PENDING', 'SCHEDULED']
        ).exists()
        
        if existing:
            raise serializers.ValidationError("You already have an active consultation request with this doctor")
        
        consultation = ConsultationRequest.objects.create(
            patient=patient,
            doctor=doctor,
            status='PENDING'
        )
        return consultation


class ConsultationScheduleSerializer(serializers.ModelSerializer):
    """Serializer for doctor to schedule consultation with date/time"""
    scheduled_time = serializers.DateTimeField()
    meet_link = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = ConsultationRequest
        fields = ['scheduled_time', 'meet_link']

    def validate_scheduled_time(self, value):
        """Validate scheduled time is in the future"""
        if value <= timezone.now():
            raise serializers.ValidationError("Scheduled time must be in the future")
        return value
