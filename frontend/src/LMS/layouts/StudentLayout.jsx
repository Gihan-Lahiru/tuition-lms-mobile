import { Outlet } from 'react-router-dom';
import {
  Home,
  BookOpen,
  CheckSquare,
  ClipboardList,
  LayoutGrid,
  Award,
  CalendarCheck,
  CreditCard,
  Bell,
  School,
  Lock,
  Video,
  MessageSquare,
} from 'lucide-react';
import LMSLayout from './LMSLayout';

const STUDENT_TABS = [
  { to: '/lms/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/lms/study', label: 'Study', icon: BookOpen },
  { to: '/lms/quizzes', label: 'Quizzes', icon: CheckSquare },
  { to: '/lms/assignments', label: 'Work', icon: ClipboardList },
  { isMoreButton: true, label: 'More', icon: LayoutGrid },
];

const MORE_ITEMS = [
  { to: '/lms/videos', label: 'Class Videos', hint: 'Recorded lectures', icon: Video },
  { to: '/lms/messages', label: 'Messages', hint: 'Chat with teacher', icon: MessageSquare },
  { to: '/lms/results', label: 'Term Marks', hint: 'Marks & average', icon: Award },
  { to: '/lms/attendance', label: 'Attendance', hint: 'Monthly % & log', icon: CalendarCheck },
  { to: '/lms/classes', label: 'My Classes', hint: 'Schedule & notices', icon: School },
  { to: '/lms/fees', label: 'Fees & Slips', hint: 'Receipts & grace', icon: CreditCard },
  { to: '/lms/notifications', label: 'Alerts', hint: 'Notifications', icon: Bell },
  { to: '/lms/security', label: 'Password', hint: 'Profile & security', icon: Lock },
];

export default function StudentLayout() {
  return (
    <LMSLayout
      title="MW Tuition LMS"
      tabs={STUDENT_TABS}
      moreItems={MORE_ITEMS}
      moreTitle="Student LMS Menu"
      notificationsPath="/lms/notifications"
    >
      <Outlet />
    </LMSLayout>
  );
}

