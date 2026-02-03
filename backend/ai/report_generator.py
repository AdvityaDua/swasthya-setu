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

    # Default Labels (Simplified for better translation stability)
    labels = {
        "title": "Diagnostic Report (AI)",
        "subtitle": "AI-Assisted Analysis",
        "summary_point_1": "Finding: {prediction}",
        "summary_point_2": "Risk Assessment: {risk_level}",
        "summary_point_3": "Recommendation: Consult a doctor for clinical diagnosis.",
        "exec_summary_title": "Clinical Summary",
        "patient_info": "Patient Information",
        "patient_name_label": "Patient Name:",
        "report_date_label": "Report Date:",
        "report_id_label": "Report ID:",
        "test_type_label": "Test Type:",
        "status_label": "Status:",
        "ai_results": "AI Analysis",
        "ai_finding_label": "Finding:",
        "ai_risk_label": "Risk Level:",
        "model_confidence_label": "AI Confidence:",
        "ai_note": "Note: AI is assistive only. Doctor review required.",
        "clinical_context": "Clinical Context",
        "symptoms_label": "Symptoms:",
        "vitals_label": "Vitals:",
        "history_label": "History Snapshot",
        "doctor_review": "Doctor's Review",
        "doctor_review_note": "Final decision by doctor.",
        "reviewing_doctor_label": "Doctor:",
        "clinical_decision_label": "Decision:",
        "doctor_notes_label": "Notes:",
        "disclaimer": "Disclaimer: AI is assistive. Medical review required.",
        "generated_on": "Generated:",
        "heatmap_title": "Heatmap",
        "heatmap_desc": "Highlighted areas influence the AI prediction.",
        "dob_label": "DOB:",
        "mobile_label": "Mobile:",
        "abha_label": "ABHA:",
        "blood_group_label": "Blood Group:",
        "address_label": "Address:"
    }

    dynamic_content = {
        "prediction": ai_result.prediction_label or "N/A",
        "risk_level_val": ai_result.risk_level.lower(), # For interpolation
        "risk_level_display": ai_result.risk_level, 
        "confidence_val": f"{ai_result.confidence * 100:.1f}%"
    }
    
    # Pre-format summary points for translation
    p1 = labels["summary_point_1"].format(prediction=dynamic_content["prediction"])
    p2 = labels["summary_point_2"].format(risk_level=dynamic_content["risk_level_display"])
    p3 = labels["summary_point_3"]
    
    labels["summary_point_1_fmt"] = p1
    labels["summary_point_2_fmt"] = p2
    labels["summary_point_3_fmt"] = p3

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

    # ================= HELPERS (Improved) =================
    def draw_section_header(text, y):
        c.setFillColor(SOFT_GRAY)
        c.roundRect(40, y - 22, width - 80, 26, 8, fill=1, stroke=0)
        c.setFillColor(PRIMARY_BLUE)
        c.setFont(font_bold, 13)
        c.drawString(55, y - 16, text)
        return y - 40

    def wrap_text(text, max_width, font=font_name, size=11):
        if not text:
            return [""]
        words = str(text).split(" ")
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

    def draw_footer():
        footer_y = 50
        c.setStrokeColor(SOFT_GRAY)
        c.line(40, footer_y + 25, width - 40, footer_y + 25)

        c.setFont(font_name, 9)
        c.setFillColor(TEXT_DARK)
        # Disclaimer Left (Keep at y=60)
        c.drawString(40, footer_y + 10, labels["disclaimer"])
        
        # Center Branding
        c.setFont(font_bold, 12)
        c.setFillColor(PRIMARY_BLUE)
        c.drawCentredString(width / 2, 25, "Swasthya Setu")
        c.setFont(font_name, 9)
        c.drawCentredString(width / 2, 12, "AI for Accessible & Responsible Healthcare")

        # Generated On Bottom Right (Align with bottom text at y=12)
        c.setFont(font_name, 8)
        c.setFillColor(TEXT_DARK)
        c.drawRightString(width - 40, 12, f"{labels['generated_on']} {datetime.now().strftime('%d %b %Y, %H:%M')}")

    def ensure_space(required=40):
        nonlocal y
        if y - required < FOOTER_HEIGHT + 20:
            draw_footer()
            c.showPage()
            y = height - 50

    def draw_field(label, value, x_label, x_value, current_y, max_w=300):
        # Calculate label height (usually 1 line)
        c.setFont(font_bold, 11)
        c.setFillColor(TEXT_DARK)
        c.drawString(x_label, current_y, label)

        # Wrap and draw value
        c.setFont(font_name, 11)
        # Ensure value is string
        val_str = str(value) if value is not None else "-"
        lines = wrap_text(val_str, max_w, font_name, 11)
        
        dy = current_y
        for line in lines:
            c.drawString(x_value, dy, line)
            dy -= 14
        
        # Return new Y (accounting for at least 1 line height or multiple)
        return min(current_y - 20, dy - 6)

    # ================= HEADER & LOGO =================
    logo_path = os.path.join(os.path.dirname(__file__), "logo.jpeg")
    
    # Logo Configuration
    logo_width = 200
    logo_height = 100
    logo_x = (width - logo_width) / 2
    
    # Minimal top margin (5 units from top edge)
    logo_y = height - logo_height - 5
    
    if os.path.exists(logo_path):
        try:
             c.drawImage(logo_path, logo_x, logo_y, width=logo_width, height=logo_height, preserveAspectRatio=True, mask='auto')
        except Exception as e:
             print(f"Error loading logo: {e}")
             # Fallback to drawn cross centered
             cx = width / 2
             cy = logo_y + logo_height / 2
             c.setFillColor(HexColor("#E63946"))
             c.roundRect(cx - 40, cy - 40, 80, 80, 12, fill=1, stroke=0)
             c.setFillColor(HexColor("#FFFFFF"))
             c.rect(cx - 10, cy - 20, 20, 40, fill=1, stroke=0)
             c.rect(cx - 20, cy - 10, 40, 20, fill=1, stroke=0)
    else:
        # Fallback centered
        cx = width / 2
        cy = logo_y + logo_height / 2
        c.setFillColor(HexColor("#E63946"))
        c.roundRect(cx - 40, cy - 40, 80, 80, 12, fill=1, stroke=0)
        c.setFillColor(HexColor("#FFFFFF"))
        c.rect(cx - 10, cy - 20, 20, 40, fill=1, stroke=0)
        c.rect(cx - 20, cy - 10, 40, 20, fill=1, stroke=0)

    # Move y down below logo for title (Minimal spacing)
    y = logo_y - 10

    # Title centered
    c.setFont(font_bold, 22)
    c.setFillColor(PRIMARY_BLUE)
    c.drawCentredString(width / 2, y, labels["title"])
    
    y -= 20

    c.setFont(font_name, 11)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(width / 2, y, labels["subtitle"])

    c.setStrokeColor(ACCENT_TEAL)
    c.setLineWidth(1.5)
    c.line(40, y - 10, width - 40, y - 10)
    y -= 35

    # ================= PATIENT INFO =================
    y = draw_section_header(labels["patient_info"], y)

    # Column 1
    start_y = y
    y = draw_field(labels["patient_name_label"], test.patient.user.full_name, 60, 160, y, max_w=180)
    y = draw_field(labels["dob_label"], test.patient.date_of_birth or "N/A", 60, 160, y, max_w=180)
    y = draw_field(labels["mobile_label"], test.patient.user.phone, 60, 160, y, max_w=180)
    
    # Column 2 (Reset Y)
    col2_y = start_y
    col2_y = draw_field(labels["report_date_label"], test.test_date.strftime("%d %b %Y"), 320, 420, col2_y, max_w=150)
    col2_y = draw_field(labels["abha_label"], test.patient.user.abha_id or "N/A", 320, 420, col2_y, max_w=150)
    col2_y = draw_field(labels["blood_group_label"], test.patient.blood_group or "N/A", 320, 420, col2_y, max_w=150)
    
    # Use lowest Y
    y = min(y, col2_y)

    # Full width address
    y = draw_field(labels["address_label"], test.patient.address or "N/A", 60, 160, y, max_w=380)
    y -= 15

    # ================= CLINICAL CONTEXT =================
    if clinical_context:
        y = draw_section_header(labels["clinical_context"], y)

        if dynamic_content.get("symptoms"):
            c.setFont(font_bold, 11)
            c.drawString(60, y, labels["symptoms_label"])
            y -= 15
            for s in dynamic_content["symptoms"]:
                y = draw_field("•", s, 70, 85, y, max_w=450)
            y -= 5

        if clinical_context.vitals:
            c.setFont(font_bold, 11)
            c.drawString(60, y, labels["vitals_label"])
            y -= 15
            
            # Grid layout for vitals
            vitals_items = list(clinical_context.vitals.items())
            for i in range(0, len(vitals_items), 2):
                # Item 1
                k1, v1 = vitals_items[i]
                y1 = draw_field(f"{k1}:", v1, 70, 180, y, max_w=100)
                
                # Item 2
                y2 = y
                if i + 1 < len(vitals_items):
                    k2, v2 = vitals_items[i+1]
                    y2 = draw_field(f"{k2}:", v2, 320, 430, y, max_w=100)
                
                y = min(y1, y2)
    
    y -= 10

    # ================= AI ANALYSIS (Split Layout) =================
    ensure_space(250)
    y = draw_section_header(labels["ai_results"], y)
    
    # Define Split Zones
    # Left Box (Heatmap): x=50, w=200, h=200
    # Center Y of the block relative to current y
    block_height = 200
    block_center_y = y - (block_height / 2)
    
    # --- Left: Heatmap ---
    # Box Top: y, Bottom: y-200
    c.setStrokeColor(SOFT_GRAY)
    c.setLineWidth(1)
    c.roundRect(50, y - block_height, 200, block_height, 8, stroke=1, fill=0)
    
    heatmap_drawn = False
    if ai_result.heatmap_image:
        try:
             # Handle remote storage (R2/S3)
            heatmap_file = ai_result.heatmap_image
            import tempfile
            
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_heatmap:
                if hasattr(heatmap_file, 'open'):
                    heatmap_file.open('rb')
                tmp_heatmap.write(heatmap_file.read())
                tmp_heatmap_path = tmp_heatmap.name
                if hasattr(heatmap_file, 'close'):
                    heatmap_file.close()

            if tmp_heatmap_path and os.path.exists(tmp_heatmap_path):
                 # Draw image inside box
                 c.drawImage(tmp_heatmap_path, 51, y - block_height + 1, width=198, height=198, preserveAspectRatio=True)
                 heatmap_drawn = True
                 try:
                     os.remove(tmp_heatmap_path)
                 except:
                     pass
        except Exception as e:
            print(f"Error drawing heatmap in split view: {e}")
            pass
            
    if not heatmap_drawn:
        c.setFont(font_name, 10)
        c.setFillColor(HexColor("#999999"))
        c.drawCentredString(150, block_center_y, "No Heatmap Available")
        
    # Heatmap Header/Label below the box
    c.setFont(font_bold, 10)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(150, y - block_height - 15, labels.get("heatmap_title", "Grad-CAM Heatmap"))

    # --- Right: Stats (Vertically Centered) ---
    # 1. Calculate height of right content to determine Start Y
    # Fonts
    f_finding = 11
    f_risk = 11
    f_conf = 11
    f_note = 9
    
    # Simulate drawing to get height
    # Finding
    finding_lines = wrap_text(dynamic_content["prediction"], 280, font_name, f_finding)
    h_finding = len(finding_lines) * 14
    
    # Risk Badge (Label + Badge + Padding)
    h_risk = 14 + 16 + 10 # roughly 40
    
    # Confidence (Label + Bar + Padding)
    h_conf = 14 + 8 + 10 # roughly 32
    
    # Note
    note_lines = wrap_text(labels["ai_note"], 260, font_oblique, f_note)
    h_note = len(note_lines) * 12
    
    total_right_height = h_finding + h_risk + h_conf + h_note + 20 # 20 padding
    
    # Start Y for Right Content such that its center aligns with block_center_y
    # Top of right content = block_center_y + (total_right_height / 2)
    right_start_y = block_center_y + (total_right_height / 2)
    
    current_y = right_start_y
    
    # Draw Finding
    c.setFont(font_name, f_finding)
    for line in finding_lines:
        c.drawString(270, current_y, line)
        current_y -= 14
    
    current_y -= 10
    
    # Risk Badge
    c.setFont(font_bold, f_risk)
    c.setFillColor(TEXT_DARK)
    c.drawString(270, current_y, labels["ai_risk_label"])
    
    badge_color = WARNING_RED if ai_result.risk_level.lower() == "high" else ACCENT_TEAL
    c.setFillColor(badge_color)
    c.roundRect(410, current_y - 2, 80, 16, 6, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont(font_bold, 9)
    risk_text = dynamic_content["risk_level_display"].upper()
    c.drawCentredString(450, current_y + 2, risk_text)
    current_y -= 25

    # Confidence Bar
    c.setFont(font_bold, f_conf)
    c.setFillColor(TEXT_DARK)
    c.drawString(270, current_y, labels["model_confidence_label"])
    c.setFont(font_name, f_conf)
    
    conf_pct = ai_result.confidence * 100
    c.drawString(410, current_y, f"{conf_pct:.1f}%")
    
    c.setFillColor(SOFT_GRAY)
    c.rect(410, current_y - 10, 120, 6, fill=1, stroke=0)
    c.setFillColor(ACCENT_TEAL)
    c.rect(410, current_y - 10, 1.2 * (conf_pct), 6, fill=1, stroke=0)
    current_y -= 25
    
    # Note
    c.setFont(font_oblique, f_note)
    c.setFillColor(TEXT_DARK)
    for line in note_lines:
        c.drawString(270, current_y, line)
        current_y -= 12

    # Move main Y below the entire block (200 height + label space + margin)
    y -= (block_height + 40)

    # ================= EXECUTIVE SUMMARY (Bullet Points) =================
    ensure_space(100)
    
    # Gather points (Translated if needed)
    sp1 = labels.get("summary_point_1_fmt", labels["summary_point_1"]).format(prediction=dynamic_content["prediction"])
    sp2 = labels.get("summary_point_2_fmt", labels["summary_point_2"]).format(risk_level=dynamic_content["risk_level_display"])
    sp3 = labels.get("summary_point_3_fmt", labels["summary_point_3"])
    
    summary_points = [sp1, sp2, sp3]
    
    # Calculate box height based on points
    # Avg 1-2 lines per point
    pts_height = 0
    formatted_points = []
    for p in summary_points:
        lines = wrap_text(p, width - 130, font_name, 11)
        formatted_points.append(lines)
        pts_height += len(lines) * 14 + 6 # 6 padding per point
        
    box_height = 20 + pts_height
    ensure_space(box_height + 40)

    # Label on top
    c.setFont(font_bold, 13)
    c.setFillColor(PRIMARY_BLUE)
    c.drawString(55, y, labels["exec_summary_title"])
    y -= 10
    
    # Box below label
    c.setFillColor(SOFT_GRAY)
    c.roundRect(40, y - box_height, width - 80, box_height, 10, fill=1, stroke=0)
    
    # Draw Points
    current_y = y - 25
    for i, p_lines in enumerate(formatted_points):
        # Bullet
        c.setFont(font_bold, 16)
        c.setFillColor(PRIMARY_BLUE)
        c.drawString(55, current_y - 2, "•")
        
        # Text
        c.setFont(font_name, 11)
        c.setFillColor(TEXT_DARK)
        dy = current_y
        for line in p_lines:
            c.drawString(75, dy, line)
            dy -= 14
            
        current_y = dy - 6

    y -= box_height + 25

    # ================= DOCTOR REVIEW =================
    ensure_space(140)
    y = draw_section_header(labels["doctor_review"], y)
    
    c.setFont(font_name, 10)
    c.setFillColor(TEXT_DARK)
    c.drawString(60, y, labels["doctor_review_note"])
    y -= 25

    try:
        referral = getattr(test, 'referral', None)
        doctor_review = getattr(referral, 'doctor_review', None) if referral else None
        
        if doctor_review:
            y = draw_field(labels["reviewing_doctor_label"], f"Dr. {doctor_review.doctor.user.full_name}", 60, 220, y)
            y = draw_field(labels["clinical_decision_label"], doctor_review.get_decision_display(), 60, 220, y)
            
            if doctor_review.notes:
                notes_text = doctor_review.notes
                # Quick translate if needed
                if bhashini and target_lang != "en":
                    try:
                        notes_text = bhashini.translate_batch([notes_text], target_lang)[0]
                    except:
                        pass
                
                y = draw_field(labels["doctor_notes_label"], notes_text, 60, 220, y, max_w=300)
        else:
            # Pending Status
            c.setFillColor(HexColor("#FFF3E0")) # Light Orange/Yellow
            c.roundRect(60, y - 30, width - 120, 30, 6, fill=1, stroke=0)
            c.setFillColor(HexColor("#FF9800")) # Darker Orange text
            c.setFont(font_bold, 11)
            c.drawCentredString(width / 2, y - 20, "Doctor's Review Pending")
            y -= 40
            
    except Exception:
        pass

    # ================= FOOTER (Final Page) =================
    draw_footer()

    c.save()
    with open(path, "rb") as f:
        pdf_name = f"report_{test.id}_{target_lang}.pdf"
        pdf = ContentFile(f.read(), name=pdf_name)
    os.remove(path)
    return pdf