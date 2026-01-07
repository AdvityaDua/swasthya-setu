from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from django.core.files.base import ContentFile
import os


def generate_report(test, ai_result):
    path = f"/tmp/report_{test.id}.pdf"
    c = canvas.Canvas(path, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "AI-Assisted Diagnostic Report")

    c.setFont("Helvetica", 11)
    c.drawString(50, height - 100, f"Patient: {test.patient.user.full_name}")
    c.drawString(50, height - 120, f"Test Type: {test.test_type}")
    c.drawString(50, height - 140, f"Risk Level: {ai_result.risk_level}")
    c.drawString(50, height - 160, f"Confidence: {ai_result.confidence:.2f}")

    c.drawString(50, height - 200, "Disclaimer:")
    c.drawString(50, height - 220, "AI output is assistive and must be reviewed by a doctor.")

    c.showPage()

    if ai_result.heatmap_image:
        c.drawImage(ai_result.heatmap_image.path, 50, height - 450, width=400)

    c.showPage()
    c.save()

    with open(path, "rb") as f:
        pdf = ContentFile(f.read(), name=f"report_{test.id}.pdf")

    os.remove(path)
    return pdf