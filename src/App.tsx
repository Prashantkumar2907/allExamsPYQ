import { useEffect, lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { ErrorState } from './components/shared/ErrorState';
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
  const { user, loading, initialized, initialize } = useAuthStore();
  useEffect(() => {
    if (!initialized && loading) void initialize();
  }, [initialized, loading, initialize]);
  if (!initialized || loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestGuard() {
  const { user, profile, profileError, fetchProfile, loading, initialized } = useAuthStore();
  const initialize = useAuthStore((state) => state.initialize);
  useEffect(() => {
    if (!initialized && loading) void initialize();
  }, [initialized, loading, initialize]);
  if (!initialized || loading) return <LoadingSpinner />;
  if (user) {
    if (profileError) return <ErrorState description={profileError} onRetry={() => fetchProfile(user.id)} />;
    if (!profile) return <LoadingSpinner />;
    const home = profile?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={home} replace />;
  }
  return <Outlet />;
}

function RoleGuard({ role }: { role: 'student' | 'admin' }) {
  const { user, profile, profileError, fetchProfile } = useAuthStore();
  if (profileError) return <ErrorState description={profileError} onRetry={() => user && fetchProfile(user.id)} />;
  if (!profile) return <LoadingSpinner />;
  if (profile?.role !== role) {
    const redirect = profile?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirect} replace />;
  }
  return <Outlet />;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Guest routes */}
      <Route path="/" element={<LandingPage />} />
      <Route element={<GuestGuard />}>
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
    </>
  )
);

export default function App() {
  return (
    <>
      <PWAInstallPrompt />
      <ToastContainer />
      <Suspense fallback={<LoadingSpinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </>
  );
}
