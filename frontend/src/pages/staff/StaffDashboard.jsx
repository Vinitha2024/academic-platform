import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/staff/dashboard-stats'), api.get('/common/announcements')])
      .then(([s, a]) => { setStats(s.data); setAnnouncements(a.data.announcements.slice(0,3)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text2)' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user.name} 👋</h1>
        <p>Staff Dashboard · {user.department}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {[
          { label: 'My Subjects', value: stats?.mySubjectsCount || 0, icon: '📚', color: '#6c63ff' },
          { label: 'Attendance Marked', value: stats?.totalAttendanceMarked || 0, icon: '📅', color: '#00d4aa' },
          { label: 'Grades Entered', value: stats?.totalGradesEntered || 0, icon: '📝', color: '#ff6b9d' },
          { label: 'Assignments', value: stats?.totalAssignmentsCreated || 0, icon: '📋', color: '#ffbe0b' },
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
          {stats?.mySubjects?.length === 0 ? <div className="empty-state"><p>No subjects assigned yet</p></div> : (
            stats?.mySubjects?.map(s => (
              <div key={s._id} style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{s.name}</strong><span className="badge badge-accent">{s.code}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: '4px' }}>{s.department} · Sem {s.semester} · {s.credits} credits</div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-head)' }}>📢 Recent Announcements</h3>
          {announcements.length === 0 ? <div className="empty-state"><p>No announcements</p></div> : (
            announcements.map(a => (
              <div key={a._id} style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{a.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{a.content.slice(0, 80)}...</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}