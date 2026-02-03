import torch
import numpy as np
import cv2
import matplotlib.cm
import os
from PIL import Image
from torchvision import transforms
from .model import HybridCNNTransformer

# Standard ImageNet normalization used in training
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# Global cache for model (Singleton pattern for efficiency)
_tb_model_cache = None

def _load_tb_model(model_path, device):
    global _tb_model_cache
    if _tb_model_cache is not None:
        return _tb_model_cache

    model = HybridCNNTransformer(num_classes=3)
    
    # Load state_dict safely
    state_dict = torch.load(model_path, map_location="cpu")
    model.load_state_dict(state_dict)
    
    model = model.to(device)
    model.eval()
    
    _tb_model_cache = model
    return model

def predict_tb(image_path, model_path, device="cpu"):
    """
    Runs TB prediction on a chest X-ray image with manual Grad-CAM and Localization.
    """
    if device == "cuda" and not torch.cuda.is_available():
        device = "cpu"
    device = torch.device(device)

    # 1. Load & Preprocess
    img = Image.open(image_path).convert("RGB")
    img_resized = img.resize((224, 224))
    img_np = np.array(img_resized)
    
    x = transform(img).unsqueeze(0).to(device)

    # 2. Model Inference + Manual Feature Extraction
    model = _load_tb_model(model_path, device)
    
    # Enable gradients for CAM computation
    model.zero_grad()
    
    # Forward Pass
    features = model.forward_features(x)
    features.retain_grad()
    
    # Manual rest of network
    pooled = features.mean(dim=[2,3])
    tokens = pooled.unsqueeze(1)
    tokens = model.transformer(tokens)
    logits = model.classifier(tokens[:,0])
    
    probs = torch.softmax(logits, dim=1)[0]
    pred_idx = torch.argmax(probs).item()
    confidence = probs[pred_idx].item()
    
    labels = ["Healthy", "Sick", "TB"]

    # 3. Manual Grad-CAM Backward Pass
    # The user's snippet hardcoded index 2 ("TB").
    # We will stick to index 2 to visualize TB features regardless of prediction.
    logits[:, 2].backward()
    
    grads = features.grad
    weights = grads.mean(dim=(2,3), keepdim=True)
    cam = (weights * features).sum(dim=1)
    cam = torch.relu(cam)
    
    cam = cam[0].detach().cpu().numpy()
    cam = cv2.resize(cam, (224, 224))
    
    # Matches gradcam_localization normalization
    cam = cam - np.min(cam)
    cam = cam / (np.max(cam) + 1e-8)
    
    # 4. Localization (Drawing Boxes)
    # Use sharper logic from draw_tb_boxes (No blur, fixed threshold) to avoid "too large" boxes
    
    # Threshold high-activation regions (threshold=0.6)
    threshold = 0.6
    binary = (cam > threshold).astype(np.uint8)
    
    # Find Contours
    contours, _ = cv2.findContours(
        (binary * 255).astype(np.uint8),
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    # Create Heatmap Overlay
    # Create Heatmap Overlay
    # Use matplotlib's jet colormap to match snippet EXACTLY
    heatmap = matplotlib.cm.jet(cam)[..., :3] # Returns RGB floats 0-1

    # Base Overlay: 0.6 * Image + 0.4 * Heatmap
    # Normalize image to 0-1 for blending
    img_float = img_np.astype(np.float32) / 255.0
    
    overlay = (0.6 * img_float + 0.4 * heatmap)
    
    # Draw Bounding Boxes on Overlay
    # Scale overlay back to 0-255 for drawing, then finalize
    overlay_uint8 = (overlay * 255).astype(np.uint8)
    
    for cnt in contours:
        x_box, y_box, w_box, h_box = cv2.boundingRect(cnt)
        
        # Ignore small noise (area > 200 as per draw_tb_boxes)
        if w_box * h_box > 200:
            cv2.rectangle(
                overlay_uint8,
                (x_box, y_box),
                (x_box + w_box, y_box + h_box),
                (255, 255, 255), # White box for visibility
                2
            )
            
    # Final Overlay normalized to 0-1 for consistency with other parts of app
    final_overlay = overlay_uint8.astype(np.float32) / 255.0

    return {
        "prediction": labels[pred_idx],
        "confidence": confidence,
        "probabilities": {
            labels[0]: float(probs[0]),
            labels[1]: float(probs[1]),
            labels[2]: float(probs[2])
        },
        "overlay": final_overlay
    }
