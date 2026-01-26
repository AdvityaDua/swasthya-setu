from rest_framework import serializers
from core.models import User, PatientProfile, DoctorProfile, PractitionerProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    patient_profile_data = serializers.DictField(required=False, allow_null=True)
    doctor_profile_data = serializers.DictField(required=False, allow_null=True)
    practitioner_profile_data = serializers.DictField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'full_name',
            'phone',
            'email',
            'role',
            'abha_id',
            'password',
            'preferred_language',
            'patient_profile_data',
            'doctor_profile_data',
            'practitioner_profile_data',
        ]

    def validate(self, attrs):
        role = attrs.get('role')
        if role == 'PATIENT' and not attrs.get('patient_profile_data'):
            raise serializers.ValidationError({'patient_profile_data': 'Required when role is PATIENT.'})
        if role == 'DOCTOR' and not attrs.get('doctor_profile_data'):
            raise serializers.ValidationError({'doctor_profile_data': 'Required when role is DOCTOR.'})
        if role == 'PRACTITIONER' and not attrs.get('practitioner_profile_data'):
            raise serializers.ValidationError({'practitioner_profile_data': 'Required when role is PRACTITIONER.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        patient_profile_data = validated_data.pop('patient_profile_data', None)
        doctor_profile_data = validated_data.pop('doctor_profile_data', None)
        practitioner_profile_data = validated_data.pop('practitioner_profile_data', None)

        user = User.objects.create_user(password=password, **validated_data)

        if user.role == 'PATIENT' and patient_profile_data:
            PatientProfile.objects.create(user=user, **patient_profile_data)
        if user.role == 'DOCTOR' and doctor_profile_data:
            DoctorProfile.objects.create(user=user, **doctor_profile_data)
        if user.role == 'PRACTITIONER' and practitioner_profile_data:
            PractitionerProfile.objects.create(user=user, **practitioner_profile_data)

        return user

