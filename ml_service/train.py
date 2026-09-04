#!/usr/bin/env python3
"""
KrishiMitra AI - Crop Disease Model Training Script
Uses MobileNetV3 Transfer Learning for fast, high-accuracy botanical disease classification.
Saves reproducible weights, class mappings, preprocessing config, and training history.
"""

import os
import sys
import time
import json
import random
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Set fixed seeds for reproducibility
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

DATASET_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dataset'))
TRAIN_DIR = os.path.join(DATASET_ROOT, 'train')
VAL_DIR = os.path.join(DATASET_ROOT, 'validation')
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models'))

MODEL_SAVE_PATH = os.path.join(MODELS_DIR, 'crop_doctor_mobilenetv3.pth')
CLASSES_SAVE_PATH = os.path.join(MODELS_DIR, 'class_names.json')
CONFIG_SAVE_PATH = os.path.join(MODELS_DIR, 'preprocessing_config.json')
HISTORY_SAVE_PATH = os.path.join(MODELS_DIR, 'training_history.json')

# Hyperparameters
BATCH_SIZE = 32
IMAGE_SIZE = 224
STAGE1_EPOCHS = 5
STAGE2_EPOCHS = 11
TOTAL_EPOCHS = STAGE1_EPOCHS + STAGE2_EPOCHS
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def get_data_loaders():
    train_transforms = transforms.Compose([
        transforms.Resize((IMAGE_SIZE + 32, IMAGE_SIZE + 32)),
        transforms.RandomCrop((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=20),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
        transforms.RandomPerspective(distortion_scale=0.15, p=0.3),
        transforms.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.25, hue=0.05),
        transforms.RandomGrayscale(p=0.05),
        transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.5)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transforms = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_dataset = datasets.ImageFolder(TRAIN_DIR, transform=train_transforms)
    val_dataset = datasets.ImageFolder(VAL_DIR, transform=val_transforms)

    # Class mappings
    class_names = train_dataset.classes
    print(f"[+] Found {len(class_names)} classes in training set:")
    for idx, cls in enumerate(class_names):
        print(f"    {idx:2d}: {cls}")

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    return train_loader, val_loader, class_names, len(train_dataset), len(val_dataset)

def build_model(num_classes):
    print(f"\n[+] Initializing MobileNetV3-Large with pre-trained ImageNet weights...")
    weights = models.MobileNet_V3_Large_Weights.DEFAULT
    model = models.mobilenet_v3_large(weights=weights)

    # Freeze feature backbone initially for transfer learning
    for param in model.features.parameters():
        param.requires_grad = False

    # Custom classifier head
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )

    model = model.to(DEVICE)
    return model

def train_epoch(model, loader, criterion, optimizer):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in loader:
        images, labels = images.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    epoch_loss = running_loss / total
    epoch_acc = (correct / total) * 100.0
    return epoch_loss, epoch_acc

def evaluate(model, loader, criterion):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

    eval_loss = running_loss / total
    eval_acc = (correct / total) * 100.0
    return eval_loss, eval_acc

def train():
    print("=" * 70)
    print("🚀 KrishiMitra AI - MobileNetV3 Crop Disease Model Training")
    print(f"Device: {DEVICE}")
    print(f"Batch Size: {BATCH_SIZE} | Image Size: {IMAGE_SIZE}x{IMAGE_SIZE}")
    print("=" * 70)

    os.makedirs(MODELS_DIR, exist_ok=True)

    train_loader, val_loader, class_names, n_train, n_val = get_data_loaders()
    num_classes = len(class_names)

    model = build_model(num_classes)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    history = {
        "epochs": [],
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": []
    }

    best_val_acc = 0.0
    start_time = time.time()

    # ----------------------------------------------------
    # STAGE 1: Train Head (Backbone Frozen)
    # ----------------------------------------------------
    print(f"\n--- Stage 1: Classifier Head Training ({STAGE1_EPOCHS} epochs, lr=1e-3, warmup) ---")
    optimizer = torch.optim.AdamW(model.classifier.parameters(), lr=1e-3, weight_decay=1e-4)
    # Linear warmup scheduler for first epoch
    warmup_scheduler = torch.optim.lr_scheduler.LinearLR(optimizer, start_factor=0.1, total_iters=1)

    for epoch in range(1, STAGE1_EPOCHS + 1):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc = evaluate(model, val_loader, criterion)
        elapsed = time.time() - t0

        print(f"Epoch {epoch:2d}/{TOTAL_EPOCHS:2d} [Stage 1] | Train Loss: {train_loss:.4f}, Train Acc: {train_acc:6.2f}% | Val Loss: {val_loss:.4f}, Val Acc: {val_acc:6.2f}% | Time: {elapsed:.1f}s")
        warmup_scheduler.step()

        history["epochs"].append(epoch)
        history["train_loss"].append(round(train_loss, 4))
        history["train_acc"].append(round(train_acc, 2))
        history["val_loss"].append(round(val_loss, 4))
        history["val_acc"].append(round(val_acc, 2))

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print(f"    ⭐ New best validation accuracy: {best_val_acc:.2f}% (Saved checkpoint)")

    # ----------------------------------------------------
    # STAGE 2: Fine-Tuning (Unfreeze Top Layers)
    # ----------------------------------------------------
    print(f"\n--- Stage 2: Fine-Tuning End-to-End ({STAGE2_EPOCHS} epochs, lr=1e-4) ---")
    # Unfreeze top feature layers (blocks 12-16)
    for param in model.features.parameters():
        param.requires_grad = True

    optimizer = torch.optim.AdamW([
        {'params': model.features.parameters(), 'lr': 1e-4},
        {'params': model.classifier.parameters(), 'lr': 5e-4}
    ], weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=STAGE2_EPOCHS)

    for epoch in range(STAGE1_EPOCHS + 1, TOTAL_EPOCHS + 1):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc = evaluate(model, val_loader, criterion)
        scheduler.step()
        elapsed = time.time() - t0

        print(f"Epoch {epoch:2d}/{TOTAL_EPOCHS:2d} [Stage 2] | Train Loss: {train_loss:.4f}, Train Acc: {train_acc:6.2f}% | Val Loss: {val_loss:.4f}, Val Acc: {val_acc:6.2f}% | Time: {elapsed:.1f}s")

        history["epochs"].append(epoch)
        history["train_loss"].append(round(train_loss, 4))
        history["train_acc"].append(round(train_acc, 2))
        history["val_loss"].append(round(val_loss, 4))
        history["val_acc"].append(round(val_acc, 2))

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print(f"    ⭐ New best validation accuracy: {best_val_acc:.2f}% (Saved checkpoint)")

    total_time = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"✅ Training completed in {total_time:.1f}s. Best Validation Accuracy: {best_val_acc:.2f}%")
    print("=" * 70)

    # Save Class Names
    with open(CLASSES_SAVE_PATH, 'w', encoding='utf-8') as f:
        json.dump(class_names, f, indent=2)
    print(f"[+] Saved class names to: {CLASSES_SAVE_PATH}")

    # Save Preprocessing Configuration & Thresholds
    config = {
        "model_architecture": "MobileNetV3-Large",
        "num_classes": num_classes,
        "image_size": [IMAGE_SIZE, IMAGE_SIZE],
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        },
        "confidence_thresholds": {
            "high_confidence_threshold": 0.75,
            "low_confidence_threshold": 0.50,
            "description": "Predictions with confidence < low_confidence_threshold are flagged as uncertain"
        },
        "training_params": {
            "batch_size": BATCH_SIZE,
            "stage1_epochs": STAGE1_EPOCHS,
            "stage2_epochs": STAGE2_EPOCHS,
            "total_epochs": TOTAL_EPOCHS,
            "best_val_accuracy": round(best_val_acc, 2),
            "device": str(DEVICE),
            "seed": SEED
        }
    }
    with open(CONFIG_SAVE_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)
    print(f"[+] Saved preprocessing config to: {CONFIG_SAVE_PATH}")

    # Save Training History
    with open(HISTORY_SAVE_PATH, 'w', encoding='utf-8') as f:
        json.dump(history, f, indent=2)
    print(f"[+] Saved training history to: {HISTORY_SAVE_PATH}")
    print(f"[+] Model weights saved to: {MODEL_SAVE_PATH}")

if __name__ == '__main__':
    train()
