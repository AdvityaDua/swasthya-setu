import torch
import numpy as np
import cv2
import os
from PIL import Image
from torchvision import transforms
import timm

from ai.breast_cancer.gradcam import GradCAM

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


def _load_pneumonia_model(model_path, device):
    """
    Loads pneumonia model from a state_dict file.
    This is CPU-safe and production-ready.
    """

    # Recreate model architecture (must match training)
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
    Runs pneumonia prediction on a chest X-ray image.

    Args:
        image_path (str): Path to input image (PNG/JPG/DICOM)
        model_path (str): Path to pneumonia_state_dict.pt
        device (str): "cpu" or "cuda"

    Returns:
        dict: {
            "prediction": str,
            "confidence": float,
            "overlay": np.ndarray (224x224x3, float 0-1)
        }
    """

    # ---------------------------------------------------------
    # Safe device resolution
    # ---------------------------------------------------------
    if device == "cuda" and not torch.cuda.is_available():
        device = "cpu"

    device = torch.device(device)

    # ---------------------------------------------------------
    # Load & preprocess image
    # ---------------------------------------------------------
    ext = os.path.splitext(image_path)[1].lower()

    if ext == ".dcm":
        import pydicom
        ds = pydicom.dcmread(image_path)
        pixel_array = ds.pixel_array.astype(np.float32)
        pixel_array = (pixel_array - pixel_array.min()) / (
            pixel_array.max() - pixel_array.min() + 1e-6
        )
        pixel_array = (pixel_array * 255).astype(np.uint8)
        img = Image.fromarray(pixel_array).convert("RGB")
    else:
        img = Image.open(image_path).convert("RGB")

    # For GradCAM overlay
    img_resized = img.resize((224, 224))
    img_np = np.array(img_resized)

    # Tensor for model
    x = transform(img).unsqueeze(0).to(device)

    # ---------------------------------------------------------
    # Load model (STATE_DICT — SAFE)
    # ---------------------------------------------------------
    model = _load_pneumonia_model(model_path, device)

    # ---------------------------------------------------------
    # Inference
    # ---------------------------------------------------------
    labels = {
        0: "Normal",
        1: "Other Lung Abnormality",
        2: "Pneumonia suspected"
    }

    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)
        pred_idx = torch.argmax(probs, dim=1).item()
        confidence = probs[0, pred_idx].item()

    prediction_label = labels.get(pred_idx, "Unknown")

    # ---------------------------------------------------------
    # Grad-CAM
    # ---------------------------------------------------------
    gradcam = GradCAM(model, model.conv_head)
    cam = gradcam.generate(x, pred_idx)

    heatmap = cv2.applyColorMap(
        np.uint8(255 * cam),
        cv2.COLORMAP_JET
    )
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    heatmap = cv2.resize(heatmap, (img_np.shape[1], img_np.shape[0]))

    overlay = cv2.addWeighted(img_np, 0.6, heatmap, 0.4, 0)

    # Normalize overlay to 0–1 float
    overlay = overlay.astype(np.float32) / 255.0

    # ---------------------------------------------------------
    # Return result
    # ---------------------------------------------------------
    return {
        "prediction": prediction_label,
        "confidence": confidence,
        "overlay": overlay
    }