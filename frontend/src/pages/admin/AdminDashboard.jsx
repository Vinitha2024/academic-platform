import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text2)' }}>Loading analytics...</div>;

  const { overview = {}, deptStats = [], attStats = [] } = data || {};
  const stats = [
    { label: 'Total Students', value: overview.totalStudents || 0,color: '#00d4aa' },
    { label: 'Active Students', value: overview.activeStudents || 0, color: '#06d6a0' },
    { label: 'Total Staff', value: overview.totalStaff || 0, color: '#6c63ff' },
    { label: 'Active Staff', value: overview.activeStaff || 0, color: '#5a52e0' },
    { label: 'Subjects', value: overview.totalSubjects || 0, color: '#ff6b9d' },
    { label: 'Announcements', value: overview.totalAnn || 0, color: '#ffbe0b' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and analytics</p>
      </div>

      <div className="grid-3" style={{ marginBottom: '28px' }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-head)' }}>Department-wise Students</h3>
          {deptStats.length === 0 ? <div className="empty-state"><p>No department data yet</p></div> : (
            deptStats.map(d => (
              <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 500 }}>{d._id || 'Unassigned'}</span>
                <span className="badge badge-accent">{d.count} students</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-head)' }}>Attendance Summary</h3>
          {attStats.length === 0 ? <div className="empty-state"><p>No attendance data yet</p></div> : (
            attStats.map(a => (
              <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{a._id}</span>
                <span className={`badge ${a._id === 'present' ? 'badge-success' : a._id === 'absent' ? 'badge-danger' : 'badge-warning'}`}>{a.count} records</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
