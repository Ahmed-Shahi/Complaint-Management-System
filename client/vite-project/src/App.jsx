import React, { useState, useEffect } from 'react';
import API from './services/api';
import Navbar from './components/Navbar';
import LoginRegister from './pages/LoginRegister';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

// Extract userId from URL hash e.g., #/dashboard/64f1a2b3...
const getUserIdFromUrl = () => {
  const hash = window.location.hash || '';
  const match = hash.match(/#\/dashboard\/([a-f0-9]{24})/i);
  return match ? match[1] : null;
};

function App() {
  const [currentUserId, setCurrentUserId] = useState(() => getUserIdFromUrl());
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Listen to hash changes in current browser tab
  useEffect(() => {
    const handleHashChange = () => {
      const urlUserId = getUserIdFromUrl();
      setCurrentUserId(urlUserId);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Whenever currentUserId changes, verify session against backend for this specific tab's userId
  useEffect(() => {
    if (currentUserId) {
      verifySession(currentUserId);
    } else {
      setUser(null);
      setCheckingAuth(false);
    }
  }, [currentUserId]);

  const verifySession = async (userId) => {
    setCheckingAuth(true);
    try {
      // Calls GET /api/auth/me/:userId -> verifies cookie Token_<userId> against param userId
      const res = await API.get(`/auth/me/${userId}`);
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
      } else {
        handleInvalidSession();
      }
    } catch (err) {
      console.warn(`Session verification failed for user ID ${userId}:`, err.response?.data?.message);
      handleInvalidSession();
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleInvalidSession = () => {
    setUser(null);
    window.location.hash = '#/login';
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Navigate tab URL to include the unique user ID parameter: #/dashboard/<userId>
    window.location.hash = `#/dashboard/${userData._id}`;
  };

  const handleLogout = async () => {
    if (user?._id) {
      try {
        await API.post(`/auth/logout/${user._id}`);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setUser(null);
    setCurrentUserId(null);
    window.location.hash = '#/login';
  };

  if (checkingAuth) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Verifying session for current tab...</p>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="main-content">
        {!user ? (
          <LoginRegister onLoginSuccess={handleLoginSuccess} />
        ) : user.role === 'ADMIN' ? (
          <AdminDashboard user={user} />
        ) : (
          <UserDashboard user={user} />
        )}
      </main>
    </div>
  );
}

export default App;
