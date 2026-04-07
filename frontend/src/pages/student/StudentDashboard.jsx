import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [announcements, setAnn] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student/dashboard-stats'),
      api.get('/student/announcements'),
      api.get('/student/my-subjects'),
    ])
    .then(([s, a, sub]) => {
      setStats(s.data);
      setAnn(a.data.announcements.slice(0, 4));
      setSubjects(sub.data.subjects);
    })
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const attPct = parseFloat(stats?.attendancePercentage || 0);
  const attColor = attPct >= 75 ? 'var(--success)' : attPct >= 60 ? 'var(--warning)' : 'var(--danger)';

  const cards = [
    { label: 'My Subjects',    value: stats?.totalSubjects      || 0, color: '#6c63ff' },
    { label: 'Attendance',     value: `${attPct}%`, color: attColor  },
    { label: 'Grades Entered', value: stats?.totalGrades        || 0, color: '#ff6b9d' },
    { label: 'Pending Tasks',  value: stats?.pendingAssignments || 0, color: '#ffbe0b' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Hello, {user.name} </h1>
        <p>{user.department} · Semester {user.semester} · Roll No: {user.rollNumber}</p>
      </div>

      {/* Low attendance warning */}
      {attPct > 0 && attPct < 75 && (
        <div className="alert alert-error mb-6">
          Your overall attendance is <strong>{attPct}%</strong> — below the 75% minimum. Please attend classes regularly.
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div>
              <div className="stat-label">{c.label}</div>
              <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* My subjects */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>My Subjects</h3>
          {subjects.length === 0
            ? <div className="empty-state" style={{ padding: '24px' }}><p>No subjects for your department & semester yet</p></div>
            : subjects.map(s => (
              <div key={s._id} style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: '3px' }}>
                      {s.credits} credits
                      {s.assignedStaff?.length > 0 && ` · ${s.assignedStaff.map(st => st.name).join(', ')}`}
                    </div>
                  </div>
                  <span className="badge badge-accent">{s.code}</span>
                </div>
              </div>
            ))
          }
        </div>

        {/* Announcements */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}> Latest Announcements</h3>
          {announcements.length === 0
            ? <div className="empty-state" style={{ padding: '24px' }}><p>No announcements yet</p></div>
            : announcements.map(a => (
              <div key={a._id} style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px', borderLeft: `2px solid ${a.priority === 'high' ? 'var(--danger)' : a.priority === 'medium' ? 'var(--warning)' : 'var(--success)'}` }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '3px' }}>{a.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{a.content.slice(0, 80)}{a.content.length > 80 ? '...' : ''}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '5px' }}>
                  {a.postedBy?.name} · {new Date(a.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}