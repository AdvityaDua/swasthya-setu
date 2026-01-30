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
MODEL_PATH = r"C:\Users\Sonali\Downloads\FracAtlas\hairline_fracture_screening_final.pkl"

model = models.efficientnet_b3(weights=None)
model.classifier[1] = nn.Linear(model.classifier[1].in_features, 1)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model = model.to(device)
model.eval()

# =========================
# MEDICAL PREPROCESS
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
# GRAD-CAM++
# =========================
class GradCAMpp:
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

        grads = self.gradients[0].detach().cpu().numpy()
        acts = self.activations[0].detach().cpu().numpy()

        weights = np.sum(grads, axis=(1,2))
        cam = np.zeros(acts.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * acts[i]

        cam = np.maximum(cam, 0)
        cam = cv2.resize(cam, (512,512))
        cam = (cam - cam.min()) / (cam.max() + 1e-8)
        return cam

# =========================
# FAST XAI LOCALIZATION
# =========================
def localize_hairline(image_path):
    image = Image.open(image_path).convert("RGB")
    input_tensor = transform(image).unsqueeze(0).to(device)

    # Probability
    with torch.no_grad():
        prob_nonfracture = torch.sigmoid(model(input_tensor)).item()
        prob_fracture = 1 - prob_nonfracture

    # Grad-CAM++
    campp = GradCAMpp(model, model.features[-1])
    cam = campp.generate(input_tensor)

    # Edge detection
    gray = cv2.cvtColor(np.array(image.resize((512,512))), cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 50, 150)

    # Fuse CAM + edges
    # ---- Sharpen CAM (keep only strong responses) ----
    cam_uint8 = np.uint8(255 * cam)
    _, cam_thresh = cv2.threshold(cam_uint8, int(0.7 * 255), 255, cv2.THRESH_BINARY)

# Clean small noise
    kernel = np.ones((5,5), np.uint8)
    cam_clean = cv2.morphologyEx(cam_thresh, cv2.MORPH_OPEN, kernel)

# ---- Edge Detection ----
    edges = cv2.Canny(gray, 50, 150)

# ---- Fuse: semantic (CAM) + geometric (edges) ----
    fused = cv2.bitwise_and(edges, cam_clean)

# ---- Bounding box from fused crack mask ----
    ys, xs = np.where(fused > 0)
    if len(xs) > 0:
        x1, x2 = xs.min(), xs.max()
        y1, y2 = ys.min(), ys.max()
    else:
        x1 = y1 = x2 = y2 = 0


    # Save visual outputs
    base = np.array(image.resize((512,512)))
    heatmap = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(base, 0.6, heatmap, 0.4, 0)

    bbox_img = base.copy()
    if x2 > x1 and y2 > y1:
        cv2.rectangle(bbox_img, (x1,y1), (x2,y2), (0,0,255), 2)

    cv2.imwrite("xai_heatmap.png", overlay)
    cv2.imwrite("xai_edges.png", edges)
    cv2.imwrite("xai_bbox.png", bbox_img)

    return {
        "fracture_probability": round(prob_fracture*100, 2),
        "bbox": (int(x1), int(y1), int(x2), int(y2)),
        "heatmap": "xai_heatmap.png",
        "edges": "xai_edges.png",
        "bbox_image": "xai_bbox.png"
    }

# =========================
# TEST
# =========================
if __name__ == "__main__":
    img_path = r"FracAtlas\images\Fractured\IMG0004356.jpg"
    result = localize_hairline(img_path)

    print("\n--- FAST XAI LOCALIZATION ---")
    print("Fracture Probability:", result["fracture_probability"], "%")
    print("Crack Bounding Box:", result["bbox"])
    print("Heatmap:", result["heatmap"])
    print("Edges:", result["edges"])
    print("BBox Image:", result["bbox_image"])
