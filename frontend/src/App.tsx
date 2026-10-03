import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { QuizPage } from './pages/QuizPage';
import { RoleRoute } from './components/RoleRoute';
import { UploaderDashboard } from './pages/DataEntry/UploaderDashboard';
import { ValidatorDashboard } from './pages/DataEntry/ValidatorDashboard';
import { AdminDashboard } from './pages/DataEntry/AdminDashboard';

import { LandingPage } from './pages/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public auth routes */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/verify-email"    element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* Protected main app route (Library) */}
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/data-entry/upload"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['Uploader']}>
                <UploaderDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/data-entry/validate"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['Validator']}>
                <ValidatorDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/data-entry/admin"
          element={
            <ProtectedRoute>
              <RoleRoute requireAdmin={true}>
                <AdminDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
