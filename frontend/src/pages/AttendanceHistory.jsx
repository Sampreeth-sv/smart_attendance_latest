import { useState, useEffect } from "react";

function AttendanceHistory({ user, onBack }) {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, attended: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const fetchAttendanceHistory = async () => {
    try {
      const token = sessionStorage.getItem("token");

      // 🔥 FIXED — use USN instead of NAME
      const response = await fetch(
        `http://localhost:5000/attendance/history/${user.usn}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRecords(data.records || []);

        const totalRecords = data.total_records || 0;
        const attended = data.attended || 0;

        const percentage =
          totalRecords > 0
            ? ((attended / totalRecords) * 100).toFixed(2)
            : 0;

        setStats({
          total: totalRecords,
          attended: attended,
          percentage: percentage,
        });
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <h2>Loading attendance history...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Attendance History</h2>
        <button onClick={onBack} className="btn">
          ← Back to Dashboard
        </button>
      </div>

      {/* Statistics */}
      <div className="card stats-card">
        <h3>Your Attendance Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Classes</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: "#28a745" }}>
              {stats.attended}
            </div>
            <div className="stat-label">Classes Attended</div>
          </div>
          <div className="stat-item">
            <div
              className="stat-value"
              style={{
                color: stats.percentage >= 75 ? "#28a745" : "#dc3545",
              }}
            >
              {stats.percentage}%
            </div>
            <div className="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <h3>Attendance Records</h3>

        {records.length === 0 ? (
          <div className="info-message">
            <p>No attendance records found.</p>
            <p>Your attendance will appear here once you mark attendance.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date & Time</th>
                  <th>Subject</th>
                  <th>QR</th>
                  <th>Location</th>
                  <th>Face</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>{new Date(record.timestamp).toLocaleString()}</td>
                    <td>{record.subject || "N/A"}</td>
                    <td>
                      <span
                        className={`badge ${
                          record.qr ? "badge-success" : "badge-danger"
                        }`}
                      >
                        {record.qr ? "✓" : "✗"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          record.location ? "badge-success" : "badge-danger"
                        }`}
                      >
                        {record.location ? "✓" : "✗"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          record.face ? "badge-success" : "badge-danger"
                        }`}
                      >
                        {record.face ? "✓" : "✗"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          record.by_teacher
                            ? "badge-warning"
                            : "badge-success"
                        }`}
                      >
                        {record.by_teacher ? "Manual" : "Auto"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceHistory;
