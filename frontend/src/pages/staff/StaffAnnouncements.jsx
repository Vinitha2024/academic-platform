import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
const PRIORITY_BADGES = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-success' };
const AUDIENCE_ICONS  = { all: '🌐', students: '🎓', staff: '👨‍🏫' };

export default function StaffAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [form, setForm] = useState({ title: '', content: '', targetAudience: 'students', priority: 'medium' });

  const fetchAnnouncements = () => {
    setLoading(true);
    api.get('/common/announcements')
      .then(r => setAnnouncements(r.data.announcements))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff/announcements', form);
      toast.success('Announcement posted successfully');
      setShowForm(false);
      setForm({ title: '', content: '', targetAudience: 'students', priority: 'medium' });
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error posting announcement');
    }
  };

  return (
    <div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Post Announcement</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handlePost}>
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Announcement title..." />
              </div>
              <div className="form-group">
                <label>Content *</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required rows={4} placeholder="Write your announcement here..." />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Target Audience</label>
                  <select value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}>
                    <option value="students">Students Only</option>
                    <option value="all">Everyone</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-between mb-6">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Announcements</h1>
          <p>All platform announcements</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Post Announcement</button>
      </div>

      {loading
        ? <div className="loading-center"><div className="spinner" /></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {announcements.map(a => (
              <div key={a._id} className="card" style={{ borderLeft: `3px solid ${PRIORITY_COLORS[a.priority] || 'var(--accent)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1rem' }}>{a.title}</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className={`badge ${PRIORITY_BADGES[a.priority] || 'badge-accent'}`} style={{ textTransform: 'capitalize' }}>
                      {a.priority || 'medium'}
                    </span>
                    <span className="badge badge-accent">
                      {AUDIENCE_ICONS[a.targetAudience]} {a.targetAudience === 'all' ? 'Everyone' : a.targetAudience}
                    </span>
                  </div>
                </div>
                <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '12px' }}>{a.content}</p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text2)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span>By <strong style={{ color: 'var(--text)' }}>{a.postedBy?.name || 'Unknown'}</strong> ({a.postedBy?.role})</span>
                  <span>{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="empty-state card">
                <p>No announcements yet. Be the first to post one!</p>
              </div>
            )}
          </div>
        )
      }
    </div>
  );
}