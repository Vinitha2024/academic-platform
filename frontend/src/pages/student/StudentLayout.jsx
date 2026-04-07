import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import StudentDashboard    from './StudentDashboard';
import StudentAttendance   from './StudentAttendance';
import StudentGrades       from './StudentGrades';
import StudentAssignments  from './StudentAssignments';
import StudentAnnouncements from './StudentAnnouncements';
import Profile             from '../Profile';

const links = [
  { to: '/student',   label: 'Dashboard' },
  { to: '/student/attendance', label: 'Attendance' },
  { to: '/student/grades', label: 'Grades' },
  { to: '/student/assignments',  label: 'Assignments' },
  { to: '/student/announcements', label: 'Announcements' },
  { to: '/student/profile',  label: 'My Profile' },
];

export default function StudentLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar links={links} />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', minHeight: '100vh' }}>
        <Routes>
          <Route path="/"   element={<StudentDashboard />} />
          <Route path="/attendance"  element={<StudentAttendance />} />
          <Route path="/grades"   element={<StudentGrades />} />
          <Route path="/assignments"   element={<StudentAssignments />} />
          <Route path="/announcements" element={<StudentAnnouncements />} />
          <Route path="/profile"       element={<Profile />} />
          <Route path="*"              element={<Navigate to="/student" replace />} />
        </Routes>
      </main>
    </div>
  );
}