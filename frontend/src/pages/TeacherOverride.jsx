import { useState, useEffect } from "react";

function TeacherOverride({ teacher, onClose }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [teacherSubjects, setTeacherSubjects] = useState([]);

  // ------------------------------------------------
  // Fetch teacher subjects
  // ------------------------------------------------
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const res = await fetch("http://localhost:5000/teacher/subjects", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setTeacherSubjects(data.subjects || []);
      } catch (err) {
        console.error("Error fetching subjects:", err);
      }
    };

    fetchSubjects();
  }, []);

  // ------------------------------------------------
  // Fetch students of selected section
  // ------------------------------------------------
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const section = teacher.section;

        const res = await fetch(
          `http://localhost:5000/teacher/students/${section}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        setStudents(data.students || []);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    fetchStudents();
  }, [teacher.section]);

  // ------------------------------------------------
  // Select / Unselect student (checkbox)
  // ------------------------------------------------
  const handleCheckbox = (usn) => {
    setSelected((prev) =>
      prev.includes(usn)
        ? prev.filter((id) => id !== usn)
        : [...prev, usn]
    );
  };

  // ------------------------------------------------
  // Manual Attendance Override
  // ------------------------------------------------
  const handleOverride = async () => {
    if (!subject || selected.length === 0) {
      alert("⚠️ Select subject and at least one student!");
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch("http://localhost:5000/teacher/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usns: selected,
          subject,
          classroom_id: 1,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`Attendance overridden for: ${selected.join(", ")}`);
        setSelected([]);

        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.detail || "Error overriding attendance");
      }
    } catch (err) {
      alert("Server error.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // UI
  // ------------------------------------------------
  return (
    <div
      className="override-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="card"
        style={{
          backgroundColor: "white",
          padding: "20px",
          width: "90%",
          maxWidth: "600px",
          borderRadius: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        <h3>✏️ Manual Attendance Override</h3>

        <p>
          Teacher: <strong>{teacher.usn}</strong> | Section:{" "}
          <strong>{teacher.section}</strong>
        </p>

        {/* SUBJECT DROPDOWN */}
        <label>Select Subject:</label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{
            width: "100%",
            marginBottom: "10px",
            padding: "5px",
            borderRadius: "5px",
          }}
        >
          <option value="">-- Choose Subject --</option>

          {teacherSubjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* SUCCESS MESSAGE */}
        {successMsg && (
          <div
            style={{
              backgroundColor: "#d4edda",
              color: "#155724",
              padding: "10px 15px",
              borderRadius: "6px",
              marginBottom: "12px",
              border: "1px solid #c3e6cb",
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            {successMsg}
          </div>
        )}

        {/* STUDENT LIST */}
        <h4>Student List</h4>
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
          }}
        >
          {students.length === 0 ? (
            <p>No students found for this section.</p>
          ) : (
            students.map((s) => (
              <div
                key={s.usn}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(s.usn)}
                  onChange={() => handleCheckbox(s.usn)}
                  style={{ marginRight: "10px" }}
                />
                <span>
                  {s.name} ({s.usn})
                </span>
              </div>
            ))
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div
          style={{
            marginTop: "15px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={handleOverride}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#28a745",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {loading ? "Marking..." : "✅ Mark Selected Present"}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#dc3545",
              color: "white",
              fontWeight: "bold",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherOverride;
