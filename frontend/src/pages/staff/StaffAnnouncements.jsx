import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function StaffAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', targetAudience: 'students' });

  const fetch = () => api.get('/common/announcements').then(r => setAnnouncements(r.data.announcements));
  useEffect(() => { fetch(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff/announcements', form);
      toast.success('Announcement posted');
      setShowForm(false);
      setForm({ title: '', content: '', targetAudience: 'students' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Post Announcement</h2><button className="modal-close" onClick={() => setShowForm(false)}>✕</button></div>
            <form onSubmit={handlePost}>
              <div className="form-group"><label>Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
              <div className="form-group"><label>Content *</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required rows={4} /></div>
              <div className="form-group"><label>Target</label>
                <select value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}>
                  <option value="students">Students</option><option value="all">All</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="flex-between mb-6">
        <div className="page-header" style={{ marginBottom: 0 }}><h1>Announcements</h1></div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Post</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {announcements.map(a => (
          <div key={a._id} className="card">
            <h3 style={{ marginBottom: '8px' }}>{a.title}</h3>
            <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '12px' }}>{a.content}</p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>By {a.postedBy?.name} · {new Date(a.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
        {announcements.length === 0 && <div className="empty-state card"><div className="icon">📢</div><p>No announcements</p></div>}
      </div>
    </div>
  );
}