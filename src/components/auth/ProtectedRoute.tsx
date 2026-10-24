import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../localization/LanguageContext';
import { UserRole, SUPER_ADMIN_EMAIL } from '../../types/auth';
import { PageContainer } from '../common/PageContainer';
import { PrimaryButton } from '../common/PrimaryButton';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { BRAND_CONFIG } from '../../config/brand';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireSuperAdmin = false,
}) => {
  const { currentUser, userProfile, isLoading, isNewUserPendingRole, isSuperAdmin } = useAuth();
  const { language, direction } = useLanguage();
  const location = useLocation();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingIndicator
          size="lg"
          label={language === 'ar' ? 'جاري التحقق من بيانات الدخول والأدوار...' : 'Verifying credentials and roles...'}
        />
      </div>
    );
  }

  // Not signed in -> send to sign in page
  if (!currentUser) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // New Google user who hasn't selected their role yet -> send to onboarding
  if (isNewUserPendingRole && !isSuperAdmin) {
    return <Navigate to="/onboarding" replace />;
  }

  // Super Admin strict route protection
  if (requireSuperAdmin) {
    if (!isSuperAdmin) {
      return (
        <div className="py-20 bg-slate-50 min-h-[70vh]">
          <PageContainer size="narrow">
            <div className="p-8 sm:p-12 rounded-2xl bg-white border border-red-200 shadow-lg text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-900">
                  {language === 'ar' ? 'وصول مقيّد — غير مصرح لك بالدخول' : 'Access Restricted — Unauthorized'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {language === 'ar'
                    ? `بوابة الإدارة العليا (Super Admin) مخصصة حصراً للهوية المعتمدة (${SUPER_ADMIN_EMAIL}). الحساب الحالي [${currentUser.email}] لا يملك صلاحية إدارة المنصة.`
                    : `The Super Admin Portal is strictly governed for the verified administrative identity (${SUPER_ADMIN_EMAIL}). Current account [${currentUser.email}] does not possess administrative privileges.`}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono">
                Security Constraint: Multi-layer verified token verification failed for non-admin identity.
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <NavigateLinkToCorrectDashboard userProfile={userProfile} />
              </div>
            </div>
          </PageContainer>
        </div>
      );
    }
  }

  // Role checks for specific dashboards
  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role) && !isSuperAdmin) {
    return (
      <div className="py-20 bg-slate-50 min-h-[70vh]">
        <PageContainer size="narrow">
          <div className="p-8 rounded-2xl bg-white border border-amber-200 shadow-md text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'ar' ? 'هذه اللوحة غير متوافقة مع نوع حسابك' : 'Portal Not Permitted For Your Role'}
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {language === 'ar'
                ? `حسابك الحالي مسجل بصفة [${userProfile.role}]. يمكنك الانتقال إلى اللوحة المخصصة لك.`
                : `Your account is registered as [${userProfile.role}]. Please navigate to your authorized dashboard.`}
            </p>
            <div>
              <NavigateLinkToCorrectDashboard userProfile={userProfile} />
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  return <>{children}</>;
};

function NavigateLinkToCorrectDashboard({ userProfile }: { userProfile: import('../../types/auth').UserProfile | null }) {
  const { language, direction } = useLanguage();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  if (!userProfile) {
    return (
      <a href="/onboarding">
        <PrimaryButton size="md">
          {language === 'ar' ? 'إكمال تسجيل الحساب' : 'Complete Account Registration'}
        </PrimaryButton>
      </a>
    );
  }

  const target = userProfile.role === 'doctor'
    ? '/dashboard/doctor'
    : userProfile.role === 'super_admin'
    ? '/dashboard/admin'
    : '/dashboard/patient';

  const label = userProfile.role === 'doctor'
    ? (language === 'ar' ? 'الذهاب إلى بوابة الأطباء' : 'Go to Doctor Portal')
    : userProfile.role === 'super_admin'
    ? (language === 'ar' ? 'الذهاب إلى لوحة الإدارة' : 'Go to Admin Portal')
    : (language === 'ar' ? 'الذهاب إلى بوابة المراجعين' : 'Go to Patient Portal');

  return (
    <a href={target}>
      <PrimaryButton size="md" icon={<ArrowIcon className="w-4 h-4" />}>
        {label}
      </PrimaryButton>
    </a>
  );
}
