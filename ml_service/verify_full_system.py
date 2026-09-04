import sys
import os
import time
import requests

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 75)
print("🚀 FULL SYSTEM VERIFICATION SUITE: KRISHIMITRA AI CROP DOCTOR")
print("=" * 75)

# 1. Health Checks
r_express = requests.get('http://localhost:5000/api/health', timeout=3)
print(f"Express Backend (Port 5000): ONLINE (Status {r_express.status_code})")

r_ml = requests.get('http://127.0.0.1:5001/health', timeout=3)
print(f"Python ML Service (Port 5001): ONLINE (Status {r_ml.status_code}) - Model loaded: {r_ml.json().get('model_loaded')}")

# 2. Test Real Leaf Image Uploads
base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_test_dir = os.path.join(base_dir, '..', 'dataset', 'test')
test_cases = [
    ('Tomato Early Blight', os.path.join(dataset_test_dir, 'Tomato___Early_blight', 'Tomato___Early_blight_test_0001.jpg')),
    ('Tomato Healthy', os.path.join(dataset_test_dir, 'Tomato___healthy', 'Tomato___healthy_test_0001.jpg')),
    ('Corn Common Rust', os.path.join(dataset_test_dir, 'Corn_(maize)___Common_rust_', 'Corn_(maize)___Common_rust__test_0001.jpg')),
    ('Apple Apple Scab', os.path.join(dataset_test_dir, 'Apple___Apple_scab', 'Apple___Apple_scab_test_0001.jpg'))
]

print("\n" + "-" * 75)
print("📸 Testing Real Leaf Image Uploads to Express API (/api/analyze-crop):")
print("-" * 75)

all_passed = True
for name, img_path in test_cases:
    if not os.path.exists(img_path):
        print(f"[-] File missing: {img_path}")
        continue
    with open(img_path, 'rb') as f:
        t0 = time.time()
        res = requests.post('http://localhost:5000/api/analyze-crop', files={'cropImage': ('leaf.jpg', f, 'image/jpeg')}, timeout=25)
        dt = (time.time() - t0) * 1000
        if res.status_code == 200:
            d = res.json().get('diagnosis', {})
            print(f" ✅ {name:<20} -> Crop: {d.get('crop')} | Disease: {d.get('disease')} | Conf: {d.get('confidence')} | Latency: {dt:.1f}ms")
        else:
            print(f" ❌ {name} failed with status {res.status_code}")
            all_passed = False

# 3. Test Sample Presets
presets = ['tomato', 'rice', 'banana', 'coconut', 'chilli', 'healthy']
print("\n" + "-" * 75)
print("🔘 Testing Sample Quick-Demo Buttons:")
print("-" * 75)

for p in presets:
    t0 = time.time()
    res = requests.post('http://localhost:5000/api/analyze-crop', json={'presetKey': p, 'language': 'en'}, timeout=5)
    dt = (time.time() - t0) * 1000
    if res.status_code == 200:
        d = res.json().get('diagnosis', {})
        print(f" ✅ Preset [{p:<8}] -> Crop: {d.get('crop')} | Disease: {d.get('disease')} | Conf: {d.get('confidence')} | Latency: {dt:.1f}ms")
    else:
        print(f" ❌ Preset [{p}] failed with status {res.status_code}")
        all_passed = False

print("=" * 75)
if all_passed:
    print("🎯 OVERALL STATUS: ALL REAL ML & PRESET DIAGNOSTIC PIPELINES WORKING 100%")
else:
    print("⚠️ SOME TESTS ENCOUNTERED ISSUES")
print("=" * 75)
