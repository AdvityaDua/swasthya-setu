from django.db import models
from core.models import Referral, DoctorProfile


class DoctorReview(models.Model):
    DECISION_CHOICES = (
        ("CONFIRM", "Confirm AI"),
        ("OVERRIDE", "Override AI"),
        ("MORE_TESTS", "Request More Tests"),
    )

    referral = models.OneToOneField(
        Referral,
        on_delete=models.CASCADE,
        related_name="doctor_review"
    )
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE
    )
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES)
    notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.referral.id} - {self.decision}"