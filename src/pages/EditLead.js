import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getContactForm, updateContactForm } from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_OPTIONS = ['New', 'In Progress', 'Contacted', 'Converted', 'Closed'];
const SERVICE_OPTIONS = ['Recruitment', 'Contractor Management', 'Global Mobility', 'Partnership', 'Not Sure Yet'];

const EditLead = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', fullPhone: '',
    companyCountry: '', hiringCountry: '', services: [],
    headcount: '', industry: '', message: '', status: 'New', notes: '', assignedTo: '',
  });

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await getContactForm(id);
        const l = res.data.contactForm;
        setForm({
          firstName: l.firstName || '',
          lastName: l.lastName || '',
          email: l.email || '',
          phone: l.phone || '',
          fullPhone: l.fullPhone || '',
          companyCountry: l.companyCountry || '',
          hiringCountry: l.hiringCountry || '',
          services: l.services || [],
          headcount: l.headcount || '',
          industry: l.industry || '',
          message: l.message || '',
          status: l.status || 'New',
          notes: l.notes || '',
          assignedTo: l.assignedTo || '',
        });
      } catch {
        toast('Lead not found.', 'error');
        navigate('/leads');
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleService = (s) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(s)
        ? prev.services.filter((x) => x !== s)
        : [...prev.services, s],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      return toast('First name, last name, and email are required.', 'error');
    }
    setSaving(true);
    try {
      await updateContactForm(id, form);
      toast('Lead updated successfully.', 'success');
      navigate(`/leads/${id}`);
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Layout title="Edit Lead">
      <div className="loader"><div className="spinner" /></div>
    </Layout>
  );

  return (
    <Layout title="Edit Lead" subtitle="Update lead information and status">
      <div className="breadcrumb" style={{ marginBottom: 16 }}>
        <Link to="/leads">
  Contact Form Leads
</Link>
        <span></span>
        <Link to={`/leads/${id}`}>
  Lead Details
</Link>
        <span></span>
        <span>Edit</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Contact Info */}
          <div className="card">
            <div className="card-header"><span className="card-title">Contact Information</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">First Name <span>*</span></label>
                <input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span>*</span></label>
                <input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Email <span>*</span></label>
                <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Full Phone</label>
                <input className="form-control" name="fullPhone" value={form.fullPhone} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Status & Assignment */}
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
                <label className="form-label">Assigned To</label>
                <input className="form-control" name="assignedTo" value={form.assignedTo} onChange={handleChange} placeholder="Team member name" />
              </div>
              <div className="form-group">
                <label className="form-label">Internal Notes</label>
                <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} rows={4} placeholder="Add internal notes about this lead…" style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Hiring Details */}
          <div className="card">
            <div className="card-header"><span className="card-title">Hiring Details</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Company Country</label>
                <input className="form-control" name="companyCountry" value={form.companyCountry} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Hiring Country</label>
                <input className="form-control" name="hiringCountry" value={form.hiringCountry} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Headcount</label>
                <select className="form-control" name="headcount" value={form.headcount} onChange={handleChange}>
                  <option value="">Select</option>
                  {['Not sure yet','1-5','6-10','11-20','21-50','51-100','101-500','500+'].map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <select className="form-control" name="industry" value={form.industry} onChange={handleChange}>
                  <option value="">Select</option>
                  {['Information Technology','Healthcare','Construction','Manufacturing','Finance & Banking','Education','Hospitality','Engineering','Logistics','Sales & Marketing','Retail','Oil & Gas','Automotive','Telecommunications','Other'].map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="card">
            <div className="card-header"><span className="card-title">Services Requested</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SERVICE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 99,
                    border: '1.5px solid',
                    borderColor: form.services.includes(s) ? 'var(--sky)' : 'var(--gray-200)',
                    background: form.services.includes(s) ? 'var(--sky)' : 'white',
                    color: form.services.includes(s) ? 'white' : 'var(--gray-700)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'var(--font)',
                    transition: 'all .15s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header"><span className="card-title">Message</span></div>
            <textarea
              className="form-control"
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={4}
              placeholder="Client's message or requirements…"
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`/leads/${id}`)}>Cancel</button>
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

export default EditLead;