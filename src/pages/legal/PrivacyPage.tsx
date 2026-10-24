import React from 'react';
import { ShieldCheck, Lock, FileText } from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { PageContainer } from '../../components/common/PageContainer';
import { BRAND_CONFIG } from '../../config/brand';

export const PrivacyPage: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <div className="py-12 space-y-8">
      <PageContainer size="narrow">
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'ar' ? 'الامتثال الطبي والأمني' : 'Medical Security Compliance'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.privacyTitle}
          </h1>
          <p className="text-xs text-slate-500">{t.privacyLastUpdated}</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? '1. التزام حماية البيانات الصحية' : '1. Health Data Protection Commitment'}
            </h2>
            <p>
              {language === 'ar'
                ? `تلتزم منصة ${BRAND_CONFIG.name} (${BRAND_CONFIG.arabicName}) بحماية خصوصية كافة المستخدمين من المرضى والأطباء والمراكز السريرية. يتم التعامل مع كافة البيانات الصحية وفق أعلى درجات السرية المهنية والتشفير التام.`
                : `The ${BRAND_CONFIG.name} platform is committed to strictly safeguarding the privacy of all patients, physicians, and clinical centers. All medical data is treated with clinical confidentiality and encrypted at rest and in transit.`}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? '2. البيانات التي نقوم بجمعها' : '2. Data Collected'}
            </h2>
            <p>
              {language === 'ar'
                ? 'تشمل البيانات المجمعة: معلومات الهوية الأساسية (الاسم، البريد الإلكتروني، رقم الهاتف)، وبيانات الاعتماد المهني للأطباء (شهادات الاختصاص، رقم هوية نقابة الأطباء)، وسجلات المواعيد الطبية المجدولة بموافقة صريحة.'
                : 'Collected information includes: core profile data (name, email, phone number), clinical licensing credentials for physicians (syndicate registration, specialization certificates), and appointment records scheduled with explicit consent.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? '3. ضوابط الوصول والسرية' : '3. Access Controls & Confidentiality'}
            </h2>
            <p>
              {language === 'ar'
                ? 'تطبق المنصة نموذج التحكم في الوصول القائم على الأدوار (RBAC). لا يُسمح لأي طرف بالاطلاع على السجلات الطبية للمراجع إلا للطبيب المعالج والمصرح له فقط. تخضع جميع العمليات لتدقيق نظامي صارم.'
                : 'The platform enforces strict Role-Based Access Control (RBAC). Medical records are accessible solely to the patient and their treating authorized physician. All system actions are audited.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? '4. التواصل مع مسؤول الخصوصية' : '4. Privacy Officer Contact'}
            </h2>
            <p>
              {language === 'ar'
                ? `لأي استفسارات حول حماية البيانات، يمكن التواصل مع إدارة المنصة عبر البريد الإلكتروني: ${BRAND_CONFIG.support.email} أو واتساب الدعم الفني: ${BRAND_CONFIG.support.whatsappNumber}.`
                : `For questions regarding privacy, please contact platform administration at ${BRAND_CONFIG.support.email} or WhatsApp at ${BRAND_CONFIG.support.whatsappInternational}.`}
            </p>
          </section>
        </div>
      </PageContainer>
    </div>
  );
};
