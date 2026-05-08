import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { ToastContainer } from './components/ui/Toast';
import { PWAInstallPrompt } from './components/shared/PWAInstallPrompt';

// Auth pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Student pages
const StudentDashboard = lazy(() => import('./pages/student/DashboardPage'));
const ExamBrowser = lazy(() => import('./pages/student/ExamBrowserPage'));
const TestList = lazy(() => import('./pages/student/TestListPage'));
const TestTaking = lazy(() => import('./pages/student/TestTakingPage'));
const TestResult = lazy(() => import('./pages/student/TestResultPage'));
const Analytics = lazy(() => import('./pages/student/AnalyticsPage'));
const Leaderboard = lazy(() => import('./pages/student/LeaderboardPage'));
const Bookmarks = lazy(() => import('./pages/student/BookmarksPage'));
const StudentProfile = lazy(() => import('./pages/student/ProfilePage'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const ExamManagement = lazy(() => import('./pages/admin/ExamManagementPage'));
const QuestionManagement = lazy(() => import('./pages/admin/QuestionManagementPage'));
const TestManagement = lazy(() => import('./pages/admin/TestManagementPage'));
const BulkUpload = lazy(() => import('./pages/admin/BulkUploadPage'));
const ReportedQuestions = lazy(() => import('./pages/admin/ReportedQuestionsPage'));
const UserAnalytics = lazy(() => import('./pages/admin/UserAnalyticsPage'));
const AdminProfile = lazy(() => import('./pages/admin/ProfilePage'));

function AuthGuard() {
  const { user, loading, initialized, profile } = useAuthStore();
  if (!initialized || loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestGuard() {
  const { user, profile, loading, initialized } = useAuthStore();
  if (!initialized || loading) return <LoadingSpinner />;
  if (user) {
    const home = profile?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={home} replace />;
  }
  return <Outlet />;
}

function RoleGuard({ role }: { role: 'student' | 'admin' }) {
  const { profile } = useAuthStore();
  if (profile?.role !== role) {
    const redirect = profile?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirect} replace />;
  }
  return <Outlet />;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <PWAInstallPrompt />
      <ToastContainer />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Guest routes */}
          <Route element={<GuestGuard />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Authenticated routes */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              {/* Student routes */}
              <Route element={<RoleGuard role="student" />}>
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/exams" element={<ExamBrowser />} />
                <Route path="/tests" element={<TestList />} />
                <Route path="/test/:attemptId" element={<TestTaking />} />
                <Route path="/result/:attemptId" element={<TestResult />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/profile" element={<StudentProfile />} />
              </Route>

              {/* Admin routes */}
              <Route element={<RoleGuard role="admin" />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/exams" element={<ExamManagement />} />
                <Route path="/admin/questions" element={<QuestionManagement />} />
                <Route path="/admin/tests" element={<TestManagement />} />
                <Route path="/admin/upload" element={<BulkUpload />} />
                <Route path="/admin/reports" element={<ReportedQuestions />} />
                <Route path="/admin/users" element={<UserAnalytics />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
              </Route>
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
