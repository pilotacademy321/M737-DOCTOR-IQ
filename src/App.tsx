import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './localization/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PatientDashboardPage } from './pages/dashboards/PatientDashboardPage';
import { DoctorDashboardPage } from './pages/dashboards/DoctorDashboardPage';
import { AdminDashboardPage } from './pages/dashboards/AdminDashboardPage';
import { PrivacyPage } from './pages/legal/PrivacyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { SupportPage } from './pages/SupportPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Main App Layout */}
            <Route path="/" element={<RootLayout />}>
              <Route index element={<HomePage />} />
              <Route path="support" element={<SupportPage />} />
              
              {/* Protected Dashboards with Strict Server-Enforced RBAC */}
              <Route
                path="dashboard/patient"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/doctor"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/admin"
                element={
                  <ProtectedRoute requireSuperAdmin={true}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Standalone Authentication & Onboarding Routes */}
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
