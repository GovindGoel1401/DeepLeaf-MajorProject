

import torch
import torch.nn as nn
from torchvision import models
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import os

# Paths
DATA_DIR = "dataset"
TRAIN_DIR = os.path.join(DATA_DIR, "train")
VAL_DIR = os.path.join(DATA_DIR, "validation")

# print("Train path exists:", os.path.exists(TRAIN_DIR))
# print("Val path exists:", os.path.exists(VAL_DIR))

# Image transforms
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

# Load datasets
train_dataset = datasets.ImageFolder(TRAIN_DIR, transform=transform)
val_dataset = datasets.ImageFolder(VAL_DIR, transform=transform)

# Data loaders
train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=16)

print("Classes:", train_dataset.classes)
print("Number of training samples:", len(train_dataset))
print("Number of validation samples:", len(val_dataset))

# Number of classes from dataset
num_classes = len(train_dataset.classes)

# Load pretrained EfficientNet-B0
model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)

# Freeze all base layers
for param in model.parameters():
    param.requires_grad = False

# Replace final classifier layer
in_features = model.classifier[1].in_features
model.classifier[1] = nn.Linear(in_features, num_classes)

# Move to device (CPU)
device = torch.device("cpu")
model = model.to(device)

print("Model ready with", num_classes, "classes")

# Loss function
criterion = nn.CrossEntropyLoss()

# Only train the final layer
optimizer = torch.optim.Adam(model.classifier[1].parameters(), lr=0.001)

epochs = 5

for epoch in range(epochs):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in train_loader:
        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        outputs = model(images)
        loss = criterion(outputs, labels)

        loss.backward()
        optimizer.step()

        running_loss += loss.item()

        _, predicted = torch.max(outputs, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

    train_acc = 100 * correct / total

    print(f"Epoch [{epoch+1}/{epochs}] Loss: {running_loss:.4f} Train Accuracy: {train_acc:.2f}%")

    # Validation phase
model.eval()
correct = 0
total = 0

with torch.no_grad():
    for images, labels in val_loader:
        images = images.to(device)
        labels = labels.to(device)

        outputs = model(images)
        _, predicted = torch.max(outputs, 1)

        total += labels.size(0)
        correct += (predicted == labels).sum().item()

val_acc = 100 * correct / total
print(f"Validation Accuracy: {val_acc:.2f}%")

# Save model weights
torch.save({
    "model_state_dict": model.state_dict(),
    "class_names": train_dataset.classes
}, "rice_efficientnet_model.pth")

print("Model saved successfully.")