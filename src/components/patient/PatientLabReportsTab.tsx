import React, { useState } from 'react';
import {
  FlaskConical,
  Search,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Filter,
  FileText,
  X,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { LabReportRecord } from '../../types/database';
import { useLanguage } from '../../localization/LanguageContext';
import { formatIraqDate } from '../../utils/timezoneUtils';
import { PrintableModal } from '../common/PrintableModal';

interface PatientLabReportsTabProps {
  labReports: LabReportRecord[];
  isLoading: boolean;
}

export const PatientLabReportsTab: React.FC<PatientLabReportsTabProps> = ({
  labReports,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<LabReportRecord | null>(null);
  const [selectedPrintReport, setSelectedPrintReport] = useState<LabReportRecord | null>(null);

  const filteredReports = labReports.filter((rep) => {
    if (typeFilter !== 'all' && rep.testType !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rep.testName.toLowerCase().includes(q) ||
      rep.laboratoryName.toLowerCase().includes(q) ||
      rep.findings.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            <span>{isAr ? 'تقاريري وفحوصاتي المخبرية' : 'My Laboratory & Diagnostic Reports'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'سجل نتائج التحاليل السريرية، الأشعة، وتقارير الفحوصات الطبية المعتمدة في ملفك.'
              : 'Laboratory test findings, imaging interpretations, and pathology records.'}
          </p>
        </div>

        <div className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {labReports.length} {isAr ? 'تقرير مخبري' : 'Total Reports'}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث باسم الفحص، المختبر، أو النتيجة...' : 'Search test name, lab, or findings...'}
            className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-purple-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] me-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {isAr ? 'النوع:' : 'Type:'}
          </span>
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All' },
            { id: 'blood', labelAr: 'دم', labelEn: 'Blood' },
            { id: 'imaging', labelAr: 'أشعة/سونار', labelEn: 'Imaging' },
            { id: 'pathology', labelAr: 'نسيجي', labelEn: 'Pathology' },
            { id: 'biochemistry', labelAr: 'كيمياء', labelEn: 'Bio' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTypeFilter(item.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                typeFilter === item.id
                  ? 'bg-purple-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? item.labelAr : item.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isAr ? 'لا توجد تقارير مخبرية مسجلة في ملفك حتى الآن' : 'No laboratory reports recorded yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAr
                ? 'ستظهر هنا نتائج الفحوصات والتحاليل فور تسجيلها وإرفاقها من قبل طبيبك المعالج أو المختبر.'
                : 'Diagnostic results shared by your physician will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">{report.testName}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">
                      {report.testType.toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        report.status === 'normal'
                          ? 'bg-emerald-50 text-emerald-800'
                          : report.status === 'abnormal'
                          ? 'bg-amber-50 text-amber-800'
                          : report.status === 'critical'
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {report.status === 'normal' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {report.status === 'abnormal' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      {report.status === 'critical' && <XCircle className="w-3 h-3 text-rose-600" />}
                      {report.status === 'pending' && <Clock className="w-3 h-3 text-slate-500" />}
                      <span>{report.status.toUpperCase()}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {report.laboratoryName}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 font-semibold">{formatIraqDate(report.testDate, isAr)}</span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <strong className="text-slate-900">{isAr ? 'النتائج والملاحظات:' : 'Findings:'}</strong> {report.findings}
                    {report.normalRange && (
                      <span className="text-slate-500 block text-[11px] mt-0.5 font-mono">
                        {isAr ? 'المعدل الطبيعي المرجعي:' : 'Reference range:'} {report.normalRange}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => setSelectedPrintReport(report)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-purple-50 text-purple-700 cursor-pointer transition-colors"
                    title={isAr ? 'طباعة التقرير المخبري' : 'Print Lab Report'}
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedReport(report)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isAr ? 'عرض التفاصيل' : 'View Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-purple-600" />
                <span>{selectedReport.testName}</span>
              </h3>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'المختبر المنفذ:' : 'Lab:'}</span>
                <strong className="text-slate-900">{selectedReport.laboratoryName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'تاريخ التحليل:' : 'Date:'}</span>
                <span className="font-semibold text-slate-800">{formatIraqDate(selectedReport.testDate, isAr)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'حالة النتيجة:' : 'Status:'}</span>
                <span className="font-bold uppercase text-purple-800">{selectedReport.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 font-bold">{isAr ? 'التقرير السريري والنتائج:' : 'Findings:'}</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-wrap text-slate-800 font-sans">
                  {selectedReport.findings}
                </div>
              </div>
              {selectedReport.normalRange && (
                <div>
                  <span className="text-slate-500 block mb-0.5">{isAr ? 'المعدل الطبيعي:' : 'Reference Range:'}</span>
                  <span className="font-mono text-slate-800">{selectedReport.normalRange}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedPrintReport(selectedReport)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة التقرير المخبري' : 'Print Report'}</span>
              </button>

              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL IRAQI LAB REPORT PRINT MODAL */}
      {selectedPrintReport && (
        <PrintableModal
          isOpen={!!selectedPrintReport}
          onClose={() => setSelectedPrintReport(null)}
          title={isAr ? 'تقرير فحص وتحليل مخبري معتمد' : 'Official Diagnostic Laboratory Report'}
          subtitle={selectedPrintReport.laboratoryName}
          docNumber={`LAB-${selectedPrintReport.id?.substring(0, 8).toUpperCase() || 'REPORT'}`}
          badgeText={selectedPrintReport.status.toUpperCase()}
          officialStampTitle={isAr ? 'ختم وتوقيع الطبيب الأخصائي بالمختبر' : 'Clinical Pathologist Seal & Signature'}
          headerDetails={[
            {
              label: isAr ? 'المختبر المعتمد:' : 'Accredited Lab:',
              value: selectedPrintReport.laboratoryName,
            },
            {
              label: isAr ? 'نوع الفحص:' : 'Test Category:',
              value: selectedPrintReport.testType?.toUpperCase() || 'GENERAL',
            },
            {
              label: isAr ? 'تاريخ التحليل:' : 'Collection Date:',
              value: formatIraqDate(selectedPrintReport.testDate, isAr),
            },
            {
              label: isAr ? 'حالة التقرير:' : 'Result Flag:',
              value: selectedPrintReport.status.toUpperCase(),
            },
          ]}
        >
          {/* Test Name & Category Bar */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 avoid-break">
            <div>
              <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">
                {isAr ? 'اسم الفحص السريري المطلوب:' : 'Diagnostic Investigation:'}
              </span>
              <h3 className="text-base font-black text-slate-900">{selectedPrintReport.testName}</h3>
            </div>
            <div className="text-end">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-purple-900 border border-purple-200">
                {selectedPrintReport.status === 'normal'
                  ? (isAr ? 'نتيجة طبيعية (Normal)' : 'Normal')
                  : selectedPrintReport.status === 'critical'
                  ? (isAr ? 'قيمة حرجة (Critical)' : 'Critical')
                  : (isAr ? 'غير طبيعي (Abnormal)' : 'Abnormal')}
              </span>
            </div>
          </div>

          {/* Findings Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden avoid-break">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-4 text-start">{isAr ? 'بيان الفحص / المؤشر' : 'Investigation Parameter'}</th>
                  <th className="py-2.5 px-4 text-start">{isAr ? 'النتيجة المرصودة' : 'Observed Value'}</th>
                  <th className="py-2.5 px-4 text-start">{isAr ? 'المعدل المرجعي الطبيعي' : 'Biological Reference'}</th>
                  <th className="py-2.5 px-4 text-start">{isAr ? 'التقييم' : 'Flag'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">{selectedPrintReport.testName}</td>
                  <td className="py-3 px-4 font-mono font-bold text-purple-900 text-sm whitespace-pre-wrap">
                    {selectedPrintReport.findings}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {selectedPrintReport.normalRange || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[11px] uppercase text-purple-800">
                      {selectedPrintReport.status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes if any */}
          {selectedPrintReport.notes && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 avoid-break">
              <span className="font-bold text-slate-900 block text-[11px]">
                {isAr ? 'ملاحظات وتوصيات المختبر السريري:' : 'Clinical Pathology Notes & Recommendations:'}
              </span>
              <p className="text-[11px] leading-relaxed font-sans">{selectedPrintReport.notes}</p>
            </div>
          )}

          {/* Official Quality Standard */}
          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 avoid-break">
            {isAr
              ? 'تم إجراء الفحص وفق المعايير القياسية لضبط الجودة المخبرية السريرية المعترف بها في جمهورية العراق.'
              : 'Conducted under recognized clinical laboratory quality standards in the Republic of Iraq.'}
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
