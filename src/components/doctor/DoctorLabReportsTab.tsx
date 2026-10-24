import React, { useState } from 'react';
import {
  FlaskConical,
  Search,
  Plus,
  FileText,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Filter,
  X,
  ExternalLink,
  Upload,
  Printer,
} from 'lucide-react';
import { LabReportRecord, AppointmentRecord } from '../../types/database';
import { UserProfile } from '../../types/auth';
import { useLanguage } from '../../localization/LanguageContext';
import { getIraqToday, formatIraqDate } from '../../utils/timezoneUtils';
import { PrintableModal } from '../common/PrintableModal';

interface DoctorLabReportsTabProps {
  labReports: LabReportRecord[];
  userProfile: UserProfile | null;
  appointments: AppointmentRecord[];
  onAddLabReport: (report: Omit<LabReportRecord, 'id' | 'uploadedAt'>) => Promise<void>;
  isLoading: boolean;
}

export const DoctorLabReportsTab: React.FC<DoctorLabReportsTabProps> = ({
  labReports,
  userProfile,
  appointments,
  onAddLabReport,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<LabReportRecord | null>(null);
  const [selectedPrintReport, setSelectedPrintReport] = useState<LabReportRecord | null>(null);

  // Form states
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [testName, setTestName] = useState('');
  const [testType, setTestType] = useState<LabReportRecord['testType']>('blood');
  const [testDate, setTestDate] = useState(getIraqToday());
  const [laboratoryName, setLaboratoryName] = useState('');
  const [findings, setFindings] = useState('');
  const [normalRange, setNormalRange] = useState('');
  const [status, setStatus] = useState<LabReportRecord['status']>('normal');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectRecentPatient = (app: AppointmentRecord) => {
    setPatientId(app.patientId);
    setPatientName(app.patientName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !testName || !findings) return;

    setIsSubmitting(true);
    try {
      await onAddLabReport({
        patientId: patientId || `p_${Date.now()}`,
        patientName,
        doctorId: userProfile?.uid || '',
        doctorName: userProfile?.displayName || 'طبيب استشاري',
        testName,
        testType,
        testDate,
        laboratoryName: laboratoryName || (isAr ? 'مختبر بغداد المركزي' : 'Baghdad Central Lab'),
        findings,
        normalRange,
        status,
        notes,
        fileName: fileName || (isAr ? 'تقرير_مختبري_معتمد.pdf' : 'lab_report.pdf'),
        documentUrl: documentUrl || undefined,
      });

      setIsAddModalOpen(false);
      // Reset form
      setPatientName('');
      setTestName('');
      setFindings('');
      setNormalRange('');
      setNotes('');
      setFileName('');
      setDocumentUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReports = labReports.filter((rep) => {
    if (typeFilter !== 'all' && rep.testType !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rep.patientName.toLowerCase().includes(q) ||
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
            <span>{isAr ? 'إدارة التقارير والفحوصات المخبرية' : 'Laboratory & Diagnostic Reports'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'متابعة نتائج التحاليل السريرية، الأشعة، تقارير المختبرات، وتوثيق النتائج الحرجة.'
              : 'Track laboratory tests, imaging reports, pathology results, and diagnostic files.'}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'تسجيل فحص مخبري جديد' : 'Add Lab Report'}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث باسم المراجع، الفحص، أو المختبر...' : 'Search by patient, test name, or laboratory...'}
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
              {isAr ? 'لا توجد تقارير مخبرية مسجلة حتى الآن' : 'No laboratory reports recorded yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAr
                ? 'يمكنك إضافة فحص مخبري ونتائج التحاليل وربطها بملف المراجع للمتابعة السريرية.'
                : 'Click "Add Lab Report" to log test results, ranges, and findings.'}
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
                    {/* Status Pill */}
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
                    <span>
                      {isAr ? 'المراجع:' : 'Patient:'} <strong className="text-slate-900">{report.patientName}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      {report.laboratoryName}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 font-semibold">{formatIraqDate(report.testDate, isAr)}</span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <strong className="text-slate-900">{isAr ? 'النتائج والملاحظات المخبرية:' : 'Findings:'}</strong> {report.findings}
                    {report.normalRange && (
                      <span className="text-slate-500 block text-[11px] mt-0.5 font-mono">
                        {isAr ? 'المعدل الطبيعي:' : 'Normal range:'} {report.normalRange}
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
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isAr ? 'عرض التفاصيل' : 'View Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD LAB REPORT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-purple-600" />
                <span>{isAr ? 'تسجيل نتيجة فحص مخبري' : 'Record Laboratory Test Result'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick patient pick */}
            {appointments.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  {isAr ? 'اختيار مراجع من حجوزات العيادة:' : 'Select Clinic Patient:'}
                </label>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {appointments.slice(0, 5).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleSelectRecentPatient(a)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {a.patientName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'اسم المراجع *' : 'Patient Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={isAr ? 'اسم المراجع' : 'Patient name'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'اسم الفحص / التحليل *' : 'Test Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder={isAr ? 'مثال: CBC, Lipid Profile, سونار البطن' : 'e.g. CBC, Ultrasound'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'نوع الفحص' : 'Test Type'}
                </label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as LabReportRecord['testType'])}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-purple-500"
                >
                  <option value="blood">{isAr ? 'تحاليل الدم (Blood)' : 'Blood'}</option>
                  <option value="imaging">{isAr ? 'الأشعة والسونار (Imaging)' : 'Imaging'}</option>
                  <option value="biochemistry">{isAr ? 'الكيمياء الحيوية (Biochemistry)' : 'Biochemistry'}</option>
                  <option value="pathology">{isAr ? 'علم الأمراض والأنسجة (Pathology)' : 'Pathology'}</option>
                  <option value="urine">{isAr ? 'تحاليل الإدرار (Urine)' : 'Urine'}</option>
                  <option value="other">{isAr ? 'أخرى (Other)' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'تاريخ الفحص' : 'Test Date'}
                </label>
                <input
                  type="date"
                  required
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'المختبر المنفذ' : 'Laboratory Name'}
                </label>
                <input
                  type="text"
                  value={laboratoryName}
                  onChange={(e) => setLaboratoryName(e.target.value)}
                  placeholder={isAr ? 'مثال: مختبر بغداد التخصصي' : 'Lab name'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'حالة النتيجة' : 'Result Status'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LabReportRecord['status'])}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-purple-500"
                >
                  <option value="normal">{isAr ? 'طبيعي (Normal)' : 'Normal'}</option>
                  <option value="abnormal">{isAr ? 'غير طبيعي (Abnormal)' : 'Abnormal'}</option>
                  <option value="critical">{isAr ? 'حرج (Critical)' : 'Critical'}</option>
                  <option value="pending">{isAr ? 'قيد الانتظار (Pending)' : 'Pending'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'النتائج والقيم المرصودة (Findings) *' : 'Findings & Values *'}
              </label>
              <textarea
                required
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                rows={3}
                placeholder={isAr ? 'مثال: الهيموغلوبين 13.5 g/dL، الصفائح الدموية 250,000...' : 'e.g. Hemoglobin 13.5 g/dL...'}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'المعدل المرجعي الطبيعي (اختياري)' : 'Normal Reference Range'}
              </label>
              <input
                type="text"
                value={normalRange}
                onChange={(e) => setNormalRange(e.target.value)}
                placeholder="12.0 - 16.0 g/dL"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isSubmitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التقرير المخبري' : 'Save Report')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{selectedReport.testName}</h3>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'المراجع:' : 'Patient:'}</span>
                <strong className="text-slate-900">{selectedReport.patientName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'المختبر:' : 'Lab:'}</span>
                <span>{selectedReport.laboratoryName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'التاريخ:' : 'Date:'}</span>
                <span className="font-semibold text-slate-800">{formatIraqDate(selectedReport.testDate, isAr)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 font-bold">{isAr ? 'النتائج التفصيلية:' : 'Findings:'}</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-wrap font-sans text-slate-800">
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
          officialStampTitle={isAr ? 'ختم وتوقيع الطبيب الأخصائي / إدارة المختبر' : 'Clinical Pathologist Seal & Signature'}
          headerDetails={[
            {
              label: isAr ? 'المراجع:' : 'Patient Name:',
              value: selectedPrintReport.patientName,
            },
            {
              label: isAr ? 'المختبر المنفذ:' : 'Laboratory:',
              value: selectedPrintReport.laboratoryName,
            },
            {
              label: isAr ? 'تاريخ الفحص:' : 'Test Date:',
              value: formatIraqDate(selectedPrintReport.testDate, isAr),
            },
            {
              label: isAr ? 'الطبيب المعالج:' : 'Physician:',
              value: selectedPrintReport.doctorName || userProfile?.displayName || 'طبيب استشاري',
            },
          ]}
        >
          {/* Test Name & Status Header */}
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
                  ? (isAr ? 'طبيعي (Normal)' : 'Normal')
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
                  <th className="py-2.5 px-4 text-start">{isAr ? 'التقييم السريري' : 'Flag'}</th>
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

          {/* Clinical Interpretation Notes */}
          {selectedPrintReport.notes && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 avoid-break">
              <span className="font-bold text-slate-900 block text-[11px]">
                {isAr ? 'ملاحظات وتوصيات المختبر السريري:' : 'Clinical Pathology Notes & Recommendations:'}
              </span>
              <p className="text-[11px] leading-relaxed font-sans">{selectedPrintReport.notes}</p>
            </div>
          )}

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 avoid-break">
            {isAr
              ? 'صادر بموجب الضوابط المخبرية السريرية المعتمدة لدى نقابة الأطباء ووزارة الصحة العراقية.'
              : 'Issued in accordance with recognized clinical standards in Iraq.'}
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
