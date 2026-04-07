import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', targetAudience: 'all', priority: 'medium' });

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await api.get('/admin/announcements'); setAnnouncements(data.announcements); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/announcements', form);
      toast.success('Announcement posted');
      setShowModal(false);
      setForm({ title: '', content: '', targetAudience: 'all', priority: 'medium' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await api.delete(`/admin/announcements/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Error'); }
  };

  const priorityColors = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-success' };

  return (
    <div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>New Announcement</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Announcement title" /></div>
              <div className="form-group"><label>Content *</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required rows={4} placeholder="Announcement details..." /></div>
              <div className="grid-2">
                <div className="form-group"><label>Target Audience</label>
                  <select value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}>
                    <option value="all">All</option><option value="students">Students Only</option><option value="staff">Staff Only</option>
                  </select>
                </div>
                <div className="form-group"><label>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-between mb-6">
        <div className="page-header" style={{ marginBottom: 0 }}><h1>Announcements</h1><p>Manage platform-wide announcements</p></div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Post Announcement</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.map(a => (
            <div key={a._id} className="card" style={{ borderLeft: `3px solid ${a.priority === 'high' ? 'var(--danger)' : a.priority === 'medium' ? 'var(--warning)' : 'var(--success)'}` }}>
              <div className="flex-between mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontFamily: 'var(--font-head)' }}>{a.title}</h3>
                  <span className={`badge ${priorityColors[a.priority]}`}>{a.priority}</span>
                  <span className="badge badge-accent"> {a.targetAudience}</span>
                </div>
                <button className="btn-danger btn-sm" onClick={() => handleDelete(a._id)}>Delete</button>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '12px' }}>{a.content}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                Posted by <strong>{a.postedBy?.name}</strong> · {new Date(a.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          {announcements.length === 0 && <div className="empty-state card"><p>No announcements yet</p></div>}
        </div>
      )}
    </div>
  );
}