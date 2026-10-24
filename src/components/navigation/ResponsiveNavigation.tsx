import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Shield, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../localization/LanguageContext';
import { BrandLogo } from '../brand/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const ResponsiveNavigation: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language } = useLanguage();
  const { currentUser, userProfile, isSuperAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (isSuperAdmin) return '/dashboard/admin';
    if (userProfile?.role === 'doctor') return '/dashboard/doctor';
    return '/dashboard/patient';
  };

  const getDashboardLabel = () => {
    if (isSuperAdmin) return language === 'ar' ? 'لوحة الإدارة' : 'Admin Portal';
    if (userProfile?.role === 'doctor') return language === 'ar' ? 'بوابة الطبيب' : 'Doctor Portal';
    return language === 'ar' ? 'بوابة المراجع' : 'Patient Portal';
  };

  const navLinks = [
    { label: t.navHome, path: '/' },
    { label: t.navSupport, path: '/support' },
    ...(currentUser
      ? [{ label: getDashboardLabel(), path: getDashboardPath() }]
      : [
          { label: t.navPatientDashboard, path: '/dashboard/patient' },
          { label: t.navDoctorDashboard, path: '/dashboard/doctor' },
        ]),
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Strict 3-zone Top Bar Contract */}
        <div className="flex items-center justify-between gap-8 h-18">
          {/* Zone 1: Single brand wordmark */}
          <div className="shrink-0">
            <BrandLogo size="md" variant="dark" showSubtitle={false} />
          </div>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                  isActive(link.path)
                    ? 'text-slate-950 font-bold border-b-2 border-amber-600'
                    : 'hover:text-slate-950'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Zone 3: Primary action + Language Switcher */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <LanguageSwitcher />

            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-900 transition-colors"
                >
                  {isSuperAdmin ? (
                    <Shield className="w-3.5 h-3.5 text-red-700" />
                  ) : userProfile?.role === 'doctor' ? (
                    <Stethoscope className="w-3.5 h-3.5 text-sky-700" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-amber-700" />
                  )}
                  <span className="truncate max-w-[120px]">
                    {userProfile?.displayName || currentUser.displayName || 'الحساب'}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  title="تسجيل الخروج"
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {t.navSignIn}
                </Link>

                <Link
                  to="/signup"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0A192F] hover:bg-[#142E54] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
                >
                  {t.navSignUp}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex sm:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-amber-50 text-amber-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-100">
            {currentUser ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-100 text-xs font-bold text-slate-900"
                >
                  <span>{userProfile?.displayName || currentUser.displayName}</span>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    {userProfile?.role || 'مستخدم'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg text-center"
                >
                  {t.navSignIn}
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-[#0A192F] hover:bg-[#142E54] rounded-lg text-center"
                >
                  {t.navSignUp}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
