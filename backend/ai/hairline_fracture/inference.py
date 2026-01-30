import torch
import torch.nn as nn
import numpy as np
import cv2
from torchvision import models, transforms
from PIL import Image
import os
from .gradcam import GradCAMpp

# =========================
# MEDICAL PREPROCESS
# =========================
class MedicalPreprocess:
    def __call__(self, img):
        img = np.array(img)
        # Convert to grayscale if not already
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        else:
            gray = img
            
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        blur = cv2.GaussianBlur(enhanced, (0,0), 1.0)
        sharp = cv2.addWeighted(enhanced, 1.5, blur, -0.5, 0)
        rgb = cv2.cvtColor(sharp, cv2.COLOR_GRAY2RGB)
        return Image.fromarray(rgb)

# =========================
# MAIN INFERENCE FUNCTION
# =========================
def predict_hairline_fracture(image_path, model_path=None, save_dir=None):
    """
    Runs hairline fracture prediction on an X-ray image.

    Args:
        image_path (str): Path to input image.
        model_path (str): Path to hairline.pkl model file.
        save_dir (str): Directory to save visual outputs (heatmap, bbox). If None, uses image directory.

    Returns:
        dict: {
            "diagnosis": str,
            "probability": float (0-100),
            "confidence": str,
            "heatmap_path": str,
            "bbox_image_path": str,
            "bbox": tuple (x1, y1, x2, y2)
        }
    """
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    if save_dir is None:
        save_dir = os.path.dirname(image_path)
    
    # Define transforms matching training
    transform = transforms.Compose([
        transforms.Resize((512, 512)),
        MedicalPreprocess(),
        transforms.ToTensor(),
        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
    ])

    # Load Model
    # Recreate architecture
    model = models.efficientnet_b3(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, 1)
    
    # Load weights safely
    if model_path is None:
        # Fallback default path relative to this file if not provided
        # Assuming ../../core/model/hairline.pkl relative to backend/ai/hairline_fracture/
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, "../../core/model/hairline.pkl")

    state_dict = torch.load(model_path, map_location=device)
    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()

    # Load & Preprocess Image
    try:
        image_pil = Image.open(image_path).convert("RGB")
    except Exception as e:
        return {"error": f"Failed to load image: {str(e)}"}

    input_tensor = transform(image_pil).unsqueeze(0).to(device)

    # Inference
    with torch.no_grad():
        logits = model(input_tensor)
        prob_nonfracture = torch.sigmoid(logits).item()
        prob_fracture = 1 - prob_nonfracture # Correct class mapping from reference

    # Diagnosis Logic
    threshold = 0.35
    if prob_fracture >= threshold:
        diagnosis = "Fracture Detected"
    else:
        diagnosis = "No Fracture Detected"

    # Confidence Scale
    if prob_fracture < 0.20:
        confidence = "Very Low"
    elif prob_fracture < 0.35:
        confidence = "Low"
    elif prob_fracture < 0.60:
        confidence = "Moderate"
    else:
        confidence = "High"

    # Grad-CAM++
    campp = GradCAMpp(model, model.features[-1])
    cam = campp.generate(input_tensor)
    
    # Resize CAM to 512x512
    cam = cv2.resize(cam, (512, 512))
    cam = (cam - cam.min()) / (cam.max() + 1e-8)

    # Edge Detection & Localization
    img_resized_np = np.array(image_pil.resize((512, 512)))
    gray = cv2.cvtColor(img_resized_np, cv2.COLOR_RGB2GRAY)
    
    # Sharpen CAM (keep only strong responses)
    cam_uint8 = np.uint8(255 * cam)
    _, cam_thresh = cv2.threshold(cam_uint8, int(0.7 * 255), 255, cv2.THRESH_BINARY)
    
    # Clean small noise
    kernel = np.ones((5,5), np.uint8)
    cam_clean = cv2.morphologyEx(cam_thresh, cv2.MORPH_OPEN, kernel)
    
    # Edge Detection
    edges = cv2.Canny(gray, 50, 150)
    
    # Fuse: semantic (CAM) + geometric (edges)
    fused = cv2.bitwise_and(edges, cam_clean)
    
    # Bounding box
    ys, xs = np.where(fused > 0)
    if len(xs) > 0:
        x1, x2 = int(xs.min()), int(xs.max())
        y1, y2 = int(ys.min()), int(ys.max())
    else:
        x1 = y1 = x2 = y2 = 0

    # Save Visual Outputs
    # Heatmap Overlay
    heatmap = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(img_resized_np, 0.6, heatmap, 0.4, 0)
    
    # BBox Image
    bbox_img = img_resized_np.copy()
    if x2 > x1 and y2 > y1:
        cv2.rectangle(bbox_img, (x1,y1), (x2,y2), (0,0,255), 2)

    base_filename = os.path.splitext(os.path.basename(image_path))[0]
    heatmap_path = os.path.join(save_dir, f"{base_filename}_heatmap.png")
    bbox_path = os.path.join(save_dir, f"{base_filename}_bbox.png")
    
    # Convert BGR to RGB for saving with cv2 (cv2 reads/writes BGR)
    # But wait, our img_resized_np is RGB (from PIL), so cv2.imwrite expects BGR.
    # We need to convert RGB -> BGR before saving.
    overlay_bgr = cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR)
    bbox_img_bgr = cv2.cvtColor(bbox_img, cv2.COLOR_RGB2BGR)
    
    cv2.imwrite(heatmap_path, overlay_bgr)
    cv2.imwrite(bbox_path, bbox_img_bgr)

    # Normalize overlay to 0-1 float for consistency with other models
    overlay_norm = overlay.astype(np.float32) / 255.0

    return {
        "diagnosis": diagnosis,
        "probability": round(prob_fracture * 100, 2),
        "confidence": prob_fracture, # Return float 0-1
        "confidence_level": confidence, # Return string as confidence_level
        "heatmap_path": os.path.abspath(heatmap_path),
        "bbox_image_path": os.path.abspath(bbox_path),
        "bbox": (x1, y1, x2, y2),
        "overlay": overlay_norm # Return numpy array 0-1
    }

