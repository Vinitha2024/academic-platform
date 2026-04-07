import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  present: { bg: '#06d6a015', border: 'rgba(6,214,160,0.3)', btn: 'var(--success)', text: '#000' },
  absent:  { bg: '#ff4d6d15', border: 'rgba(255,77,109,0.3)', btn: 'var(--danger)',  text: '#fff' },
  late:    { bg: '#ffbe0b15', border: 'rgba(255,190,11,0.3)',  btn: 'var(--warning)', text: '#000' },
};

export default function StaffAttendance() {
  const [subjects,        setSubjects]        = useState([]);
  const [students,        setStudents]        = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date,            setDate]            = useState(new Date().toISOString().split('T')[0]);
  const [attendance,      setAttendance]      = useState({});
  const [summary,         setSummary]         = useState([]);
  const [tab,             setTab]             = useState('mark');
  const [loading,         setLoading]         = useState(false);
  const [fetching,        setFetching]        = useState(false);

  useEffect(() => {
    api.get('/staff/my-subjects').then(r => setSubjects(r.data.subjects));
  }, []);

  useEffect(() => {
    if (!selectedSubject) { setStudents([]); setSummary([]); return; }
    const sub = subjects.find(s => s._id === selectedSubject);
    if (!sub) return;
    setFetching(true);
    Promise.all([
      api.get('/staff/students', { params: { department: sub.department, semester: sub.semester } }),
      api.get(`/staff/attendance/summary/${selectedSubject}`),
    ])
    .then(async ([sRes, sumRes]) => {
      let stList = sRes.data.students;
      // Fallback: if no students matched dept+semester, load all students
      if (stList.length === 0) {
        const fallback = await api.get('/staff/students', { params: { all: 'true' } });
        stList = fallback.data.students;
        if (stList.length > 0) {
          toast(`Showing all students — none found for ${sub.department} Sem ${sub.semester}`, { icon: 'ℹ️' });
        }
      }
      setStudents(stList);
      const init = {};
      stList.forEach(s => init[s._id] = 'present');
      setAttendance(init);
      setSummary(sumRes.data.summary);
    })
    .catch(() => toast.error('Error loading students'))
    .finally(() => setFetching(false));
  }, [selectedSubject]);

  const setAll = (status) => {
    const updated = {};
    students.forEach(s => updated[s._id] = status);
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    if (!selectedSubject) return toast.error('Please select a subject');
    if (!students.length) return toast.error('No students to mark');
    setLoading(true);
    try {
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
      const { data } = await api.post('/staff/attendance', { subjectId: selectedSubject, date, attendanceData });
      toast.success(data.message);
      // Refresh summary
      const sumRes = await api.get(`/staff/attendance/summary/${selectedSubject}`);
      setSummary(sumRes.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving attendance');
    } finally { setLoading(false); }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount  = Object.values(attendance).filter(v => v === 'absent').length;
  const lateCount    = Object.values(attendance).filter(v => v === 'late').length;

  return (
    <div>
      <div className="page-header">
        <h1>Attendance Management</h1>
        <p>Mark and track subject-wise attendance</p>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'mark' ? 'active' : ''}`} onClick={() => setTab('mark')}>📅 Mark Attendance</button>
        <button className={`tab-btn ${tab === 'summary' ? 'active' : ''}`} onClick={() => setTab('summary')}>📊 Attendance Summary</button>
      </div>

      {/* Subject + Date selector — shared */}
      <div className="card mb-4">
        <div className="grid-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Select Subject</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">Choose a subject...</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.code}) · Sem {s.semester}</option>
              ))}
            </select>
          </div>
          {tab === 'mark' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
          )}
        </div>
      </div>

      {/* ── Mark Tab ── */}
      {tab === 'mark' && (
        <>
          {fetching && <div className="loading-center"><div className="spinner" /></div>}

          {!fetching && selectedSubject && students.length > 0 && (
            <div className="card">
              {/* Summary bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', padding: '12px 16px', background: 'var(--surface2)', borderRadius: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>Quick Mark:</span>
                <button className="btn-success btn-sm" onClick={() => setAll('present')}>✓ All Present</button>
                <button className="btn-danger btn-sm" onClick={() => setAll('absent')}>✗ All Absent</button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--success)' }}>✓ {presentCount} Present</span>
                  <span style={{ color: 'var(--danger)' }}>✗ {absentCount} Absent</span>
                  <span style={{ color: 'var(--warning)' }}>~ {lateCount} Late</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                {students.map((s, i) => {
                  const status = attendance[s._id] || 'present';
                  const style  = STATUS_STYLE[status];
                  return (
                    <div
                      key={s._id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: style.bg, borderRadius: '8px', border: `1px solid ${style.border}`, transition: 'all 0.15s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: 'var(--text2)', fontSize: '0.78rem', width: '24px' }}>{i + 1}.</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{s.rollNumber}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {['present', 'absent', 'late'].map(st => (
                          <button
                            key={st}
                            onClick={() => setAttendance(prev => ({ ...prev, [s._id]: st }))}
                            style={{
                              padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                              background: status === st ? STATUS_STYLE[st].btn : 'var(--surface2)',
                              color: status === st ? STATUS_STYLE[st].text : 'var(--text2)',
                              border: `1px solid ${status === st ? 'transparent' : 'var(--border)'}`,
                              transition: 'all 0.15s',
                            }}
                          >
                            {st === 'present' ? '✓' : st === 'absent' ? '✗' : '~'} {st.charAt(0).toUpperCase() + st.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}>
                {loading ? 'Saving...' : ` Save Attendance for ${new Date(date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}`}
              </button>
            </div>
          )}

          {!fetching && selectedSubject && students.length === 0 && (
            <div className="empty-state card"><div className="icon">🎓</div><p>No students found for this subject's department and semester</p></div>
          )}

          {!selectedSubject && (
            <div className="empty-state card"><div className="icon">📅</div><p>Select a subject to start marking attendance</p></div>
          )}
        </>
      )}

      {/* ── Summary Tab ── */}
      {tab === 'summary' && (
        <div className="card">
          {fetching && <div className="loading-center"><div className="spinner" /></div>}
          {!fetching && summary.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Student</th><th>Roll No</th><th>Total</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th></tr>
                </thead>
                <tbody>
                  {summary
                    .sort((a, b) => b.percentage - a.percentage)
                    .map((r, i) => (
                      <tr key={r._id}>
                        <td style={{ color: 'var(--text2)' }}>{i + 1}</td>
                        <td><strong>{r.student?.name}</strong></td>
                        <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{r.student?.rollNumber}</td>
                        <td>{r.total}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{r.present}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{r.absent}</td>
                        <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{r.late}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="progress-bar-wrap" style={{ width: '80px' }}>
                              <div className="progress-bar" style={{ width: `${r.percentage}%`, background: r.percentage >= 75 ? 'var(--success)' : 'var(--danger)' }} />
                            </div>
                            <span className={`badge ${r.percentage >= 75 ? 'badge-success' : 'badge-danger'}`}>
                              {r.percentage?.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
          {!fetching && selectedSubject && summary.length === 0 && (
            <div className="empty-state"><div className="icon">📊</div><p>No attendance records for this subject yet</p></div>
          )}
          {!selectedSubject && (
            <div className="empty-state"><div className="icon">📊</div><p>Select a subject to view attendance summary</p></div>
          )}
        </div>
      )}
    </div>
  );
}