import React from 'react';
import {
  CalendarCheck,
  Clock,
  Users,
  FileSignature,
  FlaskConical,
  MessageSquare,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight,
  ArrowLeft,
  Calendar,
  DollarSign,
  Building,
  MapPin,
  Bell,
  Sparkles,
  Printer,
} from 'lucide-react';
import { UserProfile } from '../../types/auth';
import {
  AppointmentRecord,
  DoctorNotification,
  DoctorScheduleConfig,
} from '../../types/database';
import { useLanguage } from '../../localization/LanguageContext';
import { DoctorTab } from './DoctorSidebar';
import { getIraqToday, formatIraqDate, formatIraqTime } from '../../utils/timezoneUtils';
import { PrintableModal } from '../common/PrintableModal';

interface DoctorOverviewTabProps {
  userProfile: UserProfile | null;
  appointments: AppointmentRecord[];
  schedule: DoctorScheduleConfig | null;
  notifications: DoctorNotification[];
  onNavigateTab: (tab: DoctorTab) => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
}

export const DoctorOverviewTab: React.FC<DoctorOverviewTabProps> = ({
  userProfile,
  appointments,
  schedule,
  notifications,
  onNavigateTab,
  onRefreshData,
  isRefreshing,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const isPending = userProfile?.approvalStatus === 'pending_approval';

  // Compute Today's Date String YYYY-MM-DD in Iraq local time (Asia/Baghdad)
  const todayStr = getIraqToday();

  const todayBookings = appointments.filter((a) => a.date === todayStr);
  const pendingBookings = appointments.filter((a) => a.status === 'pending');
  const confirmedAppointments = appointments.filter((a) => a.status === 'confirmed');
  const cancelledAppointments = appointments.filter((a) => a.status === 'cancelled');

  const dailyCapacity = schedule?.dailyCapacity || userProfile?.yearsOfExperience ? 15 : 12;
  const bookedTodayCount = todayBookings.filter((a) => a.status === 'confirmed' || a.status === 'pending').length;
  const availableCapacity = Math.max(0, dailyCapacity - bookedTodayCount);
  const capacityPercent = Math.min(100, Math.round((bookedTodayCount / dailyCapacity) * 100));

  const unreadNotifs = notifications.filter((n) => !n.read);
  const [isPrintDailyScheduleOpen, setIsPrintDailyScheduleOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Pending Approval Notice if applicable */}
      {isPending && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-950">
                {isAr ? 'حساب الطبيب قيد التدقيق الإداري' : 'Doctor Credentials Pending Audit'}
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
                {isAr
                  ? `جاري التحقق من رقم تسجيل نقابة الأطباء [${userProfile?.syndicateId || 'المرفق'}] والبيانات السريرية من قبل الإدارة العليا. يمكنك تجهيز أوقات دوامك، إعدادات العيادة، وفحص نماذج الوصفات السريرية.`
                  : `Credentials and syndicate ID [#${userProfile?.syndicateId || 'N/A'}] are being verified by Super Admin. You can pre-configure schedule hours and clinical settings.`}
              </p>
            </div>
          </div>
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-colors cursor-pointer"
          >
            {isRefreshing ? (isAr ? 'جاري الفحص...' : 'Checking...') : (isAr ? 'تحديث الحالة' : 'Check Status')}
          </button>
        </div>
      )}

      {/* Doctor Master Credentials Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
              {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'ط'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">
                  {userProfile?.displayName || (isAr ? 'الدكتور الاستشاري' : 'Consultant Doctor')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {userProfile?.specialization || (isAr ? 'اختصاص دقيق' : 'Specialist')}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <span>{userProfile?.clinicName || (isAr ? 'عيادة تخصصية' : 'Specialized Clinic')}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  {userProfile?.governorate || (isAr ? 'بغداد' : 'Baghdad')}
                </span>
                <span>•</span>
                <span className="font-mono text-amber-300">
                  ID: {userProfile?.syndicateId ? `IRQ-${userProfile.syndicateId}` : `UID-${userProfile?.uid?.slice(0, 6)}`}
                </span>
              </p>
            </div>
          </div>

          {/* Key Metrics Pill Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[110px]">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'أجور الكشفية' : 'Consultation Fee'}</span>
              <span className="text-sm font-black text-amber-300">
                {(userProfile?.consultationFee || 25000).toLocaleString()}{' '}
                <span className="text-[10px] font-normal text-slate-300">{isAr ? 'د.ع' : 'IQD'}</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'أيام الدوام' : 'Working Days'}</span>
              <span className="text-xs font-bold text-white">
                {userProfile?.workingDays || (isAr ? 'الأحد — الخميس' : 'Sun — Thu')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[110px]">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'ساعات العيادة' : 'Hours'}</span>
              <span className="text-xs font-bold text-white font-mono">
                {userProfile?.workingHours || '09:00 - 15:00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Bookings */}
        <div
          onClick={() => onNavigateTab('appointments')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{isAr ? 'مواعيد اليوم' : "Today's Bookings"}</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{todayBookings.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {todayBookings.length === 0
              ? isAr ? 'لا توجد مواعيد اليوم' : 'No bookings today'
              : `${todayBookings.filter((b) => b.status === 'confirmed').length} ${isAr ? 'مؤكدة' : 'confirmed'}`}
          </span>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => onNavigateTab('appointments')}
          className="p-4 rounded-2xl bg-white border border-amber-200 bg-amber-50/20 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-900">{isAr ? 'طلبات قيد المراجعة' : 'Pending Requests'}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{pendingBookings.length}</div>
          <span className="text-[11px] text-amber-800 font-medium mt-1 block">
            {pendingBookings.length > 0 ? (isAr ? 'تحتاج اتخاذ قرار' : 'Requires review') : (isAr ? 'تم الرد على الجميع' : 'All clear')}
          </span>
        </div>

        {/* Confirmed Appointments */}
        <div
          onClick={() => onNavigateTab('appointments')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{isAr ? 'المواعيد المؤكدة' : 'Confirmed'}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{confirmedAppointments.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isAr ? 'مواعيد سارية في العيادة' : 'Active scheduled'}
          </span>
        </div>

        {/* Cancelled */}
        <div
          onClick={() => onNavigateTab('appointments')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{isAr ? 'المواعيد الملغية' : 'Cancelled'}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{cancelledAppointments.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isAr ? 'مع أسباب الإلغاء' : 'With recorded reason'}
          </span>
        </div>

        {/* Seat Capacity Gauge */}
        <div
          onClick={() => onNavigateTab('schedule')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{isAr ? 'سعة المقاعد اليوم' : 'Daily Seats'}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{availableCapacity}</span>
            <span className="text-xs text-slate-500">/ {dailyCapacity} {isAr ? 'شاغر' : 'left'}</span>
          </div>
          {/* Progress meter */}
          <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                capacityPercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Launchpad to All Clinical Modules */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              {isAr ? 'الوصول السريع إلى الأجنحة السريرية' : 'Clinical Workspace Quick Links'}
            </h3>
          </div>
          <span className="text-xs text-slate-600 font-medium">M737 Health Platform</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigateTab('appointments')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all text-start group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">{isAr ? 'المواعيد' : 'Appointments'}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{isAr ? 'تأكيد وإدارة الحجوزات' : 'Confirm & Review'}</p>
          </button>

          <button
            onClick={() => onNavigateTab('schedule')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-start group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">{isAr ? 'سعة المقاعد' : 'Seat Capacity'}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{isAr ? 'أوقات الدوام والعطل' : 'Schedule & Limits'}</p>
          </button>

          <button
            onClick={() => onNavigateTab('patients')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-start group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">{isAr ? 'سجلات المرضى' : 'Patient Records'}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{isAr ? 'الملفات والسوابق' : 'Histories & Visits'}</p>
          </button>

          <button
            onClick={() => onNavigateTab('prescriptions')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-start group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileSignature className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">{isAr ? 'الوصفات (Rx)' : 'E-Prescriptions'}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{isAr ? 'إصدار وطباعة رسمية' : 'Create & Print'}</p>
          </button>

          <button
            onClick={() => onNavigateTab('lab_reports')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-start group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">{isAr ? 'الفحوصات' : 'Lab Reports'}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{isAr ? 'المختبر والأشعة' : 'Tests & Uploads'}</p>
          </button>

          <button
            onClick={() => onNavigateTab('messages')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all text-start group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">{isAr ? 'الاستشارات' : 'Messaging'}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{isAr ? 'محادثات المراجعين' : 'Direct Advisory'}</p>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Today's Schedule & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule & Consultations */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'جدول العيادة لليوم' : "Today's Clinical Schedule"}
              </h3>
              <span className="text-xs font-semibold text-slate-500">({formatIraqDate(todayStr, isAr)})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintDailyScheduleOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title={isAr ? 'طباعة جدول مواعيد اليوم' : "Print Today's Schedule"}
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'طباعة الجدول' : 'Print Schedule'}</span>
              </button>
              <button
                onClick={() => onNavigateTab('appointments')}
                className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isAr ? 'عرض الكل' : 'View All'}</span>
                <Arrow className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {todayBookings.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <Clock className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                {isAr ? 'لا توجد مواعيد مسجلة لليوم حتى الآن' : 'No bookings scheduled for today'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {isAr
                  ? 'يمكن للمرضى حجز المواعيد إلكترونياً، أو يمكنك تسجيل مراجع حضوري مباشر من تبويب إدارة المواعيد.'
                  : 'Patients can book through the platform or you can add a walk-in patient from Appointments.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayBookings.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 text-center text-[11px] p-1">
                      {formatIraqTime(b.timeSlot, isAr)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{b.patientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{b.patientPhone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : b.status === 'completed'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clinical Notifications Feed */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'التنبيهات السريرية' : 'Clinical Alerts'}
              </h3>
            </div>
            {unreadNotifs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {unreadNotifs.length} {isAr ? 'جديد' : 'new'}
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
              <Bell className="w-5 h-5 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                {isAr ? 'لا توجد إشعارات حالياً' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.slice(0, 4).map((n, idx) => (
                <div
                  key={n.id || `doctor-notif-${idx}-${n.createdAt || ''}`}
                  className={`p-3 rounded-xl border text-xs transition-colors ${
                    n.read ? 'bg-slate-50/50 border-slate-200' : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="font-bold text-slate-900">
                    {isAr ? n.titleAr : n.titleEn}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                    {isAr ? n.messageAr : n.messageEn}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRINTABLE DAILY CLINIC SCHEDULE MODAL */}
      {isPrintDailyScheduleOpen && (
        <PrintableModal
          isOpen={isPrintDailyScheduleOpen}
          onClose={() => setIsPrintDailyScheduleOpen(false)}
          title={isAr ? 'جدول المواعيد والعيادة اليومي' : "Today's Clinic Schedule & Patient Roster"}
          subtitle={`${userProfile?.displayName || ''} · ${userProfile?.clinicName || (isAr ? 'عيادة تخصصية' : 'Clinic')} (${userProfile?.governorate || (isAr ? 'العراق' : 'Iraq')})`}
          docNumber={`SCH-${todayStr}`}
          badgeText={isAr ? 'جدول يومي رسمي' : 'DAILY AGENDA'}
          officialStampTitle={isAr ? 'ختم واعتماد الطبيب المعالج' : 'Physician Seal & Signature'}
          headerDetails={[
            {
              label: isAr ? 'تاريخ اليوم:' : 'Date:',
              value: formatIraqDate(todayStr, isAr),
            },
            {
              label: isAr ? 'ساعات العمل:' : 'Working Hours:',
              value: userProfile?.workingHours || '09:00 - 15:00',
            },
            {
              label: isAr ? 'إجمالي الحجوزات:' : 'Total Bookings:',
              value: `${todayBookings.length} ${isAr ? 'مراجع' : 'Patients'}`,
            },
            {
              label: isAr ? 'السعة الاستيعابية:' : 'Capacity:',
              value: `${bookedTodayCount} / ${dailyCapacity}`,
            },
          ]}
        >
          {todayBookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
              {isAr ? 'لا توجد مواعيد محجوزة لهذا اليوم حتى الآن.' : 'No appointments scheduled for today.'}
            </div>
          ) : (
            <div className="border border-slate-300 rounded-xl overflow-hidden avoid-break">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 text-start">#</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'الوقت' : 'Time'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'اسم المراجع' : 'Patient'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'الهاتف' : 'Phone'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'العمر/الجنس' : 'Age/Sex'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {todayBookings.map((app, idx) => (
                    <tr key={app.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-sky-900">{formatIraqTime(app.timeSlot, isAr)}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{app.patientName}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{app.patientPhone || '—'}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {app.patientAge || '—'} / {app.patientGender === 'female' ? (isAr ? 'أنثى' : 'F') : (isAr ? 'ذكر' : 'M')}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-[10px] uppercase">
                          {app.status === 'confirmed' ? (isAr ? 'مؤكد' : 'Confirmed') : app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PrintableModal>
      )}
    </div>
  );
};
