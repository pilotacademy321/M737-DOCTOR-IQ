import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ShieldCheck, HeartPulse } from 'lucide-react';
import { BRAND_CONFIG, getEmailSupportUrl } from '../../config/brand';
import { useLanguage } from '../../localization/LanguageContext';
import { BrandLogo } from '../brand/BrandLogo';
import { WhatsAppSupportButton } from './WhatsAppSupportButton';

export const SupportFooter: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-[#0A192F] text-slate-200 border-t border-[#142E54] mt-auto">
      {/* Prominent Iraqi Support Prompt Banner */}
      <div className="bg-[#061120] border-b border-[#142E54]/60 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-start">
          <div className="space-y-1">
            <p className="text-base sm:text-lg font-bold text-amber-300">
              {language === 'ar' ? BRAND_CONFIG.support.helpPromptAr : BRAND_CONFIG.support.helpPromptEn}
            </p>
            <p className="text-xs sm:text-sm text-slate-300">
              {language === 'ar'
                ? 'فريق الدعم الفني المباشر متاح لمساعدتك في أي استفسار يتعلق بالمنصة الطبية.'
                : 'Direct technical support is ready to assist you with any platform-related issues.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            {/* Clickable Support Email */}
            <a
              href={getEmailSupportUrl('استفسار دعم فني — منصة M737')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-medium transition-colors"
            >
              <Mail className="w-4 h-4 text-amber-300" />
              <span>{BRAND_CONFIG.support.email}</span>
            </a>

            {/* Direct WhatsApp Button */}
            <WhatsAppSupportButton size="md" showNumber={true} />
          </div>
        </div>
      </div>

      {/* Main Footer Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <BrandLogo size="md" variant="light" showSubtitle={false} />
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'ar' ? BRAND_CONFIG.taglineAr : BRAND_CONFIG.taglineEn}
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300/90 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {language === 'ar' ? 'بنية بيانات صحية مشفرة ومحمية' : 'Encrypted & protected health infrastructure'}
              </span>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">
              {language === 'ar' ? 'المنصة الطبية' : 'Platform'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link to="/" className="hover:text-amber-300 transition-colors">
                  {t.navHome}
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-amber-300 transition-colors">
                  {t.navSupport}
                </Link>
              </li>
              <li>
                <Link to="/signin" className="hover:text-amber-300 transition-colors">
                  {t.navSignIn}
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-amber-300 transition-colors">
                  {t.navSignUp}
                </Link>
              </li>
            </ul>
          </div>

          {/* Dashboards Routing Overview */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">
              {language === 'ar' ? 'البوابات التخصصية' : 'Specialized Portals'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link to="/dashboard/patient" className="hover:text-amber-300 transition-colors">
                  {t.navPatientDashboard}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/doctor" className="hover:text-amber-300 transition-colors">
                  {t.navDoctorDashboard}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/admin" className="hover:text-amber-300 transition-colors">
                  {t.navAdminDashboard}
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Support Contacts */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">
              {language === 'ar' ? 'التواصل المعتمد' : 'Verified Contacts'}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-slate-400">{t.emailSupport}</span>
                  <a
                    href={getEmailSupportUrl()}
                    className="text-white hover:text-amber-300 transition-colors font-mono"
                  >
                    {BRAND_CONFIG.support.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-slate-400">{t.whatsappSupport}</span>
                  <a
                    href={BRAND_CONFIG.support.whatsappInternational ? `tel:${BRAND_CONFIG.support.whatsappInternational}` : '#'}
                    className="text-white hover:text-emerald-300 transition-colors font-mono"
                  >
                    {BRAND_CONFIG.support.whatsappNumber} (العراق)
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-12 pt-6 border-t border-[#142E54] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-amber-400" />
            <span>
              &copy; {new Date().getFullYear()} {BRAND_CONFIG.name} — {BRAND_CONFIG.arabicName}. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-slate-200 transition-colors">
              {t.navPrivacy}
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="hover:text-slate-200 transition-colors">
              {t.navTerms}
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/support" className="hover:text-slate-200 transition-colors">
              {t.navSupport}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
