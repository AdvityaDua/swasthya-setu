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


import tempfile
import os
from contextlib import contextmanager

@contextmanager
def get_image_path(image_field):
    """
    Context manager that yields a filesystem path for an image field.
    If the image is stored locally, yields its path.
    If stored remotely (e.g. R2), downloads it to a temp file and yields that path,
    cleaning up afterwards.
    """
    try:
        # try to access local path
        path = image_field.path
        yield path
    except (NotImplementedError, Exception):
        # Remote storage
        suffix = os.path.splitext(image_field.name)[1]
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            if hasattr(image_field, 'open'):
                image_field.open('rb')
            tmp.write(image_field.read())
            if hasattr(image_field, 'close'):
                image_field.close()
            tmp_path = tmp.name
        
        try:
            yield tmp_path
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

def run_ai_and_generate_report(test, target_lang="en"):
    result = {}
    model_name = test.test_type
    risk_level = "LOW"

    # Use the context manager to get a valid file path for inference
    with get_image_path(test.raw_image) as image_path:
        if test.test_type == "BREAST_CANCER":
            result = predict_breast_cancer(
                image_path,
                settings.BREAST_CANCER_MODEL_PATH
            )
            risk_level = "HIGH" if result["prediction"] == "Malignant" else "LOW"

        elif test.test_type == "PNEUMONIA":
            result = predict_pneumonia(
                image_path,
                settings.PNEUMONIA_MODEL_PATH
            )
            # Map prediction to risk level
            if result["prediction"] in ["Pneumonia suspected", "Other Lung Abnormality"]:
                risk_level = "HIGH"
            else:
                risk_level = "LOW"
        
        elif test.test_type == "TB":
            result = predict_tb(
                image_path,
                settings.TB_MODEL_PATH
            )
            # Map prediction to risk level
            if result["prediction"] == "TB":
                risk_level = "HIGH"
            elif result["prediction"] == "Sick":
                risk_level = "MODERATE"
            else:
                risk_level = "LOW"

        elif test.test_type == "FRACTURE":
            result = predict_hairline_fracture(
                image_path,
                None  
            )
            if result["diagnosis"] == "Fracture Detected":
                risk_level = "HIGH"
            else:
                risk_level = "LOW"
        
        else:
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
        if "overlay" in result and result["overlay"] is not None:
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

        # Cleanup old report file if it exists to ensure overwrite or prevent orphans
        # This solves the issue where R2/S3 appends random strings instead of overwriting,
        # or leaves old files when language changes.
        try:
            existing_report = DiagnosticReport.objects.get(test=test)
            if existing_report.report_pdf:
                existing_report.report_pdf.delete(save=False)
        except DiagnosticReport.DoesNotExist:
            pass

        DiagnosticReport.objects.update_or_create(
            test=test,
            defaults={
                "report_pdf": pdf,
                "final_risk_level": risk_level,
                "doctor_signed": False
            }
        )

        return ai_result