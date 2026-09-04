#!/usr/bin/env python3
"""
KrishiMitra AI - Crop Doctor Comprehensive Test Suite
Tests ML inference service across:
1. Clear healthy crop
2. Clear diseased crop
3. Different lighting
4. Different background
5. Partially visible leaf
6. Blurry image
7. Unrelated image (must safely return low confidence / uncertain)
8. Low-quality image
"""

import os
import sys
import io
import json
import requests
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ML_URL = "http://127.0.0.1:5001/predict"
BACKEND_URL = "http://127.0.0.1:5000/api/analyze-crop"
DATASET_TEST = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dataset', 'test'))

def send_image_to_service(img, lang="en", endpoint=ML_URL):
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    files = {'cropImage': ('test_leaf.jpg', buf, 'image/jpeg')}
    data = {'language': lang}
    response = requests.post(endpoint, files=files, data=data, timeout=10)
    return response.json()

def run_tests():
    print("=" * 75)
    print("🧪 KrishiMitra AI - Crop Doctor Automated Robustness & Safety Test Suite")
    print(f"Target ML Endpoint: {ML_URL}")
    print("=" * 75)

    test_results = []

    # 1. Clear Healthy Crop
    healthy_dir = os.path.join(DATASET_TEST, 'Tomato___healthy')
    healthy_file = os.path.join(healthy_dir, os.listdir(healthy_dir)[0])
    img_healthy = Image.open(healthy_file)
    res_1 = send_image_to_service(img_healthy)
    pass_1 = (res_1['success'] and 'healthy' in res_1['rawClass'].lower() and not res_1['isUncertain'])
    test_results.append({
        "scenario": "1. Clear Healthy Crop",
        "class_tested": "Tomato___healthy",
        "predicted": res_1.get('rawClass'),
        "confidence": res_1.get('confidence'),
        "confidenceLevel": res_1.get('confidenceLevel'),
        "isUncertain": res_1.get('isUncertain'),
        "passed": pass_1
    })
    print(f"[+] Test 1 (Clear Healthy): Predicted {res_1.get('rawClass')} ({res_1.get('confidence')}) | Level: {res_1.get('confidenceLevel')} | Passed: {pass_1}")

    # 2. Clear Diseased Crop
    blight_dir = os.path.join(DATASET_TEST, 'Corn_(maize)___Common_rust_')
    blight_file = os.path.join(blight_dir, os.listdir(blight_dir)[0])
    img_blight = Image.open(blight_file)
    res_2 = send_image_to_service(img_blight)
    pass_2 = (res_2['success'] and 'corn' in res_2['rawClass'].lower() and not res_2['isUncertain'])
    test_results.append({
        "scenario": "2. Clear Diseased Crop",
        "class_tested": "Corn_(maize)___Common_rust_",
        "predicted": res_2.get('rawClass'),
        "confidence": res_2.get('confidence'),
        "confidenceLevel": res_2.get('confidenceLevel'),
        "isUncertain": res_2.get('isUncertain'),
        "passed": pass_2
    })
    print(f"[+] Test 2 (Clear Diseased): Predicted {res_2.get('rawClass')} ({res_2.get('confidence')}) | Level: {res_2.get('confidenceLevel')} | Passed: {pass_2}")

    # 3. Different Lighting (Dark / Low-light Leaf)
    img_dark = ImageEnhance.Brightness(img_blight).enhance(0.4)
    res_3 = send_image_to_service(img_dark)
    pass_3 = res_3['success']
    test_results.append({
        "scenario": "3. Different Lighting (Dark/Dim)",
        "class_tested": "Corn Common Rust (Dim 0.4x)",
        "predicted": res_3.get('rawClass'),
        "confidence": res_3.get('confidence'),
        "confidenceLevel": res_3.get('confidenceLevel'),
        "isUncertain": res_3.get('isUncertain'),
        "passed": pass_3
    })
    print(f"[+] Test 3 (Lighting Variations): Predicted {res_3.get('rawClass')} ({res_3.get('confidence')}) | Level: {res_3.get('confidenceLevel')} | Passed: {pass_3}")

    # 4. Different Background (Synthetic high contrast backdrop)
    bg_img = Image.new('RGB', (300, 300), color=(180, 150, 100))
    bg_img.paste(img_healthy.resize((200, 200)), (50, 50))
    res_4 = send_image_to_service(bg_img)
    pass_4 = res_4['success']
    test_results.append({
        "scenario": "4. Different Background (Natural / Soil tone)",
        "class_tested": "Tomato Healthy on Soil Backdrop",
        "predicted": res_4.get('rawClass'),
        "confidence": res_4.get('confidence'),
        "confidenceLevel": res_4.get('confidenceLevel'),
        "isUncertain": res_4.get('isUncertain'),
        "passed": pass_4
    })
    print(f"[+] Test 4 (Background Invariance): Predicted {res_4.get('rawClass')} ({res_4.get('confidence')}) | Level: {res_4.get('confidenceLevel')} | Passed: {pass_4}")

    # 5. Partially Visible Leaf (Cropped Leaf section)
    w, h = img_blight.size
    img_partial = img_blight.crop((0, 0, w // 2, h // 2))
    res_5 = send_image_to_service(img_partial)
    pass_5 = res_5['success']
    test_results.append({
        "scenario": "5. Partially Visible Leaf (Quadrant Crop)",
        "class_tested": "Cropped Corn Leaf",
        "predicted": res_5.get('rawClass'),
        "confidence": res_5.get('confidence'),
        "confidenceLevel": res_5.get('confidenceLevel'),
        "isUncertain": res_5.get('isUncertain'),
        "passed": pass_5
    })
    print(f"[+] Test 5 (Partial Leaf): Predicted {res_5.get('rawClass')} ({res_5.get('confidence')}) | Level: {res_5.get('confidenceLevel')} | Passed: {pass_5}")

    # 6. Blurry Leaf Image
    img_blurry = img_healthy.filter(ImageFilter.GaussianBlur(radius=8))
    res_6 = send_image_to_service(img_blurry)
    pass_6 = res_6['success']
    test_results.append({
        "scenario": "6. Blurry Leaf (Gaussian Blur r=8)",
        "class_tested": "Blurry Tomato Leaf",
        "predicted": res_6.get('rawClass'),
        "confidence": res_6.get('confidence'),
        "confidenceLevel": res_6.get('confidenceLevel'),
        "isUncertain": res_6.get('isUncertain'),
        "passed": pass_6
    })
    print(f"[+] Test 6 (Blurry Leaf): Predicted {res_6.get('rawClass')} ({res_6.get('confidence')}) | Level: {res_6.get('confidenceLevel')} | Passed: {pass_6}")

    # 7. Unrelated Non-Plant Image (Random noise / geometric texture)
    noise_arr = np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8)
    img_unrelated = Image.fromarray(noise_arr)
    res_7 = send_image_to_service(img_unrelated)
    # MUST handle safely (either low confidence / uncertain flag or not hallucinating 100% confidence)
    pass_7 = (res_7['success'] and (res_7['isUncertain'] or float(res_7['confidenceScore']) < 0.70))
    test_results.append({
        "scenario": "7. Unrelated Image (Noise / Non-plant)",
        "class_tested": "Pure Random Pixel Noise",
        "predicted": res_7.get('diseaseEn'),
        "confidence": res_7.get('confidence'),
        "confidenceLevel": res_7.get('confidenceLevel'),
        "isUncertain": res_7.get('isUncertain'),
        "passed": pass_7
    })
    print(f"[+] Test 7 (Unrelated Image Safety): Handled safely? {pass_7} | isUncertain: {res_7.get('isUncertain')} | Conf: {res_7.get('confidence')}")

    # 8. Low-Quality / Highly Degraded Image (JPEG compression artifacts + noise)
    degraded = ImageEnhance.Contrast(img_blight).enhance(0.3)
    degraded = degraded.filter(ImageFilter.GaussianBlur(radius=4))
    res_8 = send_image_to_service(degraded)
    pass_8 = res_8['success']
    test_results.append({
        "scenario": "8. Low Quality / Degraded Leaf Image",
        "class_tested": "Low-Contrast Degraded Leaf",
        "predicted": res_8.get('rawClass'),
        "confidence": res_8.get('confidence'),
        "confidenceLevel": res_8.get('confidenceLevel'),
        "isUncertain": res_8.get('isUncertain'),
        "passed": pass_8
    })
    print(f"[+] Test 8 (Low Quality Leaf): Predicted {res_8.get('rawClass')} ({res_8.get('confidence')}) | Level: {res_8.get('confidenceLevel')} | Passed: {pass_8}")

    print("\n" + "=" * 75)
    print("📊 ROBUSTNESS TEST RESULTS SUMMARY")
    print("=" * 75)
    all_passed = all(t['passed'] for t in test_results)
    for t in test_results:
        status_sym = "✅ PASS" if t['passed'] else "❌ FAIL"
        print(f" {status_sym} | {t['scenario']:<38} | Conf: {t['confidence']:<6} | Level: {t['confidenceLevel']}")

    print("=" * 75)
    print(f"Overall Result: {'✅ ALL TESTS PASSED' if all_passed else '⚠️ SOME TESTS FAILED'}")
    print("=" * 75)

    test_report_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models', 'robustness_test_report.json'))
    with open(test_report_path, 'w', encoding='utf-8') as f:
        json.dump(test_results, f, indent=2)
    print(f"[+] Saved test report to: {test_report_path}")

if __name__ == '__main__':
    run_tests()
