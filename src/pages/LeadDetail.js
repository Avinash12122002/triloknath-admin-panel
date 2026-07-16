import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getContactForm, deleteContactForm } from '../services/api';
import { useToast } from '../components/Toast';

const Field = ({ label, value, full }) => (
  <div className="detail-item" style={full ? { gridColumn: '1 / -1' } : {}}>
    <div className="detail-label">{label}</div>
    <div className={`detail-value ${!value ? 'empty' : ''}`}>{value || 'Not provided'}</div>
  </div>
);

const StatusColors = { New: '#0EA5E9', 'In Progress': '#F59E0B', Contacted: '#8B5CF6', Converted: '#10B981', Closed: '#94A3B8' };

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await getContactForm(id);
        setLead(res.data.contactForm);
      } catch {
        toast('Lead not found.', 'error');
        navigate('/leads');
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id, navigate, toast]);

  const handleDelete = async () => {
    try {
      await deleteContactForm(id);
      toast('Lead deleted.', 'success');
      navigate('/leads');
    } catch {
      toast('Delete failed.', 'error');
    }
  };

  if (loading) return (
    <Layout title="Lead Details">
      <div className="loader"><div className="spinner" /></div>
    </Layout>
  );

  if (!lead) return null;

  const statusColor = StatusColors[lead.status] || '#94A3B8';

  return (
    <Layout title={`${lead.firstName} ${lead.lastName}`} subtitle="Lead Details">
      {showConfirm && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="modal-title">Delete Lead</span>
              <button className="modal-close" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                Permanently delete this lead? This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
     <div className="breadcrumb" style={{ marginBottom: 16 }}>
  <Link to="/leads">
    Contact Form Leads
  </Link>

  <span></span>

  <span>
    {lead.firstName} {lead.lastName}
  </span>
</div>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/leads')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back
        </button>
        <button className="btn btn-outline" onClick={() => navigate(`/leads/${id}/edit`)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit Lead
        </button>
        <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          Delete
        </button>
      </div>

      {/* Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px 20px', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Lead Status</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 99, background: `${statusColor}18`, color: statusColor, fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
            {lead.status}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Submitted</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(lead.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Source</div>
          <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{lead.source || 'website'}</div>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Contact Info */}
        <div className="card">
          <div className="card-header"><span className="card-title">Contact Information</span></div>
          <div className="detail-grid">
            <Field label="First Name" value={lead.firstName} />
            <Field label="Last Name" value={lead.lastName} />
            <Field label="Email Address" value={lead.email} />
            <Field label="Phone" value={lead.fullPhone || lead.phone} />
          </div>
        </div>

        {/* Hiring Info */}
        <div className="card">
          <div className="card-header"><span className="card-title">Hiring Details</span></div>
          <div className="detail-grid">
            <Field label="Company Country" value={lead.companyCountry} />
            <Field label="Hiring Country" value={lead.hiringCountry} />
            <Field label="Headcount" value={lead.headcount} />
            <Field label="Industry" value={lead.industry} />
          </div>
        </div>

        {/* Services */}
        <div className="card">
          <div className="card-header"><span className="card-title">Services Requested</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(lead.services || []).map((s) => (
              <span key={s} className="tag" style={{ fontSize: 13, padding: '5px 14px' }}>{s}</span>
            ))}
            {(!lead.services || lead.services.length === 0) && <span style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: 14 }}>None selected</span>}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-header"><span className="card-title">Internal Notes</span></div>
          <p style={{ fontSize: 13.5, color: lead.notes ? 'var(--gray-700)' : 'var(--gray-300)', fontStyle: lead.notes ? 'normal' : 'italic', lineHeight: 1.6 }}>
            {lead.notes || 'No notes added yet. Edit this lead to add notes.'}
          </p>
        </div>

        {/* Message */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><span className="card-title">Message from Client</span></div>
          <p style={{ fontSize: 13.5, color: lead.message ? 'var(--gray-700)' : 'var(--gray-300)', fontStyle: lead.message ? 'normal' : 'italic', lineHeight: 1.7 }}>
            {lead.message || 'No message provided.'}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default LeadDetail;