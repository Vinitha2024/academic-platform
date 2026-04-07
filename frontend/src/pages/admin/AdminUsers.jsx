import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Mathematics', 'Physics'];

function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user?._id;
  const [form, setForm] = useState(user || { name: '', email: '', password: '', role: 'student', department: '', semester: '', rollNumber: '', employeeId: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        const { data } = await api.put(`/admin/users/${user._id}`, form);
        toast.success(data.message);
      } else {
        const { data } = await api.post('/admin/users', form);
        toast.success(data.message);
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error saving user');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit User' : 'Add New User'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={isEdit} placeholder="john@uni.edu" />
            </div>
          </div>
          {!isEdit && (
            <div className="grid-2">
              <div className="form-group">
                <label>Password *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Min 6 chars" />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
          )}
          <div className="grid-2">
            <div className="form-group">
              <label>Department *</label>
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} required>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
            </div>
          </div>
          {(form.role === 'student' || isEdit && user.role === 'student') && (
            <div className="grid-2">
              <div className="form-group">
                <label>Roll Number *</label>
                <input value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} disabled={isEdit} placeholder="CS2024001" />
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            </div>
          )}
          {(form.role === 'staff' || isEdit && user.role === 'staff') && (
            <div className="form-group">
              <label>Employee ID *</label>
              <input value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} disabled={isEdit} placeholder="EMP001" />
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ userId, onClose }) {
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (pw.length < 6) return toast.error('Min 6 characters');
    setLoading(true);
    try {
      await api.post(`/admin/users/${userId}/reset-password`, { newPassword: pw });
      toast.success('Password reset');
      onClose();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>Reset Password</h2><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="form-group"><label>New Password</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Min 6 chars" /></div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleReset} disabled={loading}>{loading ? '...' : 'Reset'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [resetId, setResetId] = useState(null);
  const [filters, setFilters] = useState({ role: '', department: '', search: '' });
  const [tab, setTab] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.department) params.department = filters.department;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [filters]);

  const toggleActive = async (user) => {
    try {
      if (user.isActive) await api.delete(`/admin/users/${user._id}`);
      else await api.put(`/admin/users/${user._id}/activate`);
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const filteredByTab = users.filter(u => {
    if (tab === 'all') return true;
    return u.role === tab;
  });

  return (
    <div>
      {modal && <UserModal user={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchUsers(); }} />}
      {resetId && <ResetPasswordModal userId={resetId} onClose={() => setResetId(null)} />}

      <div className="flex-between mb-6">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>User Management</h1>
          <p>Manage students, staff accounts</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('new')}>+ Add User</button>
      </div>

      <div className="card mb-4">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input placeholder="Search by name, email, ID..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} style={{ flex: 1, minWidth: '200px' }} />
          <select value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))} style={{ width: '180px' }}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="tab-bar">
        {['all','student','staff'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t} {t === 'all' ? `(${users.length})` : `(${users.filter(u => u.role === t).length})`}</button>
        ))}
      </div>

      <div className="card">
        {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Dept / ID</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredByTab.map(u => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td><span className={`badge ${u.role === 'student' ? 'badge-success' : u.role === 'staff' ? 'badge-accent' : 'badge-warning'}`}>{u.role}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div>{u.department}</div>
                      <div style={{ color: 'var(--text2)' }}>{u.rollNumber || u.employeeId || ''}{u.semester ? ` · Sem ${u.semester}` : ''}</div>
                    </td>
                    <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-secondary btn-sm" onClick={() => setModal(u)}>Edit</button>
                        <button className="btn-secondary btn-sm" onClick={() => setResetId(u._id)}>🔑</button>
                        <button className={`btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredByTab.length === 0 && <div className="empty-state"><div className="icon">👥</div><p>No users found</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}