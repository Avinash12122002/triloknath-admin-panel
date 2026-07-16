import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  leads: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  consultations: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
};

const Sidebar = ({ isOpen, onClose }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = admin ? admin.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'A';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icons.globe}
            </div>
            <div>
              <div className="sidebar-brand-name">Triloknath CRM</div>
              <div className="sidebar-brand-sub">Recruitment Admin</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>

          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            {icons.dashboard} Dashboard
          </NavLink>

          <NavLink to="/leads" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            {icons.leads} Contact Form Leads
          </NavLink>

          <NavLink to="/consultations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            {icons.consultations} Consultation Leads
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-admin-info">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-admin-name">{admin?.name || 'Admin'}</div>
              <div className="sidebar-admin-role">{admin?.role || 'admin'}</div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ color: '#F87171' }}>
            {icons.logout} Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;