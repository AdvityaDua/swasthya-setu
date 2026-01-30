import cv2
import numpy as np
from django.conf import settings
from django.core.files.base import ContentFile

from core.models import AIInferenceResult, DiagnosticReport
from ai.breast_cancer.inference import predict_breast_cancer
from ai.pneumonia.inference import predict_pneumonia
from ai.tb.inference import predict_tb
from ai.hairline_fracture.inference import predict_hairline_fracture
from ai.report_generator import generate_report


def run_ai_and_generate_report(test, target_lang="en"):
    result = {}
    model_name = test.test_type
    risk_level = "LOW"

    if test.test_type == "BREAST_CANCER":
        result = predict_breast_cancer(
            test.raw_image.path,
            settings.BREAST_CANCER_MODEL_PATH
        )
        risk_level = "HIGH" if result["prediction"] == "Malignant" else "LOW"

    elif test.test_type == "PNEUMONIA":
        result = predict_pneumonia(
            test.raw_image.path,
            settings.PNEUMONIA_MODEL_PATH
        )
        # Map prediction to risk level
        # Labels: "Normal", "Other Lung Abnormality", "Pneumonia suspected"
        if result["prediction"] in ["Pneumonia suspected", "Other Lung Abnormality"]:
            risk_level = "HIGH"
        else:
            risk_level = "LOW"
    
    elif test.test_type == "TB":
        result = predict_tb(
            test.raw_image.path,
            settings.TB_MODEL_PATH
        )
        # Map prediction to risk level
        # Labels: "Healthy", "Sick", "TB"
        if result["prediction"] == "TB":
            risk_level = "HIGH"
        elif result["prediction"] == "Sick":
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

    elif test.test_type == "FRACTURE":
        # Uses default model path inside inference.py if 2nd arg is None
        # or we could add settings.HAIRLINE_MODEL_PATH
        result = predict_hairline_fracture(
            test.raw_image.path,
            None  
        )
        if result["diagnosis"] == "Fracture Detected":
            risk_level = "HIGH"
        else:
            risk_level = "LOW"
    
    # Add other models here...
    else:
        # Fallback or error if model not implemented yet
        # For now, maybe raise error or return None, but let's assume we implement step by step.
        raise NotImplementedError(f"AI model for {test.test_type} not implemented yet.")

    ai_result, _ = AIInferenceResult.objects.update_or_create(
        test=test,
        defaults={
            "model_name": model_name,
            "risk_score": result["confidence"],
            "risk_level": risk_level,
            "confidence": result["confidence"],
            "prediction_label": result.get("prediction")
        }
    )

    # Save heatmap
    overlay_uint8 = (result["overlay"] * 255).astype("uint8")
    _, buffer = cv2.imencode(".png", overlay_uint8)

    ai_result.heatmap_image.save(
        f"heatmap_{test.id}.png",
        ContentFile(buffer.tobytes()),
        save=True
    )

    # Generate PDF with clinical context if available
    clinical_context = getattr(test, 'clinicalcontext', None)
    print(f"DEBUG: Calling generate_report with target_lang: {target_lang}")
    pdf = generate_report(test, ai_result, clinical_context, target_lang=target_lang)

    DiagnosticReport.objects.update_or_create(
        test=test,
        defaults={
            "report_pdf": pdf,
            "final_risk_level": risk_level,
            "doctor_signed": False
        }
    )

    return ai_result