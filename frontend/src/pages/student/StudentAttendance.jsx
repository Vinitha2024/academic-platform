import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    api.get('/student/attendance').then(r => { setAttendance(r.data.attendance); setSummary(r.data.summaryBySubject); });
  }, []);

  return (
    <div>
      <div className="page-header"><h1>My Attendance</h1><p>Track your attendance across all subjects</p></div>

      <div className="grid-3 mb-6">
        {summary.map(s => (
          <div key={s.subject._id} className="card">
            <div className="flex-between mb-4"><strong>{s.subject.name}</strong><span className="badge badge-accent">{s.subject.code}</span></div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: +s.percentage >= 75 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-head)' }}>{s.percentage}%</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--success)' }}>✓ {s.present} Present</span>
              <span style={{ color: 'var(--danger)' }}>✗ {s.absent} Absent</span>
              <span style={{ color: 'var(--warning)' }}>~ {s.late} Late</span>
            </div>
            {+s.percentage < 75 && <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--danger)' }}>⚠️ Below minimum requirement</div>}
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Attendance Records</h3>
        {attendance.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Subject</th><th>Date</th><th>Status</th><th>Marked By</th></tr></thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a._id}>
                    <td>{a.subject?.name}</td>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td><span className={`badge ${a.status === 'present' ? 'badge-success' : a.status === 'absent' ? 'badge-danger' : 'badge-warning'}`}>{a.status}</span></td>
                    <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{a.markedBy?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><div className="icon">📅</div><p>No attendance records yet</p></div>}
      </div>
    </div>
  );
}