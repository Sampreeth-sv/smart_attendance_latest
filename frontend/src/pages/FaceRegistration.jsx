import { useState, useRef } from "react";

function FaceRegistration({ user, onBack, onSuccess }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("❌ Failed to access camera: " + error.message);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageData);

    // Stop camera
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    handleOpenCamera();
  };

  const handleRegister = async () => {
  if (!capturedImage) {
    alert("Please capture your face first!");
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem("token");
    
    const response = await fetch("http://localhost:5000/face-registration/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        image: capturedImage,
        user_id: user.name
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert("🎉 Face registered successfully!");
      if (onSuccess) onSuccess();
    } else {
      alert("❌ " + (data.detail || "Failed to register face"));
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("❌ Error registering face");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📸 Register Your Face</h2>
        <button onClick={onBack} className="btn">← Back</button>
      </div>

      <div className="card">
        <h3>Face Registration</h3>
        <p>Register your face to enable AI-powered attendance verification.</p>

        <div className="instructions" style={{ 
          background: "#fff3cd", 
          padding: "15px", 
          borderRadius: "8px",
          marginTop: "15px",
          marginBottom: "20px"
        }}>
          <h4 style={{ margin: "0 0 10px 0" }}>📋 Instructions:</h4>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li>Make sure your face is clearly visible</li>
            <li>Good lighting is important</li>
            <li>Look straight at the camera</li>
            <li>Remove glasses if possible</li>
            <li>Keep a neutral expression</li>
          </ul>
        </div>

        <div className="face-registration-container" style={{ textAlign: "center" }}>
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Camera/Image Display */}
          {!capturedImage ? (
            <div>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                muted
                style={{ 
                  width: "100%", 
                  maxWidth: "400px", 
                  borderRadius: "10px",
                  border: "3px solid #667eea",
                  display: cameraActive ? "block" : "none",
                  margin: "0 auto 20px auto"
                }}
              />
              
              {!cameraActive && (
                <div style={{
                  width: "100%",
                  maxWidth: "400px",
                  height: "300px",
                  backgroundColor: "#f0f0f0",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                  border: "2px dashed #ccc"
                }}>
                  <p style={{ color: "#666", fontSize: "18px" }}>📷 Camera Off</p>
                </div>
              )}

              {!cameraActive ? (
                <button onClick={handleOpenCamera} className="btn-success" style={{ width: "200px" }}>
                  📷 Open Camera
                </button>
              ) : (
                <button onClick={handleCapture} className="btn-success" style={{ width: "200px" }}>
                  📸 Capture Photo
                </button>
              )}
            </div>
          ) : (
            <div>
              <h4>Preview</h4>
              <img 
                src={capturedImage} 
                alt="Captured face"
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  borderRadius: "10px",
                  border: "3px solid #28a745",
                  margin: "0 auto 20px auto",
                  display: "block"
                }}
              />

              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button 
                  onClick={handleRetake} 
                  className="btn"
                  disabled={loading}
                  style={{ width: "150px" }}
                >
                  🔄 Retake
                </button>
                <button 
                  onClick={handleRegister} 
                  className="btn-success"
                  disabled={loading}
                  style={{ width: "150px" }}
                >
                  {loading ? "Registering..." : "✅ Register Face"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-3" style={{ background: "#e7f3ff", padding: "15px" }}>
        <p style={{ margin: 0, color: "#004085" }}>
          <strong>Note:</strong> Your face data is stored securely and will only be used for attendance verification.
        </p>
      </div>
    </div>
  );
}

export default FaceRegistration;