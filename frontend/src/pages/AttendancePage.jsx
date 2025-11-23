import { useState, useEffect, useRef } from "react";

function AttendanceVerification() {
  const [location, setLocation] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef();

  // Get location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => alert("Location access denied.")
      );
    }
  }, []);

  // Open webcam
  useEffect(() => {
    async function openCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      } catch {
        alert("Camera access denied.");
      }
    }
    openCamera();
  }, []);

  return (
    <div className="verify-container">
      <h2>Attendance Verification</h2>

      <div className="camera-box">
        <video ref={videoRef} autoPlay playsInline />
      </div>

      <p>
        {location
          ? `📍 Lat: ${location.lat.toFixed(4)}, Lon: ${location.lon.toFixed(4)}`
          : "Fetching location..."}
      </p>

      <button
        disabled={!cameraReady || !location}
        onClick={() => alert("Attendance Marked (UI Mockup)")}
      >
        Mark Attendance
      </button>
    </div>
  );
}

export default AttendanceVerification;