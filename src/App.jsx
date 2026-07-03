import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { SessionProvider } from '@/lib/session';
import AppLayout from '@/components/AppLayout';
import { StudentGuard, AdminGuard } from '@/components/Guards';

// Public pages
import Welcome from '@/pages/Welcome';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Resources from '@/pages/Resources';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Student pages
import Dashboard from '@/pages/student/Dashboard';
import TestPage from '@/pages/student/TestPage';
import PracticeQuestions from '@/pages/student/PracticeQuestions';
import StudentCalendar from '@/pages/student/Calendar';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import StudentDatabase from '@/pages/admin/StudentDatabase';
import StudentDetail from '@/pages/admin/StudentDetail';
import PracticeTestsAdmin from '@/pages/admin/PracticeTestsAdmin';
import PracticeQuestionsAdmin from '@/pages/admin/PracticeQuestionsAdmin';
import AdminCalendar from '@/pages/admin/AdminCalendar';
import AccountApprovals from '@/pages/admin/AccountApprovals';
import AdminSettings from '@/pages/admin/Settings';
import ExamTopics from '@/pages/admin/ExamTopics';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // This app uses custom session login (see SessionProvider), not Base44 OAuth.
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <SessionProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/ResetPassword" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<StudentGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/test/:testNumber" element={<TestPage />} />
            <Route path="/practice" element={<PracticeQuestions />} />
            <Route path="/calendar" element={<StudentCalendar />} />
          </Route>

          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentDatabase />} />
            <Route path="/admin/students/:id" element={<StudentDetail />} />
            <Route path="/admin/tests" element={<PracticeTestsAdmin />} />
            <Route path="/admin/questions" element={<PracticeQuestionsAdmin />} />
            <Route path="/admin/calendar" element={<AdminCalendar />} />
            <Route path="/admin/approvals" element={<AccountApprovals />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/exam-topics" element={<ExamTopics />} />
          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </SessionProvider>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
