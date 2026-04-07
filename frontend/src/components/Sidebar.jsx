import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Sidebar({ links }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const roleColors = { admin: '#ff6b9d', staff: '#6c63ff', student: '#00d4aa' };

  return (
    <div style={{ width: '240px', minHeight: '100vh', background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 100 }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🎓</span>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, #6c63ff, #ff6b9d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AcademX</span>
        </div>
      </div>

      <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${roleColors[user.role]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', border: `2px solid ${roleColors[user.role]}44` }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: roleColors[user.role], fontWeight: 500, textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px',
            color: isActive ? '#fff' : 'var(--text2)', background: isActive ? 'var(--accent)' : 'transparent',
            fontWeight: isActive ? 600 : 400, fontSize: '0.875rem', transition: 'all 0.15s', textDecoration: 'none'
          })}>
            <span style={{ fontSize: '1rem' }}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px' }}>
        <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: 'var(--surface2)', color: 'var(--text2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
           Logout
        </button>
      </div>
    </div>
  );
}