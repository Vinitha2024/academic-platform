import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE','IT','ECE','Mechanical','Civil','Food Tech','AIDS','AIML'];

export default function StaffAssignments() {
  const [subjects, setSubjects]    = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showCreate,  setShowCreate]  = useState(false);
  const [viewSubs,  setViewSubs]  = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});
  const [loading, setLoading]  = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', subjectId: '', dueDate: '',
    totalMarks: 100, targetDepartment: '', targetSemester: 1,
  });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const fetchAssignments = () => api.get('/staff/assignments').then(r => setAssignments(r.data.assignments));

  useEffect(() => {
    api.get('/staff/my-subjects').then(r => setSubjects(r.data.subjects));
    fetchAssignments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (new Date(form.dueDate) < new Date()) {
      toast.error('Due date must be in the future');
      return;
    }
    setLoading(true);
    try {
      await api.post('/staff/assignments', { ...form, totalMarks: +form.totalMarks, targetSemester: +form.targetSemester });
      toast.success('Assignment created successfully');
      setShowCreate(false);
      setForm({ title:'', description:'', subjectId:'', dueDate:'', totalMarks:100, targetDepartment:'', targetSemester:1 });
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating assignment');
    } finally { setLoading(false); }
  };

  const openSubmissions = async (a) => {
    try {
      const { data } = await api.get(`/staff/assignments/${a._id}/submissions`);
      setViewSubs(data.assignment);
    } catch { toast.error('Error loading submissions'); }
  };

  const handleGrade = async (assignmentId, studentId, totalMarks) => {
    const key = `${assignmentId}_${studentId}`;
    const { marks, feedback } = gradeInputs[key] || {};
    if (!marks && marks !== 0) return toast.error('Enter marks to grade');
    if (+marks > totalMarks) return toast.error(`Marks cannot exceed ${totalMarks}`);
    if (+marks < 0) return toast.error('Marks cannot be negative');
    try {
      await api.put(`/staff/assignments/${assignmentId}/grade-submission`, { studentId, marksObtained: +marks, feedback: feedback || '' });
      toast.success('Submission graded');
      const { data } = await api.get(`/staff/assignments/${assignmentId}/submissions`);
      setViewSubs(data.assignment);
    } catch (err) { toast.error(err.response?.data?.message || 'Error grading'); }
  };

  const setGradeInput = (key, field, value) => {
    setGradeInputs(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const isOverdue = (dueDate) => new Date() > new Date(dueDate);
  const daysLeft  = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div>
      {/* ── Create Assignment Modal ── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Create Assignment</h2><button className="modal-close" onClick={() => setShowCreate(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Assignment Title *</label>
                <input value={form.title} onChange={e => set('title',e.target.value)} required placeholder="e.g. Unit 2 Assignment — Sorting Algorithms" />
              </div>
              <div className="form-group">
                <label>Description / Instructions *</label>
                <textarea value={form.description} onChange={e => set('description',e.target.value)} required rows={4} placeholder="Describe what students need to do..." />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Subject *</label>
                  <select value={form.subjectId} onChange={e => set('subjectId',e.target.value)} required>
                    <option value="">Select subject</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input type="date" value={form.dueDate} onChange={e => set('dueDate',e.target.value)} required min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Target Department *</label>
                  <select value={form.targetDepartment} onChange={e => set('targetDepartment',e.target.value)} required>
                    <option value="">Select dept</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Semester *</label>
                  <select value={form.targetSemester} onChange={e => set('targetSemester',+e.target.value)}>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Total Marks *</label>
                <input type="number" min="1" max="1000" value={form.totalMarks} onChange={e => set('totalMarks',e.target.value)} required />
              </div>
              <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Assignment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Submissions Modal ── */}
      {viewSubs && (
        <div className="modal-overlay" onClick={() => setViewSubs(null)}>
          <div className="modal" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{viewSubs.title}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: '4px' }}>
                  {viewSubs.submissions?.length || 0} submission(s) · {viewSubs.totalMarks} total marks
                </div>
              </div>
              <button className="modal-close" onClick={() => setViewSubs(null)}>✕</button>
            </div>

            {!viewSubs.submissions?.length
              ? <div className="empty-state"><p>No submissions yet</p></div>
              : viewSubs.submissions.map(sub => {
                  const key = `${viewSubs._id}_${sub.student?._id}`;
                  return (
                    <div key={sub._id} style={{ padding:'14px 16px', background:'var(--surface2)', borderRadius:'10px', marginBottom:'10px', border:`1px solid ${sub.status==='graded'?'rgba(6,214,160,0.3)':sub.status==='late'?'rgba(255,77,109,0.2)':'var(--border)'}` }}>
                      <div className="flex-between" style={{ marginBottom: '8px' }}>
                        <div>
                          <strong>{sub.student?.name}</strong>
                          <span style={{ color: 'var(--text2)', fontSize: '0.82rem', marginLeft: '8px' }}>{sub.student?.rollNumber}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`badge ${sub.status==='graded'?'badge-success':sub.status==='late'?'badge-danger':'badge-warning'}`}>
                            {sub.status}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg2)', padding: '10px 12px', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '10px', maxHeight: '100px', overflowY: 'auto', lineHeight: 1.6 }}>
                        {sub.submittedText}
                      </div>

                      {sub.status === 'graded'
                        ? (
                          <div style={{ padding: '8px 12px', background: 'rgba(6,214,160,0.08)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--success)' }}>
                             Grade: <strong>{sub.marksObtained}/{viewSubs.totalMarks}</strong>
                            {sub.feedback && <span style={{ color: 'var(--text2)', marginLeft: '12px' }}>"{sub.feedback}"</span>}
                          </div>
                        )
                        : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="number" min="0" max={viewSubs.totalMarks}
                              placeholder={`Marks (0-${viewSubs.totalMarks})`}
                              style={{ width: '160px' }}
                              value={gradeInputs[key]?.marks || ''}
                              onChange={e => setGradeInput(key, 'marks', e.target.value)}
                            />
                            <input
                              placeholder="Feedback (optional)"
                              style={{ flex: 1, minWidth: '150px' }}
                              value={gradeInputs[key]?.feedback || ''}
                              onChange={e => setGradeInput(key, 'feedback', e.target.value)}
                            />
                            <button className="btn-success btn-sm" onClick={() => handleGrade(viewSubs._id, sub.student?._id, viewSubs.totalMarks)}>
                              Grade
                            </button>
                          </div>
                        )
                      }
                    </div>
                  );
                })
            }
          </div>
        </div>
      )}

      {/* ── Page ── */}
      <div className="flex-between mb-6">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Assignments</h1>
          <p>Create assignments and grade student submissions</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Create Assignment</button>
      </div>

      {assignments.length === 0
        ? <div className="empty-state card"><p>No assignments yet. Create your first one!</p></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignments.map(a => {
              const over = isOverdue(a.dueDate);
              const days = daysLeft(a.dueDate);
              const gradedCount = a.submissions?.filter(s => s.status === 'graded').length || 0;
              const totalSubs   = a.submissions?.length || 0;
              return (
                <div key={a._id} className="card" style={{ borderLeft: `3px solid ${over ? 'var(--danger)' : 'var(--accent)'}` }}>
                  <div className="flex-between" style={{ marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.05rem', marginBottom: '6px' }}>{a.title}</h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-accent">{a.subject?.name}</span>
                        <span className="badge badge-success">{a.targetDepartment} · Sem {a.targetSemester}</span>
                        {over
                          ? <span className="badge badge-danger"> Overdue</span>
                          : <span className="badge badge-warning"> {days} day{days !== 1 ? 's' : ''} left</span>
                        }
                      </div>
                    </div>
                    <button className="btn-secondary btn-sm" onClick={() => openSubmissions(a)}>
                       Submissions ({totalSubs})
                    </button>
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: '12px', lineHeight: 1.5 }}>
                    {a.description?.slice(0, 140)}{a.description?.length > 140 ? '...' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text2)', flexWrap: 'wrap' }}>
                    <span> Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                    <span> {a.totalMarks} marks</span>
                    <span> {gradedCount}/{totalSubs} graded</span>
                    <span> {new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}