import { useState, useEffect, useRef } from "react";

function AdminDashboard({ admin, onLogout }) {
  const [view, setView] = useState("home");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [report, setReport] = useState([]);
  const [reportFilter, setReportFilter] = useState({
    subject: "",
    from_date: "",
    to_date: "",
  });

  // ✅ Use the same token as normal login
  const token =  sessionStorage.getItem("token");

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.detail || JSON.stringify(data));
    }
    return data;
  };

  const loadStudents = async () => {
    try {
      const data = await apiFetch("http://localhost:5000/admin/students");
      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load students");
    }
  };

  const loadTeachers = async () => {
    try {
      const data = await apiFetch("http://localhost:5000/admin/teachers");
      setTeachers(data.teachers || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load teachers");
    }
  };

  const loadReport = async () => {
    try {
      const cleanFilter = {
        subject: reportFilter.subject || undefined,
        from_date: reportFilter.from_date || undefined,
        to_date: reportFilter.to_date || undefined,
      };

      const data = await apiFetch(
        "http://localhost:5000/admin/attendance/report",
        {
          method: "POST",
          body: JSON.stringify(cleanFilter),
        }
      );
      setReport(data.records || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load report");
    }
  };

  // ---------- Create student ----------
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    const form = e.target;
    const body = {
      usn: form.usn.value,
      name: form.name.value,
      email: form.email.value,
      department: form.department.value,
      year: Number(form.year.value),
      section: form.section.value,
      password: form.password.value,
    };
    try {
      await apiFetch("http://localhost:5000/admin/students", {
        method: "POST",
        body: JSON.stringify(body),
      });
      alert("Student created");
      form.reset();
      loadStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------- Create teacher ----------
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    const form = e.target;
    const subjects = form.subjects.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const body = {
      teacher_id: form.teacher_id.value,
      name: form.name.value,
      email: form.email.value,
      phone_number: form.phone_number.value,
      qualification: form.qualification.value,
      subjects,
      password: form.password.value,
    };

    try {
      await apiFetch("http://localhost:5000/admin/teachers", {
        method: "POST",
        body: JSON.stringify(body),
      });
      alert("Teacher created");
      form.reset();
      loadTeachers();
    } catch (err) {
      alert(err.message);
    }
  };

  // ======================================================
  // ✅ TIMETABLE (Format-B) – no JSON typing
  // ======================================================
  const [ttTeacherId, setTtTeacherId] = useState("");
  const [ttDay, setTtDay] = useState("Monday");
  const [ttTime, setTtTime] = useState("");
  const [ttSubject, setTtSubject] = useState("");
  const [ttSection, setTtSection] = useState("");
  const [ttSlots, setTtSlots] = useState([]);

  const timeSlotsPreset = [
    "9:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-1:00",
    "2:00-3:00",
    "3:00-4:00",
  ];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!ttTeacherId) {
      alert("Enter Teacher ID first");
      return;
    }
    if (!ttTime.trim() || !ttSubject.trim() || !ttSection.trim()) {
      alert("Fill Time, Subject & Section");
      return;
    }

    const newSlot = {
      day: ttDay,
      time: ttTime,
      subject: ttSubject,
      section: ttSection, // e.g. "CSE-3A"
    };

    setTtSlots((prev) => [...prev, newSlot]);

    // reset only small fields
    setTtTime("");
    setTtSubject("");
    setTtSection("");
  };

  const handleRemoveSlot = (index) => {
    setTtSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTimetableUpload = async (e) => {
    e.preventDefault();
    if (!ttTeacherId) {
      alert("Teacher ID is required");
      return;
    }
    if (ttSlots.length === 0) {
      alert("Add at least one slot to timetable");
      return;
    }

    try {
      // 👇 backend expects: teacher_id + timetable (dict)
      await apiFetch("http://localhost:5000/admin/timetable", {
        method: "POST",
        body: JSON.stringify({
          teacher_id: ttTeacherId,
          timetable: { slots: ttSlots }, // stored as JSON in DB
        }),
      });
      alert("Timetable saved");
      setTtSlots([]);
    } catch (err) {
      console.error(err);
      alert("Failed to save timetable");
    }
  };

  // ---------- Assign section ----------
  const handleAssignSection = async (e) => {
    e.preventDefault();
    const form = e.target;
    const usns = form.usns.value
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      await apiFetch("http://localhost:5000/admin/sections/assign", {
        method: "POST",
        body: JSON.stringify({
          usns,
          department: form.department.value,
          year: Number(form.year.value),
          section: form.section.value,
        }),
      });
      alert("Section updated");
      form.reset();
      loadStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------- Classroom ----------
  const handleClassroom = async (e) => {
    e.preventDefault();
    const form = e.target;
    const imagePaths = form.image_paths.value
      ? form.image_paths.value.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      await apiFetch("http://localhost:5000/admin/classrooms", {
        method: "POST",
        body: JSON.stringify({
          room_number: form.room_number.value,
          lat: Number(form.lat.value),
          lon: Number(form.lon.value),
          image_paths: imagePaths,
        }),
      });
      alert("Classroom saved");
      form.reset();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------- Register face ----------
  const faceInputRef = useRef(null);

  const handleFaceRegister = async (e) => {
    e.preventDefault();
    const form = e.target;
    const usn = form.usn.value;

    const file = faceInputRef.current.files[0];
    if (!file) {
      alert("Select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;

      try {
        await apiFetch("http://localhost:5000/admin/face/register", {
          method: "POST",
          body: JSON.stringify({
            usn,
            image: base64Data,
          }),
        });
        alert("Face registered");
        form.reset();
        if (faceInputRef.current) faceInputRef.current.value = "";
      } catch (err) {
        alert(err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  // ---------- Attendance Report ----------
  const handleReportFilter = (e) => {
    e.preventDefault();
    loadReport();
  };

  // ======================================================
  // ✅ SECTION TIMETABLE VIEW (for a section like CSE-3A)
  // ======================================================
  const [secDept, setSecDept] = useState("");
  const [secYear, setSecYear] = useState("");
  const [secSection, setSecSection] = useState("");
  const [sectionSlots, setSectionSlots] = useState([]);

  const handleSectionTimetableSubmit = (e) => {
    e.preventDefault();

    if (!secDept.trim() || !secYear.trim() || !secSection.trim()) {
      alert("Fill Department, Year and Section");
      return;
    }

    // Convention: section code like "CSE-3A"
    const sectionCode = `${secDept}-${secYear}${secSection}`;

    const slots = [];
    // teachers already loaded via /admin/teachers
    teachers.forEach((t) => {
      const timetable = t.timetable || {};
      const ttSlots = (timetable && timetable.slots) || [];

      ttSlots.forEach((s) => {
        if (s.section === sectionCode) {
          slots.push({
            day: s.day,
            time: s.time,
            subject: s.subject,
            section: s.section,
            teacher_name: t.name,
            teacher_id: t.teacher_id,
          });
        }
      });
    });

    setSectionSlots(slots);
  };

  // pre-load lists when opening views
  useEffect(() => {
    if (view === "students") loadStudents();
    if (view === "teachers" || view === "sectionTimetable") loadTeachers();
    if (view === "report") loadReport();
  }, [view]);

  const logoutAdmin = () => {
    localStorage.clear();
    onLogout();
  };

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Admin Dashboard</h3>
        <div>
          <span className="me-3">Hello, {admin.name}</span>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={logoutAdmin}
          >
            Logout
          </button>
        </div>
      </div>

      {/* NAV TABS */}
      <div className="btn-group mb-4">
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("home")}
        >
          Home
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("students")}
        >
          Students
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("teachers")}
        >
          Teachers
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("timetable")}
        >
          Timetable
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("sectionTimetable")}
        >
          Section Timetable
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("sections")}
        >
          Sections
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("classrooms")}
        >
          Classrooms
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("face")}
        >
          Register Face
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("report")}
        >
          Attendance Report
        </button>
      </div>

      {/* VIEWS */}
      {view === "home" && (
        <div className="card p-3">
          <h5>Admin Actions</h5>
          <ul>
            <li>Register student faces</li>
            <li>Upload teacher timetables</li>
            <li>Assign / change sections</li>
            <li>View teachers & subjects</li>
            <li>Generate attendance reports</li>
            <li>Upload classroom photos & location</li>
            <li>Create new student / teacher accounts</li>
            <li>View section-wise timetable</li>
          </ul>
        </div>
      )}

      {view === "students" && (
        <div className="row">
          <div className="col-md-6">
            <div className="card p-3 mb-3">
              <h5>Create New Student</h5>
              <form onSubmit={handleCreateStudent}>
                <input name="usn" className="form-control mb-2" placeholder="USN" />
                <input name="name" className="form-control mb-2" placeholder="Name" />
                <input name="email" className="form-control mb-2" placeholder="Email" />
                <input
                  name="department"
                  className="form-control mb-2"
                  placeholder="Department"
                />
                <input
                  name="year"
                  type="number"
                  className="form-control mb-2"
                  placeholder="Year"
                />
                <input
                  name="section"
                  className="form-control mb-2"
                  placeholder="Section"
                />
                <input
                  name="password"
                  className="form-control mb-2"
                  placeholder="Password"
                />
                <button className="btn btn-success">Create</button>
              </form>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-3">
              <h5>Existing Students</h5>
              <ul className="list-group">
                {students.map((s) => (
                  <li key={s.usn} className="list-group-item">
                    {s.usn} - {s.name} ({s.department} {s.year}
                    {s.section})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {view === "teachers" && (
        <div className="row">
          <div className="col-md-6">
            <div className="card p-3 mb-3">
              <h5>Create New Teacher</h5>
              <form onSubmit={handleCreateTeacher}>
                <input
                  name="teacher_id"
                  className="form-control mb-2"
                  placeholder="Teacher ID (e.g., T003)"
                />
                <input name="name" className="form-control mb-2" placeholder="Name" />
                <input name="email" className="form-control mb-2" placeholder="Email" />
                <input
                  name="phone_number"
                  className="form-control mb-2"
                  placeholder="Phone (optional)"
                />
                <input
                  name="qualification"
                  className="form-control mb-2"
                  placeholder="Qualification"
                />
                <input
                  name="subjects"
                  className="form-control mb-2"
                  placeholder="Subjects (comma separated)"
                />
                <input
                  name="password"
                  className="form-control mb-2"
                  placeholder="Password"
                />
                <button className="btn btn-success">Create</button>
              </form>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-3">
              <h5>Teachers & Subjects</h5>
              <ul className="list-group">
                {teachers.map((t) => (
                  <li key={t.teacher_id} className="list-group-item">
                    {t.teacher_id} - {t.name} <br />
                    <small>Subjects: {(t.subjects || []).join(", ")}</small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {view === "timetable" && (
        <div className="card p-3">
          <h5>Teacher Timetable</h5>

          <form onSubmit={handleTimetableUpload}>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Teacher ID</label>
                <input
                  className="form-control"
                  value={ttTeacherId}
                  onChange={(e) => setTtTeacherId(e.target.value)}
                  placeholder="e.g., T001"
                />
              </div>
            </div>

            <hr />

            <h6>Add Slot</h6>
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="form-label">Day</label>
                <select
                  className="form-control"
                  value={ttDay}
                  onChange={(e) => setTtDay(e.target.value)}
                >
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Time</label>
                <select
                  className="form-control mb-1"
                  value={ttTime}
                  onChange={(e) => setTtTime(e.target.value)}
                >
                  <option value="">-- Select Time Slot --</option>
                  {timeSlotsPreset.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                <input
                  className="form-control"
                  placeholder="Or type custom (e.g., 1:00-2:00)"
                  value={ttTime}
                  onChange={(e) => setTtTime(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Subject</label>
                <input
                  className="form-control"
                  value={ttSubject}
                  onChange={(e) => setTtSubject(e.target.value)}
                  placeholder="e.g., CN"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">Section</label>
                <input
                  className="form-control"
                  value={ttSection}
                  onChange={(e) => setTtSection(e.target.value)}
                  placeholder="e.g., CSE-3A"
                />
              </div>

              <div className="col-md-1">
                <button
                  className="btn btn-success w-100"
                  style={{ marginTop: "8px" }}
                  onClick={handleAddSlot}
                >
                  +
                </button>
              </div>
            </div>

            {ttSlots.length > 0 && (
              <>
                <hr />
                <h6>Current Slots ({ttSlots.length})</h6>
                <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Subject</th>
                        <th>Section</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ttSlots.map((s, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{s.day}</td>
                          <td>{s.time}</td>
                          <td>{s.subject}</td>
                          <td>{s.section}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveSlot(idx)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="mt-3">
              <button className="btn btn-primary">
                Save Timetable for {ttTeacherId || "Teacher"}
              </button>
            </div>
          </form>
        </div>
      )}

      {view === "sectionTimetable" && (
        <div className="card p-3">
          <h5>View Section Timetable</h5>
          <form onSubmit={handleSectionTimetableSubmit} className="row g-2 mb-3">
            <div className="col-md-3">
              <label className="form-label">Department</label>
              <input
                className="form-control"
                placeholder="e.g., CSE"
                value={secDept}
                onChange={(e) => setSecDept(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Year</label>
              <input
                className="form-control"
                placeholder="e.g., 3"
                value={secYear}
                onChange={(e) => setSecYear(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Section</label>
              <input
                className="form-control"
                placeholder="e.g., A"
                value={secSection}
                onChange={(e) => setSecSection(e.target.value)}
              />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-primary w-100">
                View Section Timetable
              </button>
            </div>
          </form>

          {sectionSlots.length > 0 ? (
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Section</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionSlots.map((s, idx) => (
                    <tr key={idx}>
                      <td>{s.day}</td>
                      <td>{s.time}</td>
                      <td>{s.subject}</td>
                      <td>
                        {s.teacher_name} ({s.teacher_id})
                      </td>
                      <td>{s.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted mb-0">
              No slots found yet. Make sure you saved timetables with matching
              section code (e.g., CSE-3A).
            </p>
          )}
        </div>
      )}

      {view === "sections" && (
        <div className="card p-3">
          <h5>Assign / Change Section</h5>
          <form onSubmit={handleAssignSection}>
            <textarea
              name="usns"
              className="form-control mb-2"
              rows={3}
              placeholder="USNs (comma separated)"
            />
            <input
              name="department"
              className="form-control mb-2"
              placeholder="Department"
            />
            <input
              name="year"
              type="number"
              className="form-control mb-2"
              placeholder="Year"
            />
            <input
              name="section"
              className="form-control mb-2"
              placeholder="Section"
            />
            <button className="btn btn-success">Update Section</button>
          </form>
        </div>
      )}

      {view === "classrooms" && (
        <div className="card p-3">
          <h5>Classroom Setup</h5>
          <form onSubmit={handleClassroom}>
            <input
              name="room_number"
              className="form-control mb-2"
              placeholder="Room Number (e.g., C-304)"
            />
            <input name="lat" className="form-control mb-2" placeholder="Latitude" />
            <input name="lon" className="form-control mb-2" placeholder="Longitude" />
            <input
              name="image_paths"
              className="form-control mb-2"
              placeholder="Image paths (comma separated)"
            />
            <button className="btn btn-success">Save Classroom</button>
          </form>
        </div>
      )}

      {view === "face" && (
        <div className="card p-3">
          <h5>Register Student Face</h5>
          <form onSubmit={handleFaceRegister}>
            <input
              name="usn"
              className="form-control mb-2"
              placeholder="Student USN"
            />
            <input
              type="file"
              accept="image/*"
              ref={faceInputRef}
              className="form-control mb-2"
            />
            <button className="btn btn-success">Upload & Save Face</button>
          </form>
        </div>
      )}

      {view === "report" && (
        <div className="row">
          <div className="col-md-4">
            <div className="card p-3 mb-3">
              <h5>Report Filters</h5>
              <form onSubmit={handleReportFilter}>
                <input
                  className="form-control mb-2"
                  placeholder="Subject (optional)"
                  value={reportFilter.subject}
                  onChange={(e) =>
                    setReportFilter({ ...reportFilter, subject: e.target.value })
                  }
                />
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  className="form-control mb-2"
                  value={reportFilter.from_date}
                  onChange={(e) =>
                    setReportFilter({ ...reportFilter, from_date: e.target.value })
                  }
                />
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-control mb-2"
                  value={reportFilter.to_date}
                  onChange={(e) =>
                    setReportFilter({ ...reportFilter, to_date: e.target.value })
                  }
                />
                <button className="btn btn-primary w-100">Load Report</button>
              </form>
            </div>
          </div>

          <div className="col-md-8">
            <div className="card p-3">
              <h5>Attendance Records ({report.length})</h5>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>USN</th>
                      <th>Name</th>
                      <th>Subject</th>
                      <th>Time</th>
                      <th>QR</th>
                      <th>Loc</th>
                      <th>Face</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.usn}</td>
                        <td>{r.student_name}</td>
                        <td>{r.subject}</td>
                        <td>{new Date(r.timestamp).toLocaleString()}</td>
                        <td>{r.qr ? "✓" : "✗"}</td>
                        <td>{r.location ? "✓" : "✗"}</td>
                        <td>{r.face ? "✓" : "✗"}</td>
                        <td>{r.by_teacher ? "T" : "Auto"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
