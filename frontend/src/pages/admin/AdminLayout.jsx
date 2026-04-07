import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminSubjects from './AdminSubjects';
import AdminAnnouncements from './AdminAnnouncements';
import Profile from '../Profile';

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users',label: 'Users' },
  { to: '/admin/subjects', label: 'Subjects' },
  { to: '/admin/announcements', label: 'Announcements' },
  { to: '/admin/profile', label: 'Profile' },
];

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar links={links} />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/subjects" element={<AdminSubjects />} />
          <Route path="/announcements" element={<AdminAnnouncements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}