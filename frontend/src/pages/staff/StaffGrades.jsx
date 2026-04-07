import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const EXAM_TYPES    = ['internal1','internal2','midterm','final','assignment','quiz'];
const GRADE_COLORS  = { O:'#06d6a0', 'A+':'#00d4aa', A:'#6c63ff', 'B+':'#a09cff', B:'#ffbe0b', C:'#ff9a3c', D:'#ff6b6b', F:'#ff4d6d' };
const CURRENT_YEAR  = `${new Date().getFullYear()}-${new Date().getFullYear()+1}`;

export default function StaffGrades() {
  const [subjects,        setSubjects]        = useState([]);
  const [students,        setStudents]        = useState([]);
  const [grades,          setGrades]          = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showForm,        setShowForm]        = useState(false);
  const [fetching,        setFetching]        = useState(false);
  const [form, setForm] = useState({
    studentId: '', subjectId: '', examType: 'internal1',
    marksObtained: '', totalMarks: '100',
    semester: '', academicYear: CURRENT_YEAR, remarks: '',
  });
  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  useEffect(() => {
    api.get('/staff/my-subjects').then(r => setSubjects(r.data.subjects));
  }, []);

  useEffect(() => {
    if (!selectedSubject) { setStudents([]); setGrades([]); return; }
    const sub = subjects.find(s => s._id === selectedSubject);
    if (!sub) return;
    setFetching(true);
    Promise.all([
      // First try filtered by subject's dept+semester
      api.get('/staff/students', { params: { department: sub.department, semester: sub.semester } }),
      api.get('/staff/grades', { params: { subjectId: selectedSubject } }),
    ])
    .then(async ([sRes, gRes]) => {
      let studentList = sRes.data.students;

      // If no students match the subject's dept/semester, fall back to ALL students
      // This handles cases where student dept/semester may differ from subject
      if (studentList.length === 0) {
        const fallback = await api.get('/staff/students', { params: { all: 'true' } });
        studentList = fallback.data.students;
        if (studentList.length > 0) {
          toast(`Showing all students — no students found for ${sub.department} Sem ${sub.semester}`, { icon: 'ℹ️' });
        }
      }

      setStudents(studentList);
      setGrades(gRes.data.grades);
      set('subjectId', selectedSubject);
      set('semester', String(sub.semester));
    })
    .catch(() => toast.error('Error loading students'))
    .finally(() => setFetching(false));
  }, [selectedSubject]);

  const refreshGrades = () => {
    if (!selectedSubject) return;
    api.get('/staff/grades', { params: { subjectId: selectedSubject } }).then(r => setGrades(r.data.grades));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (+form.marksObtained > +form.totalMarks) return toast.error('Marks obtained cannot exceed total marks');
    if (!form.studentId) return toast.error('Select a student');
    try {
      await api.post('/staff/grades', {
        ...form,
        marksObtained: +form.marksObtained,
        totalMarks:    +form.totalMarks,
        semester:      +form.semester,
      });
      toast.success('Grade saved successfully');
      setShowForm(false);
      refreshGrades();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving grade');
    }
  };

  // Group grades by student for display
  const gradesByStudent = {};
  grades.forEach(g => {
    const id = g.student?._id;
    if (!gradesByStudent[id]) gradesByStudent[id] = { student: g.student, grades: [] };
    gradesByStudent[id].grades.push(g);
  });

  return (
    <div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Enter Grade</h2><button className="modal-close" onClick={() => setShowForm(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Student *</label>
                <select value={form.studentId} onChange={e => set('studentId', e.target.value)} required>
                  <option value="">Select student...</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.name} — {s.rollNumber}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Exam Type *</label>
                  <select value={form.examType} onChange={e => set('examType', e.target.value)}>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Academic Year *</label>
                  <input value={form.academicYear} onChange={e => set('academicYear', e.target.value)} required placeholder="2024-2025" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Marks Obtained *</label>
                  <input type="number" min="0" max={form.totalMarks} value={form.marksObtained} onChange={e => set('marksObtained', e.target.value)} required placeholder="e.g. 85" />
                </div>
                <div className="form-group">
                  <label>Total Marks *</label>
                  <input type="number" min="1" value={form.totalMarks} onChange={e => set('totalMarks', e.target.value)} required placeholder="e.g. 100" />
                </div>
              </div>
              {form.marksObtained && form.totalMarks && (
                <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text2)' }}>
                  Percentage: <strong style={{ color: 'var(--text)' }}>{((form.marksObtained/form.totalMarks)*100).toFixed(1)}%</strong>
                </div>
              )}
              <div className="form-group">
                <label>Remarks (optional)</label>
                <input value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Any additional notes..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-between mb-6">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Grades Management</h1>
          <p>Enter and track student academic performance</p>
        </div>
        {selectedSubject && (
          <button className="btn-primary" onClick={() => { setShowForm(true); set('studentId', ''); set('examType', 'internal1'); set('marksObtained', ''); }}>
            + Enter Grade
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Select Subject to View/Enter Grades</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            <option value="">Choose a subject...</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code}) · Sem {s.semester}</option>)}
          </select>
        </div>
      </div>

      {fetching && <div className="loading-center"><div className="spinner" /></div>}

      {!fetching && selectedSubject && (
        <div className="card">
          {grades.length === 0
            ? <div className="empty-state"><p>No grades entered for this subject yet</p></div>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Roll No</th><th>Exam Type</th><th>Marks</th><th>%</th><th>Grade</th><th>Year</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {grades.map(g => (
                      <tr key={g._id}>
                        <td><strong>{g.student?.name}</strong></td>
                        <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{g.student?.rollNumber}</td>
                        <td><span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>{g.examType}</span></td>
                        <td>{g.marksObtained} / {g.totalMarks}</td>
                        <td style={{ color: 'var(--text2)' }}>{((g.marksObtained/g.totalMarks)*100).toFixed(0)}%</td>
                        <td>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: GRADE_COLORS[g.grade] || '#fff' }}>{g.grade}</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{g.academicYear}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text2)', maxWidth: '120px' }}>{g.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {!selectedSubject && (
        <div className="empty-state card"><p>Select a subject to view and enter grades</p></div>
      )}
    </div>
  );
}