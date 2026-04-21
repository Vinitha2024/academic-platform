import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab,    setTab]    = useState('info');
  const [saving, setSaving] = useState(false);

  const [info, setInfo] = useState({
    name:        user.name        || '',
    phone:       user.phone       || '',
    address:     user.address     || '',
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
  });

  const [pw, setPw] = useState({
    currentPassword: '',
    newPassword:     '',
    confirm:         '',
  });

  const handleInfoSave = async (e) => {
    e.preventDefault();
    if (info.name.trim().length < 2) return toast.error('Name must be at least 2 characters');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', info);
      updateUser(data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match');
    if (pw.newPassword.length < 6)     return toast.error('New password must be at least 6 characters');
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pw.currentPassword,
        newPassword:     pw.newPassword,
      });
      toast.success('Password changed successfully');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error changing password');
    } finally { setSaving(false); }
  };

  const roleColors  = { admin: '#ff6b9d', staff: '#6c63ff', student: '#00d4aa' };
  const roleLabels  = { admin: 'Administrator', staff: 'Faculty', student: 'Student' };
  const color       = roleColors[user.role] || '#6c63ff';

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and security settings</p>
      </div>

      {/* Profile card */}
      <div className="card mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{
            width: '76px', height: '76px', borderRadius: '50%',
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-head)',
            color, border: `3px solid ${color}40`, flexShrink: 0,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', marginBottom: '4px' }}>{user.name}</h2>
            <div style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: '8px' }}>{user.email}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: `${color}18`, color }}>{roleLabels[user.role]}</span>
              {user.department && <span className="badge badge-accent">{user.department}</span>}
              {user.semester   && <span className="badge badge-success">Semester {user.semester}</span>}
              {user.rollNumber && <span className="badge badge-warning">Roll: {user.rollNumber}</span>}
              {user.employeeId && <span className="badge badge-warning">ID: {user.employeeId}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
           Personal Info
        </button>
        <button className={`tab-btn ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
           Change Password
        </button>
      </div>

      {/* Personal Info Tab */}
      {tab === 'info' && (
        <div className="card" style={{ maxWidth: '560px' }}>
          <form onSubmit={handleInfoSave}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                value={info.name}
                onChange={e => setInfo(f => ({...f, name: e.target.value}))}
                required
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label>Email Address (cannot change)</label>
              <input value={user.email} disabled style={{ opacity: 0.55 }} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  value={info.phone}
                  onChange={e => setInfo(f => ({...f, phone: e.target.value}))}
                  placeholder="+91 xxxxxxxxxx"
                />
              </div>
              
            </div>

            {/* Read-only role fields */}
            <div style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ color: 'var(--text2)', marginBottom: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic Info (read-only)</div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {user.department && <span> {user.department}</span>}
                {user.semester   && <span> Semester {user.semester}</span>}
                {user.rollNumber && <span> Roll: {user.rollNumber}</span>}
                {user.employeeId && <span> ID: {user.employeeId}</span>}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Change Password Tab */}
      {tab === 'password' && (
        <div className="card" style={{ maxWidth: '440px' }}>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password *</label>
              <input
                type="password"
                value={pw.currentPassword}
                onChange={e => setPw(f => ({...f, currentPassword: e.target.value}))}
                required
                placeholder="Enter current password"
              />
            </div>
            <div className="form-group">
              <label>New Password * (min 6 characters)</label>
              <input
                type="password"
                value={pw.newPassword}
                onChange={e => setPw(f => ({...f, newPassword: e.target.value}))}
                required
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password *</label>
              <input
                type="password"
                value={pw.confirm}
                onChange={e => setPw(f => ({...f, confirm: e.target.value}))}
                required
                placeholder="Repeat new password"
              />
              {pw.confirm && pw.newPassword !== pw.confirm && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                   Passwords do not match
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={saving || (pw.confirm && pw.newPassword !== pw.confirm)}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}