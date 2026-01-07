import torch
import numpy as np
import cv2
import pydicom
import os

from .model import BreastCancerModel
from .gradcam import GradCAM


def load_image(path, size=(224, 224)):
    ext = os.path.splitext(path)[1].lower()

    # ---- DICOM ----
    if ext == ".dcm":
        ds = pydicom.dcmread(path)
        image = ds.pixel_array.astype(np.float32)

        image *= float(getattr(ds, "RescaleSlope", 1.0))
        image += float(getattr(ds, "RescaleIntercept", 0.0))

        if hasattr(ds, "WindowCenter") and hasattr(ds, "WindowWidth"):
            wc = ds.WindowCenter[0] if isinstance(ds.WindowCenter, list) else ds.WindowCenter
            ww = ds.WindowWidth[0] if isinstance(ds.WindowWidth, list) else ds.WindowWidth
            image = np.clip(image, wc - ww / 2, wc + ww / 2)

    # ---- PNG / JPG ----
    else:
        image = cv2.imread(path, cv2.IMREAD_GRAYSCALE).astype(np.float32)

    image = (image - image.min()) / (image.max() - image.min() + 1e-6)
    image = cv2.resize(image, size)
    return image


def predict_breast_cancer(dicom_or_image_path, model_path, device="cpu"):
    device = torch.device(device)

    image = load_image(dicom_or_image_path)
    tensor = torch.tensor(image).unsqueeze(0).repeat(3, 1, 1).unsqueeze(0).to(device)

    model = BreastCancerModel(num_classes=2).to(device)
    checkpoint = torch.load(model_path, map_location=device)

    state_dict = {k.replace("model.", ""): v for k, v in checkpoint["model_state_dict"].items()}
    model.model.load_state_dict(state_dict, strict=False)
    model.eval()

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)
        pred_class = int(torch.argmax(probs))
        confidence = float(probs[0, pred_class])

    gradcam = GradCAM(model, model.model.conv_head)
    cam = gradcam.generate(tensor, pred_class)

    # Resize CAM to image size
    cam_resized = cv2.resize(cam, (image.shape[1], image.shape[0]))

    heatmap = cv2.applyColorMap(
        np.uint8(255 * cam_resized),
        cv2.COLORMAP_JET
    )

    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

    overlay = (
        0.6 * np.stack([image]*3, axis=-1)
        + 0.4 * heatmap / 255.0
    )

    overlay = np.clip(overlay, 0, 1)

    return {
        "prediction": "Malignant" if pred_class == 1 else "Benign",
        "confidence": confidence,
        "overlay": overlay,
    }