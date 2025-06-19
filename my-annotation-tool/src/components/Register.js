import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Register = ({ onRegisterSuccess, switchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // ✅ Validation
    if (!username.trim() || !email.trim()) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/register', // ✅ Fixed API URL
        { username, email, password },
        { withCredentials: true }
      );

      // ✅ Store user in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (onRegisterSuccess) {
        onRegisterSuccess(response.data.user);
      }

      alert('✅ Registration successful! Please log in.');
      switchToLogin(); // ✅ Redirect to Login Page
    } catch (err) {
      setError(err.response?.data?.message || '❌ Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-form">
      <h2>Create an Account</h2>

      {error && <div className="auth-error">{error}</div>}
      
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
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="form-switch">
        Already have an account? 
        <button 
          onClick={switchToLogin} 
          className="switch-button"
          disabled={loading}
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default Register;
