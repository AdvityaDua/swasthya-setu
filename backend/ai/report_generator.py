from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from django.core.files.base import ContentFile
import os
from datetime import datetime

from ai.bhashini_service import BhashiniService

# ================= COLORS =================
PRIMARY_BLUE   = HexColor("#1F3C88")   # Trust / Authority
ACCENT_TEAL    = HexColor("#1AA6B7")   # AI / Technology
WARNING_RED    = HexColor("#E63946")   # High Risk
SOFT_GRAY      = HexColor("#F4F6F8")   # Background panels
TEXT_DARK      = HexColor("#2B2D42")   # Body text

def generate_report(test, ai_result, clinical_context=None, target_lang="en"):
    # ================= SETUP =================
    path = f"/tmp/report_{test.id}_{target_lang}.pdf"
    c = canvas.Canvas(path, pagesize=A4)
    width, height = A4
    y = height - 50
    FOOTER_HEIGHT = 90  # reserved bottom space

    # Initialize Bhashini for translation if target_lang is not English
    bhashini = BhashiniService() if target_lang != "en" else None

    # Default Labels
    labels = {
        "title": "Clinical Diagnostic Report (AI-Assisted)",
        "subtitle": "Generated using AI-assisted clinical decision support",
        "intro_summary": "The AI system suggests a {risk_level}-risk finding of '{prediction}'. This assessment should be interpreted in conjunction with clinical symptoms, recorded vitals, patient history, and the final judgment of a qualified medical professional.",
        "exec_summary_title": "Executive Clinical Summary",
        "patient_info": "Patient Information",
        "patient_name_label": "Patient Name:",
        "report_date_label": "Report Date:",
        "report_id_label": "Report ID:",
        "test_type_label": "Test Type:",
        "status_label": "Status:",
        "ai_results": "AI Analysis (Assistive)",
        "ai_finding_label": "AI-Suggested Finding:",
        "ai_risk_label": "AI Risk Stratification:",
        "model_confidence_label": "Model Confidence:",
        "ai_note": "Note: AI outputs are probabilistic and intended to assist—not replace—clinical decision-making.",
        "clinical_context": "Clinical Context",
        "symptoms_label": "Reported Symptoms:",
        "vitals_label": "Recorded Vitals:",
        "history_label": "Patient Health History Snapshot",
        "doctor_review": "Doctor’s Final Clinical Review",
        "doctor_review_note": "This section represents the final medical decision by a qualified healthcare professional.",
        "reviewing_doctor_label": "Reviewing Doctor:",
        "clinical_decision_label": "Clinical Decision:",
        "doctor_notes_label": "Doctor’s Notes:",
        "disclaimer": "Disclaimer: AI outputs are assistive and must be reviewed by a qualified medical professional.",
        "generated_on": "Generated on:",
        "heatmap_title": "Grad-CAM Heatmap Visualization",
        "heatmap_desc": "Highlighted regions indicate areas influencing the AI model's prediction. This is not a definitive diagnosis."
    }

    dynamic_content = {
        "prediction": ai_result.prediction_label or "N/A",
        "risk_level_val": ai_result.risk_level.lower(), # For interpolation
        "risk_level_display": ai_result.risk_level, 
        "confidence_val": f"{ai_result.confidence * 100:.1f}%"
    }
    
    # Pre-format summary text for translation
    summary_text = labels["intro_summary"].format(
        risk_level=dynamic_content["risk_level_val"],
        prediction=dynamic_content["prediction"]
    )
    
    # If translating, we need to translate the summary text as a whole
    # So we replace the template in labels with the formatted string for translation
    labels["intro_summary_formatted"] = summary_text

    if clinical_context:
        dynamic_content["symptoms"] = clinical_context.symptoms if isinstance(clinical_context.symptoms, list) else [str(clinical_context.symptoms)]
        # Vitals are a dict, we convert to list of strings for translation batching compatibility if needed, 
        # but better to handle as key-value pairs in drawing. For now assuming keys don't need translation or are standard.
        # Let's keep vitals as is and translate values if needed.
        
        # History snapshot
        dynamic_content["history"] = clinical_context.auto_history_snapshot

    # Translate if needed
    if bhashini and target_lang != "en":
        # Prepare text list for translation
        keys_to_translate = list(labels.keys())
        values_to_translate = list(labels.values())
        
        # Add dynamic content that needs translation
        if clinical_context:
            # Add symptoms
            symptoms = dynamic_content["symptoms"]
            keys_to_translate.extend([f"symptom_{i}" for i in range(len(symptoms))])
            values_to_translate.extend(symptoms)
        
        # Translate Batch
        try:
             translated_values = bhashini.translate_batch(values_to_translate, target_lang)
             translated_dict = dict(zip(keys_to_translate, translated_values))
             
             # Update labels
             for k in labels:
                 if k in translated_dict:
                     labels[k] = translated_dict[k]
             
             # Update dynamic content
             if clinical_context:
                 translated_symptoms = []
                 for i in range(len(dynamic_content["symptoms"])):
                     key = f"symptom_{i}"
                     if key in translated_dict:
                         translated_symptoms.append(translated_dict[key])
                 dynamic_content["symptoms"] = translated_symptoms
                 
        except Exception as e:
            print(f"Translation failed: {e}")

    # ================= FONTS =================
    font_name = "Helvetica"
    font_bold = "Helvetica-Bold"
    font_oblique = "Helvetica-Oblique"

    if target_lang != "en":
        try:
            fonts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fonts")
            
            # Map language codes to font filenames and keys
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
                font_bold = font_key # NotoSans often comes as single weight in these packs, or we map bold to same
                font_oblique = font_key
            else:
                print(f"Font file not found: {font_path}")
                
        except Exception as e:
            print(f"Font registration failed: {e}")

    # ================= HELPERS =================
    def draw_section_header(text, y):
        c.setFillColor(SOFT_GRAY)
        c.roundRect(40, y - 22, width - 80, 26, 8, fill=1, stroke=0)
        c.setFillColor(PRIMARY_BLUE)
        c.setFont(font_bold, 13)
        c.drawString(55, y - 16, text)
        return y - 40

    def wrap_text(text, max_width, font=font_name, size=11):
        words = text.split(" ")
        lines, current = [], ""
        for w in words:
            test_line = current + w + " "
            if c.stringWidth(test_line, font, size) <= max_width:
                current = test_line
            else:
                lines.append(current)
                current = w + " "
        lines.append(current)
        return lines

    def ensure_space(required=40):
        nonlocal y
        if y - required < FOOTER_HEIGHT:
            c.showPage()
            y = height - 50

    # ================= TITLE =================
    c.setFont(font_bold, 22)
    c.setFillColor(PRIMARY_BLUE)
    c.drawCentredString(width / 2, y, labels["title"])

    c.setFont(font_name, 11)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(
        width / 2, y - 24,
        labels["subtitle"]
    )

    c.setStrokeColor(ACCENT_TEAL)
    c.setLineWidth(1.5)
    c.line(50, y - 38, width - 50, y - 38)
    y -= 70

    # ================= EXECUTIVE SUMMARY =================
    # Use formatted/translated summary text
    summary_text = labels.get("intro_summary_formatted", labels["intro_summary"])

    wrapped = wrap_text(summary_text, width - 110, font=font_name, size=11)
    box_height = 35 + len(wrapped) * 14

    ensure_space(box_height + 20)

    c.setFillColor(SOFT_GRAY)
    c.roundRect(40, y - box_height, width - 80, box_height, 10, fill=1, stroke=0)

    c.setFont(font_bold, 13)
    c.setFillColor(PRIMARY_BLUE)
    c.drawString(55, y - 20, labels["exec_summary_title"])

    text = c.beginText(55, y - 40)
    text.setFont(font_name, 11)
    text.setFillColor(TEXT_DARK)
    for line in wrapped:
        text.textLine(line)
    c.drawText(text)

    y -= box_height + 25

    # ================= PATIENT INFO =================
    y = draw_section_header(labels["patient_info"], y)

    c.setFont(font_name, 11)
    c.setFillColor(TEXT_DARK)
    c.drawString(60, y, labels["patient_name_label"])
    c.setFont(font_bold, 11)
    c.drawString(170, y, test.patient.user.full_name)

    c.setFont(font_name, 11)
    c.drawString(350, y, labels["report_date_label"])
    c.setFont(font_bold, 11)
    c.drawString(440, y, test.test_date.strftime("%d %b %Y"))
    y -= 18

    c.setFont(font_name, 10)
    c.drawString(60, y, f"{labels['report_id_label']} {test.id}")
    c.drawString(350, y, f"{labels['test_type_label']} {test.get_test_type_display()}")
    y -= 30

    # ================= AI ANALYSIS =================
    y = draw_section_header(labels["ai_results"], y)

    c.setFont(font_bold, 11)
    c.drawString(60, y, labels["ai_finding_label"])
    c.setFont(font_name, 11)
    c.drawString(300, y, dynamic_content["prediction"])
    y -= 20

    c.setFont(font_bold, 11)
    c.drawString(60, y, labels["ai_risk_label"])
    c.setFont(font_name, 11)
    c.drawString(300, y, dynamic_content["risk_level_display"])

    badge_color = WARNING_RED if ai_result.risk_level.lower() == "high" else ACCENT_TEAL
    c.setFillColor(badge_color)
    c.roundRect(470, y - 12, 60, 16, 6, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont(font_bold, 9)
    # Center text in badge
    risk_text = dynamic_content["risk_level_display"].upper()
    text_width = c.stringWidth(risk_text, font_bold, 9)
    c.drawString(470 + (60 - text_width) / 2, y - 8, risk_text)
    y -= 30

    confidence_pct = ai_result.confidence * 100
    c.setFont(font_bold, 11)
    c.setFillColor(TEXT_DARK)
    c.drawString(60, y, labels["model_confidence_label"])
    c.setFont(font_name, 11)
    c.drawString(300, y, f"{confidence_pct:.1f}%")
    y -= 12

    c.setFillColor(SOFT_GRAY)
    c.rect(300, y, 200, 8, fill=1, stroke=0)
    c.setFillColor(ACCENT_TEAL)
    c.rect(300, y, 2 * confidence_pct, 8, fill=1, stroke=0)
    y -= 25

    c.setFont(font_oblique, 9)
    c.drawString(60, y, labels["ai_note"])
    y -= 25

    # ================= CLINICAL CONTEXT =================
    if clinical_context:
        y = draw_section_header(labels["clinical_context"], y)

        if dynamic_content.get("symptoms"):
            c.setFont(font_bold, 11)
            c.drawString(60, y, labels["symptoms_label"])
            c.setFont(font_name, 10)
            sy = y - 16
            for s in dynamic_content["symptoms"]:
                c.drawString(70, sy, f"• {s}")
                sy -= 14
            y = sy - 10 # Update y

        if clinical_context.vitals:
            c.setFont(font_bold, 11)
            c.drawString(350, y + 26 if dynamic_content.get("symptoms") else y, labels["vitals_label"])
            c.setFont(font_name, 10)
            vy = y + 10 if dynamic_content.get("symptoms") else y - 16
            for k, v in clinical_context.vitals.items():
                c.drawString(360, vy, f"{k}: {v}")
                vy -= 14
            # Update y based on lowest point
            y = min(y, vy) - 20

    # ================= DOCTOR REVIEW =================
    ensure_space(140)
    
    try:
        referral = getattr(test, 'referral', None)
        doctor_review = getattr(referral, 'doctor_review', None) if referral else None
        
        if doctor_review:
            y = draw_section_header(labels["doctor_review"], y)

            c.setFont(font_name, 10)
            c.drawString(60, y, labels["doctor_review_note"])
            y -= 25

            def draw_line(label, val, y_pos):
                c.setFont(font_bold, 11)
                c.drawString(60, y_pos, label)
                c.setFont(font_name, 11)
                c.drawString(220, y_pos, val)
                c.setStrokeColor(SOFT_GRAY)
                c.line(60, y_pos - 5, width - 60, y_pos - 5)
                return y_pos - 20

            y = draw_line(labels["reviewing_doctor_label"], f"Dr. {doctor_review.doctor.user.full_name}", y)
            y = draw_line(labels["clinical_decision_label"], doctor_review.get_decision_display(), y)
            
            if doctor_review.notes:
                notes_text = doctor_review.notes
                # Translate notes if needed
                if bhashini and target_lang != "en":
                    try:
                        notes_text = bhashini.translate_batch([notes_text], target_lang)[0]
                    except:
                        pass
                
                c.setFont(font_bold, 11)
                c.drawString(60, y, labels["doctor_notes_label"])
                y -= 15
                c.setFont(font_name, 10)
                wrapped_notes = wrap_text(notes_text, width - 120, font=font_name, size=10)
                for line in wrapped_notes:
                    c.drawString(70, y, line)
                    y -= 12
                y -= 20
    except Exception:
        pass

    # ================= FOOTER =================
    footer_y = 70

    c.setFont(font_name, 9)
    c.setFillColor(TEXT_DARK)
    c.drawString(50, footer_y, labels["disclaimer"])

    c.drawRightString(
        width - 50, footer_y + 14,
        f"{labels['generated_on']} {datetime.now().strftime('%d %b %Y, %H:%M')}"
    )

    c.setFont(font_bold, 12)
    c.setFillColor(PRIMARY_BLUE)
    c.drawCentredString(width / 2, 35, "Swasthya Setu")

    c.setFont(font_name, 9)
    c.drawCentredString(width / 2, 22, "AI for Accessible & Responsible Healthcare")

    # ================= HEATMAP PAGE =================
    if ai_result.heatmap_image:
        c.showPage()
        try:
            heatmap_path = ai_result.heatmap_image.path
            if heatmap_path and os.path.exists(heatmap_path):
                c.setFont(font_bold, 14)
                c.setFillColor(PRIMARY_BLUE)
                c.drawString(50, height - 50, labels["heatmap_title"])

                c.setFont(font_name, 10)
                c.setFillColor(TEXT_DARK)
                c.drawString(50, height - 80, labels["heatmap_desc"])

                c.drawImage(heatmap_path, 50, height - 500, width=500, preserveAspectRatio=True)
        except Exception:
            pass

    c.save()

    with open(path, "rb") as f:
        pdf_name = f"report_{test.id}_{target_lang}.pdf"
        pdf = ContentFile(f.read(), name=pdf_name)

    os.remove(path)
    return pdf