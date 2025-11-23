import { useState } from "react";

function Login({ onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");   // ✅ ADDED ROLE
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      alert("Please enter a valid email");
      return;
    }

    if (!password.trim()) {
      alert("Please enter your password");
      return;
    }

    setIsLoading(true);

    // Pass role also
    await onLogin(email, password, role);

    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">

        <h2>Smart Attendance System</h2>
        <p className="login-subtitle">Please login to continue</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">

          {/* ROLE SELECT  */}
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-control"
              disabled={isLoading}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>  {/* ✅ ADDED */}
            </select>
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              disabled={isLoading}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              disabled={isLoading}
              required
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="btn-login"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-info">
          <p>💡 Use your email to access the system</p>
        </div>

      </div>
    </div>
  );
}

export default Login;
