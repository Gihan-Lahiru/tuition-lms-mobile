import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  ClipboardCheck,
  CalendarCheck,
  FolderUp,
} from 'lucide-react';
import LMSLayout from './LMSLayout';

const TEACHER_TABS = [
  { to: '/lms/teacher', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/lms/teacher/quizzes', label: 'Quizzes', icon: CheckSquare },
  { to: '/lms/teacher/assignments', label: 'Grading', icon: ClipboardCheck },
  { to: '/lms/teacher/marks-attendance', label: 'Marks/Att', icon: CalendarCheck },
  { to: '/lms/teacher/content', label: 'Content', icon: FolderUp },
];

export default function TeacherLayout() {
  return (
    <LMSLayout
      title="MW Teacher LMS"
      subtitle="Instructor Mobile Console"
      tabs={TEACHER_TABS}
      notificationsPath="/lms/notifications"
    >
      <Outlet />
    </LMSLayout>
  );
}

