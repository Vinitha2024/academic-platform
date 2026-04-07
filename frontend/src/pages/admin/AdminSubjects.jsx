import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'AIDS', 'AIML', 'Food Tech'];

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', department: '', semester: 1, credits: 3, description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, staffRes] = await Promise.all([
        api.get('/admin/subjects'),
        api.get('/admin/users', { params: { role: 'staff' } })
      ]);
      setSubjects(subRes.data.subjects);
      setStaffList(staffRes.data.users);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal._id) {
        await api.put(`/admin/subjects/${modal._id}`, form);
        toast.success('Subject updated');
      } else {
        await api.post('/admin/subjects', form);
        toast.success('Subject created');
      }
      setModal(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffIds.length) return toast.error('Select at least one staff');
    try {
      const { data } = await api.post(`/admin/subjects/${assignModal._id}/assign-staff`, { staffIds: selectedStaffIds });
      toast.success(data.message);
      setAssignModal(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const removeStaff = async (subjectId, staffId) => {
    try {
      await api.delete(`/admin/subjects/${subjectId}/remove-staff/${staffId}`);
      toast.success('Staff removed');
      fetchData();
    } catch { toast.error('Error'); }
  };

  const openModal = (sub = null) => {
    setModal(sub || { new: true });
    setForm(sub ? { name: sub.name, code: sub.code, department: sub.department, semester: sub.semester, credits: sub.credits, description: sub.description || '' } : { name: '', code: '', department: '', semester: 1, credits: 3, description: '' });
  };

  return (
    <div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{modal._id ? 'Edit Subject' : 'New Subject'}</h2><button className="modal-close" onClick={() => setModal(null)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group"><label>Subject Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Data Structures" /></div>
                <div className="form-group"><label>Subject Code *</label><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required placeholder="CS301" disabled={!!modal._id} /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Department *</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} required>
                    <option value="">Select</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label>Semester *</label>
                    <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: +e.target.value }))}>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Credits *</label>
                    <select value={form.credits} onChange={e => setForm(f => ({ ...f, credits: +e.target.value }))}>
                      {[1,2,3,4,5,6].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Brief description..." /></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">{modal._id ? 'Update' : 'Create'} Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Assign Staff to {assignModal.name}</h2><button className="modal-close" onClick={() => setAssignModal(null)}>✕</button></div>
            <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: '16px' }}> Select staff to add:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
              {staffList.filter(s => !assignModal.assignedStaff?.some(a => a._id === s._id)).map(s => (
                <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: selectedStaffIds.includes(s._id) ? 'rgba(108,99,255,0.1)' : 'var(--surface2)', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${selectedStaffIds.includes(s._id) ? 'var(--accent)' : 'var(--border)'}` }}>
                  <input type="checkbox" checked={selectedStaffIds.includes(s._id)} onChange={e => setSelectedStaffIds(prev => e.target.checked ? [...prev, s._id] : prev.filter(id => id !== s._id))} style={{ width: 'auto' }} />
                  <div><div style={{ fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{s.department} · {s.employeeId}</div></div>
                </label>
              ))}
            </div>
            {assignModal.assignedStaff?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '8px', fontWeight: 600 }}>CURRENTLY ASSIGNED</div>
                {assignModal.assignedStaff.map(s => (
                  <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--surface2)', borderRadius: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.875rem' }}>{s.name}</span>
                    <button className="btn-danger btn-sm" onClick={() => { removeStaff(assignModal._id, s._id); setAssignModal(null); }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setAssignModal(null)}>Close</button>
              <button className="btn-primary" onClick={handleAssignStaff}>Assign Selected</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-between mb-6">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Subject Management</h1>
          <p>Manage subjects and staff assignments</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>+ Add Subject</button>
      </div>

      <div className="card">
        {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading...</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Subject</th><th>Code</th><th>Department</th><th>Sem/Credits</th><th>Assigned Staff</th><th>Actions</th></tr></thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s._id}>
                    <td><strong>{s.name}</strong></td>
                    <td><span className="badge badge-accent">{s.code}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{s.department}</td>
                    <td style={{ fontSize: '0.85rem' }}>Sem {s.semester} · {s.credits} cr</td>
                    <td>
                      {s.assignedStaff?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {s.assignedStaff.map(st => <span key={st._id} className="tag" style={{ fontSize: '0.75rem' }}>{st.name}</span>)}
                        </div>
                      ) : <span style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>None assigned</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-secondary btn-sm" onClick={() => openModal(s)}>Edit</button>
                        <button className="btn-secondary btn-sm" onClick={() => { setAssignModal(s); setSelectedStaffIds([]); }}>Staff</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {subjects.length === 0 && <div className="empty-state"><p>No subjects yet. Add one!</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}