from __future__ import annotations

import asyncio
import io
from pathlib import Path
from typing import Dict, List

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models


_MODEL: torch.nn.Module | None = None
_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Populated lazily from the training checkpoint so it exactly matches the model.
CLASS_NAMES: List[str] = []

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def _get_model() -> torch.nn.Module:
    """
    Lazily load the trained EfficientNet-B0 model and its class names.

    The checkpoint is expected to have been saved via:
        torch.save({
            "model_state_dict": model.state_dict(),
            "class_names": train_dataset.classes,
        }, path)
    """

    global _MODEL, CLASS_NAMES

    if _MODEL is not None:
        return _MODEL

    model_path = Path(__file__).resolve().parent.parent / "models" / "rice_efficientnet_model.pth"
    if not model_path.exists():
        raise RuntimeError(f"Model file not found at {model_path}")

    checkpoint = torch.load(model_path, map_location=_DEVICE)

    state_dict = checkpoint.get("model_state_dict")
    class_names = checkpoint.get("class_names")
    if state_dict is None or class_names is None:
        raise RuntimeError("Checkpoint missing required keys 'model_state_dict' or 'class_names'.")

    # Recreate EfficientNet-B0 architecture without pretrained weights.
    model = models.efficientnet_b0(weights=None)

    # Replace final classifier layer to match the number of classes.
    in_features = model.classifier[-1].in_features  # type: ignore[index]
    model.classifier[-1] = nn.Linear(in_features, len(class_names))  # type: ignore[index]

    model.load_state_dict(state_dict)
    model.eval()

    _MODEL = model.to(_DEVICE)
    CLASS_NAMES = list(class_names)
    return _MODEL


def _preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """
    Convert raw image bytes into an ImageNet-normalized tensor suitable for EfficientNet-B0.
    """

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((224, 224))

    # Convert to [0,1] tensor with shape (1, 3, 224, 224)
    data = torch.frombuffer(image.tobytes(), dtype=torch.uint8)
    data = data.view(224, 224, 3).float() / 255.0
    tensor = data.permute(2, 0, 1).unsqueeze(0)  # (1, 3, 224, 224)

    mean = torch.tensor(IMAGENET_MEAN, dtype=tensor.dtype).view(1, 3, 1, 1)
    std = torch.tensor(IMAGENET_STD, dtype=tensor.dtype).view(1, 3, 1, 1)

    tensor = (tensor - mean) / std
    return tensor


def _predict(image_bytes: bytes) -> Dict[str, float | str]:
    """
    Run EfficientNet-B0 inference synchronously and return disease + confidence.
    """

    model = _get_model()
    inputs = _preprocess_image(image_bytes).to(_DEVICE)

    with torch.no_grad():
        outputs = model(inputs)
        if outputs.ndim == 1:
            outputs = outputs.unsqueeze(0)
        probabilities = torch.softmax(outputs, dim=1)[0]
        confidence, idx = torch.max(probabilities, dim=0)

    idx_int = int(idx.item())
    if 0 <= idx_int < len(CLASS_NAMES):
        label = CLASS_NAMES[idx_int]
    else:
        label = f"class_{idx_int}"

    return {"disease": label, "confidence": float(confidence.item())}


async def classify_rice_leaf(*, image_bytes: bytes, filename: str | None = None) -> dict:
    """
    Async wrapper that offloads EfficientNet-B0 inference to a worker thread.

    The filename is accepted for logging/debugging, but not required.
    """

    _ = filename

    # Offload CPU-bound work to a separate thread so we do not block the event loop.
    return await asyncio.to_thread(_predict, image_bytes)
