import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Stethoscope,
  Building2,
  Users,
  FileText,
  Activity,
  ArrowRight,
  ArrowLeft,
  Lock,
  Headphones,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';
import { useLanguage } from '../localization/LanguageContext';
import { BRAND_CONFIG, getEmailSupportUrl, getWhatsAppSupportUrl } from '../config/brand';
import { PageContainer } from '../components/common/PageContainer';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import { WhatsAppSupportButton } from '../components/common/WhatsAppSupportButton';

export const HomePage: React.FC = () => {
  const { t, language, direction } = useLanguage();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A192F] via-[#0D223F] to-[#0A192F] text-white pt-12 sm:pt-16 pb-20 border-b border-amber-500/20">
        <div className="absolute inset-0 bg-iraqi-grid-dark opacity-40 pointer-events-none" />

        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
            {/* Left/Right Text Content (Col 7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Quiet editorial kicker */}
              <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold tracking-wide">
                <span>{t.heroKicker}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300 font-normal">
                  {language === 'ar' ? 'بغداد · أربيل · البصرة · النجف' : 'Baghdad · Erbil · Basra · Najaf'}
                </span>
              </div>

              {/* Dominant Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.25] text-balance">
                {t.heroTitle}
              </h1>

              {/* Concrete Value Proposition */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                {t.heroDescription}
              </p>

              {/* Single primary + secondary action CTA */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/signin">
                  <PrimaryButton
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-md"
                    icon={<ArrowIcon className="w-4 h-4" />}
                  >
                    {t.heroPrimaryCta}
                  </PrimaryButton>
                </Link>

                <a href="#architecture">
                  <SecondaryButton
                    size="lg"
                    variant="outline"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/15"
                  >
                    {t.heroSecondaryCta}
                  </SecondaryButton>
                </a>
              </div>

              {/* Trust Metadata (Zero-Pill Discipline) */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{language === 'ar' ? 'ضوابط خصوصية طبية مشددة' : 'Strict Medical Privacy'}</span>
                </div>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span>{language === 'ar' ? 'تدقيق مؤهلات الأطباء' : 'Verified Clinical Credentials'}</span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span>{language === 'ar' ? 'دعم فني عراقي مباشر' : 'Dedicated Iraqi Support'}</span>
              </div>
            </div>

            {/* Right Visual Carrier (Col 5) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-2xl bg-slate-900 aspect-[16/10] lg:aspect-[4/3] group">
                <img
                  src="/src/assets/images/hero_medical_center_1791878366520.jpg"
                  alt="M737 Premier Medical Center Atrium in Iraq"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to stylized SVG mesh if image fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback container underneath image */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0A192F] via-[#142E54] to-[#0A192F] -z-10 flex flex-col items-center justify-center p-6 text-center">
                  <Building2 className="w-12 h-12 text-amber-400 mb-2" />
                  <p className="text-sm font-semibold text-white">{BRAND_CONFIG.name} · {BRAND_CONFIG.arabicName}</p>
                </div>

                {/* Subdued Scrim Overlay with Caption */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-4 sm:p-5 text-white">
                  <p className="text-xs font-semibold text-amber-300">
                    {language === 'ar' ? 'مجمع الطب الأول بالعراق' : 'M737 National Medical Complex'}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {language === 'ar'
                      ? 'بنية تحتية متطورة تلبي متطلبات الأطباء الاستشاريين والمراكز الطبية المعتمدة'
                      : 'High-standard digital infrastructure designed for Iraqi specialized healthcare'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 2. Four Core Pillars Grid */}
      <section id="architecture" className="scroll-mt-24">
        <PageContainer>
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t.networkTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {t.networkSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-400/60 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                01. {t.pillar1Title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.pillar1Desc}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-400/60 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                02. {t.pillar2Title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.pillar2Desc}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-400/60 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                03. {t.pillar3Title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.pillar3Desc}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-400/60 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                04. {t.pillar4Title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.pillar4Desc}
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 3. Clinical Architecture & Role Portals Preview */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual consultation card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-white">
                <img
                  src="/src/assets/images/doctor_consultation_scene_1791878366603.jpg"
                  alt="Doctor consultation workflow"
                  className="w-full aspect-[4/3] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="p-5 space-y-2 bg-white">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">
                      {language === 'ar' ? 'إجراءات سريرية منضبطة' : 'Regulated Clinical Operations'}
                    </span>
                    <span className="text-amber-700 font-medium">M737 Care</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {language === 'ar'
                      ? 'تمكين الطبيب الاستشاري من التركيز على التشخيص الدقيق ومتابعة الحالة الصحية للمريض.'
                      : 'Empowering consulting physicians to prioritize clinical precision and continuous care.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Portals List & Deep Roles */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {language === 'ar'
                    ? 'بوابات متخصصة للأدوار الرئيسية في المنظومة'
                    : 'Specialized Portals for Key Healthcare Roles'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {language === 'ar'
                    ? 'تخصص المنصة واجهات مستقلة لكل طرف لضمان دقة العمليات وسرية البيانات الطبية'
                    : 'Independent portals tailored for each stakeholder ensuring security and clarity'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Patient Portal Link */}
                <Link
                  to="/dashboard/patient"
                  className="block p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {t.rolePatient}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600">{t.rolePatientDesc}</p>
                    </div>
                    <ArrowIcon className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0 mt-1" />
                  </div>
                </Link>

                {/* Doctor Portal Link */}
                <Link
                  to="/dashboard/doctor"
                  className="block p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-sky-600" />
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {t.roleDoctor}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600">{t.roleDoctorDesc}</p>
                    </div>
                    <ArrowIcon className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0 mt-1" />
                  </div>
                </Link>

                {/* Admin Portal Link */}
                <Link
                  to="/dashboard/admin"
                  className="block p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {t.roleAdmin}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600">{t.roleAdminDesc}</p>
                    </div>
                    <ArrowIcon className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0 mt-1" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 4. Support and Help Desk Card */}
      <section>
        <PageContainer>
          <div className="rounded-2xl bg-gradient-to-r from-[#0A192F] to-[#142E54] text-white p-8 sm:p-10 border border-amber-500/30 shadow-lg relative overflow-hidden">
            <div className="max-w-2xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 text-xs text-amber-300 font-semibold">
                <Headphones className="w-4 h-4" />
                <span>{t.contactSupport}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {language === 'ar' ? BRAND_CONFIG.support.helpPromptAr : BRAND_CONFIG.support.helpPromptEn}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {language === 'ar'
                  ? 'يتيح مجمع الطب الأول بالعراق قنوات اتصال مباشرة للاستفسارات التقنية وتسهيل استخدام المنصة للأطباء والمراجعين.'
                  : 'M737 provides direct channels for technical inquiries and onboarding assistance.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <WhatsAppSupportButton size="md" showNumber={true} />
                <a
                  href={getEmailSupportUrl('استفسار من الصفحة الرئيسية')}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                >
                  {BRAND_CONFIG.support.email}
                </a>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
};
