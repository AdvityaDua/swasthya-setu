import torch

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self._register_hooks()

    def _register_hooks(self):
        self.target_layer.register_forward_hook(
            lambda _, __, output: setattr(self, "activations", output)
        )
        self.target_layer.register_full_backward_hook(
            lambda _, grad_input, grad_output: setattr(self, "gradients", grad_output[0])
        )

    def generate(self, x, class_idx):
        output = self.model(x)
        self.model.zero_grad()
        output[0, class_idx].backward()

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = (weights * self.activations).sum(dim=1)
        cam = torch.relu(cam)

        cam -= cam.min()
        cam /= cam.max() + 1e-6
        return cam.squeeze().detach().cpu().numpy()