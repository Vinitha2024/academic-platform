import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password, form.role);
      toast.success(`Welcome, ${user.name}!`);
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)', top: '-200px', left: '-200px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,157,0.06) 0%, transparent 70%)', bottom: '-100px', right: '-100px', pointerEvents: 'none' }} />
      
      <div style={{ width: '100%', maxWidth: '420px', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #6c63ff, #ff6b9d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AcademX</h1>
          <p style={{ color: 'var(--text2)', marginTop: '6px' }}>Smart Digital Academic Platform</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', padding: '4px', borderRadius: '8px', marginBottom: '24px' }}>
            {['student', 'staff', 'admin'].map(role => (
              <button key={role} onClick={() => setForm(f => ({ ...f, role }))}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', background: form.role === role ? 'var(--accent)' : 'transparent', color: form.role === role ? '#fff' : 'var(--text2)', fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.2s' }}>
                {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@university.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Signing in...' : `Sign in as ${form.role.charAt(0).toUpperCase() + form.role.slice(1)}`}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: 'var(--text2)' }}>
            First time? Ask your administrator for credentials.
          </p>
        </div>
      </div>
    </div>
  );
}