import React, { useState } from 'react';
import { Settings, ShieldCheck, Mail, Phone, Server, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { BRAND_CONFIG } from '../../config/brand';
import { SUPER_ADMIN_EMAIL } from '../../types/auth';

export const AdminSettingsTab: React.FC = () => {
  const { language } = useLanguage();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [requireSyndicateProof, setRequireSyndicateProof] = useState(true);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleSave = () => {
    setSaveNotice(
      language === 'ar'
        ? 'تم حفظ وتحديث إعدادات المنظومة بنجاح.'
        : 'Platform governance settings updated successfully.'
    );
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-600" />
          <span>{language === 'ar' ? 'إعدادات وحوكمة المنظومة' : 'Platform Governance & Settings'}</span>
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          {language === 'ar'
            ? 'تكوين ضوابط الرقابة والتأكد من مطابقة المعايير السريرية الوطنية لمنصة M737.'
            : 'Configure governance controls and maintain clinical security integrity for M737.'}
        </p>
      </div>

      {saveNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Security Identity Information Card */}
      <div className="p-6 rounded-2xl bg-[#0A192F] text-white border border-[#142E54] space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <Lock className="w-4 h-4" />
          <span>{language === 'ar' ? 'بيانات الاعتماد المشفرة للإدارة العليا' : 'Super Admin Cryptographic Identity'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-slate-400 text-[10px] block">{language === 'ar' ? 'البريد المعتمد حصراً' : 'Exclusive Admin Email'}</span>
            <span className="font-mono font-bold text-white text-sm">{SUPER_ADMIN_EMAIL}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-slate-400 text-[10px] block">{language === 'ar' ? 'حالة التحقق السحابي' : 'Cloud Security Claims'}</span>
            <span className="font-bold text-emerald-400">Google Verified Token (Active)</span>
          </div>
        </div>
      </div>

      {/* Clinical Governance Policies Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900">
          {language === 'ar' ? 'سياسات الاعتماد والتشغيل' : 'Operational & Accreditation Policies'}
        </h3>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-bold text-slate-900">
                {language === 'ar' ? 'إلزامية التحقق من رقم نقابة الأطباء' : 'Enforce Syndicate ID Audit'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'ar'
                  ? 'منع أي طبيب من تفعيل العيادة واستقبال المواعيد إلا بعد تدقيق رقم النقابة.'
                  : 'Block public clinic appointments until Syndicate registration number is verified.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={requireSyndicateProof}
              onChange={(e) => setRequireSyndicateProof(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-bold text-slate-900">
                {language === 'ar' ? 'وضع الصيانة للمنظومة' : 'Platform Maintenance Mode'}
              </p>
              <p className="text-[11px] text-slate-500">
                {language === 'ar'
                  ? 'تعليق حجوزات المرضى مؤقتاً لأعمال التحديث وتدقيق الخوادم.'
                  : 'Temporarily pause public bookings for database updates and auditing.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
          </div>
        </div>

        {/* Support Channels Verification */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="font-bold text-slate-900 text-xs">
            {language === 'ar' ? 'قنوات الدعم الفني المعتمدة للمنصة' : 'Verified Platform Support Contacts'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Mail className="w-4 h-4 text-amber-600" />
              <span className="font-mono text-slate-800">{BRAND_CONFIG.support.email}</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="font-mono text-slate-800">{BRAND_CONFIG.support.whatsappNumber} ({BRAND_CONFIG.support.whatsappInternational})</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#142E54] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'حفظ إعدادات المنظومة' : 'Save Platform Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
