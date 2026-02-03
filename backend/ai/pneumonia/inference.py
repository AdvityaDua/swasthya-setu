import torch
import numpy as np
import cv2
import os
from PIL import Image
from torchvision import transforms
import timm

# ---------------------------------------------------------
# Image transforms (as per training notebook)
# ---------------------------------------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# =====================================================
# LUNG SEGMENTATION (CLASSICAL APPROACH)
# =====================================================
def segment_lungs(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    gray = clahe.apply(gray)

    blur = cv2.GaussianBlur(gray, (5,5), 0)

    _, thresh = cv2.threshold(blur, 0, 255,
                              cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    kernel = np.ones((7,7), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(thresh,
                                   cv2.RETR_EXTERNAL,
                                   cv2.CHAIN_APPROX_SIMPLE)

    mask = np.zeros_like(gray)

    # Keep 2 largest components (lungs)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:2]

    for cnt in contours:
        cv2.drawContours(mask, [cnt], -1, 255, -1)

    mask = cv2.GaussianBlur(mask, (15,15), 0)

    return mask

# =====================================================
# GRAD-CAM
# =====================================================
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

    def generate(self, input_tensor, class_idx):
        # We need to run a forward pass to get gradients/activations
        # Note: The caller might have already run forward, but we need to ensure
        # hooks are triggered or gradients are zeroed for this specific backward.
        
        # However, to avoid double forward if not needed, we can just run output backwards
        # IF the model state has the activations. 
        # But cleanest way is to just run forward again inside generate or before.
        # The user's snippet runs: output = self.model(input_tensor); output.backward(...)
        
        output = self.model(input_tensor)
        self.model.zero_grad()

        one_hot = torch.zeros_like(output)
        one_hot[0][class_idx] = 1
        output.backward(gradient=one_hot)

        gradients = self.gradients[0].detach().cpu().numpy()
        activations = self.activations[0].detach().cpu().numpy()

        weights = np.mean(gradients, axis=(1,2))
        cam = np.zeros(activations.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * activations[i]

        cam = np.maximum(cam, 0)
        cam = cv2.resize(cam, (224,224))
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)

        return cam

def _load_pneumonia_model(model_path, device):
    """
    Loads pneumonia model from a state_dict file.
    """
    # Recreate model architecture (efficientnet_b0 as per previous context)
    model = timm.create_model(
        "efficientnet_b0",
        pretrained=False,
        num_classes=3
    )

    # Load state_dict safely on CPU
    state_dict = torch.load(
        model_path,
        map_location="cpu"
    )

    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()

    return model


def predict_pneumonia(image_path, model_path, device="cpu"):
    """
    Runs pneumonia prediction with precise screening logic (cropping, segmentation).
    """
    # Safe device resolution
    if device == "cuda" and not torch.cuda.is_available():
        device = "cpu"
    device = torch.device(device)

    # 1. Load & Preprocess
    img = Image.open(image_path).convert("RGB")
    img_np = np.array(img)

    # Crop thoracic region
    h, w = img_np.shape[:2]
    x1 = int(0.15 * w)
    x2 = int(0.85 * w)
    y1 = int(0.10 * h)
    y2 = int(0.95 * h)

    cropped = img_np[y1:y2, x1:x2]
    cropped_resized = cv2.resize(cropped, (224,224))

    # Segment lungs
    lung_mask = segment_lungs(cropped_resized)

    # Prepare for model
    cropped_pil = Image.fromarray(cropped_resized)
    input_tensor = transform(cropped_pil).unsqueeze(0).to(device)

    # 2. Model Inference
    model = _load_pneumonia_model(model_path, device)

    with torch.no_grad():
        outputs = model(input_tensor)
        probs = torch.softmax(outputs, dim=1)[0].cpu().numpy()

    normal_p = float(probs[0])
    other_p  = float(probs[1])
    pneu_p   = float(probs[2])

    max_prob = max(normal_p, other_p, pneu_p)

    # Diagnosis Logic
    if max_prob < 0.50:
        diagnosis = "Inconclusive"
        confidence = max_prob # Use max prob as confidence
    elif pneu_p >= 0.55:
        diagnosis = "Pneumonia suspected"
        confidence = pneu_p
    elif other_p >= 0.55:
        diagnosis = "Other Lung Abnormality"
        confidence = other_p
    else:
        diagnosis = "Normal"
        confidence = normal_p

    # 3. Grad-CAM
    # Target layer: model.blocks[-2] (EfficientNet specific)
    target_layer = model.blocks[-2]
    gradcam = GradCAM(model, target_layer)
    predicted_class_idx = np.argmax(probs)
    
    # We must enable gradients for GradCAM
    # Re-run forward pass with gradients enabled is handled inside gradcam.generate?
    # No, gradcam.generate runs model(input). 
    # But model is in eval mode. We need to make sure gradients are not disabled globally if we want backward()
    # torch.set_grad_enabled(True) is needed if wrapped in no_grad, but here we are outside no_grad block.
    # The snippet runs backward() so it should work.

    cam = gradcam.generate(input_tensor, predicted_class_idx)
    cam_uint8 = np.uint8(255 * cam)

    # Restrict CAM to lung mask
    cam_masked = cv2.bitwise_and(cam_uint8, cam_uint8, mask=lung_mask)

    # Threshold strongest areas (0.60)
    threshold_value = int(0.60 * 255)
    _, cam_thresh = cv2.threshold(cam_masked, threshold_value, 255, cv2.THRESH_BINARY)

    contours, _ = cv2.findContours(cam_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Heatmap (BGR by default in OpenCV)
    heatmap = cv2.applyColorMap(cam_masked, cv2.COLORMAP_JET)

    # Overlay: 0.6 * original(BGR) + 0.4 * heatmap(BGR)
    # Note: cropped_resized is RGB (from PIL), verify? 
    # PIL -> np.array is RGB. 
    # cv2.resize behaves on arrays.
    # So cropped_resized is RGB.
    # cv2.applyColorMap returns BGR.
    # So we are mixing RGB (cropped) + BGR (heatmap). This creates incorrect colors locally.
    # User snippet:
    #   image = Image.open(image_path).convert("RGB")
    #   img_np = np.array(image) # RGB
    #   cropped_resized = cv2.resize(cropped, ...) # RGB
    #   heatmap = cv2.applyColorMap(..., cv2.COLORMAP_JET) # BGR
    #   overlay = cv2.addWeighted(cropped_resized, 0.6, heatmap, 0.4, 0)
    # User snippet mixes RGB and BGR? 
    #   If cropped_resized is RGB (Red lungs) and heatmap is BGR (Blue=Cold, Red=Hot).
    #   Red in Heatmap (Hot) + Red in Image -> Red.
    #   Blue in Heatmap (Cold) + Blue in Image -> Blue.
    #   It might mostly work visually if content is grayscaleish.
    # But for correctness, we should match spaces.
    
    # HOWEVER, strict adherence to user snippet implies doing exactly what they did.
    # But I need to return RGB so that ai_service can convert it to BGR.
    
    # My plan:
    # 1. Convert cropped_resized to BGR.
    # 2. Mix with Heatmap (BGR).
    # 3. Result is BGR.
    # 4. Draw Box (Green).
    # 5. Convert to RGB before returning.
    
    crop_bgr = cv2.cvtColor(cropped_resized, cv2.COLOR_RGB2BGR)
    overlay_bgr = cv2.addWeighted(crop_bgr, 0.6, heatmap, 0.4, 0)

    bbox = None
    if contours:
        largest = max(contours, key=cv2.contourArea)
        x, y, w_box, h_box = cv2.boundingRect(largest)

        if w_box * h_box > 300:
            cv2.rectangle(overlay_bgr,
                          (x,y),
                          (x+w_box, y+h_box),
                          (0,255,0), # Green in BGR
                          2)
            bbox = (x, y, x+w_box, y+h_box)

    # Output for ai_service needs to be RGB (0-1 float or just uint8?)
    # ai_service expects 0-1 float for overlay in other models, checks line 111:
    # overlay_uint8 = (result["overlay"] * 255).astype("uint8")
    # So it expects 0-1 float.
    
    # Convert BGR -> RGB
    overlay_rgb = cv2.cvtColor(overlay_bgr, cv2.COLOR_BGR2RGB)
    
    # Normalize to 0-1
    overlay_normalized = overlay_rgb.astype(np.float32) / 255.0

    return {
        "prediction": diagnosis,
        "confidence": confidence,
        "probabilities": {
            "Normal": round(normal_p * 100, 2),
            "Other": round(other_p * 100, 2),
            "Pneumonia": round(pneu_p * 100, 2)
        },
        "overlay": overlay_normalized
    }