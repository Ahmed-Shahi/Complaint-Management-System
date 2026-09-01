import React, { useState } from 'react';
import API from '../services/api';
import { Lock, Mail, UserPlus, LogIn, AlertTriangle, CheckCircle } from 'lucide-react';

const LoginRegister = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register endpoint
        const res = await API.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        setSuccessMsg(res.data.message || 'Registration submitted! Please wait for Admin approval.');
        setIsRegister(false);
        setFormData({ name: '', email: formData.email, password: '' });
      } else {
        // Login endpoint
        const res = await API.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });

        if (res.data.success) {
          if (res.data.token && res.data.user?._id) {
            sessionStorage.setItem(`cms_token_${res.data.user._id}`, res.data.token);
          }
          onLoginSuccess(res.data.user);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication request failed. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{isRegister ? 'Student / User Registration' : 'Single Common Login'}</h2>
          <p className="auth-subtitle">
            {isRegister
              ? 'Create your account to submit and track complaints'
              : 'Enter your credentials to access your dashboard'}
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <AlertTriangle size={18} style={{ marginRight: '8px', flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle size={18} style={{ marginRight: '8px', flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@domain.com or admin@cms.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? (
              'Processing...'
            ) : isRegister ? (
              <>
                <UserPlus size={18} style={{ marginRight: '6px' }} /> Create Account (Pending Approval)
              </>
            ) : (
              <>
                <LogIn size={18} style={{ marginRight: '6px' }} /> Login
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                Sign in here
              </button>
            </p>
          ) : (
            <p>
              New Student/User?{' '}
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                Register Account
              </button>
            </p>
          )}
        </div>

        <div className="admin-tip">
          <small>
            <strong>Default Admin Credentials:</strong> Email: <code>admin@cms.com</code> | Password: <code>admin123</code>
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
