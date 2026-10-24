import React, { useState } from 'react';
import { Mail, MessageCircle, Phone, Clock, Send, CheckCircle2, HelpCircle } from 'lucide-react';
import { useLanguage } from '../localization/LanguageContext';
import { BRAND_CONFIG, getEmailSupportUrl, getWhatsAppSupportUrl } from '../config/brand';
import { PageContainer } from '../components/common/PageContainer';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { WhatsAppSupportButton } from '../components/common/WhatsAppSupportButton';
import { SuccessNotification } from '../components/common/SuccessNotification';

export const SupportPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;

    // Generate formatted mailto or WhatsApp link and open mail client
    const subject = `طلب دعم فني M737 من ${userName || 'مستخدم المنصة'}`;
    const body = `الاسم: ${userName}\nالبريد: ${userEmail}\n\nنص الرسالة:\n${message}`;
    const mailUrl = `mailto:${BRAND_CONFIG.support.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailUrl;
    setSubmitted(true);
  };

  return (
    <div className="py-12 space-y-12">
      <PageContainer>
        {/* Support Center Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Phone className="w-3.5 h-3.5" />
            <span>{t.contactSupport}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t.supportPageTitle}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {t.supportPageSubtitle}
          </p>
        </div>

        {/* Prompt Alert Card */}
        <div className="max-w-4xl mx-auto rounded-xl bg-gradient-to-r from-[#0A192F] to-[#142E54] text-white p-6 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start shadow-sm">
          <div>
            <p className="text-base font-bold text-amber-300">
              {language === 'ar' ? BRAND_CONFIG.support.helpPromptAr : BRAND_CONFIG.support.helpPromptEn}
            </p>
            <p className="text-xs text-slate-300 mt-1">
              {language === 'ar'
                ? 'فريق الدعم الفني جاهز لمساعدتك وحل أي عقبة تقنية تواجهها فوراً.'
                : 'Our technical support team is dedicated to promptly addressing any questions.'}
            </p>
          </div>
          <div className="shrink-0">
            <WhatsAppSupportButton size="md" showNumber={true} />
          </div>
        </div>

        {/* Direct Channels Cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Email Support Card */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.emailSupport}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar' ? 'للاستفسارات الرسمية وطلبات انضمام الأطباء' : 'Official inquiries and physician accreditation'}
              </p>
            </div>
            <a
              href={getEmailSupportUrl('استفسار دعم فني — منصة M737')}
              className="inline-block text-sm font-mono font-bold text-slate-900 hover:text-amber-700 transition-colors"
            >
              {BRAND_CONFIG.support.email}
            </a>
            <div className="pt-2">
              <a
                href={getEmailSupportUrl('استفسار دعم فني — منصة M737')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-300" />
                <span>{t.sendSupportEmail}</span>
              </a>
            </div>
          </div>

          {/* WhatsApp Direct Card */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.whatsappSupport}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar' ? 'محادثة مباشرة مع فريق الدعم الفني العراقي' : 'Direct live chat with Iraqi technical support team'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-mono font-bold text-slate-900">
                {BRAND_CONFIG.support.whatsappNumber}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {BRAND_CONFIG.support.whatsappInternational}
              </p>
            </div>
            <div className="pt-2">
              <WhatsAppSupportButton size="md" />
            </div>
          </div>
        </div>

        {/* Message Composer & Inquiry Form */}
        <div className="max-w-4xl mx-auto p-8 rounded-xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'ar' ? 'إرسال رسالة مباشرة إلى الدعم' : 'Send a Message to Support'}
            </h2>
            <p className="text-xs text-slate-600">
              {language === 'ar'
                ? 'املأ النموذج التالي لفتح تطبيق البريد مباشرة مع نص رسالتك المجهزة'
                : 'Complete the form to dispatch your inquiry directly to our support desk'}
            </p>
          </div>

          {submitted && (
            <SuccessNotification
              title={language === 'ar' ? 'تم تجهيز الرسالة' : 'Message Prepared'}
              message={
                language === 'ar'
                  ? 'تم فتح تطبيق البريد الخاص بك لإرسال الرسالة إلى bcgmoc@gmail.com بنجاح.'
                  : 'Your email client has been triggered to send the inquiry to bcgmoc@gmail.com.'
              }
              onDismiss={() => setSubmitted(false)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {t.fullNameLabel}
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {language === 'ar' ? 'نص الاستفسار أو المشكلة' : 'Message or Problem Details'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                placeholder={
                  language === 'ar'
                    ? 'اكتب تفاصيل الاستفسار أو المشكلة التي تواجهك...'
                    : 'Describe your inquiry or the issue you are facing...'
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              />
            </div>

            <PrimaryButton type="submit" size="md" icon={<Send className="w-4 h-4" />}>
              {language === 'ar' ? 'إرسال الرسالة عبر البريد' : 'Submit via Email Client'}
            </PrimaryButton>
          </form>
        </div>

        {/* FAQs Section */}
        <div className="max-w-4xl mx-auto space-y-4 pt-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <HelpCircle className="w-5 h-5 text-amber-700" />
            <h2>{t.faqTitle}</h2>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-1">{t.faq1Q}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.faq1A}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-1">{t.faq2Q}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.faq2A}</p>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};
