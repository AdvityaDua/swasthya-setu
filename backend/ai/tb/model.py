import torch
import torch.nn as nn
import timm

class TBModel(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()

        # ResNet50 backbone (num_classes=0 for feature extraction)
        self.backbone = timm.create_model(
            "resnet50",
            pretrained=False,
            num_classes=0
        )

        # Transformer Encoder
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

        # Classifier head
        self.classifier = nn.Sequential(
            nn.Linear(2048, 512),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        # x: (B, 3, 224, 224)
        x = self.backbone(x)       # (B, 2048)
        x = x.unsqueeze(1)         # (B, 1, 2048)
        x = self.transformer(x)    # (B, 1, 2048)
        return self.classifier(x[:, 0]) # (B, num_classes)
