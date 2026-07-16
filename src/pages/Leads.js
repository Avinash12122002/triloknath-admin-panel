import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getContactForms, deleteContactForm, exportLeads } from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_OPTIONS = ['', 'New', 'In Progress', 'Contacted', 'Converted', 'Closed'];

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${(status || 'New').replace(' ', '')}`}>
    {status || 'New'}
  </span>
);

const ConfirmModal = ({ name, onConfirm, onCancel }) => (
  <div className="modal-backdrop">
    <div className="modal" style={{ maxWidth: 380 }}>
      <div className="modal-header">
        <span className="modal-title">Delete Lead</span>
        <button className="modal-close" onClick={onCancel}>✕</button>
      </div>
      <div className="modal-body">
        <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete <strong>{name}</strong>'s lead? This action cannot be undone.
        </p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Delete Lead</button>
      </div>
    </div>
  </div>
);

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const limit = 15;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getContactForms({ page, limit, search, status: statusFilter });
      setLeads(res.data.contactForms);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast('Failed to load leads.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContactForm(deleteTarget._id);
      toast('Lead deleted.', 'success');
      setDeleteTarget(null);
      fetchLeads();
    } catch {
      toast('Failed to delete lead.', 'error');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportLeads();
      const data = res.data.data;
      if (!data?.length) return toast('No data to export.', 'info');

      // Build CSV
      const headers = Object.keys(data[0]);
      const rows = data.map((row) =>
        headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Leads-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported ${data.length} leads as CSV.`, 'success');
    } catch {
      toast('Export failed.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="pagination">
        <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
        <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
        {pages.map((p) => (
          <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
        ))}
        <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
        <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
      </div>
    );
  };

  return (
    <Layout title="Contact Form Leads" subtitle={`${total} total submissions`}>
      {deleteTarget && (
        <ConfirmModal
          name={`${deleteTarget.firstName} ${deleteTarget.lastName}`}
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
              placeholder="Search by name, email, phone, country…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>

          <button className="btn btn-ghost" onClick={fetchLeads}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>

          <button className="btn btn-success" onClick={handleExport} disabled={exporting}>
            {exporting ? <span className="inline-spinner" /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
            Export CSV
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <h3>No leads found</h3>
            <p>{search || statusFilter ? 'Try adjusting your search or filters.' : 'Leads submitted from your website will appear here.'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Company Country</th>
                    <th>Hiring Country</th>
                    <th>Services</th>
                    <th>Industry</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr key={lead._id}>
                      <td className="td-muted">{(page - 1) * limit + i + 1}</td>
                      <td className="td-name" style={{ whiteSpace: 'nowrap' }}>{lead.firstName} {lead.lastName}</td>
                      <td className="td-email" style={{ fontSize: 12.5 }}>{lead.email}</td>
                      <td className="td-muted">{lead.fullPhone || lead.phone}</td>
                      <td>{lead.companyCountry}</td>
                      <td>{lead.hiringCountry}</td>
                      <td style={{ maxWidth: 160 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {(lead.services || []).map((s) => (
                            <span key={s} className="tag" style={{ fontSize: 11 }}>{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="td-muted">{lead.industry || '—'}</td>
                      <td><StatusBadge status={lead.status} /></td>
                      <td className="td-muted" style={{ whiteSpace: 'nowrap' }}>{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-icon"
                            title="View Details"
                            onClick={() => navigate(`/leads/${lead._id}`)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button
                            className="btn btn-outline btn-icon"
                            title="Edit Lead"
                            onClick={() => navigate(`/leads/${lead._id}/edit`)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            title="Delete Lead"
                            onClick={() => setDeleteTarget(lead)}
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
            {renderPagination()}
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} leads
            </p>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Leads;