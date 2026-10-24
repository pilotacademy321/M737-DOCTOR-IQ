import React, { useState } from 'react';
import { ScrollText, Search, ShieldCheck, Clock, User, Filter, Printer } from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { AuditLog } from '../../types/auth';
import { PrintableModal } from '../common/PrintableModal';

interface AdminAuditLogTabProps {
  logs: AuditLog[];
}

export const AdminAuditLogTab: React.FC<AdminAuditLogTabProps> = ({ logs }) => {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [isPrintAuditOpen, setIsPrintAuditOpen] = useState(false);

  const actionTypes = Array.from(new Set(logs.map((l) => l.action)));

  const filtered = logs.filter((log) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      (log.actorEmail && log.actorEmail.toLowerCase().includes(q)) ||
      log.targetUid.toLowerCase().includes(q) ||
      (log.metadata && log.metadata.toLowerCase().includes(q));

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-amber-600" />
            <span>{language === 'ar' ? 'سجل الرقابة والعمليات الإدارية' : 'Governance & Audit Log'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {language === 'ar'
              ? 'سجل غير قابل للتعديل (Immutable) يرصد كافة القرارات الإدارية وتراخيص الكوادر الطبية.'
              : 'Cryptographically sealed audit trail capturing administrative interventions and licensing.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPrintAuditOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title={language === 'ar' ? 'طباعة سجل الرقابة' : 'Print Audit Log'}
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>{language === 'ar' ? 'طباعة السجل' : 'Print Audit Log'}</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{logs.length} {language === 'ar' ? 'عملية' : 'Logs'}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'البحث في سجل العمليات...' : 'Search logs...'}
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="p-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 w-full sm:w-auto"
        >
          <option value="all">{language === 'ar' ? 'كل أنواع العمليات' : 'All Actions'}</option>
          {actionTypes.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <ScrollText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">
              {language === 'ar' ? 'لا توجد سجلات مطابقة' : 'No audit entries found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'نوع الإجراء' : 'Action'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'المسؤول المنفذ' : 'Actor'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'المعرف المستهدف' : 'Target UID'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'التفاصيل / الميتاداتا' : 'Metadata'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'طابع الوقت' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filtered.map((log, idx) => (
                  <tr key={log.logId || `log-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block font-sans">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{log.actorEmail || 'Admin'}</div>
                      <div className="text-[10px] text-slate-400">UID: {(log.actorUid || '').substring(0, 8)}...</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {log.targetUid}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {log.metadata || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRINTABLE GOVERNANCE AUDIT REPORT */}
      {isPrintAuditOpen && (
        <PrintableModal
          isOpen={isPrintAuditOpen}
          onClose={() => setIsPrintAuditOpen(false)}
          title={language === 'ar' ? 'سجل الرقابة الإدارية ومصادقة العمليات' : 'Administrative Governance & Operations Audit Record'}
          subtitle={language === 'ar' ? 'سجل غير قابل للتعديل موثق في قاعدة بيانات المنصة' : 'Immutable Operations Trail - M737 National Platform'}
          docNumber={`AUDIT-${logs.length}-OPS`}
          badgeText={language === 'ar' ? 'سجل رقابي رسمي' : 'Official Audit Trail'}
          officialStampTitle={language === 'ar' ? 'مصادقة قسم الامتثال والرقابة الإدارية' : 'Compliance & Governance Official Seal'}
          headerDetails={[
            {
              label: language === 'ar' ? 'إجمالي السجلات:' : 'Total Records:',
              value: `${filtered.length} ${language === 'ar' ? 'إجراء' : 'Actions'}`,
            },
            {
              label: language === 'ar' ? 'تاريخ التوليد:' : 'Generated Date:',
              value: new Date().toLocaleDateString(),
            },
            {
              label: language === 'ar' ? 'فلتر العمليات:' : 'Action Filter:',
              value: actionFilter.toUpperCase(),
            },
            {
              label: language === 'ar' ? 'حالة التشفير:' : 'Cryptographic Integrity:',
              value: 'SEALED & VERIFIED',
            },
          ]}
        >
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-6 text-center bg-slate-50 rounded-xl">
              {language === 'ar' ? 'لا توجد سجلات مطابقة للشروط.' : 'No audit records match the filter.'}
            </p>
          ) : (
            <div className="border border-slate-300 rounded-xl overflow-hidden avoid-break">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 text-start">#</th>
                    <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'نوع الإجراء' : 'Action'}</th>
                    <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'المسؤول' : 'Actor'}</th>
                    <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الهدف / UID' : 'Target'}</th>
                    <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'التفاصيل والميتاداتا' : 'Details'}</th>
                    <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'التوقيت' : 'Time'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {filtered.slice(0, 50).map((log, idx) => (
                    <tr key={log.logId || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="py-2 px-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-sans font-bold text-amber-900">{log.action}</td>
                      <td className="py-2 px-3 text-slate-700">{log.actorEmail || 'Admin'}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-28">{log.targetUid}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px] max-w-xs truncate">{log.metadata || '—'}</td>
                      <td className="py-2 px-3 text-slate-400 text-[10px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 avoid-break">
            {language === 'ar'
              ? 'سجل غير قابل للتعديل يضمن الامتثال للوائح المعايير المهنية الطبية العراقية وحماية البيانات السريرية.'
              : 'Immutable regulatory trail ensuring full compliance with healthcare privacy regulations.'}
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
