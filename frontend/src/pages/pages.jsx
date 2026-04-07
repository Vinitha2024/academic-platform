import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', address: user.address || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [tab, setTab] = useState('profile');

  const handleProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const roleColor = { admin: '#ff6b9d', staff: '#6c63ff', student: '#00d4aa' };

  return (
    <div>
      <div className="page-header"><h1>My Profile</h1><p>Manage your account settings</p></div>

      <div className="card mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `${roleColor[user.role]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: `3px solid ${roleColor[user.role]}44`, flexShrink: 0 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem' }}>{user.name}</h2>
            <div style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{user.email}</div>
            <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
              <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>{user.role}</span>
              {user.department && <span className="badge badge-success">{user.department}</span>}
              {user.rollNumber && <span className="badge badge-warning">Roll: {user.rollNumber}</span>}
              {user.employeeId && <span className="badge badge-warning">ID: {user.employeeId}</span>}
              {user.semester && <span className="badge badge-accent">Sem {user.semester}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>👤 Profile Info</button>
        <button className={`tab-btn ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>🔑 Change Password</button>
      </div>

      {tab === 'profile' && (
        <div className="card">
          <form onSubmit={handleProfile}>
            <div className="grid-2">
              <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="form-group"><label>Email </label><input value={user.email} disabled style={{ opacity: 0.6 }} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" /></div>
              <div className="form-group"><label>Department</label><input value={user.department || ''} disabled style={{ opacity: 0.6 }} /></div>
            </div>
            <div className="form-group"><label>Address</label><textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={3} placeholder="Your address" /></div>
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <form onSubmit={handlePassword}>
            <div className="form-group"><label>Current Password</label><input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required /></div>
            <div className="form-group"><label>New Password</label><input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required placeholder="Min 6 chars" /></div>
            <div className="form-group"><label>Confirm New Password</label><input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required /></div>
            <button type="submit" className="btn-primary">Change Password</button>
          </form>
        </div>
      )}
    </div>
  );
}