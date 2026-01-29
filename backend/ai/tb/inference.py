import torch
import numpy as np
import cv2
import os
from PIL import Image
from torchvision import transforms
from .model import TBModel
from ai.breast_cancer.gradcam import GradCAM

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

    model = TBModel(num_classes=3)
    
    # Load state_dict safely
    state_dict = torch.load(model_path, map_location="cpu")
    model.load_state_dict(state_dict)
    
    model = model.to(device)
    model.eval()
    
    _tb_model_cache = model
    return model

def predict_tb(image_path, model_path, device="cpu"):
    """
    Runs TB prediction on a chest X-ray image.
    
    Returns:
        dict: {
            "prediction": str ("Healthy" | "Sick" | "TB"),
            "confidence": float,
            "probabilities": dict,
            "overlay": np.ndarray (224x224x3, float 0-1)
        }
    """
    if device == "cuda" and not torch.cuda.is_available():
        device = "cpu"
    device = torch.device(device)

    # 1. Load & Preprocess
    img = Image.open(image_path).convert("RGB")
    img_resized = img.resize((224, 224))
    img_np = np.array(img_resized)
    
    x = transform(img).unsqueeze(0).to(device)

    # 2. Model Inference
    model = _load_tb_model(model_path, device)
    
    labels = ["Healthy", "Sick", "TB"]
    
    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)[0]
        pred_idx = torch.argmax(probs).item()
        confidence = probs[pred_idx].item()

    # 3. Grad-CAM Visualization
    # Target terminal ResNet layer for heatmap
    target_layer = model.backbone.layer4[-1]
    gradcam = GradCAM(model, target_layer)
    cam = gradcam.generate(x, pred_idx)
    
    # Resize cam to match original image dimensions (224x224)
    cam = cv2.resize(cam, (224, 224))
    
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    
    # Overlay heatmap on original image
    overlay = cv2.addWeighted(img_np, 0.6, heatmap, 0.4, 0)
    overlay = overlay.astype(np.float32) / 255.0

    return {
        "prediction": labels[pred_idx],
        "confidence": confidence,
        "probabilities": {
            labels[0]: float(probs[0]),
            labels[1]: float(probs[1]),
            labels[2]: float(probs[2])
        },
        "overlay": overlay
    }
