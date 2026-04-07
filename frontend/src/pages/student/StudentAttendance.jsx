import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function StudentAttendance() {
  const [attendance,      setAttendance]      = useState([]);
  const [summaryBySubject, setSummary]        = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading,         setLoading]         = useState(true);

  useEffect(() => {
    api.get('/student/attendance')
      .then(r => {
        setAttendance(r.data.attendance);
        setSummary(r.data.summaryBySubject);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter records by selected subject
  const filtered = selectedSubject
    ? attendance.filter(a => a.subject?._id === selectedSubject)
    : attendance;

  const overallPresent = attendance.filter(a => a.status === 'present').length;
  const overallPct     = attendance.length > 0
    ? ((overallPresent / attendance.length) * 100).toFixed(1)
    : 0;

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Attendance</h1>
        <p>Subject-wise attendance tracking</p>
      </div>

      {/* Overall badge */}
      <div className="card mb-6" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${+overallPct >= 75 ? 'rgba(6,214,160,0.15)' : 'rgba(255,77,109,0.15)'}`, border: `3px solid ${+overallPct >= 75 ? 'var(--success)' : 'var(--danger)'}` }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-head)', color: +overallPct >= 75 ? 'var(--success)' : 'var(--danger)' }}>{overallPct}%</span>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.1rem' }}>Overall Attendance</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: '4px' }}>
            {overallPresent} present out of {attendance.length} total classes
          </div>
          {+overallPct < 75 && (
            <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '4px' }}>
              ⚠️ Below 75% minimum requirement
            </div>
          )}
        </div>
      </div>

      {/* Per-subject summary cards */}
      {summaryBySubject.length > 0 && (
        <div className="grid-3 mb-6">
          {summaryBySubject.map(s => (
            <div
              key={s.subject._id}
              className="card"
              style={{ cursor: 'pointer', borderColor: selectedSubject === s.subject._id ? 'var(--accent)' : 'var(--border)', transition: 'all 0.15s' }}
              onClick={() => setSelectedSubject(prev => prev === s.subject._id ? '' : s.subject._id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.subject.name}</div>
                <span className="badge badge-accent">{s.subject.code}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-head)', color: +s.percentage >= 75 ? 'var(--success)' : 'var(--danger)', marginBottom: '8px' }}>
                {s.percentage}%
              </div>
              <div className="progress-bar-wrap" style={{ marginBottom: '10px' }}>
                <div className="progress-bar" style={{ width: `${s.percentage}%`, background: +s.percentage >= 75 ? 'var(--success)' : 'var(--danger)' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--success)' }}>✓ {s.present}</span>
                <span style={{ color: 'var(--danger)' }}>✗ {s.absent}</span>
                <span style={{ color: 'var(--warning)' }}>~ {s.late}</span>
                <span style={{ color: 'var(--text2)' }}>/ {s.total} total</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Records table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Attendance Records {selectedSubject && '(filtered)'}</h3>
          {selectedSubject && (
            <button className="btn-secondary btn-sm" onClick={() => setSelectedSubject('')}>Clear filter</button>
          )}
        </div>

        {filtered.length === 0
          ? <div className="empty-state"><div className="icon">📅</div><p>No attendance records yet</p></div>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Subject</th><th>Date</th><th>Status</th><th>Marked By</th></tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{a.subject?.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{a.subject?.code}</div>
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
                        {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span className={`badge ${a.status === 'present' ? 'badge-success' : a.status === 'absent' ? 'badge-danger' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                          {a.status === 'present' ? '✓' : a.status === 'absent' ? '✗' : '~'} {a.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{a.markedBy?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}