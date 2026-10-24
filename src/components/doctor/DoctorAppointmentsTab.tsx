import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Plus,
  FileText,
  User,
  Phone,
  AlertCircle,
  Edit3,
  Calendar,
  X,
  FileSignature,
  Paperclip,
  Download,
  Eye,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { AppointmentRecord, MedicalAttachment } from '../../types/database';
import { useLanguage } from '../../localization/LanguageContext';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { getIraqToday, formatIraqDate, formatIraqTime } from '../../utils/timezoneUtils';
import { PrintableModal } from '../common/PrintableModal';

interface DoctorAppointmentsTabProps {
  appointments: AppointmentRecord[];
  onUpdateStatus: (
    appointmentId: string,
    newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected',
    cancellationReason?: string,
    clinicalNotes?: string
  ) => Promise<void>;
  onCreateWalkInAppointment: (appointment: Omit<AppointmentRecord, 'id' | 'createdAt'>) => Promise<void>;
  onOpenPrescriptionForPatient?: (patientData: { id: string; name: string; phone: string; age?: number; gender?: string; appointmentId?: string }) => void;
  isLoading: boolean;
}

export const DoctorAppointmentsTab: React.FC<DoctorAppointmentsTabProps> = ({
  appointments,
  onUpdateStatus,
  onCreateWalkInAppointment,
  onOpenPrescriptionForPatient,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD or empty for all

  // Cancellation Modal State
  const [cancelModalAppointment, setCancelModalAppointment] = useState<AppointmentRecord | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Clinical Notes Modal State
  const [notesModalAppointment, setNotesModalAppointment] = useState<AppointmentRecord | null>(null);
  const [clinicalNotesText, setClinicalNotesText] = useState('');
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false);

  // Walk-in Appointment Modal State
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDate, setWalkInDate] = useState(getIraqToday());
  const [walkInTimeSlot, setWalkInTimeSlot] = useState('11:00 AM');
  const [walkInAge, setWalkInAge] = useState('');
  const [walkInGender, setWalkInGender] = useState('male');
  const [walkInNotes, setWalkInNotes] = useState('');
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);

  // Medical Attachments Modal State
  const [attachmentModalApp, setAttachmentModalApp] = useState<AppointmentRecord | null>(null);
  const [attachmentsList, setAttachmentsList] = useState<MedicalAttachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [attachmentLoadError, setAttachmentLoadError] = useState<string | null>(null);

  const handleOpenAttachments = async (app: AppointmentRecord) => {
    setAttachmentModalApp(app);
    setIsLoadingAttachments(true);
    setAttachmentLoadError(null);
    setAttachmentsList([]);

    try {
      if (!app.attachmentIds || app.attachmentIds.length === 0) {
        setIsLoadingAttachments(false);
        return;
      }

      const results: MedicalAttachment[] = [];
      for (const attId of app.attachmentIds) {
        try {
          const snap = await getDoc(doc(db, 'medical_attachments', attId));
          if (snap.exists()) {
            results.push({ id: snap.id, ...(snap.data() as any) });
          }
        } catch (fetchErr) {
          console.warn(`Could not load attachment doc ${attId}:`, fetchErr);
        }
      }
      setAttachmentsList(results);
    } catch (err) {
      console.error('Error fetching appointment attachments:', err);
      setAttachmentLoadError(
        isAr
          ? 'تعذر تحميل بيانات المرفقات الطبية. يرجى التحقق من الاتصال بالشبكة.'
          : 'Failed to load medical attachments.'
      );
    } finally {
      setIsLoadingAttachments(false);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((app) => {
    // Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;

    // Date filter
    if (dateFilter && app.date !== dateFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.patientName?.toLowerCase().includes(q);
      const matchPhone = app.patientPhone?.toLowerCase().includes(q);
      const matchId = app.id?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId) return false;
    }

    return true;
  });

  const handleConfirm = async (appId: string) => {
    await onUpdateStatus(appId, 'confirmed');
  };

  const handleMarkCompleted = async (appId: string) => {
    await onUpdateStatus(appId, 'completed');
  };

  const handleOpenCancelModal = (app: AppointmentRecord) => {
    setCancelModalAppointment(app);
    setCancellationReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalAppointment) return;
    setIsSubmittingCancel(true);
    try {
      await onUpdateStatus(
        cancelModalAppointment.id,
        'cancelled',
        cancellationReason || (isAr ? 'تم الإلغاء من قبل الطبيب' : 'Cancelled by physician')
      );
      setCancelModalAppointment(null);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleOpenNotesModal = (app: AppointmentRecord) => {
    setNotesModalAppointment(app);
    setClinicalNotesText(app.clinicalNotes || '');
  };

  const handleSaveNotes = async () => {
    if (!notesModalAppointment) return;
    setIsSubmittingNotes(true);
    try {
      await onUpdateStatus(
        notesModalAppointment.id,
        notesModalAppointment.status,
        undefined,
        clinicalNotesText
      );
      setNotesModalAppointment(null);
    } finally {
      setIsSubmittingNotes(false);
    }
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInPhone) return;

    setIsSubmittingWalkIn(true);
    try {
      await onCreateWalkInAppointment({
        patientId: `walkin_${Date.now()}`,
        doctorId: '', // set by container
        patientName: walkInName,
        patientPhone: walkInPhone,
        patientAge: walkInAge ? parseInt(walkInAge) : undefined,
        patientGender: walkInGender,
        date: walkInDate,
        timeSlot: walkInTimeSlot,
        status: 'confirmed',
        notes: walkInNotes ? `[مراجع حضوري] ${walkInNotes}` : '[مراجع حضوري - مسجل بالعيادة]',
      });
      setIsWalkInModalOpen(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInNotes('');
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  // Printing States
  const [isPrintDailyScheduleOpen, setIsPrintDailyScheduleOpen] = useState(false);
  const [selectedPrintAppointment, setSelectedPrintAppointment] = useState<AppointmentRecord | null>(null);

  const handlePrintDailySummary = () => {
    setIsPrintDailyScheduleOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-sky-600" />
            <span>{isAr ? 'إدارة المواعيد وحجوزات المراجعين' : 'Appointment & Booking Management'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'متابعة المواعيد الواردة، تأكيد الحجوزات، تسجيل الملاحظات السريرية، وتوثيق الكشف الطبي.'
              : 'Review requests, confirm bookings, log consultation notes, and issue prescriptions.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrintDailySummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title={isAr ? 'طباعة جدول المواعيد لليوم' : 'Print schedule summary'}
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAr ? 'طباعة الجدول' : 'Print Summary'}</span>
          </button>

          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'حجز مراجع حضوري' : 'Add Walk-in'}</span>
          </button>
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
            placeholder={isAr ? 'بحث بالاسم، رقم الهاتف، أو كود الحجز...' : 'Search by patient name, phone, or booking ID...'}
            className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] me-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {isAr ? 'الحالة:' : 'Status:'}
          </span>
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' && (isAr ? 'الكل' : 'All')}
              {st === 'pending' && (isAr ? 'قيد الانتظار' : 'Pending')}
              {st === 'confirmed' && (isAr ? 'مؤكد' : 'Confirmed')}
              {st === 'completed' && (isAr ? 'مكتمل' : 'Completed')}
              {st === 'cancelled' && (isAr ? 'ملغي' : 'Cancelled')}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:border-sky-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
            >
              {isAr ? 'مسح التاريخ' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isAr ? 'لم يتم العثور على أي مواعيد تطابق البحث' : 'No matching appointments found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAr
                ? 'جرب تغيير فلاتر البحث أو التاريخ، أو يمكنك إضافة موعد مراجع حضوري الآن.'
                : 'Try adjusting filters or register a new walk-in appointment.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map((app) => {
              const isPending = app.status === 'pending';
              const isConfirmed = app.status === 'confirmed';
              const isCompleted = app.status === 'completed';
              const isCancelled = app.status === 'cancelled';

              return (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  {/* Left: Patient Details and Booking Meta */}
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center shrink-0">
                      {app.patientName?.charAt(0) || <User className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {app.patientName}
                        </h4>
                        <span className="font-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                          {app.id}
                        </span>
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : isCompleted
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isConfirmed && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                          {isCompleted && <CheckCircle2 className="w-3 h-3 text-sky-600" />}
                          {isCancelled && <XCircle className="w-3 h-3 text-rose-600" />}
                          <span>
                            {isConfirmed && (isAr ? 'مؤكد' : 'Confirmed')}
                            {isPending && (isAr ? 'قيد المراجعة' : 'Pending')}
                            {isCompleted && (isAr ? 'مكتمل' : 'Completed')}
                            {isCancelled && (isAr ? 'ملغي' : 'Cancelled')}
                          </span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {app.patientPhone}
                        </span>
                        {app.patientAge && (
                          <span>
                            {isAr ? 'العمر:' : 'Age:'} <strong className="font-mono">{app.patientAge}</strong> {isAr ? 'سنة' : 'yrs'}
                          </span>
                        )}
                        {app.patientGender && (
                          <span>
                            {app.patientGender === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}
                          </span>
                        )}
                      </div>

                      {/* Notes / Reason */}
                      {app.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-xl">
                          <strong className="text-slate-800">{isAr ? 'ملاحظة المراجع:' : 'Patient Note:'}</strong> {app.notes}
                        </p>
                      )}

                      {app.clinicalNotes && (
                        <p className="text-xs text-sky-900 bg-sky-50 p-2 rounded-lg border border-sky-100 max-w-xl">
                          <strong className="text-sky-950">{isAr ? 'ملاحظات الطبيب السريرية:' : 'Clinical Notes:'}</strong> {app.clinicalNotes}
                        </p>
                      )}

                      {app.cancellationReason && (
                        <p className="text-xs text-rose-900 bg-rose-50 p-2 rounded-lg border border-rose-100 max-w-xl">
                          <strong className="text-rose-950">{isAr ? 'سبب الإلغاء:' : 'Cancellation Reason:'}</strong> {app.cancellationReason}
                        </p>
                      )}

                      {/* Medical Attachments Button */}
                      {app.attachmentIds && app.attachmentIds.length > 0 && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAttachments(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                            <span>
                              {isAr
                                ? `عرض المرفقات والتحاليل الطبية (${app.attachmentIds.length})`
                                : `View Medical Attachments (${app.attachmentIds.length})`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Date, Time & Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end lg:self-center shrink-0">
                    {/* Date and Slot */}
                    <div className="text-end pe-2">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-end">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>{formatIraqDate(app.date, isAr)}</span>
                      </div>
                      <div className="text-xs text-sky-800 font-bold font-mono">
                        {formatIraqTime(app.timeSlot, isAr)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">Asia/Baghdad</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleConfirm(app.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تأكيد الحجز' : 'Confirm'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenCancelModal(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isAr ? 'اعتذار / إلغاء' : 'Decline'}</span>
                          </button>
                        </>
                      )}

                      {isConfirmed && (
                        <>
                          <button
                            onClick={() => handleMarkCompleted(app.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'إتمام الكشف' : 'Complete'}</span>
                          </button>

                          {onOpenPrescriptionForPatient && (
                            <button
                              onClick={() =>
                                onOpenPrescriptionForPatient({
                                  id: app.patientId,
                                  name: app.patientName,
                                  phone: app.patientPhone,
                                  age: app.patientAge,
                                  gender: app.patientGender,
                                  appointmentId: app.id,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer"
                              title={isAr ? 'إصدار وصفة طبية Rx' : 'Write Prescription'}
                            >
                              <FileSignature className="w-3.5 h-3.5" />
                              <span>{isAr ? 'وصفة Rx' : 'Rx'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenCancelModal(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{isAr ? 'إلغاء' : 'Cancel'}</span>
                          </button>
                        </>
                      )}

                      {/* Edit Notes button */}
                      <button
                        onClick={() => handleOpenNotesModal(app)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        title={isAr ? 'ملاحظات الكشف السريري' : 'Consultation Notes'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Print Consultation Slip */}
                      <button
                        onClick={() => setSelectedPrintAppointment(app)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                        title={isAr ? 'طباعة استمارة كشفية المراجع' : 'Print Consultation Slip'}
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Cancellation Reason */}
      {cancelModalAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>{isAr ? 'إلغاء أو الاعتذار عن الموعد' : 'Cancel or Decline Appointment'}</span>
              </h3>
              <button
                onClick={() => setCancelModalAppointment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {isAr
                ? `أنت على وشك إلغاء موعد المراجع [${cancelModalAppointment.patientName}]. يرجى إدخال سبب الإلغاء ليتم إرساله في السجل وتنبيه المراجع.`
                : `You are cancelling booking for [${cancelModalAppointment.patientName}]. Please specify reason.`}
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'سبب الإلغاء أو الاعتذار:' : 'Cancellation Reason:'}
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                placeholder={
                  isAr
                    ? 'مثال: اعتذار طارئ للطبيب، أو عدم توفر الفحوصات المطلوبة، أو طلب تعديل التاريخ...'
                    : 'e.g. Doctor emergency leave, test results missing, schedule conflict...'
                }
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

      {/* MODAL 2: Clinical Consultation Notes */}
      {notesModalAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <span>{isAr ? 'تدوين الملاحظات السريرية للكشف' : 'Consultation Clinical Notes'}</span>
              </h3>
              <button
                onClick={() => setNotesModalAppointment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-500">{isAr ? 'المراجع:' : 'Patient:'} </span>
              <strong className="text-slate-900">{notesModalAppointment.patientName}</strong>
              <span className="text-slate-400 mx-2">|</span>
              <span className="text-slate-500">{isAr ? 'التاريخ:' : 'Date:'} </span>
              <strong className="font-mono text-slate-900">{notesModalAppointment.date}</strong>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'الملاحظات السريرية والتشخيص الأولي:' : 'Clinical Findings & Preliminary Diagnosis:'}
              </label>
              <textarea
                value={clinicalNotesText}
                onChange={(e) => setClinicalNotesText(e.target.value)}
                rows={5}
                placeholder={
                  isAr
                    ? 'اكتب نتائج الفحص السريري، الضغط، النبض، الشكوى الرئيسية، والتوصيات الطبية...'
                    : 'Document clinical findings, vitals, primary complaint, and physician advisory...'
                }
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPrintAppointment(notesModalAppointment);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة استمارة الكشف' : 'Print Slip'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNotesModalAppointment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSubmittingNotes}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isSubmittingNotes ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ الملاحظات' : 'Save Notes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Walk-In Appointment */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateWalkIn}
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <span>{isAr ? 'حجز وتسجيل مراجع حضوري بالعيادة' : 'Register Walk-In Patient'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsWalkInModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'اسم المراجع الثلاثي *' : 'Patient Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder={isAr ? 'مثال: علي حسن عبد الله' : 'e.g. Ali Hassan'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'رقم الهاتف العراقي *' : 'Phone Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="07XXXXXXXXX"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'تاريخ الموعد' : 'Date'}
                </label>
                <input
                  type="date"
                  required
                  value={walkInDate}
                  onChange={(e) => setWalkInDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'الوقت / الفترة' : 'Time Slot'}
                </label>
                <select
                  value={walkInTimeSlot}
                  onChange={(e) => setWalkInTimeSlot(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'العمر (اختياري)' : 'Age'}
                </label>
                <input
                  type="number"
                  value={walkInAge}
                  onChange={(e) => setWalkInAge(e.target.value)}
                  placeholder="35"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'الجنس' : 'Gender'}
                </label>
                <select
                  value={walkInGender}
                  onChange={(e) => setWalkInGender(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
                >
                  <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                  <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'شكوى المراجع / ملاحظات الحجز' : 'Patient Complaint / Notes'}
              </label>
              <textarea
                value={walkInNotes}
                onChange={(e) => setWalkInNotes(e.target.value)}
                rows={2}
                placeholder={isAr ? 'مراجعة دورية، فحص عام، آلام صدرية...' : 'General checkup, pain...'}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsWalkInModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmittingWalkIn}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isSubmittingWalkIn ? (isAr ? 'جاري التسجيل...' : 'Registering...') : (isAr ? 'تثبيت الحجز في العيادة' : 'Confirm Registration')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MEDICAL ATTACHMENTS VIEWER MODAL */}
      {attachmentModalApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAr ? 'المرفقات والتحاليل الطبية للمراجع' : 'Patient Medical Attachments'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {attachmentModalApp.patientName} — {isAr ? 'كود الحجز:' : 'Booking Ref:'} <span className="font-mono">{attachmentModalApp.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachmentModalApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {isLoadingAttachments ? (
                <div className="py-12 text-center space-y-2">
                  <Clock className="w-7 h-7 text-purple-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">
                    {isAr ? 'جاري استرجاع وفك تشفير الملفات الطبية المرفقة...' : 'Loading patient medical attachments...'}
                  </p>
                </div>
              ) : attachmentLoadError ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{attachmentLoadError}</span>
                </div>
              ) : attachmentsList.length === 0 ? (
                <div className="p-8 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-700">
                    {isAr ? 'لم يتم العثور على ملفات مرفقة لهذا الموعد' : 'No attachments found for this booking'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isAr
                      ? 'يمكن للمراجع إرفاق التحاليل والأشعة عند إنشاء الحجز أو جلب النسخة الورقية لمعاينتها بالعيادة.'
                      : 'Patient did not attach digital documents during booking.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attachmentsList.map((att: MedicalAttachment, idx: number) => {
                    const isImg = att.fileType?.startsWith('image/') || att.fileData?.startsWith('data:image/');
                    const isPdf = att.fileType === 'application/pdf' || att.fileName?.toLowerCase().endsWith('.pdf');

                    return (
                      <div
                        key={att.id || `att-${idx}`}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            {isImg ? (
                              <ImageIcon className="w-4 h-4 text-sky-600 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                            )}
                            <div>
                              <strong className="text-xs font-bold text-slate-900 block">{att.fileName}</strong>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {att.fileSize ? `${(att.fileSize / 1024).toFixed(1)} KB` : ''} · {att.fileType || 'Document'}
                              </span>
                            </div>
                          </div>

                          {att.fileData && (
                            <a
                              href={att.fileData}
                              download={att.fileName || 'medical_attachment'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{isAr ? 'تحميل / فتح الملف' : 'Download / Open'}</span>
                            </a>
                          )}
                        </div>

                        {/* Image Preview if available */}
                        {isImg && att.fileData && (
                          <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-2">
                            <img
                              src={att.fileData}
                              alt={att.fileName}
                              className="w-full max-h-80 object-contain rounded-lg mx-auto"
                            />
                          </div>
                        )}

                        {/* Notes / Clinical reference info */}
                        {att.notes && (
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-bold block">
                              {isAr ? 'ملاحظة الإرفاق والتنسيق السريري:' : 'Attachment Note:'}
                            </span>
                            <p className="text-slate-700 text-xs">{att.notes}</p>
                          </div>
                        )}

                        {!att.fileData && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                            <p className="font-semibold">
                              {isAr
                                ? 'ملاحظة سريرية: مستند طبي مسجل للمعاينة المباشرة.'
                                : 'Clinical Note: Hardcopy file registered for consultation review.'}
                            </p>
                            <p className="text-[11px] text-amber-800">
                              {isAr
                                ? `تم تثبيت هذا المرفق برقم الحجز [${attachmentModalApp.id}]. يرجى فحص النسخة الأصلية أو نتائج التحليل المطبوعة أثناء كشف العيادة.`
                                : `Registered with booking ref [${attachmentModalApp.id}].`}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                M737 Medical Attachment Vault · Asia/Baghdad
              </span>
              <button
                type="button"
                onClick={() => setAttachmentModalApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE MODAL 1: CLINIC DAILY APPOINTMENT AGENDA */}
      {isPrintDailyScheduleOpen && (
        <PrintableModal
          isOpen={isPrintDailyScheduleOpen}
          onClose={() => setIsPrintDailyScheduleOpen(false)}
          title={isAr ? 'جدول المواعيد والكشوفات السريرية للعيادة' : 'Clinic Daily Appointments Agenda'}
          subtitle={isAr ? 'قائمة المراجعين المحجوزين وسجل الاستقبال الطبي اليومي' : 'Daily Patient Schedule & Intake Roster'}
          docNumber={`SCHED-${getIraqToday()}`}
          badgeText={isAr ? 'جدول العيادة الرسمي' : 'Official Clinic Roster'}
          officialStampTitle={isAr ? 'ختم العيادة واعتماد سكرتارية الاستقبال' : 'Clinic Reception Official Stamp'}
          headerDetails={[
            {
              label: isAr ? 'تاريخ الجدول:' : 'Schedule Date:',
              value: formatIraqDate(dateFilter || getIraqToday(), isAr),
            },
            {
              label: isAr ? 'إجمالي الحجوزات:' : 'Total Bookings:',
              value: `${filteredAppointments.length} ${isAr ? 'مراجع' : 'Patients'}`,
            },
            {
              label: isAr ? 'المؤكدة حضورياً:' : 'Confirmed Slots:',
              value: `${filteredAppointments.filter((a) => a.status === 'confirmed').length}`,
            },
            {
              label: isAr ? 'إجمالي الكشفيات المتوقع:' : 'Est. Consultation Fees:',
              value: `${filteredAppointments.reduce((acc, curr) => acc + (curr.consultationFee || 25000), 0).toLocaleString()} IQD`,
            },
          ]}
        >
          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 rounded-xl bg-slate-50">
              {isAr ? 'لا توجد مواعيد مسجلة لهذا التاريخ في العيادة.' : 'No appointments scheduled for this date.'}
            </div>
          ) : (
            <div className="border border-slate-300 rounded-xl overflow-hidden avoid-break">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 text-start">#</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'التوقيت' : 'Time'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'اسم المراجع' : 'Patient Name'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'الهاتف' : 'Phone'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'العمر/الجنس' : 'Age/Sex'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'ملاحظة الزيارة' : 'Reason/Notes'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'الكشفية' : 'Fee'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {filteredAppointments.map((app, idx) => (
                    <tr key={app.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-800">{app.timeSlot}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{app.patientName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{app.patientPhone}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {app.patientAge ? `${app.patientAge}y` : '—'} / {app.patientGender === 'female' ? (isAr ? 'أنثى' : 'F') : (isAr ? 'ذكر' : 'M')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                          {app.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{app.notes || '—'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-800">
                        {(app.consultationFee || 25000).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PrintableModal>
      )}

      {/* PRINTABLE MODAL 2: INDIVIDUAL CONSULTATION SLIP */}
      {selectedPrintAppointment && (
        <PrintableModal
          isOpen={!!selectedPrintAppointment}
          onClose={() => setSelectedPrintAppointment(null)}
          title={isAr ? 'استمارة كشفية ومعاينة سريرية' : 'Clinical Consultation Encounter Sheet'}
          subtitle={selectedPrintAppointment.clinicName || (isAr ? 'العيادة التخصصية' : 'Specialist Clinic')}
          docNumber={selectedPrintAppointment.id}
          badgeText={selectedPrintAppointment.status.toUpperCase()}
          officialStampTitle={isAr ? 'ختم وتوقيع الطبيب الاستشاري' : 'Consultant Physician Stamp & Signature'}
          headerDetails={[
            {
              label: isAr ? 'المراجع:' : 'Patient Name:',
              value: selectedPrintAppointment.patientName,
            },
            {
              label: isAr ? 'العمر والجنس:' : 'Age / Gender:',
              value: `${selectedPrintAppointment.patientAge || '—'} ${isAr ? 'سنة' : 'yrs'} / ${selectedPrintAppointment.patientGender === 'female' ? (isAr ? 'أنثى' : 'F') : (isAr ? 'ذكر' : 'M')}`,
            },
            {
              label: isAr ? 'رقم الهاتف:' : 'Phone:',
              value: selectedPrintAppointment.patientPhone || '—',
            },
            {
              label: isAr ? 'تاريخ الكشف:' : 'Date & Slot:',
              value: `${formatIraqDate(selectedPrintAppointment.date, isAr)} (${selectedPrintAppointment.timeSlot})`,
            },
          ]}
        >
          {/* Patient Complaint & History */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 avoid-break">
            <span className="text-[11px] font-bold text-slate-900 block">
              {isAr ? 'الشكوى السريرية الأولية وسبب الزيارة:' : 'Chief Clinical Complaint & Visit Reason:'}
            </span>
            <p className="text-slate-800 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-200">
              {selectedPrintAppointment.notes || (isAr ? 'مراجعة دورية بالعيادة.' : 'Routine clinic consultation.')}
            </p>
          </div>

          {/* Physician Clinical Observations */}
          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 text-xs space-y-2 avoid-break">
            <span className="text-[11px] font-bold text-sky-950 block">
              {isAr ? 'ملاحظات الطبيب السريرية وتوثيق الفحص الطبي:' : 'Physician Examination Findings & Clinical Notes:'}
            </span>
            <p className="text-slate-900 leading-relaxed font-sans bg-white p-3 rounded-lg border border-sky-200 min-h-24">
              {selectedPrintAppointment.clinicalNotes || (isAr ? 'الكشف السريري مطابق للأصول الطبية المعتمدة.' : 'Clinical examination consistent with standard protocols.')}
            </p>
          </div>

          {/* Vitals Placeholders */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs avoid-break">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'ضغط الدم (BP)' : 'Blood Pressure'}</span>
              <strong className="text-slate-800 font-mono">___ / ___</strong>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'النبض (Pulse)' : 'Pulse'}</span>
              <strong className="text-slate-800 font-mono">___ bpm</strong>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'الحرارة (Temp)' : 'Temperature'}</span>
              <strong className="text-slate-800 font-mono">___ °C</strong>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'أكسجين الدم (SpO2)' : 'SpO2'}</span>
              <strong className="text-slate-800 font-mono">___ %</strong>
            </div>
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
