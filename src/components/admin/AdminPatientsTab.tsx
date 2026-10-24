import React, { useState } from 'react';
import { Users, Search, ShieldCheck, MapPin, Phone, Calendar, ChevronRight, ChevronLeft, Printer } from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { UserProfile } from '../../types/auth';
import { PrintableModal } from '../common/PrintableModal';

interface AdminPatientsTabProps {
  patients: UserProfile[];
}

export const AdminPatientsTab: React.FC<AdminPatientsTabProps> = ({ patients }) => {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isPrintPatientsOpen, setIsPrintPatientsOpen] = useState(false);
  const pageSize = 10;

  const filtered = patients.filter((pat) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      !q ||
      (pat.displayName && pat.displayName.toLowerCase().includes(q)) ||
      (pat.email && pat.email.toLowerCase().includes(q)) ||
      (pat.uid && pat.uid.toLowerCase().includes(q)) ||
      (pat.governorate && pat.governorate.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {language === 'ar' ? 'سجل المراجعين والمرضى' : 'Patient Identity Registry'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {language === 'ar'
              ? 'إدارة حسابات المراجعين مع الحفاظ التام على خصوصية السجلات والتشخيصات الطبية.'
              : 'Administrative identity directory strictly isolating sensitive medical records.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPrintPatientsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title={language === 'ar' ? 'طباعة سجل المراجعين' : 'Print Patients Register'}
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ar' ? 'طباعة السجل' : 'Print Register'}</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ar' ? 'مشفر' : 'Isolated'}</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={
              language === 'ar'
                ? 'البحث باسم المراجع، البريد الإلكتروني، المعرف أو المحافظة...'
                : 'Search patient name, email, UID, governorate...'
            }
            className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">
              {language === 'ar' ? 'لا يوجد مراجعون مطابقون' : 'No patients found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'المراجع' : 'Patient'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'معرف المستخدم' : 'User UID'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'المحافظة' : 'Governorate'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'فصيلة الدم' : 'Blood Group'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'تاريخ التسجيل' : 'Registered'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((pat, idx) => (
                  <tr key={pat.uid || `pat-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{pat.displayName || 'مراجع M737'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{pat.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {pat.uid.substring(0, 10)}...
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {pat.governorate || 'بغداد'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {pat.phoneNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-red-700">
                      {pat.bloodType || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {pat.createdAt ? new Date(pat.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              {language === 'ar' ? 'الصفحة' : 'Page'} {page} {language === 'ar' ? 'من' : 'of'} {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PRINTABLE PATIENTS REGISTRY */}
      {isPrintPatientsOpen && (
        <PrintableModal
          isOpen={isPrintPatientsOpen}
          onClose={() => setIsPrintPatientsOpen(false)}
          title={language === 'ar' ? 'سجل هويات المراجعين والمرضى المعتمد' : 'Official Patient Healthcare Directory'}
          subtitle={language === 'ar' ? 'سجل هويات المراجعين مع العزل التام للبيانات والملفات السريرية' : 'Verified Identity Registry - M737 National Healthcare'}
          docNumber={`REG-PATS-${patients.length}`}
          badgeText={language === 'ar' ? 'سجل المراجعين' : 'Patients Registry'}
          officialStampTitle={language === 'ar' ? 'مصادقة قسم السجلات الطبية وشؤون المرضى' : 'Patient Relations & Records Official Seal'}
          headerDetails={[
            {
              label: language === 'ar' ? 'إجمالي المراجعين:' : 'Total Patients:',
              value: `${filtered.length} ${language === 'ar' ? 'مراجع' : 'Patients'}`,
            },
            {
              label: language === 'ar' ? 'تاريخ التقرير:' : 'Report Date:',
              value: new Date().toLocaleDateString(),
            },
            {
              label: language === 'ar' ? 'حالة السجلات:' : 'EHR Isolation:',
              value: 'ENCRYPTED & PRIVACY GUARDED',
            },
            {
              label: language === 'ar' ? 'نظام الحفظ:' : 'Storage System:',
              value: 'Cloud Firestore Iraq Network',
            },
          ]}
        >
          <div className="border border-slate-300 rounded-xl overflow-hidden avoid-break">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3 text-start">#</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'اسم المراجع' : 'Patient Name'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'المحافظة' : 'Governorate'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'المعرف UID' : 'UID'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((pat, idx) => (
                  <tr key={pat.uid} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{pat.displayName || 'مراجع بدون اسم'}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{pat.phoneNumber || '—'}</td>
                    <td className="py-2 px-3 text-slate-600">{pat.governorate || 'بغداد'}</td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px] truncate max-w-36">{pat.email || '—'}</td>
                    <td className="py-2 px-3 font-mono text-slate-400 text-[10px] truncate max-w-28">{pat.uid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
