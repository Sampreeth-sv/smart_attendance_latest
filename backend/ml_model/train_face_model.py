# CLI script to train face model (run manually)
from services.facial_service import train_model

if __name__ == "__main__":
    ok = train_model()
    print("Training finished:", ok)