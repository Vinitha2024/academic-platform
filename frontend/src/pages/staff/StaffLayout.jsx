import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import StaffDashboard from './StaffDashboard';
import StaffAttendance from './StaffAttendance';
import StaffGrades from './StaffGrades';
import StaffAssignments from './StaffAssignments';
import StaffAnnouncements from './StaffAnnouncements';
import Profile from '../Profile';

const links = [
  { to: '/staff',  label: 'Dashboard' },
  { to: '/staff/attendance', label: 'Attendance' },
  { to: '/staff/grades', label: 'Grades' },
  { to: '/staff/assignments', label: 'Assignments' },
  { to: '/staff/announcements',  label: 'Announcements' },
  { to: '/staff/profile',label: 'Profile' },
];

export default function StaffLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar links={links} />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<StaffDashboard />} />
          <Route path="/attendance" element={<StaffAttendance />} />
          <Route path="/grades" element={<StaffGrades />} />
          <Route path="/assignments" element={<StaffAssignments />} />
          <Route path="/announcements" element={<StaffAnnouncements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/staff" replace />} />
        </Routes>
      </main>
    </div>
  );
}