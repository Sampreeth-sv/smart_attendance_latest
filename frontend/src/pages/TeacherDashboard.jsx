import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import TeacherAttendanceView from "./TeacherAttendanceView";
import TeacherOverride from "./TeacherOverride";

function TeacherDashboard({ user, onLogout }) {
  const [attendanceActive, setAttendanceActive] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAttendanceView, setShowAttendanceView] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);

  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const res = await fetch("http://localhost:5000/teacher/subjects", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setSubjects(data.subjects || []);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    let interval = null;

    if (attendanceActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (attendanceActive && timeLeft === 0) {
      handleStopAttendance();
      alert("⏳ Attendance session ended automatically!");
    }

    return () => clearInterval(interval);
  }, [attendanceActive, timeLeft]);

  const resetUI = () => {
    setAttendanceActive(false);
    setQrValue("");
    setSessionId("");
    setCurrentSession(null);
    setTimeLeft(600);
  };

  const handleStartAttendance = async () => {
    if (!selectedSubject) {
      alert("⚠️ Please select a subject!");
      return;
    }
    if (!selectedSection) {
      alert("⚠️ Please select a section!");
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch("http://localhost:5000/qr/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: selectedSubject,
          teacher_id: user.usn,
          section: selectedSection,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Failed to start attendance");
        return;
      }

      const qrData = {
        session_id: data.session_id,
        subject: selectedSubject,
        section: selectedSection,
      };

      setSessionId(data.session_id);
      setQrValue(JSON.stringify(qrData));
      setAttendanceActive(true);
      setTimeLeft(600);
      setCurrentSession({
        session_id: data.session_id,
        subject: selectedSubject,
        section: selectedSection,
        teacher_id: user.usn,
      });

      alert(`✅ Attendance started for ${selectedSubject} - Section ${selectedSection}!`);
    } catch (err) {
      console.error(err);
      alert("Server error!");
    } finally {
      setLoading(false);
    }
  };

  const handleStopAttendance = async () => {
    try {
      const token = sessionStorage.getItem("token");
      await fetch("http://localhost:5000/qr/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      resetUI();
    } catch (err) {
      console.error("Error stopping session:", err);
    }
  };

  const handleViewAttendance = () => {
    if (!currentSession) {
      alert("Start a session first!");
      return;
    }
    setShowAttendanceView(true);
  };

  if (showAttendanceView && currentSession) {
    return (
      <TeacherAttendanceView
        session={currentSession}
        onBack={() => setShowAttendanceView(false)}
      />
    );
  }

  if (showOverride) {
    return (
      <TeacherOverride
        teacher={{ ...user, section: selectedSection }}
        onClose={() => setShowOverride(false)}
      />
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: "30px" }}>
      <div style={{ width: "100%", maxWidth: "850px" }}>

        <div className="text-center mb-4">
          <h2>Welcome, {user.name}</h2>
          <button onClick={onLogout} className="btn btn-danger mt-2">
            Logout
          </button>
        </div>

        <div className="card shadow-sm mb-4 p-4 text-center">
          <h4>📊 Teacher Dashboard</h4>
          <p className="text-muted">Start and manage attendance sessions</p>
        </div>

        <div className="card shadow-sm mb-4 p-4">
          <h5 className="text-center mb-3">Start Attendance Session</h5>

          {!attendanceActive ? (
            <div className="text-center">

              <select
                className="form-select mb-3"
                style={{ maxWidth: "400px", margin: "0 auto" }}
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              <select
                className="form-select mb-3"
                style={{ maxWidth: "200px", margin: "0 auto" }}
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select Section --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>

              <div className="mt-2">
                <button
                  className="btn btn-primary me-3"
                  onClick={handleStartAttendance}
                  disabled={loading || !selectedSubject || !selectedSection}
                >
                  {loading ? "Starting..." : "🚀 Start Attendance"}
                </button>

                <button
                  onClick={() => setShowOverride(true)}
                  className="btn btn-warning ms-3"
                >
                  ✏️ Manual Override
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center">
              <h6 className="mb-2">
                Attendance Active: {selectedSubject} ({selectedSection})
              </h6>
              <p className="text-danger fw-bold">
                ⏳ Time Left: {Math.floor(timeLeft / 60)}:
                {String(timeLeft % 60).padStart(2, "0")}
              </p>
              <p>Session ID: {sessionId}</p>

              <div className="my-3">
                <QRCode value={qrValue} size={220} />
              </div>

              <button
                className="btn btn-info me-3"
                onClick={handleViewAttendance}
              >
                📋 View Live Attendance
              </button>

              <button className="btn btn-danger" onClick={handleStopAttendance}>
                ⏹️ Stop Attendance
              </button>
            </div>
          )}
        </div>

        <div className="card shadow-sm p-4 text-center">
          <h5>📌 Quick Tools</h5>
          <button className="btn btn-secondary mt-2">Generate Reports</button>
        </div>

      </div>
    </div>
  );
}

export default TeacherDashboard;
