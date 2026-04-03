import { useEffect, useState } from "react";

function ParentDashboard({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [percentageData, setPercentageData] = useState([]);

  useEffect(() => {
    fetchData();
    fetchPercentage();
  }, []);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch("http://127.0.0.1:5000/parent/my-child", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await res.json();
      setData(result);
    } catch (err) {
      alert("Error fetching parent data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPercentage = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(
        "http://127.0.0.1:5000/attendance/parent/percentage",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await res.json();
      setPercentageData(result.data || []);
    } catch (err) {
      alert("Error fetching percentage");
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div className="dashboard">
      <h2>👨‍👩‍👧 Parent Dashboard</h2>

      <button onClick={onLogout} className="btn btn-danger">
        Logout
      </button>

      {data && (
        <div className="card mt-3">
          <h3>
            {data.student.name} ({data.student.usn})
          </h3>
          <p>Section: {data.student.section}</p>

         

          {/* 🟡 Attendance Percentage */}
          <h4 className="mt-4">📊 Attendance Percentage</h4>

          {percentageData.length === 0 ? (
            <p>No percentage data available</p>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Attended</th>
                  <th>Total</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {percentageData.map((p, i) => (
                  <tr key={i}>
                    <td>{p.subject}</td>
                    <td>{p.attended}</td>
                    <td>{p.total}</td>
                    <td>{p.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;