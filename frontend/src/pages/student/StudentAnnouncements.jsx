import { useState, useEffect } from 'react';
import api from '../../api/axios';

const PRIORITY_COLORS = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
const PRIORITY_BADGES = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-success' };

export default function StudentAnnouncements() {
  const [announcements, setAnn]     = useState([]);
  const [loading,       setLoading] = useState(true);
  const [filter,        setFilter]  = useState('all');

  useEffect(() => {
    api.get('/student/announcements')
      .then(r => setAnn(r.data.announcements))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? announcements : announcements.filter(a => a.priority === filter);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Announcements</h1>
        <p>Stay updated with latest news from admin and faculty</p>
      </div>

      {/* Filter bar */}
      <div className="tab-bar">
        {[
          { key: 'all',    label: `All (${announcements.length})` },
          { key: 'high',   label: ` High (${announcements.filter(a=>a.priority==='high').length})` },
          { key: 'medium', label: ` Medium (${announcements.filter(a=>a.priority==='medium').length})` },
          { key: 'low',    label: ` Low (${announcements.filter(a=>a.priority==='low').length})` },
        ].map(f => (
          <button key={f.key} className={`tab-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <div className="empty-state card"><div className="icon">📢</div><p>No announcements yet</p></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(a => (
              <div key={a._id} className="card" style={{ borderLeft: `3px solid ${PRIORITY_COLORS[a.priority] || 'var(--accent)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1rem' }}>{a.title}</h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className={`badge ${PRIORITY_BADGES[a.priority]}`} style={{ textTransform: 'capitalize' }}>
                      {a.priority} priority
                    </span>
                    <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>
                      {a.targetAudience === 'all' ? ' Everyone' : a.targetAudience === 'students' ? '🎓 Students' : '👨‍🏫 Staff'}
                    </span>
                  </div>
                </div>
                <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '14px' }}>
                  {a.content}
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text2)' }}>
                  <span>
                    Posted by <strong style={{ color: 'var(--text)' }}>{a.postedBy?.name}</strong>
                    <span style={{ marginLeft: '4px', textTransform: 'capitalize' }}>({a.postedBy?.role})</span>
                  </span>
                  <span>{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}