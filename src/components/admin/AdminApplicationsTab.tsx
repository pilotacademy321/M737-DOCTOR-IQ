import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  MessageCircle,
  Mail,
  AlertCircle,
  Phone,
  Building,
  Award,
  Calendar,
  X,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { DoctorApplication } from '../../types/auth';
import { getWhatsAppSupportUrl } from '../../config/brand';

interface AdminApplicationsTabProps {
  applications: DoctorApplication[];
  onApprove: (app: DoctorApplication) => Promise<void>;
  onReject: (app: DoctorApplication, reason?: string) => Promise<void>;
  onRequestInfo: (app: DoctorApplication, message: string) => Promise<void>;
}

export const AdminApplicationsTab: React.FC<AdminApplicationsTabProps> = ({
  applications,
  onApprove,
  onReject,
  onRequestInfo,
}) => {
  const { language } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_approval' | 'active' | 'rejected'>('all');
  const [selectedApp, setSelectedApp] = useState<DoctorApplication | null>(null);

  // Modal dialog states
  const [confirmApproveModal, setConfirmApproveModal] = useState<DoctorApplication | null>(null);
  const [confirmRejectModal, setConfirmRejectModal] = useState<DoctorApplication | null>(null);
  const [requestInfoModal, setRequestInfoModal] = useState<DoctorApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('عدم تطابق بيانات تسجيل نقابة الأطباء أو نقص الوثائق');
  const [infoMessage, setInfoMessage] = useState('يرجى تزويد إدارة منصة M737 بنسخة إضافية من هوية نقابة الأطباء أو ترخيص العيادة.');
  const [isProcessing, setIsProcessing] = useState(false);

  const filtered = applications.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      app.fullName.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.specialization.toLowerCase().includes(query) ||
      app.syndicateId.toLowerCase().includes(query) ||
      (app.clinicName && app.clinicName.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const handleConfirmApproval = async () => {
    if (!confirmApproveModal) return;
    setIsProcessing(true);
    try {
      await onApprove(confirmApproveModal);
      setConfirmApproveModal(null);
      if (selectedApp?.doctorId === confirmApproveModal.doctorId) {
        setSelectedApp(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!confirmRejectModal) return;
    setIsProcessing(true);
    try {
      await onReject(confirmRejectModal, rejectionReason);
      setConfirmRejectModal(null);
      if (selectedApp?.doctorId === confirmRejectModal.doctorId) {
        setSelectedApp(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendInfoRequest = async () => {
    if (!requestInfoModal) return;
    setIsProcessing(true);
    try {
      await onRequestInfo(requestInfoModal, infoMessage);
      setRequestInfoModal(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {language === 'ar' ? 'إدارة وتدقيق طلبات اعتماد الأطباء' : 'Doctor Credential Auditing Desk'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {language === 'ar'
              ? 'مراجعة وتدقيق هويات نقابة الأطباء العراقية وتفعيل الصلاحيات السريرية رسمياً.'
              : 'Review and verify Iraqi Medical Syndicate credentials before activating clinical access.'}
          </p>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl text-xs font-bold self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-[#0A192F] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'الكل' : 'All'} ({applications.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending_approval')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'pending_approval' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'المعلقة' : 'Pending'} ({applications.filter((a) => a.status === 'pending_approval').length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'المعتمدة' : 'Approved'} ({applications.filter((a) => a.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'rejected' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'المرفوضة' : 'Rejected'} ({applications.filter((a) => a.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            language === 'ar'
              ? 'البحث باسم الطبيب، البريد الإلكتروني، الاختصاص، رقم النقابة...'
              : 'Search doctor name, email, specialty, syndicate ID...'
          }
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {language === 'ar' ? 'لا توجد طلبات تطابق معايير البحث' : 'No matching applications found'}
            </p>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'قم بتغيير خيارات التصفية أو البحث.' : 'Adjust search terms or status filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الطبيب' : 'Physician'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الاختصاص' : 'Specialty'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'رقم النقابة' : 'Syndicate ID'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'المحافظة والعيادة' : 'Governorate & Clinic'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'تاريخ التقديم' : 'Submitted'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app, idx) => (
                  <tr key={app.doctorId || `app-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{app.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{app.email}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{app.phoneNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {app.specialization}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {app.syndicateId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{app.governorate}</div>
                      <div className="text-[11px] text-slate-400">{app.clinicName || 'عيادة خاصة'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {app.status === 'pending_approval' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[11px]">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>{language === 'ar' ? 'قيد التدقيق' : 'Pending'}</span>
                        </span>
                      )}
                      {app.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{language === 'ar' ? 'معتمد' : 'Approved'}</span>
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 border border-red-300 text-red-800 font-bold text-[11px]">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span>{language === 'ar' ? 'مرفوض' : 'Rejected'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {/* View full details */}
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                        >
                          {language === 'ar' ? 'التفاصيل' : 'Details'}
                        </button>

                        {/* Approve button */}
                        {app.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() => setConfirmApproveModal(app)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            {language === 'ar' ? 'قبول' : 'Approve'}
                          </button>
                        )}

                        {/* Reject button */}
                        {app.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => setConfirmRejectModal(app)}
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-bold text-xs transition-colors cursor-pointer"
                          >
                            {language === 'ar' ? 'رفض' : 'Reject'}
                          </button>
                        )}

                        {/* Request info */}
                        <button
                          type="button"
                          onClick={() => setRequestInfoModal(app)}
                          title="طلب معلومات إضافية"
                          className="p-1 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-50 cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. APPLICATION DETAILS MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-black text-slate-900">
                  {language === 'ar' ? 'ملف اعتماد الطبيب السريري' : 'Doctor Credential Dossier'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of All Application Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</span>
                <span className="font-bold text-slate-900 text-sm">{selectedApp.fullName}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                <span className="font-mono font-bold text-slate-900">{selectedApp.email}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</span>
                <span className="font-mono font-bold text-slate-900">{selectedApp.phoneNumber}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'رقم تسجيل النقابة' : 'Syndicate ID'}</span>
                <span className="font-mono font-black text-amber-800 text-sm">{selectedApp.syndicateId}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'التخصص الطبي' : 'Specialty'}</span>
                <span className="font-bold text-slate-900">{selectedApp.specialization}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'المحافظة' : 'Governorate'}</span>
                <span className="font-bold text-slate-900">{selectedApp.governorate}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'العيادة أو المجمع' : 'Clinic'}</span>
                <span className="font-bold text-slate-900">{selectedApp.clinicName || 'عيادة خاصة'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'سنوات الخبرة' : 'Experience'}</span>
                <span className="font-bold text-slate-900">{selectedApp.yearsOfExperience || 5} {language === 'ar' ? 'سنوات' : 'Years'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'أجر الاستشارة' : 'Consultation Fee'}</span>
                <span className="font-mono font-bold text-slate-900">{selectedApp.consultationFee ? `${selectedApp.consultationFee.toLocaleString()} IQD` : '25,000 IQD'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'أوقات الدوام' : 'Working Hours'}</span>
                <span className="font-semibold text-slate-900">{selectedApp.workingHours || '4:00 PM - 9:00 PM'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'أيام الاستشارة الأسبوعية' : 'Working Days'}</span>
                <span className="font-semibold text-slate-900">{selectedApp.workingDays || 'السبت - الأربعاء'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'تاريخ التقديم وملاحظات التدقيق' : 'Submission & Review Details'}</span>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                  <span>تاريخ التقديم: <strong className="font-mono">{selectedApp.submittedAt ? new Date(selectedApp.submittedAt).toLocaleString() : '—'}</strong></span>
                  {selectedApp.reviewedAt && (
                    <span>تاريخ التدقيق: <strong className="font-mono">{new Date(selectedApp.reviewedAt).toLocaleString()}</strong></span>
                  )}
                </div>
                {selectedApp.reviewNotes && (
                  <p className="mt-1 text-slate-700 bg-white p-2 rounded border border-slate-200">{selectedApp.reviewNotes}</p>
                )}
              </div>
            </div>

            {/* Quick Action Footer in Dossier */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <a
                href={getWhatsAppSupportUrl(`السلام عليكم د. ${selectedApp.fullName}، بخصوص طلب اعتمادك في منصة M737...`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{language === 'ar' ? 'مراسلة عبر واتساب' : 'Chat via WhatsApp'}</span>
              </a>

              <div className="flex items-center gap-2">
                {selectedApp.status !== 'active' && (
                  <button
                    onClick={() => {
                      setConfirmApproveModal(selectedApp);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    {language === 'ar' ? 'قبول واعتماد' : 'Approve Application'}
                  </button>
                )}
                {selectedApp.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      setConfirmRejectModal(selectedApp);
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                  >
                    {language === 'ar' ? 'رفض الطلب' : 'Reject Application'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONFIRM APPROVAL DIALOG */}
      {confirmApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'ar' ? 'تأكيد اعتماد الطبيب رسمياً' : 'Confirm Physician Accreditation'}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmApproveModal.fullName} · {confirmApproveModal.syndicateId}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'ar'
                ? 'عند تأكيد الاعتماد، سيتم تفعيل حساب الطبيب في Firestore ليصبح قادراً على إدارة العيادة واستقبال مواعيد المرضى. سيتم تسجيل رقمك الإداري وطابع الوقت في سجل الرقابة.'
                : 'Confirming approval updates the doctor status in Firestore to active and allows patient booking. An immutable audit log will be created.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmApproveModal(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessing
                  ? language === 'ar' ? 'جاري الاعتماد...' : 'Approving...'
                  : language === 'ar' ? 'نعم، اعتماد الطبيب' : 'Yes, Approve Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONFIRM REJECTION DIALOG */}
      {confirmRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'ar' ? 'رفض طلب الاعتماد السريري' : 'Reject Credential Application'}
                </h3>
                <p className="text-xs text-slate-500">{confirmRejectModal.fullName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              {language === 'ar'
                ? 'يرجى توضيح سبب الرفض ليتم حفظه في سجل الطلب والتدقيق:'
                : 'Specify reason for rejection to be logged in application history:'}
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              required
              className="w-full p-3 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-red-500"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmRejectModal(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessing
                  ? language === 'ar' ? 'جاري الرفض...' : 'Rejecting...'
                  : language === 'ar' ? 'تأكيد الرفض' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. REQUEST ADDITIONAL INFO MODAL */}
      {requestInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'ar' ? 'طلب معلومات أو وثائق إضافية' : 'Request Additional Documentation'}
                </h3>
                <p className="text-xs text-slate-500">{requestInfoModal.fullName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              {language === 'ar'
                ? 'اكتب رسالة التوجيه للطبيب لإرفاق متطلبات إضافية:'
                : 'Enter clarification instructions for the physician:'}
            </p>

            <textarea
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRequestInfoModal(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSendInfoRequest}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'تسجيل الملاحظة' : 'Record Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
