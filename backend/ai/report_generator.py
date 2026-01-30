from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from django.core.files.base import ContentFile
import os


from ai.bhashini_service import BhashiniService

def generate_report(test, ai_result, clinical_context=None, target_lang="en"):
    path = f"/tmp/report_{test.id}_{target_lang}.pdf"
    c = canvas.Canvas(path, pagesize=A4)
    width, height = A4
    y = height - 50

    # Initialize Bhashini for translation if target_lang is not English
    bhashini = BhashiniService() if target_lang != "en" else None
    
    # Default Labels
    labels = {
        "title": "AI-Assisted Diagnostic Report",
        "patient": "Patient",
        "date": "Date",
        "test_type": "Test Type",
        "status": "Status",
        "ai_results": "AI Analysis Results",
        "diagnosis": "Diagnosis",
        "risk_level": "Risk Level",
        "confidence": "Confidence",
        "clinical_context": "Clinical Context",
        "symptoms": "Symptoms",
        "vitals": "Vitals",
        "history": "Patient Health History Snapshot",
        "doctor_review": "Doctor's Clinical Review",
        "doctor": "Doctor",
        "decision": "Decision",
        "notes_label": "Doctor's Notes:",
        "disclaimer": "Disclaimer: AI output is assistive and must be reviewed by a qualified medical professional.",
        "heatmap_title": "Grad-CAM Heatmap Visualization"
    }

    dynamic_content = {
        "prediction": ai_result.prediction_label or "N/A",
        "risk_level_val": ai_result.risk_level,
    }

    if clinical_context:
        dynamic_content["symptoms_val"] = ", ".join(clinical_context.symptoms) if isinstance(clinical_context.symptoms, list) else str(clinical_context.symptoms)
        if clinical_context.vitals:
            vitals_list = [f"{k}: {v}" for k, v in clinical_context.vitals.items() if v]
            dynamic_content["vitals_val"] = " | ".join(vitals_list)

    # Translate if needed
    if bhashini and target_lang != "en":
        all_text = {**labels, **dynamic_content}
        translated = bhashini.translate_report_sections(all_text, target_lang)
        # Update labels and dynamic content with translations
        for k in labels: labels[k] = translated.get(k, labels[k])
        for k in dynamic_content: dynamic_content[k] = translated.get(k, dynamic_content[k])

    # Register Font
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    font_name = "Helvetica"
    font_bold = "Helvetica-Bold"
    
    if target_lang != "en":
        try:
            fonts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fonts")
            
            # Map language codes to font filenames and keys
            # Default to Devanagari for hi, mr
            font_map = {
                "pa": ("NotoSansGurmukhi-Regular.ttf", "NotoSansGurmukhi"),
                "ta": ("NotoSansTamil-Regular.ttf", "NotoSansTamil"),
                "te": ("NotoSansTelugu-Regular.ttf", "NotoSansTelugu"),
                "kn": ("NotoSansKannada-Regular.ttf", "NotoSansKannada"),
                "gu": ("NotoSansGujarati-Regular.ttf", "NotoSansGujarati"),
                "bn": ("NotoSansBengali-Regular.ttf", "NotoSansBengali"),
                "ml": ("NotoSansMalayalam-Regular.ttf", "NotoSansMalayalam"),
            }
            
            # Get font info or default to Devanagari
            font_filename, font_key = font_map.get(target_lang, ("NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari"))
            
            font_path = os.path.join(fonts_dir, font_filename)

            if os.path.exists(font_path):
                pdfmetrics.registerFont(TTFont(font_key, font_path))
                font_name = font_key
                font_bold = font_key # Using regular for bold if bold not available
            else:
                print(f"Font file not found: {font_path}")
                
        except Exception as e:
            print(f"Font registration failed: {e}")

    def draw_section_header(canvas, text, y_pos):
        canvas.setFont(font_bold, 14)
        canvas.drawString(50, y_pos, text)
        canvas.line(50, y_pos - 5, width - 50, y_pos - 5)
        return y_pos - 25

    # Title
    c.setFont(font_bold, 18)
    c.drawString(50, y, labels["title"])
    y -= 40

    # Basic Info
    c.setFont(font_name, 11)
    c.drawString(50, y, f"{labels['patient']}: {test.patient.user.full_name}")
    c.drawString(300, y, f"{labels['date']}: {test.test_date.strftime('%Y-%m-%d %H:%M')}")
    y -= 20
    c.drawString(50, y, f"{labels['test_type']}: {test.get_test_type_display()}")
    c.drawString(300, y, f"{labels['status']}: {test.get_status_display()}")
    y -= 40

    # AI Analysis Section
    y = draw_section_header(c, labels["ai_results"], y)
    c.setFont(font_bold, 12)
    c.drawString(60, y, f"{labels['diagnosis']}: {dynamic_content['prediction']}")
    y -= 20
    c.setFont(font_name, 11)
    c.drawString(60, y, f"{labels['risk_level']}: {dynamic_content['risk_level_val']}")
    c.drawString(200, y, f"{labels['confidence']}: {ai_result.confidence:.2f}")
    y -= 40

    # Clinical Context Section
    if clinical_context:
        y = draw_section_header(c, labels["clinical_context"], y)
        c.setFont(font_bold, 11)
        c.drawString(60, y, f"{labels['symptoms']}:")
        y -= 15
        c.setFont(font_name, 10)
        c.drawString(70, y, dynamic_content.get("symptoms_val", ""))
        y -= 25

        if clinical_context.vitals:
            c.setFont(font_bold, 11)
            c.drawString(60, y, f"{labels['vitals']}:")
            y -= 15
            c.setFont(font_name, 10)
            c.drawString(70, y, dynamic_content.get("vitals_val", ""))
            y -= 40

        # Health History Snapshot
        if clinical_context.auto_history_snapshot:
            snapshot = clinical_context.auto_history_snapshot
            y = draw_section_header(c, labels["history"], y)
            
            # (Note: Translating the history snapshot keys like 'Known Allergies' might be overkill or complex here, 
            # let's keep it simple or use translated labels if we want)
            items = [
                ("Known Allergies", snapshot.get("known_allergies") or "None"),
                ("Chronic Conditions", snapshot.get("chronic_conditions") or "None"),
            ]
            
            for label, val in items:
                if y < 100:
                    c.showPage()
                    y = height - 50
                c.setFont(font_bold, 10)
                c.drawString(60, y, f"{label}:")
                y -= 15
                c.setFont(font_name, 10)
                c.drawString(70, y, str(val))
                y -= 25

    # Doctor Review Section
    try:
        referral = getattr(test, 'referral', None)
        doctor_review = getattr(referral, 'doctor_review', None) if referral else None
        
        if doctor_review:
            y = draw_section_header(c, labels["doctor_review"], y)
            c.setFont(font_bold, 11)
            c.drawString(60, y, f"{labels['doctor']}: Dr. {doctor_review.doctor.user.full_name}")
            y -= 20
            
            c.setFont(font_bold, 11)
            c.drawString(60, y, f"{labels['decision']}:")
            c.setFont(font_name, 11)
            c.drawString(120, y, doctor_review.get_decision_display())
            y -= 20
            
            if doctor_review.notes:
                notes_text = doctor_review.notes
                if bhashini and target_lang != "en":
                    notes_text = bhashini.translate_batch([notes_text], target_lang)[0]
                
                c.setFont(font_bold, 11)
                c.drawString(60, y, labels["notes_label"])
                y -= 15
                c.setFont(font_name, 10)
                c.drawString(70, y, notes_text[:100] + ("..." if len(notes_text) > 100 else ""))
                y -= 25
    except Exception:
        pass

    # Disclaimer
    if y < 100:
        c.showPage()
        y = height - 50
    c.setFont(font_name, 9) # Using font_name assuming Italic not available for NotoSans
    c.drawString(50, 50, labels["disclaimer"])

    # Heatmap on a new page
    c.showPage()
    if ai_result.heatmap_image:
        try:
            heatmap_path = ai_result.heatmap_image.path
            if heatmap_path and os.path.exists(heatmap_path):
                c.setFont(font_bold, 14)
                c.drawString(50, height - 50, labels["heatmap_title"])
                c.drawImage(heatmap_path, 50, height - 500, width=500, preserveAspectRatio=True)
        except Exception:
            pass

    c.save()

    with open(path, "rb") as f:
        pdf_name = f"report_{test.id}_{target_lang}.pdf"
        pdf = ContentFile(f.read(), name=pdf_name)

    os.remove(path)
    return pdf

    # Heatmap on a new page
    c.showPage()
    if ai_result.heatmap_image:
        try:
            heatmap_path = ai_result.heatmap_image.path
            if heatmap_path and os.path.exists(heatmap_path):
                c.setFont("Helvetica-Bold", 14)
                c.drawString(50, height - 50, "Grad-CAM Heatmap Visualization")
                c.drawImage(heatmap_path, 50, height - 500, width=500, preserveAspectRatio=True)
            else:
                pass
        except Exception:
            pass

    c.save()

    with open(path, "rb") as f:
        pdf = ContentFile(f.read(), name=f"report_{test.id}.pdf")

    os.remove(path)
    return pdf