import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getConsultation, deleteConsultation } from '../services/api';
import { useToast } from '../components/Toast';

const Field = ({ label, value, full }) => (
  <div className="detail-item" style={full ? { gridColumn: '1 / -1' } : {}}>
    <div className="detail-label">{label}</div>
    <div className={`detail-value ${!value ? 'empty' : ''}`}>{value || 'Not provided'}</div>
  </div>
);

const StatusColors = { New: '#0EA5E9', Contacted: '#8B5CF6', Converted: '#10B981' };

const ConsultationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const res = await getConsultation(id);
        setConsultation(res.data.consultation);
      } catch {
        toast('Consultation not found.', 'error');
        navigate('/consultations');
      } finally {
        setLoading(false);
      }
    };
    fetchConsultation();
  }, [id, navigate, toast]);

  const handleDelete = async () => {
    try {
      await deleteConsultation(id);
      toast('Consultation deleted.', 'success');
      navigate('/consultations');
    } catch {
      toast('Delete failed.', 'error');
    }
  };

  if (loading) return (
    <Layout title="Consultation Details">
      <div className="loader"><div className="spinner" /></div>
    </Layout>
  );

  if (!consultation) return null;

  const statusColor = StatusColors[consultation.status] || '#94A3B8';

  return (
    <Layout title={consultation.name} subtitle="Consultation Details">
      {showConfirm && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="modal-title">Delete Consultation</span>
              <button className="modal-close" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                Permanently delete this consultation request? This cannot be undone.
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
        <Link to="/consultations">Consultation Leads</Link>
        <span></span>
        <span>{consultation.name}</span>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/consultations')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back
        </button>
        <button className="btn btn-outline" onClick={() => navigate(`/consultations/${id}/edit`)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          Delete
        </button>
      </div>

      {/* Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px 20px', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Status</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 99, background: `${statusColor}18`, color: statusColor, fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
            {consultation.status}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Submitted</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(consultation.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Source</div>
          <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{consultation.sourceUrl || '—'}</div>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Contact Info */}
        <div className="card">
          <div className="card-header"><span className="card-title">Contact Information</span></div>
          <div className="detail-grid">
            <Field label="Name" value={consultation.name} />
            <Field label="Email Address" value={consultation.email} />
            <Field label="WhatsApp" value={`${consultation.countryCode || ''} ${consultation.whatsapp || ''}`.trim()} />
            <Field label="Form Heading" value={consultation.heading} />
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-header"><span className="card-title">Internal Notes</span></div>
          <p style={{ fontSize: 13.5, color: consultation.notes ? 'var(--gray-700)' : 'var(--gray-300)', fontStyle: consultation.notes ? 'normal' : 'italic', lineHeight: 1.6 }}>
            {consultation.notes || 'No notes added yet. Edit this consultation to add notes.'}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ConsultationDetail;
