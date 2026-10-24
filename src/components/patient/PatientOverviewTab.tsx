import React from 'react';
import {
  Search,
  CalendarCheck,
  Clock,
  FileSignature,
  FlaskConical,
  MessageSquare,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  Heart,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { UserProfile } from '../../types/auth';
import {
  AppointmentRecord,
  PrescriptionRecord,
  LabReportRecord,
  DoctorNotification,
} from '../../types/database';
import { useLanguage } from '../../localization/LanguageContext';
import { PatientTab } from './PatientSidebar';
import { getIraqToday, formatIraqDate, formatIraqTime } from '../../utils/timezoneUtils';
import { PrintableModal } from '../common/PrintableModal';

interface PatientOverviewTabProps {
  userProfile: UserProfile | null;
  appointments: AppointmentRecord[];
  prescriptions: PrescriptionRecord[];
  labReports: LabReportRecord[];
  notifications: DoctorNotification[];
  onNavigateTab: (tab: PatientTab) => void;
  onSearchDoctorId: (doctorId: string) => void;
}

export const PatientOverviewTab: React.FC<PatientOverviewTabProps> = ({
  userProfile,
  appointments,
  prescriptions,
  labReports,
  notifications,
  onNavigateTab,
  onSearchDoctorId,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [quickDoctorId, setQuickDoctorId] = React.useState('');
  const [selectedPrintAppointment, setSelectedPrintAppointment] = React.useState<AppointmentRecord | null>(null);

  // Calculate profile completion percentage
  let completedFields = 0;
  const totalFields = 6;
  if (userProfile?.displayName) completedFields++;
  if (userProfile?.phoneNumber) completedFields++;
  if (userProfile?.governorate) completedFields++;
  if (userProfile?.gender) completedFields++;
  if (userProfile?.emergencyContact) completedFields++;
  if (userProfile?.bloodType) completedFields++;
  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  // Group appointments using canonical Iraq timezone (Asia/Baghdad)
  const nowStr = getIraqToday();
  const pendingAppointments = appointments.filter((a) => a.status === 'pending');
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'confirmed' && a.date >= nowStr
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === 'completed' || (a.status === 'confirmed' && a.date < nowStr)
  );

  const unreadNotifs = notifications.filter((n) => !n.read);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickDoctorId.trim()) {
      onSearchDoctorId(quickDoctorId.trim());
    } else {
      onNavigateTab('search_doctors');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-slate-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
              {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'م'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">
                  {isAr ? `أهلاً بك، ${userProfile?.displayName || 'المراجع العزيز'}` : `Welcome, ${userProfile?.displayName || 'Patient'}`}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isAr ? 'حساب مراجع مفعل' : 'Active Account'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                <span>{userProfile?.governorate || (isAr ? 'العراق' : 'Iraq')}</span>
                <span className="mx-2">•</span>
                <span className="font-mono">{userProfile?.phoneNumber || (isAr ? 'رقم الهاتف غير مسجل' : 'No phone')}</span>
                <span className="mx-2">•</span>
                <span className="font-mono text-sky-300">UID: {userProfile?.uid?.slice(0, 8)}</span>
              </p>
            </div>
          </div>

          {/* Primary Quick Booking CTA Button */}
          <button
            onClick={() => onNavigateTab('search_doctors')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4 text-slate-950" />
            <span>{isAr ? 'البحث عن طبيب وحجز موعد' : 'Find Doctor & Book Now'}</span>
          </button>
        </div>
      </div>

      {/* Profile Completion Bar (if < 100%) */}
      {completionPercentage < 100 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                {isAr ? `اكتمال الملف الطبي: ${completionPercentage}%` : `Profile Completion: ${completionPercentage}%`}
              </h4>
              <p className="text-[11px] text-amber-900 mt-0.5">
                {isAr
                  ? 'أكمل إدخال هاتفك، فصيلة دمك، ومحافظتك لتسهيل إجراءات الحجز لدى العيادات.'
                  : 'Complete phone, blood type, and governorate for faster clinical check-in.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('profile')}
            className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            {isAr ? 'إكمال البيانات الآن' : 'Complete Profile'}
          </button>
        </div>
      )}

      {/* Prominent Doctor ID Search Box */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">
            {isAr ? 'ابحث عن طبيب بواسطة المعرف (Doctor ID) أو النقابة' : 'Find Doctor by Doctor ID / Syndicate Number'}
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          {isAr
            ? 'إذا كان لديك الكود التعريفي لطبيبك (مثال: IRQ-1044 أو رقم النقابة)، أدخله هنا لعرض جدول مواعيده المتاحة وحجز كشفية مباشرة.'
            : 'Enter the physician ID (e.g. IRQ-1044 or Syndicate ID) to view schedule and book.'}
        </p>

        <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              type="text"
              value={quickDoctorId}
              onChange={(e) => setQuickDoctorId(e.target.value)}
              placeholder={isAr ? 'أدخل كود الطبيب (مثال: IRQ-XXXX أو 1024)...' : 'Enter doctor ID or syndicate reg...'}
              className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'بحث عن الطبيب' : 'Search Doctor'}
          </button>
        </form>
      </div>

      {/* Key Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Upcoming Appointments */}
        <div
          onClick={() => onNavigateTab('appointments')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{isAr ? 'المواعيد القادمة' : 'Upcoming'}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{upcomingAppointments.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isAr ? 'مواعيد مؤكدة قادمة' : 'Confirmed upcoming'}
          </span>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => onNavigateTab('appointments')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{isAr ? 'طلبات قيد المراجعة' : 'Pending Requests'}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{pendingAppointments.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isAr ? 'بانتظار تأكيد الطبيب' : 'Awaiting confirmation'}
          </span>
        </div>

        {/* Prescriptions */}
        <div
          onClick={() => onNavigateTab('prescriptions')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{isAr ? 'الوصفات الطبية (Rx)' : 'Prescriptions'}</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileSignature className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{prescriptions.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isAr ? 'وصفات معتمدة صادرة' : 'Issued Rx pads'}
          </span>
        </div>

        {/* Lab Reports */}
        <div
          onClick={() => onNavigateTab('lab_reports')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{isAr ? 'التقارير المخبرية' : 'Lab Reports'}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{labReports.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isAr ? 'فحوصات ونتائج مسجلة' : 'Recorded tests'}
          </span>
        </div>
      </div>

      {/* Two Column Section: Upcoming Appointments & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Appointment Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'أقرب موعد قادم في العيادة' : 'Next Scheduled Appointment'}
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <Arrow className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                {isAr ? 'لا توجد مواعيد مؤكدة قادمة حالياً' : 'No upcoming confirmed appointments'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {isAr
                  ? 'يمكنك البحث عن طبيب اختصاص في محافظتك وحجز موعد استشارة سريرية بكل سهولة.'
                  : 'Search for a specialist doctor in your governorate to book an appointment.'}
              </p>
              <button
                onClick={() => onNavigateTab('search_doctors')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'حجز موعد الآن' : 'Book Appointment'}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              {upcomingAppointments.slice(0, 1).map((app) => (
                <div key={app.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">{isAr ? 'الطبيب المعالج:' : 'Doctor:'}</div>
                      <div className="text-base font-extrabold text-slate-900">{app.doctorName}</div>
                      <div className="text-xs text-sky-700 font-semibold">{app.specialty} · {app.clinicName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPrintAppointment(app);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        title={isAr ? 'طباعة وصل الموعد' : 'Print Slip'}
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isAr ? 'طباعة الوصل' : 'Print Slip'}</span>
                      </button>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {isAr ? 'مؤكد' : 'Confirmed'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'التاريخ' : 'Date'}</span>
                      <strong className="text-slate-900 block">{formatIraqDate(app.date, isAr)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'الوقت' : 'Time'}</span>
                      <strong className="text-sky-800 font-bold block">{formatIraqTime(app.timeSlot, isAr)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'الكشفية' : 'Fee'}</span>
                      <strong className="text-amber-800 font-bold">
                        {(app.consultationFee || 25000).toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications preview */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{isAr ? 'التنبيهات والإشعارات' : 'Notifications'}</h3>
            {unreadNotifs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {unreadNotifs.length} {isAr ? 'جديد' : 'new'}
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">
              {isAr ? 'لا توجد إشعارات حالياً' : 'No notifications'}
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-0.5">
                  <div className="font-bold text-slate-900">{isAr ? n.titleAr : n.titleEn}</div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{isAr ? n.messageAr : n.messageEn}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRINTABLE APPOINTMENT SLIP MODAL */}
      {selectedPrintAppointment && (
        <PrintableModal
          isOpen={!!selectedPrintAppointment}
          onClose={() => setSelectedPrintAppointment(null)}
          title={isAr ? 'تذكرة مراجعة وكشفية طبية' : 'Clinic Appointment Voucher'}
          subtitle={`${selectedPrintAppointment.doctorName} · ${selectedPrintAppointment.clinicName || (isAr ? 'العيادة التخصصية' : 'Clinic')}`}
          docNumber={selectedPrintAppointment.id}
          badgeText={selectedPrintAppointment.status.toUpperCase()}
          officialStampTitle={isAr ? 'ختم إدارة العيادة والاستقبال' : 'Clinic Reception & Administration Seal'}
          headerDetails={[
            {
              label: isAr ? 'المراجع:' : 'Patient Name:',
              value: selectedPrintAppointment.patientName,
            },
            {
              label: isAr ? 'رقم الهاتف:' : 'Phone:',
              value: selectedPrintAppointment.patientPhone || '—',
            },
            {
              label: isAr ? 'تاريخ الموعد:' : 'Appointment Date:',
              value: formatIraqDate(selectedPrintAppointment.date, isAr),
            },
            {
              label: isAr ? 'الفترة المحددة:' : 'Time Slot:',
              value: `${formatIraqTime(selectedPrintAppointment.timeSlot, isAr)} (Asia/Baghdad)`,
            },
          ]}
        >
          {/* Card Details */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 avoid-break">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">{isAr ? 'الطبيب المعالج:' : 'Doctor:'}</span>
                <strong className="text-slate-900 block text-sm">{selectedPrintAppointment.doctorName}</strong>
                <span className="text-[11px] text-slate-600">{selectedPrintAppointment.specialty}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">{isAr ? 'مقر العيادة:' : 'Clinic:'}</span>
                <strong className="text-slate-900 block text-sm">{selectedPrintAppointment.clinicName || (isAr ? 'عيادة تخصصية' : 'Specialist Clinic')}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-500">{isAr ? 'أجور الكشفية:' : 'Consultation Fee:'}</span>
              <strong className="text-slate-900 font-mono font-bold text-sm">
                {(selectedPrintAppointment.consultationFee || 25000).toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
              </strong>
            </div>

            {selectedPrintAppointment.notes && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block text-[10px]">{isAr ? 'ملاحظات الزيارة:' : 'Visit Notes:'}</span>
                <p className="text-slate-800 font-sans mt-0.5">{selectedPrintAppointment.notes}</p>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-1 avoid-break">
            <h4 className="font-bold">{isAr ? 'تعليمات وإرشادات الحضور للعيادة:' : 'Clinic Attendance Instructions:'}</h4>
            <p className="text-[11px] text-sky-900 leading-relaxed">
              {isAr
                ? 'يرجى التواجد بالعيادة قبل الموعد بـ 15 دقيقة وإبراز هذه التذكرة أو رقم الحجز لموظف الاستقبال.'
                : 'Please arrive 15 minutes prior to your appointment slot and present this slip.'}
            </p>
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
