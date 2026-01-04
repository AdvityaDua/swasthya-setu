from rest_framework import serializers
from core.models import User, PatientProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'full_name',
            'phone',
            'email',
            'role',
            'abha_id',
            'password',
        ]

    def create(self, validated_data):
        print("Creating user with data:", validated_data)
        password = validated_data.pop('password')

        user = User.objects.create_user(password=password, **validated_data)

        # Auto-create PatientProfile if role = PATIENT
        if user.role == 'PATIENT':
            PatientProfile.objects.create(user=user)

        return user

