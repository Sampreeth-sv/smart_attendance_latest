import { useState, useEffect } from "react";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
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
    if (selectedRole !== "admin") {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Login failed");
        return;
      }

      const userRole = data.user.is_teacher ? "teacher" : "student";

      sessionStorage.setItem("token", data.access_token);
      sessionStorage.setItem("role", userRole);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      setRole(userRole);
      setUser(data.user);
      return;
    }

    // Admin login
    const res = await fetch("http://localhost:5000/admin/login", {
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

  if (role === "admin") {
    return <AdminDashboard admin={user} onLogout={handleLogout} />;
  }

  if (role === "teacher") {
    return <TeacherDashboard user={user} onLogout={handleLogout} />;
  }

  return <StudentDashboard user={user} onLogout={handleLogout} />;
}

export default App;
