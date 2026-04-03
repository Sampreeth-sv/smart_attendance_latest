import { useState, useEffect } from "react";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import HODDashboard from "./pages/HODDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRole = sessionStorage.getItem("role");
    const savedUser = sessionStorage.getItem("user");
    const savedToken = sessionStorage.getItem("token");

    if (savedRole && savedUser && savedToken) {
      setRole(savedRole);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const handleLogin = async (email, password, selectedRole) => {

    // -------------------------------
    // 🟢 ADMIN LOGIN
    // -------------------------------
    if (selectedRole === "admin") {
      const res = await fetch("http://127.0.0.1:5000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Admin login failed");
        return;
      }

      sessionStorage.setItem("token", data.access_token);
      sessionStorage.setItem("role", "admin");
      sessionStorage.setItem("user", JSON.stringify(data.admin));

      setRole("admin");
      setUser(data.admin);
      return;
    }

    // -------------------------------
    // 🟢 NORMAL LOGIN (student/teacher/parent)
    // -------------------------------
    const res = await fetch("http://127.0.0.1:5000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Login failed");
      return;
    }

    let userRole = "student";

    if (selectedRole === "parent") {
      userRole = "parent";
    } else if (data.user.is_teacher) {
      userRole = "teacher";
    }

    sessionStorage.setItem("token", data.access_token);
    sessionStorage.setItem("role", userRole);
    sessionStorage.setItem("user", JSON.stringify(data.user));

    setRole(userRole);
    setUser(data.user);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setUser(null);
    setRole(null);
  };

  if (loading) return <h2>Loading...</h2>;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // -------------------------------
  // 🟢 ROLE BASED ROUTING
  // -------------------------------

  if (role === "admin") {
  return <AdminDashboard admin={user} onLogout={handleLogout} />;
}

  if (role === "teacher") {
    return <TeacherDashboard user={user} onLogout={handleLogout} />;
  }

  if (role === "parent") {
    return <ParentDashboard user={user} onLogout={handleLogout} />;
  }

  return <StudentDashboard user={user} onLogout={handleLogout} />;
}

export default App;
