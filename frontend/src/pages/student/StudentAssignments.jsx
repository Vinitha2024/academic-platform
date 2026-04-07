import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function StudentAssignments() {
  const [assignments,  setAssignments]  = useState([]);
  const [submitModal,  setSubmitModal]  = useState(null);
  const [submitText,   setSubmitText]   = useState('');
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [activeTab,    setActiveTab]    = useState('all');

  const fetchAssignments = () => {
    api.get('/student/assignments')
      .then(r => setAssignments(r.data.assignments))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitText.trim().length < 10) {
      return toast.error('Answer must be at least 10 characters');
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/student/assignments/${submitModal._id}/submit`, { submittedText: submitText });
      toast.success(data.message);
      setSubmitModal(null);
      setSubmitText('');
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting');
    } finally { setSubmitting(false); }
  };

  const daysLeft = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const tabs = [
    { key: 'all',       label: 'All',       list: assignments },
    { key: 'pending',   label: 'Pending',   list: assignments.filter(a => !a.isSubmitted && !a.isOverdue) },
    { key: 'submitted', label: 'Submitted', list: assignments.filter(a => a.isSubmitted) },
    { key: 'overdue',   label: 'Overdue',   list: assignments.filter(a => a.isOverdue) },
  ];

  const filtered = tabs.find(t => t.key === activeTab)?.list || assignments;

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      {/* Submit Modal */}
      {submitModal && (
        <div className="modal-overlay" onClick={() => { setSubmitModal(null); setSubmitText(''); }}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Submit Assignment</h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: '4px' }}>{submitModal.title}</div>
              </div>
              <button className="modal-close" onClick={() => { setSubmitModal(null); setSubmitText(''); }}>✕</button>
            </div>

            {/* Assignment details */}
            <div style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '6px', color: 'var(--text2)' }}><strong style={{ color: 'var(--text)' }}>Instructions:</strong> {submitModal.description}</div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: 'var(--text2)', marginTop: '8px' }}>
                <span>📅 Due: {new Date(submitModal.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>🏆 Marks: {submitModal.totalMarks}</span>
                <span>📚 {submitModal.subject?.name}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Your Answer * (minimum 10 characters)</label>
                <textarea
                  value={submitText}
                  onChange={e => setSubmitText(e.target.value)}
                  rows={8}
                  placeholder="Type your answer here..."
                  required
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '4px', textAlign: 'right' }}>
                  {submitText.length} characters
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setSubmitModal(null); setSubmitText(''); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : '📤 Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1>Assignments</h1>
        <p>View and submit your assignments</p>
      </div>

      {/* Stats row */}
      <div className="grid-4 mb-6">
        {[
          { label: 'Total',     value: assignments.length,                                       color: '#6c63ff' },
          { label: 'Pending',   value: assignments.filter(a => !a.isSubmitted && !a.isOverdue).length, color: '#ffbe0b' },
          { label: 'Submitted', value: assignments.filter(a => a.isSubmitted).length,            color: '#06d6a0' },
          { label: 'Overdue',   value: assignments.filter(a => a.isOverdue).length,              color: '#ff4d6d' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.key === 'overdue' ? '⚠️ ' : ''}{t.label} ({t.list.length})
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <div className="empty-state card"><div className="icon">📋</div><p>No {activeTab !== 'all' ? activeTab : ''} assignments</p></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(a => {
              const days = daysLeft(a.dueDate);
              const borderColor = a.isSubmitted ? 'var(--success)' : a.isOverdue ? 'var(--danger)' : days <= 2 ? 'var(--warning)' : 'var(--accent)';
              return (
                <div key={a._id} className="card" style={{ borderLeft: `3px solid ${borderColor}` }}>
                  <div className="flex-between" style={{ marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', marginBottom: '6px' }}>{a.title}</h3>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="badge badge-accent">{a.subject?.name}</span>
                        {a.isSubmitted
                          ? <span className="badge badge-success">✅ Submitted</span>
                          : a.isOverdue
                            ? <span className="badge badge-danger">⚠️ Overdue</span>
                            : <span className="badge badge-warning">⏳ {days} day{days !== 1 ? 's' : ''} left</span>
                        }
                        {a.mySubmission?.status === 'graded' && (
                          <span className="badge badge-success">✓ Graded</span>
                        )}
                      </div>
                    </div>
                    {!a.isSubmitted && !a.isOverdue && (
                      <button className="btn-primary btn-sm" onClick={() => { setSubmitModal(a); setSubmitText(''); }}>
                        📤 Submit
                      </button>
                    )}
                    {a.isOverdue && !a.isSubmitted && (
                      <button className="btn-secondary btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => { setSubmitModal(a); setSubmitText(''); }}>
                        Submit Late
                      </button>
                    )}
                  </div>

                  <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: '12px', lineHeight: 1.5 }}>
                    {a.description}
                  </p>

                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text2)', flexWrap: 'wrap' }}>
                    <span>📅 Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>🏆 {a.totalMarks} marks</span>
                    <span>👨‍🏫 {a.createdBy?.name}</span>
                  </div>

                  {/* Graded result */}
                  {a.mySubmission?.status === 'graded' && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.25)', borderRadius: '8px', fontSize: '0.875rem' }}>
                      <strong style={{ color: 'var(--success)' }}>✅ Graded:</strong>{' '}
                      <span>{a.mySubmission.marksObtained} / {a.totalMarks} marks</span>
                      {a.mySubmission.feedback && (
                        <span style={{ color: 'var(--text2)', marginLeft: '12px' }}>"{a.mySubmission.feedback}"</span>
                      )}
                    </div>
                  )}

                  {/* Submitted but not graded */}
                  {a.mySubmission && a.mySubmission.status !== 'graded' && (
                    <div style={{ marginTop: '12px', padding: '8px 14px', background: 'rgba(255,190,11,0.08)', border: '1px solid rgba(255,190,11,0.2)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--warning)' }}>
                      ⏳ Submitted on {new Date(a.mySubmission.submittedAt).toLocaleDateString()} — awaiting grade
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}