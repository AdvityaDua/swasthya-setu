import torch.nn as nn
import timm

class BreastCancerModel(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.model = timm.create_model(
            "efficientnet_b0",
            pretrained=False,
            num_classes=num_classes
        )

    def forward(self, x):
        return self.model(x)