import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getConsultation, updateConsultation } from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_OPTIONS = ['New', 'Contacted', 'Converted'];

const EditConsultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', whatsapp: '', countryCode: '', heading: '', status: 'New', notes: '',
  });

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const res = await getConsultation(id);
        const c = res.data.consultation;
        setForm({
          name: c.name || '',
          email: c.email || '',
          whatsapp: c.whatsapp || '',
          countryCode: c.countryCode || '',
          heading: c.heading || '',
          status: c.status || 'New',
          notes: c.notes || '',
        });
      } catch {
        toast('Consultation not found.', 'error');
        navigate('/consultations');
      } finally {
        setLoading(false);
      }
    };
    fetchConsultation();
  }, [id, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.whatsapp) {
      return toast('Name, email, and WhatsApp number are required.', 'error');
    }
    setSaving(true);
    try {
      await updateConsultation(id, form);
      toast('Consultation updated successfully.', 'success');
      navigate(`/consultations/${id}`);
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Layout title="Edit Consultation">
      <div className="loader"><div className="spinner" /></div>
    </Layout>
  );

  return (
    <Layout title="Edit Consultation" subtitle="Update consultation information and status">
      <div className="breadcrumb" style={{ marginBottom: 16 }}>
        <Link to="/consultations">Consultation Leads</Link>
        <span></span>
        <Link to={`/consultations/${id}`}>Details</Link>
        <span></span>
        <span>Edit</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Contact Info */}
          <div className="card">
            <div className="card-header"><span className="card-title">Contact Information</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Name <span>*</span></label>
                <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Email <span>*</span></label>
                <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Country Code</label>
                <input className="form-control" name="countryCode" value={form.countryCode} onChange={handleChange} placeholder="+61" />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp <span>*</span></label>
                <input className="form-control" name="whatsapp" value={form.whatsapp} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="card">
            <div className="card-header"><span className="card-title">Lead Management</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Form Heading</label>
                <input className="form-control" name="heading" value={form.heading} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Internal Notes</label>
                <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} rows={4} placeholder="Add internal notes about this consultation…" style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`/consultations/${id}`)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="inline-spinner" /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            )}
            Save Changes
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default EditConsultation;
