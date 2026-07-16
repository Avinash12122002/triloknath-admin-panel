import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import Layout from '../components/Layout';
import { getStats, getConsultations } from '../services/api';
import { useToast } from '../components/Toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const LEAD_STATUS_COLORS = {
  New: '#0EA5E9',
  'In Progress': '#F59E0B',
  Contacted: '#8B5CF6',
  Converted: '#10B981',
  Closed: '#94A3B8',
};

const CONSULT_STATUS_COLORS = {
  New: '#0EA5E9',
  Contacted: '#8B5CF6',
  Converted: '#10B981',
};

const StatusDot = ({ status, palette }) => (
  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: palette[status] || '#94A3B8', marginRight: 6 }} />
);

// Build client-side aggregate stats for consultations (no backend stats endpoint for this collection)
const computeConsultationStats = (consultations) => {
  const list = consultations || [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);

  const total = list.length;
  const today = list.filter((c) => new Date(c.createdAt) >= todayStart).length;
  const week = list.filter((c) => new Date(c.createdAt) >= weekAgo).length;

  const statusMap = {};
  list.forEach((c) => {
    const s = c.status || 'New';
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const statusCounts = Object.entries(statusMap).map(([_id, count]) => ({ _id, count }));

  const monthMap = {};
  list.forEach((c) => {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const monthlyTrend = Object.entries(monthMap)
    .map(([key, count]) => {
      const [year, month] = key.split('-').map(Number);
      return { _id: { year, month }, count };
    })
    .sort((a, b) => (a._id.year - b._id.year) || (a._id.month - b._id.month));

  const recent = [...list]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return { total, today, week, statusCounts, monthlyTrend, recent };
};

// Merge two monthlyTrend arrays into a single sorted label set + two aligned data arrays
const mergeMonthlyTrends = (trendA, trendB) => {
  const keySet = new Map();
  const addAll = (trend) => {
    (trend || []).forEach((m) => {
      const key = `${m._id.year}-${m._id.month}`;
      if (!keySet.has(key)) keySet.set(key, { year: m._id.year, month: m._id.month });
    });
  };
  addAll(trendA);
  addAll(trendB);

  const sortedKeys = [...keySet.entries()].sort(
    (a, b) => (a[1].year - b[1].year) || (a[1].month - b[1].month)
  );

  const labels = sortedKeys.map(([, v]) => `${MONTH_NAMES[v.month - 1]} ${v.year}`);
  const lookup = (trend) => {
    const map = {};
    (trend || []).forEach((m) => { map[`${m._id.year}-${m._id.month}`] = m.count; });
    return sortedKeys.map(([key]) => map[key] || 0);
  };

  return { labels, dataA: lookup(trendA), dataB: lookup(trendB) };
};

const Dashboard = () => {
  const [leadStats, setLeadStats] = useState(null);
  const [consultStats, setConsultStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, consultRes] = await Promise.all([
          getStats(),
          getConsultations({}),
        ]);
        setLeadStats(statsRes.data.stats);
        setConsultStats(computeConsultationStats(consultRes.data.consultations));
      } catch {
        toast('Failed to load dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [toast]);

  const merged = useMemo(
    () => mergeMonthlyTrends(leadStats?.monthlyTrend, consultStats?.monthlyTrend),
    [leadStats, consultStats]
  );

  if (loading) return (
    <Layout title="Dashboard" subtitle="Welcome to your CRM">
      <div className="loader"><div className="spinner" /></div>
    </Layout>
  );

  const combinedBarData = {
    labels: merged.labels,
    datasets: [
      {
        label: 'Contact Form Leads',
        data: merged.dataA,
        backgroundColor: 'rgba(14,165,233,0.85)',
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: 'Consultation Leads',
        data: merged.dataB,
        backgroundColor: 'rgba(139,92,246,0.85)',
        borderRadius: 5,
        borderSkipped: false,
      },
    ],
  };

  const leadDoughnutData = {
    labels: (leadStats?.statusCounts || []).map((s) => s._id),
    datasets: [{
      data: (leadStats?.statusCounts || []).map((s) => s.count),
      backgroundColor: (leadStats?.statusCounts || []).map((s) => LEAD_STATUS_COLORS[s._id] || '#CBD5E1'),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const consultDoughnutData = {
    labels: (consultStats?.statusCounts || []).map((s) => s._id),
    datasets: [{
      data: (consultStats?.statusCounts || []).map((s) => s.count),
      backgroundColor: (consultStats?.statusCounts || []).map((s) => CONSULT_STATUS_COLORS[s._id] || '#CBD5E1'),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const barOpts = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10.5 } } },
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 10.5 }, precision: 0 }, beginAtZero: true },
    },
  };

  const donutOpts = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 }, boxWidth: 10 } },
    },
    cutout: '65%',
  };

  const convertedLeads = leadStats?.statusCounts?.find((s) => s._id === 'Converted')?.count ?? 0;
  const convertedConsults = consultStats?.statusCounts?.find((s) => s._id === 'Converted')?.count ?? 0;

  return (
    <Layout title="Dashboard" subtitle="Real-time overview of your contact form and consultation leads">

      {/* ── Contact Form Leads ── */}
      <div className="section-title">Contact Form Leads</div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div className="stat-label">Total Leads</div>
          <div className="stat-value">{leadStats?.totalLeads ?? 0}</div>
          <div className="stat-sub">All time submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className="stat-label">Today's Leads</div>
          <div className="stat-value">{leadStats?.todayLeads ?? 0}</div>
          <div className="stat-sub">New today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div className="stat-label">This Week</div>
          <div className="stat-value">{leadStats?.weekLeads ?? 0}</div>
          <div className="stat-sub">Last 7 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          <div className="stat-label">Converted</div>
          <div className="stat-value">{convertedLeads}</div>
          <div className="stat-sub">Successful leads</div>
        </div>
      </div>

      {/* ── Consultation Leads ── */}
      <div className="section-title">Consultation Leads</div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div className="stat-label">Total Consultations</div>
          <div className="stat-value">{consultStats?.total ?? 0}</div>
          <div className="stat-sub">All time submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className="stat-label">Today's Consultations</div>
          <div className="stat-value">{consultStats?.today ?? 0}</div>
          <div className="stat-sub">New today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div className="stat-label">This Week</div>
          <div className="stat-value">{consultStats?.week ?? 0}</div>
          <div className="stat-sub">Last 7 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          <div className="stat-label">Converted</div>
          <div className="stat-value">{convertedConsults}</div>
          <div className="stat-sub">Successful consultations</div>
        </div>
      </div>

      {/* ── Charts (3): combined trend + both status breakdowns ── */}
      <div className="section-title">Overview</div>
      <div className="chart-grid chart-grid-3">
        <div className="chart-card">
          <div className="chart-title">Monthly Trend (Combined)</div>
          {merged.labels.length > 0
            ? <Bar data={combinedBarData} options={barOpts} />
            : <div className="empty-state" style={{ padding: '30px 0' }}><p>No trend data yet</p></div>}
        </div>
        <div className="chart-card">
          <div className="chart-title">Contact Form Leads by Status</div>
          {(leadStats?.statusCounts?.length ?? 0) > 0
            ? <Doughnut data={leadDoughnutData} options={donutOpts} />
            : <div className="empty-state" style={{ padding: '30px 0' }}><p>No status data yet</p></div>}
        </div>
        <div className="chart-card">
          <div className="chart-title">Consultation Leads by Status</div>
          {(consultStats?.statusCounts?.length ?? 0) > 0
            ? <Doughnut data={consultDoughnutData} options={donutOpts} />
            : <div className="empty-state" style={{ padding: '30px 0' }}><p>No status data yet</p></div>}
        </div>
      </div>

      {/* ── Bottom Row: Contact Form specific breakdowns ── */}
      <div className="chart-grid">
        <div className="card" style={{ marginTop: 0 }}>
          <div className="card-header"><span className="card-title">Top Hiring Countries</span></div>
          {(leadStats?.topHiringCountries?.length ?? 0) > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leadStats.topHiringCountries.map((c) => {
                const pct = leadStats.totalLeads > 0 ? Math.round((c.count / leadStats.totalLeads) * 100) : 0;
                return (
                  <div key={c._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{c._id}</span>
                      <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{c.count} leads</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--sky)', borderRadius: 99, transition: 'width .5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="empty-state" style={{ padding: '20px 0' }}><p>No country data yet</p></div>}
        </div>

        <div className="card" style={{ marginTop: 0 }}>
          <div className="card-header"><span className="card-title">Services Requested</span></div>
          {(leadStats?.topServices?.length ?? 0) > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {leadStats.topServices.map((s) => (
                <span key={s._id} className="tag" style={{ fontSize: 12.5, padding: '4px 12px' }}>
                  {s._id} ({s.count})
                </span>
              ))}
            </div>
          ) : <div className="empty-state" style={{ padding: '20px 0' }}><p>No service data yet</p></div>}
        </div>
      </div>

      {/* ── Recent Contact Form Leads ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Recent Contact Form Leads</div>
            <div className="card-subtitle">Latest 5 submissions</div>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/leads')} style={{ fontSize: 12.5 }}>
            View All →
          </button>
        </div>
        {(leadStats?.recentLeads?.length ?? 0) > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company Country</th>
                  <th>Hiring Country</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {leadStats.recentLeads.map((lead) => (
                  <tr key={lead._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/leads/${lead._id}`)}>
                    <td className="td-name">{lead.firstName} {lead.lastName}</td>
                    <td className="td-email">{lead.email}</td>
                    <td>{lead.companyCountry}</td>
                    <td>{lead.hiringCountry}</td>
                    <td><span className={`status-badge status-${lead.status?.replace(' ', '')}`}><StatusDot status={lead.status} palette={LEAD_STATUS_COLORS} />{lead.status}</span></td>
                    <td className="td-muted">{new Date(lead.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <h3>No leads yet</h3>
            <p>Leads submitted from your website will appear here.</p>
          </div>
        )}
      </div>

      {/* ── Recent Consultation Leads ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Recent Consultation Leads</div>
            <div className="card-subtitle">Latest 5 submissions</div>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/consultations')} style={{ fontSize: 12.5 }}>
            View All →
          </button>
        </div>
        {(consultStats?.recent?.length ?? 0) > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  {/* <th>Heading</th> */}
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {consultStats.recent.map((c) => (
                  <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/consultations/${c._id}`)}>
                    <td className="td-name">{c.name}</td>
                    <td className="td-email">{c.email}</td>
                    <td className="td-muted">{c.countryCode} {c.whatsapp}</td>
                    {/* <td>{c.heading}</td> */}
                    <td><span className={`status-badge status-${(c.status || 'New').replace(' ', '')}`}><StatusDot status={c.status} palette={CONSULT_STATUS_COLORS} />{c.status || 'New'}</span></td>
                    <td className="td-muted">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <h3>No consultations yet</h3>
            <p>Consultation requests submitted from your website will appear here.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
