import torch
import torch.nn as nn
import numpy as np
import cv2
from torchvision import models, transforms
from PIL import Image
import os

# =========================
# DEVICE
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================
# MEDICAL PREPROCESS
# =========================
class MedicalPreprocess:
    def __call__(self, img):
        img = np.array(img)
        # Handle grayscale/RGB input
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

transform = transforms.Compose([
    transforms.Resize((512, 512)),
    MedicalPreprocess(),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

# =========================
# GRAD-CAM
# =========================
class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate(self, input_tensor):
        output = self.model(input_tensor)
        self.model.zero_grad()
        output.backward(torch.ones_like(output))

        gradients = self.gradients[0].detach().cpu().numpy()
        activations = self.activations[0].detach().cpu().numpy()

        weights = np.mean(gradients, axis=(1,2))
        cam = np.zeros(activations.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * activations[i]

        cam = np.maximum(cam, 0)
        cam = cv2.resize(cam, (512,512))
        cam = (cam - cam.min()) / (cam.max() + 1e-8)

        return cam

# =========================
# MAIN INFERENCE
# =========================
def predict_hairline_fracture(image_path, model_path=None, save_dir=None):
    """
    Runs hairline fracture prediction and localization.
    Adapted from 'screen_and_localize' snippet.
    """
    
    # 1. Load Model
    # Recreate architecture
    model = models.efficientnet_b3(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, 1)
    
    if model_path is None:
        # Fallback default path relative to this file if not provided
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, "../../core/model/hairline.pkl")

    state_dict = torch.load(model_path, map_location=device)
    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()

    # 2. Preprocess
    original = Image.open(image_path).convert("RGB")
    img_np_full = np.array(original.resize((512,512)))

    # ---- Spatial Cropping (remove side artifacts) ----
    h, w, _ = img_np_full.shape
    x1 = int(0.15 * w)
    x2 = int(0.85 * w)
    y1 = int(0.05 * h)
    y2 = int(0.95 * h)

    cropped = img_np_full[y1:y2, x1:x2]
    cropped = cv2.resize(cropped, (512,512))
    cropped_pil = Image.fromarray(cropped)

    # ---- Inference ----
    input_tensor = transform(cropped_pil).unsqueeze(0).to(device)

    with torch.no_grad():
        prob_nonfracture = torch.sigmoid(model(input_tensor)).item()
        prob_fracture = 1 - prob_nonfracture

    threshold = 0.35
    diagnosis = "Fracture Detected" if prob_fracture >= threshold else "No Fracture Detected"

    if prob_fracture < 0.20:
        confidence = "Very Low"
    elif prob_fracture < 0.35:
        confidence = "Low"
    elif prob_fracture < 0.60:
        confidence = "Moderate"
    else:
        confidence = "High"

    # ---- Grad-CAM (higher resolution layer) ----
    gradcam = GradCAM(model, model.features[-2])
    cam = gradcam.generate(input_tensor)

    cam_uint8 = np.uint8(255 * cam)

    # ---- Keep top 30% strongest activations ----
    threshold_value = int(0.70 * 255)
    _, cam_thresh = cv2.threshold(cam_uint8, threshold_value, 255, cv2.THRESH_BINARY)

    kernel = np.ones((7,7), np.uint8)
    cam_clean = cv2.morphologyEx(cam_thresh, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(cam_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    heatmap = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    
    # Overlay: 0.6 * cropped(RGB) + 0.4 * heatmap(BGR) - WAIT!
    # User snippet:
    #   cropped_pil = Image.fromarray(cropped) -> cropped is RGB (from PIL)
    #   heatmap = cv2.applyColorMap(..., cv2.COLORMAP_JET) -> BGR
    #   overlay = cv2.addWeighted(cropped, ...)
    # This mixes RGB and BGR in the snippet.
    # To be SAFE and consistent with previous fixes (TB/Pneumonia), I will:
    # 1. Convert Crop to BGR.
    # 2. Mix with Heatmap (BGR).
    # 3. Draw Red Box (BGR: 0,0,255).
    # 4. Convert Result to RGB.
    
    cropped_bgr = cv2.cvtColor(cropped, cv2.COLOR_RGB2BGR)
    overlay_bgr = cv2.addWeighted(cropped_bgr, 0.6, heatmap, 0.4, 0)

    bbox_img = overlay_bgr.copy()
    bbox = None

    if contours:
        largest = max(contours, key=cv2.contourArea)
        x, y, w_box, h_box = cv2.boundingRect(largest)

        if w_box * h_box > 300:
            cv2.rectangle(bbox_img, (x,y), (x+w_box, y+h_box), (0,0,255), 2) # Red in BGR
            bbox = (x, y, x+w_box, y+h_box)
            
    # Convert BGR -> RGB for output (ai_service expects RGB to convert back to BGR)
    overlay_rgb = cv2.cvtColor(bbox_img, cv2.COLOR_BGR2RGB)
    
    # Normalize to 0-1
    overlay_norm = overlay_rgb.astype(np.float32) / 255.0

    return {
        "diagnosis": diagnosis,
        "probability": round(prob_fracture * 100, 2),
        "confidence": prob_fracture, # float as expected by ai_service
        "confidence_level": confidence,
        "bbox": bbox,
        "overlay": overlay_norm
    }

