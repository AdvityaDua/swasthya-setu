import cv2
import numpy as np
from django.conf import settings
from django.core.files.base import ContentFile

from core.models import AIInferenceResult, DiagnosticReport
from ai.breast_cancer.inference import predict_breast_cancer
from ai.report_generator import generate_report


def run_ai_and_generate_report(test):
    result = predict_breast_cancer(
        test.raw_image.path,
        settings.BREAST_CANCER_MODEL_PATH
    )

    risk_level = "HIGH" if result["prediction"] == "Malignant" else "LOW"

    ai_result = AIInferenceResult.objects.create(
        test=test,
        model_name="BREAST_CANCER",
        risk_score=result["confidence"],
        risk_level=risk_level,
        confidence=result["confidence"]
    )

    # Save heatmap
    overlay_uint8 = (result["overlay"] * 255).astype("uint8")
    _, buffer = cv2.imencode(".png", overlay_uint8)

    ai_result.heatmap_image.save(
        f"heatmap_{test.id}.png",
        ContentFile(buffer.tobytes()),
        save=True
    )

    # Generate PDF
    pdf = generate_report(test, ai_result)

    DiagnosticReport.objects.create(
        test=test,
        report_pdf=pdf,
        final_risk_level=risk_level,
        doctor_signed=False
    )

    return ai_result