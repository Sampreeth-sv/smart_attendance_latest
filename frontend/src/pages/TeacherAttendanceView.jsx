import { useState, useEffect } from "react";

function TeacherAttendanceView({ session, onBack }) {
  const [attendanceList, setAttendanceList] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionAttendance();
    // Refresh every 5 seconds to show live updates
    const interval = setInterval(fetchSessionAttendance, 5000);
    return () => clearInterval(interval);
  }, [session]);

  const fetchSessionAttendance = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/attendance/session/${session.session_id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setAttendanceList(data.records || []);
        setStats({
          total: data.total_students || 0,
          present: data.present_count || 0,
          percentage: data.percentage || 0
        });
      }
    } catch (error) {
      console.error("Error fetching session attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Student Name", "USN", "Time", "QR", "Location", "Face", "Status"];
    const rows = attendanceList.map(record => [
      record.student_name,
      record.usn,
      new Date(record.timestamp).toLocaleString(),
      record.qr ? "✓" : "✗",
      record.location ? "✓" : "✗",
      record.face ? "✓" : "✗",
      record.by_teacher ? "Manual" : "Auto"
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${session.subject}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <h2>Loading attendance data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Session Attendance: {session.subject}</h2>
        <button onClick={onBack} className="btn">← Back to Dashboard</button>
      </div>

      <div className="card stats-card">
        <h3>Live Attendance Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats.present}</div>
            <div className="stat-label">Present</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: stats.percentage >= 75 ? '#28a745' : '#dc3545' }}>
              {stats.percentage.toFixed(1)}%
            </div>
            <div className="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3>Students Present ({attendanceList.length})</h3>
          <button onClick={exportToCSV} className="btn-success" disabled={attendanceList.length === 0}>
            📥 Export to CSV
          </button>
        </div>

        {attendanceList.length === 0 ? (
          <div className="info-message">
            <p>No students have marked attendance yet.</p>
            <p>Students will appear here as they mark attendance.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Time</th>
                  <th>QR</th>
                  <th>Location</th>
                  <th>Face</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>{record.student_name}</td>
                    <td>{record.usn}</td>
                    <td>{new Date(record.timestamp).toLocaleTimeString()}</td>
                    <td>
                      <span className={`badge ${record.qr ? 'badge-success' : 'badge-danger'}`}>
                        {record.qr ? '✓' : '✗'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${record.location ? 'badge-success' : 'badge-danger'}`}>
                        {record.location ? '✓' : '✗'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${record.face ? 'badge-success' : 'badge-danger'}`}>
                        {record.face ? '✓' : '✗'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${record.by_teacher ? 'badge-warning' : 'badge-success'}`}>
                        {record.by_teacher ? 'Manual' : 'Auto'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mt-3" style={{ background: "#f8f9fa", padding: "15px" }}>
        <p style={{ margin: 0, color: "#666" }}>
          🔄 Auto-refreshing every 5 seconds • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}


export default TeacherAttendanceView;