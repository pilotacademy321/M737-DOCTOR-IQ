import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { PageContainer } from '../../components/common/PageContainer';
import { BRAND_CONFIG } from '../../config/brand';

export const TermsPage: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <div className="py-12 space-y-8">
      <PageContainer size="narrow">
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md">
            <FileText className="w-4 h-4" />
            <span>{language === 'ar' ? 'الاتفاقية النظامية' : 'Platform Governance Agreement'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.termsTitle}
          </h1>
          <p className="text-xs text-slate-500">{t.termsLastUpdated}</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? '1. القبول والصفة القانونية' : '1. Acceptance & Legal Capacity'}
            </h2>
            <p>
              {language === 'ar'
                ? `باستخدام منصة ${BRAND_CONFIG.name} (${BRAND_CONFIG.arabicName})، فإنك توافق على الالتزام بكافة الشروط والضوابط المنصوص عليها هنا والامتثال للقوانين واللوائح الصحية المعمول بها في جمهورية العراق.`
                : `By using the ${BRAND_CONFIG.name} platform, you agree to comply with all governing terms herein and abide by applicable health regulations within the Republic of Iraq.`}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? '2. مسؤولية الكوادر الطبية' : '2. Medical Personnel Responsibilities'}
            </h2>
            <p>
              {language === 'ar'
                ? 'يقر الطبيب أو المركز الصحي بصحة كافة الوثائق والتراخيص المهنية المدخلة، ويتحمل المسؤولية الطبية والأخلاقية الكاملة عن الاستشارات والتشخيصات المقدمة وفق الأصول السريرية المتعارف عليها.'
                : 'Physicians and healthcare facilities warrant the authenticity of all submitted medical credentials and bear clinical responsibility for healthcare advice provided.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? '3. الاستخدام العادل والأمن السيبراني' : '3. Fair Use & Platform Security'}
            </h2>
            <p>
              {language === 'ar'
                ? 'يُحظر تماماً محاولة الوصول غير المصرح به لقواعد البيانات أو استغلال أي ثغرات أو انتحال صفة كوادر طبية أو إدارية. تحتفظ المنصة بحق اتخاذ الإجراءات القانونية بحق أي مخالفة.'
                : 'Unauthorized attempts to breach system controls, impersonate medical personnel, or tamper with clinical records are strictly prohibited and subject to legal prosecution.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              {language === 'ar' ? '4. قنوات الدعم والتعديلات' : '4. Support & Amendments'}
            </h2>
            <p>
              {language === 'ar'
                ? `تحتفظ المنصة بحق تحديث هذه الشروط لتعزيز الأداء وتحديث المعايير. للدعم والاستفسار: ${BRAND_CONFIG.support.email}.`
                : `The platform reserves the right to update these terms to enhance service delivery. For inquiries: ${BRAND_CONFIG.support.email}.`}
            </p>
          </section>
        </div>
      </PageContainer>
    </div>
  );
};
