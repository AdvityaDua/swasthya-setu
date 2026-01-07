from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
import uuid

class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError('The Phone number must be set')
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    ROLE_CHOICES = (
        ('PATIENT', 'Patient'),
        ('PRACTITIONER', 'Practitioner'),
        ('DOCTOR', 'Doctor'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    abha_id = models.CharField(max_length=50, unique=True, null=True, blank=True)

    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    objects = UserManager()
    
    def __str__(self):
        return f"{self.full_name} ({self.role})"
    


class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    blood_group = models.CharField(max_length=5, null=True, blank=True)
    known_allergies = models.TextField(null=True, blank=True)
    chronic_conditions = models.TextField(null=True, blank=True)

    emergency_contact = models.CharField(max_length=15)
    address = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PatientProfile - {self.user.full_name}"


class DoctorProfile(models.Model):
    SPECIALIZATION_CHOICES = (
        ('TB', 'Tuberculosis'),
        ('ONCOLOGY', 'Oncology'),
        ('GENERAL', 'General Medicine'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')

    specialization = models.CharField(max_length=50, choices=SPECIALIZATION_CHOICES)
    hospital_name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, unique=True)

    years_of_experience = models.PositiveIntegerField()
    is_teleconsult_available = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dr. {self.user.full_name} ({self.specialization})"
    


class PractitionerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='practitioner_profile')

    designation = models.CharField(max_length=100)
    diagnostic_center_name = models.CharField(max_length=255)
    center_location = models.CharField(max_length=255)

    experience_years = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.full_name} - {self.diagnostic_center_name}"


class PastMedicalHistory(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('RESOLVED', 'Resolved'),
    )

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='medical_history'
    )

    condition_name = models.CharField(max_length=255)
    diagnosed_on = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    notes = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.condition_name} ({self.status})"


class DiagnosticTest(models.Model):
    TEST_TYPE_CHOICES = (
        ('TB', 'Tuberculosis'),
        ('BREAST_CANCER', 'Breast Cancer'),
    )

    STATUS_CHOICES = (
        ('UPLOADED', 'Uploaded'),
        ('AI_DONE', 'AI Processed'),
        ('REFERRED', 'Referred'),
        ('CLOSED', 'Closed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    practitioner = models.ForeignKey(PractitionerProfile, on_delete=models.SET_NULL, null=True)

    test_type = models.CharField(max_length=50, choices=TEST_TYPE_CHOICES)
    raw_image = models.FileField(upload_to='diagnostic_images/')

    test_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.test_type} Test - {self.patient.user.full_name}"



class ClinicalContext(models.Model):
    test = models.OneToOneField(DiagnosticTest, on_delete=models.CASCADE)

    symptoms = models.JSONField()
    vitals = models.JSONField(null=True, blank=True)
    auto_history_snapshot = models.JSONField()

    entered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Clinical Context for Test {self.test.id}"



class AIInferenceResult(models.Model):
    RISK_LEVEL_CHOICES = (
        ('LOW', 'Low'),
        ('MODERATE', 'Moderate'),
        ('HIGH', 'High'),
    )

    test = models.OneToOneField(DiagnosticTest, on_delete=models.CASCADE)

    model_name = models.CharField(max_length=100)
    risk_score = models.FloatField()
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES)
    confidence = models.FloatField()

    heatmap_image = models.ImageField(upload_to='heatmaps/', null=True, blank=True)

    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AI Result - {self.risk_level}"



class Referral(models.Model):
    URGENCY_CHOICES = (
        ('ROUTINE', 'Routine'),
        ('HIGH', 'High'),
    )

    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('REVIEWED', 'Reviewed'),
        ('CLOSED', 'Closed'),
    )

    test = models.OneToOneField(DiagnosticTest, on_delete=models.CASCADE)

    referred_by = models.ForeignKey(PractitionerProfile, on_delete=models.SET_NULL, null=True)
    referred_to = models.ForeignKey(DoctorProfile, on_delete=models.SET_NULL, null=True)

    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES)
    reason = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Referral - {self.urgency}"


class Appointment(models.Model):
    APPOINTMENT_TYPE_CHOICES = (
        ('DIAGNOSTIC', 'Diagnostic'),
        ('CONSULTATION', 'Consultation'),
    )

    MODE_CHOICES = (
        ('ONLINE', 'Online'),
        ('IN_PERSON', 'In Person'),
    )

    STATUS_CHOICES = (
        ('BOOKED', 'Booked'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.SET_NULL, null=True, blank=True)
    practitioner = models.ForeignKey(PractitionerProfile, on_delete=models.SET_NULL, null=True, blank=True)

    appointment_type = models.CharField(max_length=20, choices=APPOINTMENT_TYPE_CHOICES)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES)

    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.appointment_type} - {self.scheduled_time}"


class DiagnosticReport(models.Model):
    test = models.OneToOneField(DiagnosticTest, on_delete=models.CASCADE)

    report_pdf = models.FileField(upload_to='reports/')
    final_risk_level = models.CharField(max_length=20)
    doctor_signed = models.BooleanField(default=False)

    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report for Test {self.test.id}"