import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Building,
  User,
  Phone,
  AlertCircle,
  MessageSquare,
  FileText,
  X,
  FileSignature,
  Paperclip,
  Download,
  Image as ImageIcon,
  Printer,
} from 'lucide-react';
import { AppointmentRecord, MedicalAttachment } from '../../types/database';
import { useLanguage } from '../../localization/LanguageContext';
import { getIraqToday, formatIraqDate, formatIraqTime } from '../../utils/timezoneUtils';
import { PrintableModal } from '../common/PrintableModal';

interface PatientAppointmentsTabProps {
  appointments: AppointmentRecord[];
  onCancelAppointment: (appointmentId: string, reason: string) => Promise<void>;
  onOpenMessageWithDoctor?: (doctorId: string, doctorName: string) => void;
  isLoading: boolean;
}

export const PatientAppointmentsTab: React.FC<PatientAppointmentsTabProps> = ({
  appointments,
  onCancelAppointment,
  onOpenMessageWithDoctor,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [filterStatus, setFilterStatus] = useState<
    'all' | 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cancellation modal state
  const [cancelModalAppointment, setCancelModalAppointment] = useState<AppointmentRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Detail Modal & Attachment state
  const [detailAppointment, setDetailAppointment] = useState<AppointmentRecord | null>(null);
  const [detailAttachments, setDetailAttachments] = useState<MedicalAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Printing State
  const [selectedPrintAppointment, setSelectedPrintAppointment] = useState<AppointmentRecord | null>(null);

  // Load attachments when detail appointment is opened
  useEffect(() => {
    if (!detailAppointment || !detailAppointment.attachmentIds || detailAppointment.attachmentIds.length === 0) {
      setDetailAttachments([]);
      return;
    }

    const loadAttachments = async () => {
      setLoadingAttachments(true);
      const list: MedicalAttachment[] = [];
      for (const id of detailAppointment.attachmentIds || []) {
        try {
          const snap = await getDoc(doc(db, 'medical_attachments', id));
          if (snap.exists()) {
            list.push({ id: snap.id, ...(snap.data() as any) });
          }
        } catch (e) {
          console.warn('Error loading detail attachment:', e);
        }
      }
      setDetailAttachments(list);
      setLoadingAttachments(false);
    };

    loadAttachments();
  }, [detailAppointment]);

  const nowStr = getIraqToday();

  const filteredAppointments = appointments.filter((app) => {
    // Status Filter
    if (filterStatus === 'upcoming') {
      if (app.status !== 'confirmed' || app.date < nowStr) return false;
    } else if (filterStatus === 'pending') {
      if (app.status !== 'pending') return false;
    } else if (filterStatus === 'confirmed') {
      if (app.status !== 'confirmed') return false;
    } else if (filterStatus === 'completed') {
      if (app.status !== 'completed') return false;
    } else if (filterStatus === 'cancelled') {
      if (app.status !== 'cancelled') return false;
    } else if (filterStatus === 'rejected') {
      if (app.status !== 'rejected') return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDoc = app.doctorName?.toLowerCase().includes(q);
      const matchSpecialty = app.specialty?.toLowerCase().includes(q);
      const matchId = app.id?.toLowerCase().includes(q);
      if (!matchDoc && !matchSpecialty && !matchId) return false;
    }

    return true;
  });

  const handleConfirmCancel = async () => {
    if (!cancelModalAppointment) return;
    setIsSubmittingCancel(true);
    try {
      await onCancelAppointment(
        cancelModalAppointment.id,
        cancelReason || (isAr ? 'تم الإلغاء من قبل المراجع' : 'Cancelled by patient')
      );
      setCancelModalAppointment(null);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-sky-600" />
            <span>{isAr ? 'مواعيدي وحجوزاتي السريرية' : 'My Clinic Appointments'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'متابعة وتدقيق حالة المواعيد، طلبات الحجز المعلقة، والمواعيد المؤكدة والسابقة.'
              : 'Review your appointment history, pending requests, confirmed bookings, and clinical summaries.'}
          </p>
        </div>

        <div className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {appointments.length} {isAr ? 'حجز مسجل' : 'Total Bookings'}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث باسم الطبيب، التخصص، أو كود الحجز...' : 'Search doctor, specialty, or booking reference...'}
            className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-sky-500 focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] me-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {isAr ? 'الحالة:' : 'Filter:'}
          </span>
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All' },
            { id: 'upcoming', labelAr: 'القادمة', labelEn: 'Upcoming' },
            { id: 'pending', labelAr: 'قيد الانتظار', labelEn: 'Pending' },
            { id: 'confirmed', labelAr: 'مؤكد', labelEn: 'Confirmed' },
            { id: 'completed', labelAr: 'مكتمل', labelEn: 'Completed' },
            { id: 'cancelled', labelAr: 'ملغي', labelEn: 'Cancelled' },
            { id: 'rejected', labelAr: 'معتذر عنه', labelEn: 'Rejected' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id as typeof filterStatus)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? item.labelAr : item.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isAr ? 'لا توجد مواعيد تطابق الفلاتر المحددة' : 'No appointments match the filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAr
                ? 'يمكنك البحث عن طبيب استشاري وطلب حجز موعد جديد في أي وقت.'
                : 'Search for a specialist doctor to schedule your next visit.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map((app) => {
              const isPending = app.status === 'pending';
              const isConfirmed = app.status === 'confirmed';
              const isCompleted = app.status === 'completed';
              const isCancelled = app.status === 'cancelled';
              const isRejected = app.status === 'rejected';

              // Patient is allowed to cancel if status is pending or confirmed (upcoming)
              const canCancel = isPending || (isConfirmed && app.date >= nowStr);

              return (
                <div
                  key={app.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {app.id}
                      </span>
                      <h3 className="text-sm font-black text-slate-900">
                        {app.doctorName || (isAr ? 'طبيب استشاري' : 'Specialist')}
                      </h3>
                      <span className="text-xs font-semibold text-sky-700">
                        {app.specialty}
                      </span>
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isConfirmed
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : isCompleted
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : isRejected
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isConfirmed && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                        {isCompleted && <CheckCircle2 className="w-3 h-3 text-sky-600" />}
                        {isCancelled && <XCircle className="w-3 h-3 text-rose-600" />}
                        {isRejected && <AlertCircle className="w-3 h-3 text-purple-600" />}
                        <span>
                          {isConfirmed && (isAr ? 'مؤكد' : 'Confirmed')}
                          {isPending && (isAr ? 'قيد المراجعة' : 'Pending')}
                          {isCompleted && (isAr ? 'مكتمل' : 'Completed')}
                          {isCancelled && (isAr ? 'ملغي' : 'Cancelled')}
                          {isRejected && (isAr ? 'معتذر عنه' : 'Declined')}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {app.clinicName} · {app.clinicGovernorate}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-amber-800">
                        {(app.consultationFee || 25000).toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
                      </span>
                    </div>

                    {/* Cancellation reason if present */}
                    {app.cancellationReason && (
                      <p className="text-xs text-rose-900 bg-rose-50 p-2 rounded-lg border border-rose-100 max-w-xl">
                        <strong className="text-rose-950">{isAr ? 'سبب الإلغاء:' : 'Reason:'}</strong> {app.cancellationReason}
                      </p>
                    )}

                    {/* Doctor clinical notes if completed */}
                    {app.clinicalNotes && (
                      <p className="text-xs text-sky-900 bg-sky-50 p-2 rounded-lg border border-sky-100 max-w-xl">
                        <strong className="text-sky-950">{isAr ? 'ملاحظات الكشف السريري:' : 'Doctor Findings:'}</strong> {app.clinicalNotes}
                      </p>
                    )}

                    {/* Medical Attachment Indicator */}
                    {app.attachmentIds && app.attachmentIds.length > 0 && (
                      <div className="pt-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-bold">
                          <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                          <span>
                            {isAr
                              ? `تم إرفاق تقارير طبية مع الحجز (${app.attachmentIds.length})`
                              : `Attached medical documents (${app.attachmentIds.length})`}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right side: Date, time & actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 self-end lg:self-center">
                    <div className="text-end pe-2">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-end">
                        <Calendar className="w-3.5 h-3.5 text-sky-600" />
                        <span>{formatIraqDate(app.date, isAr)}</span>
                      </div>
                      <div className="text-xs text-sky-800 font-bold font-mono">
                        {formatIraqTime(app.timeSlot, isAr)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">Asia/Baghdad</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedPrintAppointment(app)}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
                        title={isAr ? 'طباعة وصل / تذكرة الموعد' : 'Print Appointment Slip'}
                      >
                        <Printer className="w-4 h-4 text-slate-600" />
                      </button>

                      <button
                        onClick={() => setDetailAppointment(app)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        {isAr ? 'التفاصيل' : 'Details'}
                      </button>

                      {onOpenMessageWithDoctor && (isConfirmed || isCompleted) && (
                        <button
                          onClick={() => onOpenMessageWithDoctor(app.doctorId, app.doctorName || 'طبيب استشاري')}
                          className="p-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 cursor-pointer"
                          title={isAr ? 'محادثة الطبيب' : 'Message Doctor'}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}

                      {canCancel && (
                        <button
                          onClick={() => setCancelModalAppointment(app)}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                        >
                          {isAr ? 'إلغاء الموعد' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CANCELLATION REASON MODAL */}
      {cancelModalAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>{isAr ? 'تأكيد إلغاء موعد الحجز' : 'Confirm Booking Cancellation'}</span>
              </h3>
              <button onClick={() => setCancelModalAppointment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {isAr
                ? `أنت على وشك إلغاء موعدك برمز [${cancelModalAppointment.id}] لدى ${cancelModalAppointment.doctorName} ليوم ${cancelModalAppointment.date}. سيتم إشعار العيادة لإعادة إتاحة المقعد لمرضى آخرين.`
                : `You are cancelling booking [${cancelModalAppointment.id}]. The seat will be released.`}
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'سبب الإلغاء:' : 'Reason for Cancellation:'}
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder={isAr ? 'ظرف طارئ، تغيير موعد السفر، تحسن الحالة...' : 'Emergency, rescheduled...'}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalAppointment(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {isAr ? 'تراجع' : 'Back'}
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isSubmittingCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isSubmittingCancel ? (isAr ? 'جاري الإلغاء...' : 'Cancelling...') : (isAr ? 'تأكيد الإلغاء' : 'Confirm Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-sky-600" />
                <span>{isAr ? 'تفاصيل الموعد والكشف الطبي' : 'Appointment Details'}</span>
              </h3>
              <button onClick={() => setDetailAppointment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'كود الحجز:' : 'Ref:'}</span>
                <span className="font-mono font-bold text-slate-900">{detailAppointment.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'الطبيب:' : 'Doctor:'}</span>
                <strong className="text-slate-900">{detailAppointment.doctorName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'التخصص والعيادة:' : 'Clinic:'}</span>
                <span>{detailAppointment.specialty} · {detailAppointment.clinicName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'التاريخ والوقت (توقيت العراق):' : 'Date & Time:'}</span>
                <span className="font-bold text-sky-800">
                  {formatIraqDate(detailAppointment.date, isAr)} — {formatIraqTime(detailAppointment.timeSlot, isAr)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'أجور الكشفية:' : 'Fee:'}</span>
                <strong className="text-amber-800">{(detailAppointment.consultationFee || 25000).toLocaleString()} {isAr ? 'د.ع' : 'IQD'}</strong>
              </div>

              {detailAppointment.reasonForVisit && (
                <div>
                  <span className="text-slate-500 block mb-0.5 font-bold">{isAr ? 'شكوى المراجع المسجلة:' : 'Reason for Visit:'}</span>
                  <p className="p-2.5 bg-slate-50 rounded-xl text-slate-700">{detailAppointment.reasonForVisit}</p>
                </div>
              )}

              {detailAppointment.clinicalNotes && (
                <div>
                  <span className="text-sky-900 block mb-0.5 font-bold">{isAr ? 'ملاحظات الطبيب السريرية:' : 'Doctor Findings:'}</span>
                  <p className="p-2.5 bg-sky-50 rounded-xl text-sky-900">{detailAppointment.clinicalNotes}</p>
                </div>
              )}

              {/* Medical Attachments Section */}
              {detailAppointment.attachmentIds && detailAppointment.attachmentIds.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-slate-700 block font-bold flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                    <span>{isAr ? 'الملفات والتقارير الطبية المرفقة:' : 'Attached Medical Documents:'}</span>
                  </span>

                  {loadingAttachments ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      {isAr ? 'جاري استرجاع الملفات المرفقة...' : 'Loading attachments...'}
                    </div>
                  ) : detailAttachments.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic p-2 bg-slate-50 rounded-lg">
                      {isAr ? 'تم تسجيل المرفق برقم الحجز للمعاينة المباشرة في العيادة.' : 'Document registered for clinic consultation.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detailAttachments.map((att, idx) => {
                        const isImg = att.fileType?.startsWith('image/') || att.fileData?.startsWith('data:image/');
                        return (
                          <div
                            key={att.id || `att-${idx}`}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 truncate max-w-xs">{att.fileName}</span>
                              {att.fileData && (
                                <a
                                  href={att.fileData}
                                  download={att.fileName || 'medical_attachment'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>{isAr ? 'تحميل' : 'Download'}</span>
                                </a>
                              )}
                            </div>

                            {isImg && att.fileData && (
                              <img
                                src={att.fileData}
                                alt={att.fileName}
                                className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-white"
                              />
                            )}

                            {att.notes && (
                              <p className="text-[11px] text-slate-600">{att.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setSelectedPrintAppointment(detailAppointment);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة وصل الموعد' : 'Print Visit Slip'}</span>
              </button>

              <button
                onClick={() => setDetailAppointment(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE APPOINTMENT SLIP MODAL */}
      {selectedPrintAppointment && (
        <PrintableModal
          isOpen={!!selectedPrintAppointment}
          onClose={() => setSelectedPrintAppointment(null)}
          title={isAr ? 'وصل وتذكرة مراجعة طبية رسمية' : 'Official Clinic Visit Voucher'}
          subtitle={isAr ? 'صادر عن شبكة العيادات الطبية الاستشارية المعتمدة في العراق' : 'Accredited Iraqi Specialist Clinic Voucher'}
          docNumber={selectedPrintAppointment.id}
          badgeText={
            selectedPrintAppointment.status === 'confirmed'
              ? (isAr ? 'موعد مؤكد' : 'Confirmed')
              : selectedPrintAppointment.status === 'completed'
              ? (isAr ? 'مكتمل' : 'Completed')
              : (isAr ? 'قيد المراجعة' : 'Pending')
          }
          officialStampTitle={isAr ? 'ختم وتوقيع إدارة العيادة الطبية' : 'Clinic Reception Official Stamp'}
          headerDetails={[
            {
              label: isAr ? 'المراجع:' : 'Patient:',
              value: selectedPrintAppointment.patientName,
            },
            {
              label: isAr ? 'الهاتف:' : 'Phone:',
              value: selectedPrintAppointment.patientPhone || '—',
            },
            {
              label: isAr ? 'المحافظة:' : 'Governorate:',
              value: selectedPrintAppointment.patientGovernorate || 'بغداد',
            },
            {
              label: isAr ? 'رقم الحجز:' : 'Booking Ref:',
              value: selectedPrintAppointment.id,
            },
          ]}
        >
          {/* Main Appointment Sheet */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs avoid-break">
            <div>
              <span className="text-slate-400 block text-[10px]">{isAr ? 'الطبيب والعيادة الاستشارية' : 'Physician & Clinic'}</span>
              <strong className="text-slate-900 text-sm block">{selectedPrintAppointment.doctorName}</strong>
              <p className="text-sky-800 font-semibold">{selectedPrintAppointment.specialty}</p>
              <p className="text-slate-600 text-[11px]">{selectedPrintAppointment.clinicName} · {selectedPrintAppointment.clinicGovernorate}</p>
              {selectedPrintAppointment.clinicPhone && (
                <p className="text-slate-500 text-[10px] font-mono mt-0.5">
                  {isAr ? 'هاتف العيادة:' : 'Clinic Phone:'} {selectedPrintAppointment.clinicPhone}
                </p>
              )}
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">{isAr ? 'تاريخ ووقت المعاينة (توقيت العراق)' : 'Consultation Time (Iraq Time)'}</span>
              <strong className="text-slate-900 text-sm block">{formatIraqDate(selectedPrintAppointment.date, isAr)}</strong>
              <p className="text-amber-800 font-bold font-mono text-xs">{formatIraqTime(selectedPrintAppointment.timeSlot, isAr)}</p>
              <p className="text-slate-400 text-[10px] font-mono">Asia/Baghdad (UTC+3)</p>
              <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">{isAr ? 'أجور الكشفية:' : 'Consultation Fee:'}</span>
                <strong className="text-slate-900 font-black">
                  {(selectedPrintAppointment.consultationFee || 25000).toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
                </strong>
              </div>
            </div>
          </div>

          {/* Notes or Reason */}
          {selectedPrintAppointment.notes && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1 avoid-break">
              <span className="text-slate-500 font-bold block text-[11px]">
                {isAr ? 'سبب الزيارة والملاحظات السريرية الأولية:' : 'Reason for Visit & Notes:'}
              </span>
              <p className="text-slate-800 leading-relaxed font-sans">
                {selectedPrintAppointment.notes}
              </p>
            </div>
          )}

          {/* Patient Attendance Instructions */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-1 avoid-break">
            <span className="font-bold block text-[11px]">
              {isAr ? 'إرشادات مراجعة العيادة للمريض:' : 'Patient Clinical Attendance Notice:'}
            </span>
            <ul className="list-disc list-inside text-[11px] text-amber-900 space-y-0.5">
              <li>{isAr ? 'يرجى إبراز هذا الوصل عند الوصول إلى قسم استقبال العيادة لتأكيد تسلسل الدخول.' : 'Present this voucher at clinic reception to claim your queue.'}</li>
              <li>{isAr ? 'يرجى إحضار كافة التقارير الطبية، التحاليل المخبرية والأشعة السابقة ذات الصلة بالحالة.' : 'Bring all prior relevant lab tests and diagnostic imaging.'}</li>
              <li>{isAr ? 'تطبق الإجراءات الاحترازية والتنظيمية المعتمدة لدى وزارة الصحة العراقية.' : 'Adhere to Iraqi Ministry of Health clinical safety protocols.'}</li>
            </ul>
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
