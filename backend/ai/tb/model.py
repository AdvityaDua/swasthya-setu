import torch
import torch.nn as nn
import timm

class HybridCNNTransformer(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()

        self.backbone = timm.create_model(
            "resnet50",
            pretrained=False,
            num_classes=0
        )

        self.transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(
                d_model=2048,
                nhead=8,
                dim_feedforward=1024,
                dropout=0.3,
                batch_first=True
            ),
            num_layers=2
        )

        # 🔴 EXACT SAME classifier as training
        self.classifier = nn.Sequential(
            nn.Linear(2048, 512),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(512, num_classes)
        )

    # 🔥 expose spatial features
    def forward_features(self, x):
        return self.backbone.forward_features(x)  # (B,2048,7,7)

    def forward(self, x):
        feats = self.forward_features(x)
        pooled = feats.mean(dim=[2,3])
        tokens = pooled.unsqueeze(1)
        tokens = self.transformer(tokens)
        return self.classifier(tokens[:,0])