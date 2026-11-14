import { Navigate, Route, Routes } from 'react-router-dom';
import RouteGuard from '../security/RouteGuard';
import StudentLayout from '../layouts/StudentLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import LMSLayout from '../layouts/LMSLayout';

import AuthScreen from '../modules/auth/AuthScreen';
import AccountSecurityPage from '../modules/auth/AccountSecurityPage';
import StudentDashboardPage from '../modules/dashboard/StudentDashboardPage';
import TeacherDashboardPage from '../modules/dashboard/TeacherDashboardPage';
import ClassesPage from '../modules/classes/ClassesPage';
import StudyHubPage from '../modules/papers/StudyHubPage';
import StudentAssignmentsPage from '../modules/assignments/StudentAssignmentsPage';
import StudentQuizzesPage from '../modules/quizzes/StudentQuizzesPage';
import QuizPlayerPage from '../modules/quizzes/QuizPlayerPage';
import QuizResultPage from '../modules/quizzes/QuizResultPage';
import StudentResultsPage from '../modules/results/StudentResultsPage';
import StudentAttendancePage from '../modules/attendance/StudentAttendancePage';
import StudentVideosPage from '../modules/videos/StudentVideosPage';
import StudentMessagesPage from '../modules/messages/StudentMessagesPage';
import TeacherMessagesPage from '../modules/teacher/TeacherMessagesPage';
import StudentFeesPage from '../modules/fees/StudentFeesPage';
import NotificationsPage from '../modules/notifications/NotificationsPage';
import TeacherQuizzesPage from '../modules/teacher/TeacherQuizzesPage';
import TeacherAssignmentsPage from '../modules/teacher/TeacherAssignmentsPage';
import TeacherMarksAttendancePage from '../modules/teacher/TeacherMarksAttendancePage';
import TeacherContentPage from '../modules/teacher/TeacherContentPage';

export default function LMSRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/lms/dashboard" replace />} />
      <Route path="/lms" element={<Navigate to="/lms/dashboard" replace />} />
      <Route path="/lms/login" element={<AuthScreen />} />

      {/* Protected Student App Shell */}
      <Route
        path="/lms"
        element={
          <RouteGuard allowedRoles={['student']}>
            <StudentLayout />
          </RouteGuard>
        }
      >
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="study" element={<StudyHubPage />} />
        <Route path="quizzes" element={<StudentQuizzesPage />} />
        <Route path="quizzes/:quizId" element={<QuizPlayerPage />} />
        <Route path="quiz-result/:attemptId" element={<QuizResultPage />} />
        <Route path="assignments" element={<StudentAssignmentsPage />} />
        <Route path="results" element={<StudentResultsPage />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route path="videos" element={<StudentVideosPage />} />
        <Route path="messages" element={<StudentMessagesPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="security" element={<AccountSecurityPage />} />
      </Route>

      {/* Fees remains reachable even if grace-locked so students can upload receipts */}
      <Route
        path="/lms/fees"
        element={
          <RouteGuard allowedRoles={['student']} allowWhenGraceLocked>
            <StudentLayout />
          </RouteGuard>
        }
      >
        <Route index element={<StudentFeesPage />} />
      </Route>

      {/* Shared Notifications Route (both Student and Teacher) */}
      <Route
        path="/lms/notifications"
        element={
          <RouteGuard allowedRoles={['student', 'teacher', 'admin']} allowWhenGraceLocked>
            <LMSLayout title="MW Tuition LMS" subtitle="Notifications">
              <NotificationsPage />
            </LMSLayout>
          </RouteGuard>
        }
      />

      {/* Protected Teacher Mobile Console */}
      <Route
        path="/lms/teacher"
        element={
          <RouteGuard allowedRoles={['teacher', 'admin']}>
            <TeacherLayout />
          </RouteGuard>
        }
      >
        <Route index element={<TeacherDashboardPage />} />
        <Route path="quizzes" element={<TeacherQuizzesPage />} />
        <Route path="assignments" element={<TeacherAssignmentsPage />} />
        <Route path="marks-attendance" element={<TeacherMarksAttendancePage />} />
        <Route path="content" element={<TeacherContentPage />} />
        <Route path="messages" element={<TeacherMessagesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/lms/dashboard" replace />} />
    </Routes>
  );
}

