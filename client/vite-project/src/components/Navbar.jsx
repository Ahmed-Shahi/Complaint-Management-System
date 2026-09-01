import React from 'react';
import StatusBadge from './StatusBadge';
import { LogOut, User, ShieldCheck } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <ShieldCheck size={24} style={{ marginRight: '8px', color: '#38bdf8' }} />
          <span>Smart Complaint Management System</span>
        </div>

        {user && (
          <div className="navbar-user-info">
            <div className="user-details">
              <User size={16} style={{ marginRight: '4px' }} />
              <span className="user-name">{user.name}</span>
              <span className="role-tag">{user.role}</span>
              <StatusBadge status={user.status} />
            </div>
            <button onClick={onLogout} className="btn-logout">
              <LogOut size={16} style={{ marginRight: '4px' }} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
