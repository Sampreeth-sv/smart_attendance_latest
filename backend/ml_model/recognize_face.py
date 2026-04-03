# Example script to test recognition on a single image
import cv2, os
from services.facial_service import MODEL_PATH

def recognize(image_path):
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(MODEL_PATH)
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    faces = face_cascade.detectMultiScale(img, scaleFactor=1.1, minNeighbors=4)
    if len(faces) == 0:
        print("No face")
        return
    (x,y,w,h) = faces[0]
    face = img[y:y+h, x:x+w]
    label, conf = recognizer.predict(face)
    print("label:", label, "conf:", conf)

if __name__ == "__main__":
    import sys
    recognize(sys.argv[1])
