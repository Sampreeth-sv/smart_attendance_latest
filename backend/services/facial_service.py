# utilities for training and recognizing using OpenCV LBPH
import cv2
import os
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "face_data")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "face_model.yml")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

def collect_images_for_user(label:int, image_paths:list):
    """
    image_paths: list of paths to grayscale face images already cropped
    Each label should be integer and mapping label->user.id stored externally.
    """
    label_dir = os.path.join(DATA_DIR, str(label))
    os.makedirs(label_dir, exist_ok=True)
    for i, p in enumerate(image_paths):
        ext = os.path.splitext(p)[1]
        dest = os.path.join(label_dir, f"{i}{ext}")
        if not os.path.exists(dest):
            import shutil
            shutil.copy(p, dest)

def train_model():
    faces = []
    labels = []
    for label_name in os.listdir(DATA_DIR):
        label_path = os.path.join(DATA_DIR, label_name)
        if not os.path.isdir(label_path):
            continue
        for fname in os.listdir(label_path):
            fpath = os.path.join(label_path, fname)
            img = cv2.imread(fpath, cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue
            faces.append(img)
            labels.append(int(label_name))
    if not faces:
        raise RuntimeError("No faces found to train")
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(faces, np.array(labels))
    recognizer.save(MODEL_PATH)
    return True