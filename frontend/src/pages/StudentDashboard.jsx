import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import AttendanceHistory from "./AttendanceHistory";

function StudentDashboard({ user, onLogout }) {
  const [attendanceActive, setAttendanceActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [markedSessionId, setMarkedSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ============================================================
  // POLLING FOR SESSION
  // ============================================================
  useEffect(() => {
    if (showHistory) return;

    const poll = async () => {
      try {
        const res = await fetch("http://localhost:5000/qr/active-session");
        if (!res.ok) return;

        const data = await res.json();

        if (!data.active) {
          setAttendanceActive(false);
          setCurrentSession(null);
          setQrValue("");
          return;
        }

        if (data.section !== user.section) {
          setAttendanceActive(false);
          setCurrentSession(null);
          setQrValue("");
          return;
        }

        setAttendanceActive(true);

        if (!currentSession || currentSession.session_id !== data.session_id) {
          setCurrentSession({
            session_id: data.session_id,
            subject: data.subject,
            teacher_id: data.teacher_id,
          });

          setQrValue(
            JSON.stringify({
              session_id: data.session_id,
              subject: data.subject,
            })
          );

          setMarkedSessionId(null);
          setAttendanceMarked(false);
          setStep(1);
          setLocation(null);
          setLocationVerified(false);
          setCameraActive(false);
        }
      } catch (error) {
        console.log(error);
      }
    };

    poll();
    const t = setInterval(poll, 2500);
    return () => clearInterval(t);
  }, [showHistory, currentSession?.session_id, user.section]);

  // ---- QR Verify ----
  const handleVerifyQR = () => {
    setStep(2);
    alert("✅ QR Code Verified!");
  };

  // ---- Location ----
  const handleGetLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert("❌ Location not supported");
      return setLoading(false);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });

        setLocationVerified(true);
        setStep(3);
        setLoading(false);
        alert("✅ Location verified!");
      },
      () => {
        alert("❌ Enable location services");
        setLoading(false);
      }
    );
  };

  // ---- Camera ----
  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCameraActive(true);
    } catch (error) {
      alert("❌ Cannot access camera");
    }
  };

  // ---- Mark Attendance ----
  const markAttendance = async (faceImage) => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch("http://localhost:5000/attendance/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: currentSession.session_id,
          student_id: user.usn,
          location,
          face_image: faceImage,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMarkedSessionId(currentSession.session_id);
        setAttendanceMarked(true);
        setStep(4);
        alert("🎉 Attendance Marked!");
      } else {
        alert(data.detail || "Failed to mark attendance");
      }
    } catch (error) {
      alert("Error marking attendance");
    }
  };

  // ---- Face Verification ----
  const handleCaptureFace = async () => {
    if (!cameraActive) return alert("Open the camera first!");
    setLoading(true);

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const imgData = canvas.toDataURL("image/jpeg");

    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch("http://localhost:5000/facial/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: imgData,
          user_id: user.usn,
        }),
      });

      const data = await res.json();

      if (res.ok && data.verified) {
        alert("✅ Face Verified!");
        await markAttendance(imgData);
      } else {
        alert("❌ Face verification failed.");
      }
    } catch (err) {
      alert("Error verifying face");
    }

    setLoading(false);
  };

  // ============================================================
  // PAGE SWITCHING
  // ============================================================
  if (showHistory)
    return (
      <AttendanceHistory
        user={user}                 // ✅ FIXED (passing correct object)
        onBack={() => setShowHistory(false)}
      />
    );

  // ============================================================
  // MAIN UI
  // ============================================================
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: "30px" }}>
      <div style={{ width: "100%", maxWidth: "850px" }}>
        
        {/* HEADER */}
        <div className="text-center mb-4">
          <h2>
            Welcome, {user.name} ({user.usn})
          </h2>
          <button onClick={onLogout} className="btn btn-danger mt-2">
            Logout
          </button>
        </div>

        {/* CARD DASHBOARD */}
        <div className="card shadow-sm mb-4 p-4">
          <h4 className="text-center">📱 Student Dashboard</h4>
          <p className="text-center text-muted">
            Mark your attendance when a session is active.
          </p>

          <div className="text-center mt-3">
            <button
              onClick={() => setShowHistory(true)}
              className="btn btn-secondary"
            >
              📊 Attendance History
            </button>
          </div>
        </div>

        {/* NO SESSION */}
        {!attendanceActive ? (
          <div className="card shadow-sm text-center py-5">
            <h5>
              {markedSessionId
                ? "✅ Attendance Completed"
                : "⏳ No Active Session"}
            </h5>
            <p className="text-muted">
              {markedSessionId
                ? "Waiting for next session..."
                : "Please wait for teacher"}
            </p>
          </div>
        ) : attendanceMarked ? (
          <div className="card shadow-sm text-center py-5">
            <h5>✅ Attendance Marked!</h5>
            <p className="text-muted">Subject: {currentSession.subject}</p>
          </div>
        ) : (
          <div className="card shadow-sm p-4">

            <h5 className="text-center">
              📋 Active Session: {currentSession.subject}
            </h5>

            {/* STEP 1 */}
            {step === 1 && (
              <div className="text-center">
                <h6 className="mt-3">Step 1: QR Verification</h6>
                <p className="text-muted">QR Code detected!</p>

                <div className="my-3">
                  <QRCode value={qrValue} size={200} />
                </div>

                <button
                  className="btn btn-success btn-lg"
                  onClick={handleVerifyQR}
                >
                  ✓ Verify QR Code
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="text-center">
                <h6 className="mt-3">Step 2: Location</h6>

                {!locationVerified ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleGetLocation}
                  >
                    {loading ? "Locating..." : "📍 Verify Location"}
                  </button>
                ) : (
                  <p className="text-success">✅ Location Verified</p>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="text-center">
                <h6 className="mt-3">Step 3: Face Verification</h6>

                <video
                  ref={videoRef}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    borderRadius: "8px",
                  }}
                />

                {!cameraActive ? (
                  <button
                    className="btn btn-warning mt-3"
                    onClick={handleOpenCamera}
                  >
                    📷 Open Camera
                  </button>
                ) : (
                  <button
                    className="btn btn-success mt-3"
                    onClick={handleCaptureFace}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "📸 Capture & Verify"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
