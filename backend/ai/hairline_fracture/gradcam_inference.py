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
# LOAD MODEL
# =========================
model = models.efficientnet_b3(weights=None)
model.classifier[1] = nn.Linear(model.classifier[1].in_features, 1)
model.load_state_dict(torch.load("hairline_fracture_screening_final.pkl", map_location=device))
model = model.to(device)
model.eval()

# =========================
# SAME MEDICAL PREPROCESS AS TRAINING
# =========================
class MedicalPreprocess:
    def __call__(self, img):
        img = np.array(img)
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
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

        weights = np.mean(gradients, axis=(1, 2))
        cam = np.zeros(activations.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * activations[i]

        cam = np.maximum(cam, 0)
        cam = cv2.resize(cam, (512, 512))
        cam = (cam - cam.min()) / (cam.max() + 1e-8)

        return cam

# =========================
# PREDICT + DECIDE + HEATMAP
# =========================
def screen_hairline_fracture(image_path, save_path="gradcam_result.png"):

    image = Image.open(image_path).convert("RGB")
    input_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        prob_nonfracture = torch.sigmoid(model(input_tensor)).item()
        prob_fracture = 1 - prob_nonfracture   # correct class mapping

    # Screening threshold
    threshold = 0.35

    if prob_fracture >= threshold:
        diagnosis = "Fracture Detected (Screening Positive)"
    else:
        diagnosis = "No Fracture Detected"

    # Confidence scale
    if prob_fracture < 0.20:
        confidence = "Very Low"
    elif prob_fracture < 0.35:
        confidence = "Low"
    elif prob_fracture < 0.60:
        confidence = "Moderate"
    else:
        confidence = "High"

    # Grad-CAM
    gradcam = GradCAM(model, model.features[-1])
    cam = gradcam.generate(input_tensor)

    img_np = np.array(image.resize((512, 512)))
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(img_np, 0.6, heatmap, 0.4, 0)

    cv2.imwrite(save_path, overlay)

    return {
        "diagnosis": diagnosis,
        "probability": round(prob_fracture * 100, 2),
        "confidence": confidence,
        "heatmap_path": os.path.abspath(save_path)
    }

# =========================
# TEST
# =========================
if __name__ == "__main__":
    img_path = r"FracAtlas\images\Fractured\IMG0004356.jpg"

    result = screen_hairline_fracture(img_path, "gradcam_IMG0004356.png")

    print("\n--- Screening Result ---")
    print("Diagnosis :", result["diagnosis"])
    print("Probability:", result["probability"], "%")
    print("Confidence :", result["confidence"])
    print("Heatmap    :", result["heatmap_path"])
