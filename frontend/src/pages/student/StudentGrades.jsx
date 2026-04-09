import { useState, useEffect } from 'react';
import api from '../../api/axios';

const GRADE_COLORS = { O:'#06d6a0', 'A+':'#00d4aa', A:'#6c63ff', 'B+':'#a09cff', B:'#ffbe0b', C:'#ff9a3c', D:'#ff6b6b', F:'#ff4d6d' };
const GRADE_POINTS = { O:10, 'A+':9, A:8, 'B+':7, B:6, C:5, D:4, F:0 };
const EXAM_LABELS  = { internal1:'Internal 1', internal2:'Internal 2', midterm:'Midterm', final:'Final', assignment:'Assignment', quiz:'Quiz' };

export default function StudentGrades() {
  const [grades,    setGrades]    = useState([]);
  const [gpa,       setGpa]       = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    api.get('/student/grades')
      .then(r => { setGrades(r.data.grades); setGpa(r.data.gpa); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  // Group by subject
  const bySubject = {};
  grades.forEach(g => {
    const id = g.subject?._id;
    if (!bySubject[id]) bySubject[id] = { subject: g.subject, grades: [] };
    bySubject[id].grades.push(g);
  });

  const examTypes = ['all', 'internal1', 'internal2', 'midterm', 'final', 'assignment', 'quiz'];
  const filtered  = activeTab === 'all' ? grades : grades.filter(g => g.examType === activeTab);

  return (
    <div>
      <div className="page-header">
        <h1>My Grades</h1>
        <p>Academic performance across all subjects</p>
      </div>

      {/* Summary cards */}
      <div className="grid-3 mb-6">
        <div className="stat-card">
          <div>
            <div className="stat-label">Subjects Graded</div>
            <div className="stat-value" style={{ color: '#6c63ff' }}>{Object.keys(bySubject).length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Entries</div>
            <div className="stat-value" style={{ color: '#00d4aa' }}>{grades.length}</div>
          </div>
        </div>
      </div>

      {/* Filter tabs by exam type */}
      <div className="tab-bar">
        {examTypes.map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'all' ? 'All' : EXAM_LABELS[t]}
            {t !== 'all' && ` (${grades.filter(g => g.examType === t).length})`}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0
          ? <div className="empty-state"><p>No grades {activeTab !== 'all' ? `for ${EXAM_LABELS[activeTab]}` : ''} yet</p></div>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Subject</th><th>Exam Type</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Year</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {filtered.map(g => {
                    const pct = ((g.marksObtained / g.totalMarks) * 100).toFixed(1);
                    return (
                      <tr key={g._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{g.subject?.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{g.subject?.code}</div>
                        </td>
                        <td>
                          <span className="badge badge-accent">{EXAM_LABELS[g.examType] || g.examType}</span>
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {g.marksObtained} <span style={{ color: 'var(--text2)' }}>/ {g.totalMarks}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="progress-bar-wrap" style={{ width: '60px' }}>
                              <div className="progress-bar" style={{ width: `${pct}%`, background: +pct >= 75 ? 'var(--success)' : +pct >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: GRADE_COLORS[g.grade] || '#fff' }}>{g.grade}</span>
                        </td>
                        <td style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>{g.academicYear}</td>
                        <td style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>{g.remarks || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}