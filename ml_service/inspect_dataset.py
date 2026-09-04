#!/usr/bin/env python3
"""
KrishiMitra AI - Dataset Inspector & Validation Tool
Scans the dataset directory, analyzes class distribution, checks for image corruption,
verifies data integrity, and checks for potential data leakage.
"""

import os
import sys
import json
import hashlib
from collections import defaultdict
from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

DATASET_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dataset'))
REPORT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'dataset_report.json'))

def get_image_hash(file_path):
    """Compute SHA256 hash of image file content to detect duplicates."""
    hasher = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def inspect_dataset(dataset_dir=DATASET_ROOT):
    print("=" * 70)
    print("🌾 KrishiMitra AI - Dataset Inspection & Quality Audit")
    print(f"Dataset root: {dataset_dir}")
    print("=" * 70)

    if not os.path.exists(dataset_dir):
        print(f"[-] Error: Dataset directory '{dataset_dir}' does not exist.")
        return None

    splits = ['train', 'validation', 'test']
    split_counts = defaultdict(lambda: defaultdict(int))
    all_classes = set()
    formats = defaultdict(int)
    corrupted_files = []
    image_shapes = defaultdict(int)
    split_hashes = defaultdict(dict)  # split -> hash -> filepath

    for split in splits:
        split_path = os.path.join(dataset_dir, split)
        if not os.path.exists(split_path):
            print(f"[-] Warning: Split directory '{split}' not found at {split_path}")
            continue

        class_folders = [d for d in os.listdir(split_path) if os.path.isdir(os.path.join(split_path, d))]
        for cls in sorted(class_folders):
            all_classes.add(cls)
            cls_path = os.path.join(split_path, cls)
            for fname in os.listdir(cls_path):
                fpath = os.path.join(cls_path, fname)
                if not os.path.isfile(fpath):
                    continue

                ext = os.path.splitext(fname)[1].lower()
                formats[ext] += 1

                # Check corruption
                try:
                    with Image.open(fpath) as img:
                        img.verify()  # verify integrity
                    with Image.open(fpath) as img:
                        mode = img.mode
                        size = img.size
                        image_shapes[f"{size[0]}x{size[1]}_{mode}"] += 1
                    
                    # Compute hash for duplicate / leakage detection
                    img_hash = get_image_hash(fpath)
                    split_hashes[split][img_hash] = fpath
                    split_counts[split][cls] += 1
                except Exception as e:
                    corrupted_files.append({"file": fpath, "error": str(e)})

    # Data leakage check across splits
    leakage_found = []
    train_hashes = split_hashes.get('train', {})
    val_hashes = split_hashes.get('validation', {})
    test_hashes = split_hashes.get('test', {})

    for h, train_file in train_hashes.items():
        if h in val_hashes:
            leakage_found.append({"type": "train_val_leakage", "train": train_file, "val": val_hashes[h]})
        if h in test_hashes:
            leakage_found.append({"type": "train_test_leakage", "train": train_file, "test": test_hashes[h]})

    for h, val_file in val_hashes.items():
        if h in test_hashes:
            leakage_found.append({"type": "val_test_leakage", "val": val_file, "test": test_hashes[h]})

    # Summaries
    sorted_classes = sorted(list(all_classes))
    total_train = sum(split_counts['train'].values())
    total_val = sum(split_counts['validation'].values())
    total_test = sum(split_counts['test'].values())
    grand_total = total_train + total_val + total_test

    class_stats = []
    for cls in sorted_classes:
        c_train = split_counts['train'][cls]
        c_val = split_counts['validation'][cls]
        c_test = split_counts['test'][cls]
        c_tot = c_train + c_val + c_test
        class_stats.append({
            "class": cls,
            "train": c_train,
            "validation": c_val,
            "test": c_test,
            "total": c_tot
        })

    train_totals = [s['train'] for s in class_stats if s['train'] > 0]
    min_train = min(train_totals) if train_totals else 0
    max_train = max(train_totals) if train_totals else 0
    imbalance_ratio = round(max_train / min_train, 2) if min_train > 0 else 1.0

    report = {
        "dataset_root": dataset_dir,
        "num_classes": len(sorted_classes),
        "total_images": grand_total,
        "split_totals": {
            "train": total_train,
            "validation": total_val,
            "test": total_test,
            "train_ratio": round(total_train / grand_total, 3) if grand_total else 0,
            "val_ratio": round(total_val / grand_total, 3) if grand_total else 0,
            "test_ratio": round(total_test / grand_total, 3) if grand_total else 0
        },
        "class_imbalance": {
            "min_samples_per_class": min_train,
            "max_samples_per_class": max_train,
            "imbalance_ratio": imbalance_ratio,
            "is_balanced": imbalance_ratio <= 1.5
        },
        "image_formats": dict(formats),
        "corrupted_images_count": len(corrupted_files),
        "corrupted_files": corrupted_files,
        "data_leakage_detected": len(leakage_found) > 0,
        "leakage_count": len(leakage_found),
        "leakage_details": leakage_found,
        "classes": sorted_classes,
        "per_class_distribution": class_stats
    }

    # Print summary table
    print(f"\nTotal Classes: {len(sorted_classes)}")
    print(f"Total Images: {grand_total} (Train: {total_train}, Val: {total_val}, Test: {total_test})")
    print(f"Corrupted Images: {len(corrupted_files)}")
    print(f"Data Leakage (Duplicate Hashes): {len(leakage_found)} detected")
    print(f"Class Imbalance Ratio: {imbalance_ratio}x (Min: {min_train}, Max: {max_train})")
    print("\n" + "-" * 70)
    print(f"{'Class Name':<42} | {'Train':<6} | {'Val':<5} | {'Test':<5} | {'Total':<6}")
    print("-" * 70)
    for s in class_stats:
        print(f"{s['class']:<42} | {s['train']:<6} | {s['validation']:<5} | {s['test']:<5} | {s['total']:<6}")
    print("-" * 70)

    # Save JSON report
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    print(f"[+] Dataset report saved to: {REPORT_PATH}")
    print("=" * 70)
    return report

if __name__ == '__main__':
    inspect_dataset()
