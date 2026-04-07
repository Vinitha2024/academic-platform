import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function StaffAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'',content:'',targetAudience:'students',priority:'medium' });

  const fetch = () => api.get('/common/announcements').then(r => setAnnouncements(r.data.announcements));
  useEffect(() => { fetch(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff/announcements', form);
      toast.success('Announcement posted');
      setShowForm(false);
      setForm({ title:'',content:'',targetAudience:'students',priority:'medium' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.message||'Error'); }
  };

  const priorityColor = { high:'badge-danger', medium:'badge-warning', low:'badge-success' };

  return (
    <div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Post Announcement</h2><button className="modal-close" onClick={() => setShowForm(false)}>✕</button></div>
            <form onSubmit={handlePost}>
              <div className="form-group"><label>Title *</label><input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} required placeholder="Announcement title" /></div>
              <div className="form-group"><label>Content *</label><textarea value={form.content} onChange={e => setForm(f=>({...f,content:e.target.value}))} required rows={4} placeholder="Write your announcement..." /></div>
              <div className="grid-2">
                <div className="form-group"><label>Target Audience</label>
                  <select value={form.targetAudience} onChange={e => setForm(f=>({...f,targetAudience:e.target.value}))}>
                    <option value="students">Students Only</option>
                    <option value="all">Everyone</option>
                  </select>
                </div>
                <div className="form-group"><label>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'flex',gap:'12px',justifyContent:'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="flex-between mb-6">
        <div className="page-header" style={{ marginBottom:0 }}><h1>Announcements</h1><p>View and post announcements for students</p></div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Post Announcement</button>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
        {announcements.map(a => (
          <div key={a._id} className="card" style={{ borderLeft:`3px solid ${a.priority==='high'?'var(--danger)':a.priority==='medium'?'var(--warning)':'var(--success)'}` }}>
            <div className="flex-between mb-4">
              <h3 style={{ fontFamily:'var(--font-head)' }}>{a.title}</h3>
              <div style={{ display:'flex',gap:'8px' }}>
                <span className={`badge ${priorityColor[a.priority]}`}>{a.priority}</span>
                <span className="badge badge-accent">{a.targetAudience}</span>
              </div>
            </div>
            <p style={{ color:'var(--text2)',fontSize:'0.9rem',marginBottom:'12px' }}>{a.content}</p>
            <div style={{ fontSize:'0.8rem',color:'var(--text2)' }}>
              Posted by <strong>{a.postedBy?.name}</strong> ({a.postedBy?.role}) · {new Date(a.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
        {!announcements.length && <div className="empty-state card"><div className="icon">📢</div><p>No announcements yet</p></div>}
      </div>
    </div>
  );
}