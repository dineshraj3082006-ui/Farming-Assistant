#!/usr/bin/env python3
"""
KrishiMitra AI - Model Evaluation on Test Dataset
Evaluates the trained MobileNetV3 Crop Doctor model solely on the untouched TEST set.
Computes accuracy, precision, recall, F1 score, per-class breakdown, and confusion matrix.
"""

import os
import sys
import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

DATASET_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dataset'))
TEST_DIR = os.path.join(DATASET_ROOT, 'test')
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models'))

MODEL_PATH = os.path.join(MODELS_DIR, 'crop_doctor_mobilenetv3.pth')
CLASSES_PATH = os.path.join(MODELS_DIR, 'class_names.json')
CONFIG_PATH = os.path.join(MODELS_DIR, 'preprocessing_config.json')
EVAL_SAVE_PATH = os.path.join(MODELS_DIR, 'evaluation_metrics.json')

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
IMAGE_SIZE = 224

def load_classes():
    if not os.path.exists(CLASSES_PATH):
        raise FileNotFoundError(f"Classes file not found at {CLASSES_PATH}")
    with open(CLASSES_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_trained_model(num_classes):
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Trained model weights not found at {MODEL_PATH}")

    model = models.mobilenet_v3_large(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    state_dict = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
    model.load_state_dict(state_dict)
    model = model.to(DEVICE)
    model.eval()
    return model

def evaluate_test_set():
    print("=" * 75)
    print("🧪 KrishiMitra AI - Crop Doctor Evaluation on TEST Dataset")
    print(f"Test directory: {TEST_DIR}")
    print(f"Device: {DEVICE}")
    print("=" * 75)

    if not os.path.exists(TEST_DIR):
        print(f"[-] Error: Test directory not found at {TEST_DIR}")
        return None

    class_names = load_classes()
    num_classes = len(class_names)
    model = load_trained_model(num_classes)

    test_transforms = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    test_dataset = datasets.ImageFolder(TEST_DIR, transform=test_transforms)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=0)

    y_true = []
    y_pred = []
    y_conf = []

    softmax = nn.Softmax(dim=1)

    print(f"[+] Running inference on {len(test_dataset)} untouched test images across {num_classes} classes...")

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(DEVICE)
            outputs = model(images)
            probs = softmax(outputs)
            confs, preds = torch.max(probs, dim=1)

            y_true.extend(labels.cpu().numpy().tolist())
            y_pred.extend(preds.cpu().numpy().tolist())
            y_conf.extend(confs.cpu().numpy().tolist())

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    y_conf = np.array(y_conf)

    # Metrics
    total_samples = len(y_true)
    correct_mask = (y_true == y_pred)
    total_correct = int(np.sum(correct_mask))
    test_accuracy = float(total_correct / total_samples)

    # Macro & Weighted metrics
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(y_true, y_pred, average='macro', zero_division=0)
    p_weighted, r_weighted, f1_weighted, _ = precision_recall_fscore_support(y_true, y_pred, average='weighted', zero_division=0)

    # Per-class metrics
    p_class, r_class, f1_class, support_class = precision_recall_fscore_support(y_true, y_pred, average=None, zero_division=0)

    per_class_results = []
    for i in range(num_classes):
        cls_name = test_dataset.classes[i] if i < len(test_dataset.classes) else f"Class_{i}"
        cls_mask = (y_true == i)
        avg_cls_conf = float(np.mean(y_conf[cls_mask])) if np.any(cls_mask) else 0.0

        per_class_results.append({
            "class_index": i,
            "class_name": cls_name,
            "precision": round(float(p_class[i]), 4),
            "recall": round(float(r_class[i]), 4),
            "f1_score": round(float(f1_class[i]), 4),
            "support": int(support_class[i]),
            "avg_confidence": round(avg_cls_conf, 4)
        })

    # Sort to find weakest classes
    weakest_classes = sorted(per_class_results, key=lambda x: x['f1_score'])[:3]

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred).tolist()

    # Confidence statistics
    correct_confs = y_conf[correct_mask]
    incorrect_confs = y_conf[~correct_mask] if np.any(~correct_mask) else np.array([0.0])

    confidence_stats = {
        "mean_overall_confidence": round(float(np.mean(y_conf)), 4),
        "mean_correct_confidence": round(float(np.mean(correct_confs)), 4) if len(correct_confs) else 0.0,
        "mean_incorrect_confidence": round(float(np.mean(incorrect_confs)), 4) if len(incorrect_confs) else 0.0,
        "high_confidence_ratio (>=0.75)": round(float(np.mean(y_conf >= 0.75)), 4),
        "low_confidence_ratio (<0.50)": round(float(np.mean(y_conf < 0.50)), 4)
    }

    eval_report = {
        "evaluation_dataset": "TEST split (untouched)",
        "total_test_samples": total_samples,
        "correct_predictions": total_correct,
        "overall_accuracy": round(test_accuracy * 100.0, 2),
        "overall_accuracy_ratio": round(test_accuracy, 4),
        "macro_metrics": {
            "precision": round(float(p_macro), 4),
            "recall": round(float(r_macro), 4),
            "f1_score": round(float(f1_macro), 4)
        },
        "weighted_metrics": {
            "precision": round(float(p_weighted), 4),
            "recall": round(float(r_weighted), 4),
            "f1_score": round(float(f1_weighted), 4)
        },
        "confidence_statistics": confidence_stats,
        "weakest_classes": weakest_classes,
        "per_class_metrics": per_class_results,
        "confusion_matrix": cm,
        "class_names": class_names
    }

    # Print Report
    print("\n" + "=" * 75)
    print("📊 TEST EVALUATION RESULTS SUMMARY")
    print("=" * 75)
    print(f"Total Test Samples:  {total_samples}")
    print(f"Test Accuracy:       {test_accuracy * 100.0:.2f}% ({total_correct}/{total_samples})")
    print(f"Macro Precision:     {p_macro:.4f}")
    print(f"Macro Recall:        {r_macro:.4f}")
    print(f"Macro F1-Score:      {f1_macro:.4f}")
    print(f"Weighted F1-Score:   {f1_weighted:.4f}")
    print(f"Avg Confidence:      {confidence_stats['mean_overall_confidence'] * 100:.2f}% (Correct: {confidence_stats['mean_correct_confidence']*100:.2f}%)")
    print("\n" + "-" * 75)
    print(f"{'Class Name':<38} | {'Precision':<9} | {'Recall':<6} | {'F1-Score':<8} | {'Support':<7}")
    print("-" * 75)
    for p in per_class_results:
        print(f"{p['class_name']:<38} | {p['precision']:<9.4f} | {p['recall']:<6.4f} | {p['f1_score']:<8.4f} | {p['support']:<7d}")
    print("-" * 75)

    print("\n[!] Weakest Classes:")
    for w in weakest_classes:
        print(f"    - {w['class_name']} (F1: {w['f1_score']:.4f}, Recall: {w['recall']:.4f}, Precision: {w['precision']:.4f})")

    # Save to disk
    with open(EVAL_SAVE_PATH, 'w', encoding='utf-8') as f:
        json.dump(eval_report, f, indent=2)
    print(f"\n[+] Full evaluation metrics saved to: {EVAL_SAVE_PATH}")
    print("=" * 75)
    return eval_report

if __name__ == '__main__':
    evaluate_test_set()
