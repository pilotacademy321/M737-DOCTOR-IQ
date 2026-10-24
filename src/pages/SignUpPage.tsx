import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Stethoscope, Users, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../localization/LanguageContext';
import { BRAND_CONFIG, getEmailSupportUrl } from '../config/brand';
import { BrandLogo } from '../components/brand/BrandLogo';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { WhatsAppSupportButton } from '../components/common/WhatsAppSupportButton';
import { SuccessNotification } from '../components/common/SuccessNotification';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const SignUpPage: React.FC = () => {
  const { t, language, direction } = useLanguage();
  const { signInWithGoogle, isLoading, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    clearAuthError();
    setIsRegistering(true);
    setSuccessInfo(null);

    try {
      const { isNewUser, profile } = await signInWithGoogle();

      if (isNewUser || !profile) {
        setSuccessInfo(
          language === 'ar'
            ? 'تم التحقق من حساب Google بنجاح. جاري توجيهك لتحديد صفتك (مريض أو طبيب)...'
            : 'Google authentication verified. Directing to role selection...'
        );
        setTimeout(() => {
          navigate('/onboarding');
        }, 700);
      } else {
        setSuccessInfo(
          language === 'ar'
            ? `لديك حساب مسجل بالفعل بصفة [${profile.role}]. جاري نقلك إلى لوحة التحكم...`
            : `You already have an existing account as [${profile.role}]. Redirecting...`
        );
        setTimeout(() => {
          if (profile.role === 'super_admin') {
            navigate('/dashboard/admin');
          } else if (profile.role === 'doctor') {
            navigate('/dashboard/doctor');
          } else {
            navigate('/dashboard/patient');
          }
        }, 700);
      }
    } catch {
      // Auth errors managed in AuthContext
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Side Visual Showcase */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-[#0A192F] text-white flex-col justify-between p-10 overflow-hidden border-e border-amber-500/20">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_medical_center_1791878366520.jpg"
            alt="M737 Healthcare Architecture"
            className="w-full h-full object-cover opacity-25"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061120] via-[#0A192F]/85 to-[#0A192F]" />
          <div className="absolute inset-0 bg-iraqi-grid-dark opacity-30" />
        </div>

        <div className="relative z-10">
          <BrandLogo size="lg" variant="light" />
        </div>

        <div className="relative z-10 space-y-4 my-auto max-w-md">
          <div className="w-12 h-1 bg-amber-400 rounded-full" />
          <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
            {language === 'ar' ? 'انضم إلى مجمع الطب الأول بالعراق' : 'Join the Premier Medical Platform of Iraq'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'ar'
              ? 'سواء كنت مراجعاً تبحث عن رعاية سريرية دقيقة، أو طبيباً اختصاصياً يسعى لتقديم استشارات معتمدة، تمنحك M737 بنية رقمية حديثة وآمنة.'
              : 'Whether seeking top-tier clinical healthcare or practicing as a certified physician, M737 provides advanced digital infrastructure.'}
          </p>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
            <p className="font-semibold text-amber-300">
              {language === 'ar' ? 'مسار التسجيل الآمن' : 'Secure Registration Protocol'}
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {language === 'ar'
                ? 'يبدأ التسجيل بمصادقة حساب Google الرسمي، ويليه اختيار دورك (مريض أو طبيب) وتعبئة الاستمارة المخصصة.'
                : 'Authentication proceeds with your verified Google identity, followed by role selection and credential submission.'}
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-amber-300">
            {language === 'ar' ? BRAND_CONFIG.support.helpPromptAr : BRAND_CONFIG.support.helpPromptEn}
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <a href={getEmailSupportUrl()} className="hover:text-white transition-colors">
              {BRAND_CONFIG.support.email}
            </a>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{BRAND_CONFIG.support.whatsappNumber}</span>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="lg:hidden">
            <BrandLogo size="sm" variant="dark" showSubtitle={false} />
          </div>
          <div className="ms-auto flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              {t.backToHome}
            </Link>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto space-y-6 my-auto">
          {/* Segmented Switcher Header: Clearly Separated Options */}
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-xl text-center text-xs font-bold">
            <Link
              to="/signin"
              className="py-2.5 px-3 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
            <span className="py-2.5 px-3 rounded-lg bg-white text-slate-900 shadow-xs">
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t.signUpTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {language === 'ar'
                ? 'ابدأ بإنشاء حسابك الرسمي عبر Google، ثم اختر نوع الحساب'
                : 'Start by creating your account with Google, then select your role'}
            </p>
          </div>

          {successInfo && (
            <SuccessNotification message={successInfo} onDismiss={() => setSuccessInfo(null)} />
          )}

          {authError && (
            <ErrorMessage message={authError} onDismiss={clearAuthError} />
          )}

          {/* Two Roles Preview Box */}
          <div className="grid grid-cols-2 gap-3 text-start">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Users className="w-4 h-4 text-amber-600" />
                <span>{language === 'ar' ? 'حساب مريض' : 'Patient Role'}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {language === 'ar' ? 'حجز فوري ومتابعة السجلات الطبية' : 'Instant booking & health records'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Stethoscope className="w-4 h-4 text-sky-600" />
                <span>{language === 'ar' ? 'حساب طبيب' : 'Doctor Role'}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {language === 'ar' ? 'إدارة العيادة (يتطلب تدقيق النقابة)' : 'Clinic hub (Requires Syndicate ID)'}
              </p>
            </div>
          </div>

          {/* Google Quick Sign-Up Action */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isRegistering || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-bold shadow-xs hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60"
            >
              {isRegistering ? (
                <span className="inline-block w-5 h-5 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.09C3.25 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.26C.46 8.22 0 10.06 0 12s.46 3.78 1.26 5.4l4.02-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.6l4.02 3.09c.95-2.84 3.6-4.94 6.72-4.94z"
                  />
                </svg>
              )}
              <span>
                {isRegistering
                  ? language === 'ar'
                    ? 'جاري الربط مع Google...'
                    : 'Connecting with Google...'
                  : language === 'ar'
                  ? 'إنشاء الحساب بواسطة Google'
                  : 'Register with Google'}
              </span>
            </button>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              {t.termsAgreement}
            </p>
          </div>

          <div className="pt-2 text-center text-xs text-slate-600">
            <span>{t.alreadyHaveAccount} </span>
            <Link
              to="/signin"
              className="font-bold text-amber-700 hover:text-amber-800 underline underline-offset-4"
            >
              {language === 'ar' ? 'تسجيل الدخول إلى حسابك' : 'Sign in to your account'}
            </Link>
          </div>

          {/* Support prompt banner */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 text-xs text-slate-700 space-y-2">
            <p className="font-bold text-amber-950">
              {language === 'ar' ? BRAND_CONFIG.support.helpPromptAr : BRAND_CONFIG.support.helpPromptEn}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <WhatsAppSupportButton size="sm" />
              <a
                href={getEmailSupportUrl('مساعدة في إنشاء حساب جديد')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium"
              >
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span>{BRAND_CONFIG.support.email}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 pt-8">
          &copy; {new Date().getFullYear()} {BRAND_CONFIG.name} — {BRAND_CONFIG.arabicName}
        </div>
      </div>
    </div>
  );
};
