import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import "./Login.css";
import "./Auth.css";

const Login = ({ onLoginSuccess, switchToRegister, switchToResetPassword }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Get login function from auth context
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);

    try {
      // Use the AuthContext login function
      const result = await login(username, password);
      
      if (result.success) {
        console.log("Login successful!");
        
        // Call onLoginSuccess if provided
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form auth-form">
      <h2>Login to Annotation Tool</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="forgot-password">
          <span onClick={switchToResetPassword}>Forgot Password?</span>
        </div>

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="auth-link">
        Don't have an account?{" "}
        <span onClick={switchToRegister}>Register</span>
      </p>
    </div>
  );
};

export default Login;