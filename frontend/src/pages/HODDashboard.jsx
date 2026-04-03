import { useState } from "react";

function HODDashboard({ user, onLogout }) {
  const [section, setSection] = useState("A");
  const [data, setData] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(
        `http://127.0.0.1:5000/analytics/section/${section}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await res.json();
      setData(result);
    } catch {
      alert("Error fetching analytics");
    }
  };

  return (
    <div className="dashboard">
      <h2>🏫 HOD / Principal Dashboard</h2>

      <button onClick={onLogout} className="btn btn-danger">
        Logout
      </button>

      <div className="card mt-3">
        <h3>Select Section</h3>

        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
        >
          <option value="A">Section A</option>
          <option value="B">Section B</option>
          <option value="C">Section C</option>
        </select>

        <button
          onClick={fetchAnalytics}
          className="btn btn-primary mt-2"
        >
          Fetch Analytics
        </button>
      </div>

      {data && (
        <div className="card mt-3">
          <h3>Section {data.section}</h3>

          <table className="attendance-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Total Sessions</th>
                <th>Attendance Records</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((s, i) => (
                <tr key={i}>
                  <td>{s.subject}</td>
                  <td>{s.total_sessions}</td>
                  <td>{s.attendance_records}</td>
                  <td>{s.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HODDashboard;