import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import StudentDashboard from './StudentDashboard';
import StudentAttendance from './StudentAttendance';
import StudentGrades from './StudentGrades';
import StudentAssignments from './StudentAssignments';
import StudentAnnouncements from './StudentAnnouncements';
import Profile from '../Profile';

const links = [
  { to: '/student', icon: '📊', label: 'Dashboard' },
  { to: '/student/attendance', icon: '📅', label: 'Attendance' },
  { to: '/student/grades', icon: '📝', label: 'Grades' },
  { to: '/student/assignments', icon: '📋', label: 'Assignments' },
  { to: '/student/announcements', icon: '📢', label: 'Announcements' },
  { to: '/student/profile', icon: '👤', label: 'Profile' },
];

export default function StudentLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar links={links} />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<StudentDashboard />} />
          <Route path="/attendance" element={<StudentAttendance />} />
          <Route path="/grades" element={<StudentGrades />} />
          <Route path="/assignments" element={<StudentAssignments />} />
          <Route path="/announcements" element={<StudentAnnouncements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </main>
    </div>
  );
}