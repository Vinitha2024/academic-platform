import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function StudentGrades() {
  const [grades, setGrades] = useState([]);
  const [gpa, setGpa] = useState(0);

  useEffect(() => {
    api.get('/student/grades').then(r => { setGrades(r.data.grades); setGpa(r.data.gpa); });
  }, []);

  const gradeColors = { 'O': '#06d6a0', 'A+': '#00d4aa', 'A': '#6c63ff', 'B+': '#5a52e0', 'B': '#ffbe0b', 'C': '#ff9a3c', 'D': '#ff6b6b', 'F': '#ff4d6d' };

  return (
    <div>
      <div className="page-header"><h1>My Grades</h1><p>Academic performance overview</p></div>
      <div className="stat-card card mb-6" style={{ maxWidth: '300px' }}>
        <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.2)' }}>🎯</div>
        <div><div className="stat-label">Current GPA</div><div className="stat-value" style={{ color: 'var(--accent)' }}>{gpa}</div></div>
      </div>
      <div className="card">
        {grades.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Subject</th><th>Exam Type</th><th>Marks</th><th>Grade</th><th>Academic Year</th></tr></thead>
              <tbody>
                {grades.map(g => (
                  <tr key={g._id}>
                    <td><strong>{g.subject?.name}</strong><div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{g.subject?.code}</div></td>
                    <td style={{ textTransform: 'capitalize' }}>{g.examType}</td>
                    <td>{g.marksObtained}/{g.totalMarks} ({((g.marksObtained/g.totalMarks)*100).toFixed(0)}%)</td>
                    <td><span style={{ fontSize: '1.1rem', fontWeight: 800, color: gradeColors[g.grade] }}>{g.grade}</span></td>
                    <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{g.academicYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><div className="icon">📝</div><p>No grades yet</p></div>}
      </div>
    </div>
  );
}