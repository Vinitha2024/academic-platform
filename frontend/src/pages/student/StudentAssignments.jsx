import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [submitModal, setSubmitModal] = useState(null);
  const [text, setText] = useState('');

  const fetch = () => api.get('/student/assignments').then(r => setAssignments(r.data.assignments));
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/student/assignments/${submitModal._id}/submit`, { submittedText: text });
      toast.success(data.message);
      setSubmitModal(null);
      setText('');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      {submitModal && (
        <div className="modal-overlay" onClick={() => setSubmitModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Submit: {submitModal.title}</h2><button className="modal-close" onClick={() => setSubmitModal(null)}>✕</button></div>
            <div style={{ marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text2)' }}>{submitModal.description}</div>
            <div style={{ padding: '10px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              Due: {new Date(submitModal.dueDate).toLocaleDateString()} · {submitModal.totalMarks} marks
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Your Answer (min 10 characters)</label><textarea value={text} onChange={e => setText(e.target.value)} required rows={6} placeholder="Type your answer here..." /></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setSubmitModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header"><h1>Assignments</h1><p>View and submit your assignments</p></div>

      {assignments.length === 0 ? <div className="empty-state card"><div className="icon">📋</div><p>No assignments yet</p></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {assignments.map(a => (
            <div key={a._id} className="card" style={{ borderLeft: `3px solid ${a.isSubmitted ? 'var(--success)' : a.isOverdue ? 'var(--danger)' : 'var(--accent)'}` }}>
              <div className="flex-between mb-4">
                <div>
                  <h3 style={{ fontFamily: 'var(--font-head)', marginBottom: '6px' }}>{a.title}</h3>
                  <span className="badge badge-accent">{a.subject?.name}</span>
                </div>
                <div>
                  {a.isSubmitted ? <span className="badge badge-success">✅ Submitted</span> :
                    a.isOverdue ? <span className="badge badge-danger">⚠️ Overdue</span> :
                    <button className="btn-primary btn-sm" onClick={() => setSubmitModal(a)}>Submit</button>}
                </div>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: '12px' }}>{a.description}</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text2)' }}>
                <span>📅 Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                <span>🏆 Marks: {a.totalMarks}</span>
                <span>👨‍🏫 By: {a.createdBy?.name}</span>
              </div>
              {a.mySubmission?.status === 'graded' && (
                <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(6,214,160,0.1)', borderRadius: '8px', fontSize: '0.875rem' }}>
                  ✅ Graded: {a.mySubmission.marksObtained}/{a.totalMarks} marks{a.mySubmission.feedback ? ` · "${a.mySubmission.feedback}"` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}