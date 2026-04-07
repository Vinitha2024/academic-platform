import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/student/dashboard-stats'),
      api.get('/student/my-subjects'),
      api.get('/student/announcements'),
    ]).then(([s, sub, ann]) => {
      setStats(s.data);
      setSubjects(sub.data.subjects);
      setAnnouncements(ann.data.announcements.slice(0, 4));
    });
  }, []);

  const attPct = +(stats?.attendancePercentage || 0);

  return (
    <div>
      <div className="page-header">
        <h1>Hello, {user.name} 👋</h1>
        <p>{user.department} · Semester {user.semester} · {user.rollNumber}</p>
      </div>

      {attPct > 0 && attPct < 75 && (
        <div className="alert alert-error mb-6">
          ⚠️ Your attendance is <strong>{attPct}%</strong> — below the required 75%. Please attend classes regularly.
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {[
          { label: 'My Subjects', value: stats?.totalSubjects || 0, icon: '📚', color: '#6c63ff' },
          { label: 'Attendance', value: `${attPct}%`, icon: '📅', color: attPct >= 75 ? '#06d6a0' : '#ff4d6d' },
          { label: 'Pending Tasks', value: stats?.pendingAssignments || 0, icon: '📋', color: '#ffbe0b' },
          { label: 'Grades Received', value: stats?.totalGrades || 0, icon: '📝', color: '#ff6b9d' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}22` }}>{s.icon}</div>
            <div><div className="stat-label">{s.label}</div><div className="stat-value" style={{ color: s.color }}>{s.value}</div></div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-head)' }}>📚 My Subjects</h3>
          {!subjects.length
            ? <div className="empty-state" style={{ padding: '24px' }}><p>No subjects assigned for your semester yet</p></div>
            : subjects.map(s => (
              <div key={s._id} style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px' }}>
                <div className="flex-between">
                  <strong style={{ fontSize: '0.9rem' }}>{s.name}</strong>
                  <span className="badge badge-accent">{s.code}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: '4px' }}>
                  {s.credits} credits ·
                  {s.assignedStaff?.length ? ` ${s.assignedStaff.map(st => st.name).join(', ')}` : ' No staff assigned'}
                </div>
              </div>
            ))
          }
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-head)' }}>📢 Announcements</h3>
          {!announcements.length
            ? <div className="empty-state" style={{ padding: '24px' }}><p>No announcements</p></div>
            : announcements.map(a => (
              <div key={a._id} style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px', borderLeft: `2px solid ${a.priority === 'high' ? 'var(--danger)' : a.priority === 'medium' ? 'var(--warning)' : 'var(--success)'}` }}>
                <strong style={{ fontSize: '0.875rem' }}>{a.title}</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: '4px' }}>{a.content.slice(0, 80)}...</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: '6px' }}>{a.postedBy?.name}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}