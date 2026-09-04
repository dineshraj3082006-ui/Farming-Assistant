#!/usr/bin/env python3
"""
KrishiMitra AI - Dataset Preparation Script
Downloads and partitions verified botanical disease images into train/validation/test splits (70/15/15).
Ensures zero data leakage across splits.
"""

import os
import sys
import random
import json
import urllib.request
import urllib.parse
import concurrent.futures
from PIL import Image
import io

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

DATASET_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dataset'))
TRAIN_DIR = os.path.join(DATASET_ROOT, 'train')
VAL_DIR = os.path.join(DATASET_ROOT, 'validation')
TEST_DIR = os.path.join(DATASET_ROOT, 'test')

# Selected benchmark classes spanning vegetables, grains, fruits
CLASSES_TO_DOWNLOAD = [
    # Tomato diseases (existing)
    "Tomato___Early_blight",
    "Tomato___Bacterial_spot",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___healthy",
    # Tomato diseases (NEW — fruit & leaf diseases)
    "Tomato___Septoria_leaf_spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Spider_mites_Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_mosaic_virus",
    # Pepper (existing)
    "Pepper__bell___Bacterial_spot",
    "Pepper__bell___healthy",
    # Potato (existing)
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    # Corn/Maize (existing + NEW)
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot",
    "Corn_(maize)___Northern_Leaf_Blight",
    # Apple (existing + NEW)
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___healthy",
    "Apple___Cedar_apple_rust",
    # Grape (existing + NEW)
    "Grape___Black_rot",
    "Grape___healthy",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    # Rice (existing — local class, not from PlantVillage)
    "Rice___Leaf_Blast",
]

# GitHub mapping (handle commas, spaces, parentheses in PlantVillage folder names)
GITHUB_CLASS_MAP = {
    "Pepper__bell___Bacterial_spot": "Pepper,_bell___Bacterial_spot",
    "Pepper__bell___healthy": "Pepper,_bell___healthy",
    "Tomato___Spider_mites_Two-spotted_spider_mite": "Tomato___Spider_mites Two-spotted_spider_mite",
    "Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
}

IMAGES_PER_CLASS = 60  # 42 train, 9 val, 9 test per class = ~1020 total curated images
RANDOM_SEED = 42

def fetch_class_file_list(github_class_name):
    url = f"https://api.github.com/repos/spMohanty/PlantVillage-Dataset/contents/raw/color/{urllib.parse.quote(github_class_name)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'KrishiMitra-DatasetPrep/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            items = json.loads(response.read().decode('utf-8'))
            return [item['download_url'] for item in items if item['type'] == 'file' and item['name'].lower().endswith(('.jpg', '.jpeg', '.png'))]
    except Exception as e:
        print(f"[-] Failed to fetch file list for {github_class_name}: {e}")
        return []

def download_and_verify_image(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=12) as r:
            data = r.read()
            # Verify image integrity with PIL
            img = Image.open(io.BytesIO(data))
            img.verify()
            return data
    except Exception:
        return None

def prepare_dataset():
    print("=" * 60)
    print("🌱 KrishiMitra AI - Preparing Plant Disease Dataset")
    print(f"Target directory: {DATASET_ROOT}")
    print(f"Classes: {len(CLASSES_TO_DOWNLOAD)}")
    print(f"Images per class: {IMAGES_PER_CLASS}")
    print("=" * 60)

    os.makedirs(TRAIN_DIR, exist_ok=True)
    os.makedirs(VAL_DIR, exist_ok=True)
    os.makedirs(TEST_DIR, exist_ok=True)

    random.seed(RANDOM_SEED)

    for class_name in CLASSES_TO_DOWNLOAD:
        # Skip classes that already have sufficient images downloaded
        existing_train_dir = os.path.join(TRAIN_DIR, class_name)
        if os.path.isdir(existing_train_dir):
            existing_count = len([f for f in os.listdir(existing_train_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
            if existing_count >= 30:
                print(f"\n[✓] Skipping {class_name} — already has {existing_count} training images")
                continue

        github_name = GITHUB_CLASS_MAP.get(class_name, class_name)
        print(f"\n[+] Fetching URLs for class: {class_name} ...")
        urls = fetch_class_file_list(github_name)
        if not urls:
            print(f"[-] Warning: No URLs found for {class_name}")
            continue

        random.shuffle(urls)
        selected_urls = urls[:IMAGES_PER_CLASS + 15]  # extra buffer in case of download failure

        downloaded_images = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            future_to_url = {executor.submit(download_and_verify_image, u): u for u in selected_urls}
            for future in concurrent.futures.as_completed(future_to_url):
                data = future.result()
                if data:
                    downloaded_images.append(data)
                    if len(downloaded_images) >= IMAGES_PER_CLASS:
                        break

        total_valid = len(downloaded_images)
        print(f"    Downloaded & verified {total_valid} valid images for {class_name}")

        if total_valid < 10:
            print(f"[-] Error: Insufficient images for {class_name}")
            continue

        # Split: 70% train, 15% val, 15% test
        n_train = int(total_valid * 0.70)
        n_val = int(total_valid * 0.15)
        n_test = total_valid - n_train - n_val

        train_imgs = downloaded_images[:n_train]
        val_imgs = downloaded_images[n_train:n_train + n_val]
        test_imgs = downloaded_images[n_train + n_val:]

        for split_dir, split_imgs, split_label in [(TRAIN_DIR, train_imgs, 'train'),
                                                  (VAL_DIR, val_imgs, 'validation'),
                                                  (TEST_DIR, test_imgs, 'test')]:
            class_split_dir = os.path.join(split_dir, class_name)
            os.makedirs(class_split_dir, exist_ok=True)
            for idx, img_data in enumerate(split_imgs):
                file_path = os.path.join(class_split_dir, f"{class_name}_{split_label}_{idx+1:04d}.jpg")
                with open(file_path, 'wb') as f:
                    f.write(img_data)

        print(f"    Saved -> Train: {len(train_imgs)}, Val: {len(val_imgs)}, Test: {len(test_imgs)}")

    print("\n" + "=" * 60)
    print("✅ Dataset preparation complete! Zero data leakage enforced.")
    print("=" * 60)

if __name__ == '__main__':
    prepare_dataset()
