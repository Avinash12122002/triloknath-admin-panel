import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getConsultations, deleteConsultation } from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_OPTIONS = ['', 'New', 'Contacted', 'Converted'];

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${(status || 'New').replace(' ', '')}`}>
    {status || 'New'}
  </span>
);

const ConfirmModal = ({ name, onConfirm, onCancel }) => (
  <div className="modal-backdrop">
    <div className="modal" style={{ maxWidth: 380 }}>
      <div className="modal-header">
        <span className="modal-title">Delete Consultation</span>
        <button className="modal-close" onClick={onCancel}>✕</button>
      </div>
      <div className="modal-body">
        <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete <strong>{name}</strong>'s consultation request? This action cannot be undone.
        </p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
);

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getConsultations({ status: statusFilter });
      setConsultations(res.data.consultations || []);
    } catch {
      toast('Failed to load consultations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConsultation(deleteTarget._id);
      toast('Consultation deleted.', 'success');
      setDeleteTarget(null);
      fetchConsultations();
    } catch {
      toast('Failed to delete consultation.', 'error');
    }
  };

  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return consultations;
    return consultations.filter((c) =>
      [c.name, c.email, c.whatsapp, c.heading]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [consultations, searchInput]);

  return (
    <Layout title="Consultation Leads" subtitle={`${filtered.length} of ${consultations.length} requests`}>
      {deleteTarget && (
        <ConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="card">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-bar-wrap" style={{ flex: 1, maxWidth: 400 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search by name, email, WhatsApp…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>

          <button className="btn btn-ghost" onClick={fetchConsultations}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <h3>No consultations found</h3>
            <p>{searchInput || statusFilter ? 'Try adjusting your search or filters.' : 'Consultation requests submitted from your website will appear here.'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  {/* <th>Heading</th> */}
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c._id}>
                    <td className="td-muted">{i + 1}</td>
                    <td className="td-name" style={{ whiteSpace: 'nowrap' }}>{c.name}</td>
                    <td className="td-email" style={{ fontSize: 12.5 }}>{c.email}</td>
                    <td className="td-muted" style={{ whiteSpace: 'nowrap' }}>{c.countryCode} {c.whatsapp}</td>
                    {/* <td style={{ maxWidth: 200 }}>{c.heading}</td> */}
                    <td><StatusBadge status={c.status} /></td>
                    <td className="td-muted" style={{ whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="View Details"
                          onClick={() => navigate(`/consultations/${c._id}`)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button
                          className="btn btn-outline btn-icon"
                          title="Edit"
                          onClick={() => navigate(`/consultations/${c._id}/edit`)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          title="Delete"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Consultations;
