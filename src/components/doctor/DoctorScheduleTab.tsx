import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Users,
  Activity,
  CalendarOff,
} from 'lucide-react';
import { DoctorScheduleConfig, AppointmentRecord } from '../../types/database';
import { useLanguage } from '../../localization/LanguageContext';
import {
  getIraqToday,
  getIraqDayOfWeek,
  formatIraqDate,
  formatIraqTime,
} from '../../utils/timezoneUtils';

interface DoctorScheduleTabProps {
  schedule: DoctorScheduleConfig | null;
  appointments: AppointmentRecord[];
  onSaveSchedule: (newSchedule: Partial<DoctorScheduleConfig>) => Promise<void>;
  isLoading: boolean;
}

export const DoctorScheduleTab: React.FC<DoctorScheduleTabProps> = ({
  schedule,
  appointments,
  onSaveSchedule,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const allWeekDays = [
    { id: 'Sunday', labelAr: 'الأحد', labelEn: 'Sunday' },
    { id: 'Monday', labelAr: 'الإثنين', labelEn: 'Monday' },
    { id: 'Tuesday', labelAr: 'الثلاثاء', labelEn: 'Tuesday' },
    { id: 'Wednesday', labelAr: 'الأربعاء', labelEn: 'Wednesday' },
    { id: 'Thursday', labelAr: 'الخميس', labelEn: 'Thursday' },
    { id: 'Friday', labelAr: 'الجمعة', labelEn: 'Friday' },
    { id: 'Saturday', labelAr: 'السبت', labelEn: 'Saturday' },
  ];

  const [selectedDays, setSelectedDays] = useState<string[]>(
    schedule?.workingDays || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  );
  const [shiftStart, setShiftStart] = useState<string>(schedule?.shiftStartTime || '09:00');
  const [shiftEnd, setShiftEnd] = useState<string>(schedule?.shiftEndTime || '15:00');
  const [slotDuration, setSlotDuration] = useState<number>(schedule?.slotDurationMinutes || 20);
  const [dailyCapacity, setDailyCapacity] = useState<number>(schedule?.dailyCapacity || 15);
  const [blackoutDates, setBlackoutDates] = useState<string[]>(schedule?.blackoutDates || []);
  const [newBlackoutDate, setNewBlackoutDate] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Selected date for previewing seat capacity (Default to today in Iraq Asia/Baghdad)
  const [previewDate, setPreviewDate] = useState<string>(getIraqToday());

  // Generate shift slots for preview
  const previewCandidateSlots: string[] = [];
  try {
    const [startH, startM] = shiftStart.split(':').map(Number);
    const [endH, endM] = shiftEnd.split(':').map(Number);
    let curM = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    while (curM + slotDuration <= endMinutes) {
      const h = Math.floor(curM / 60);
      const m = curM % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m < 10 ? `0${m}` : m;
      previewCandidateSlots.push(`${displayH}:${displayM} ${ampm}`);
      curM += slotDuration;
    }
  } catch {
    // fallback
  }

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const addBlackoutDate = () => {
    if (!newBlackoutDate || blackoutDates.includes(newBlackoutDate)) return;
    setBlackoutDates([...blackoutDates, newBlackoutDate]);
    setNewBlackoutDate('');
  };

  const removeBlackoutDate = (dateToRemove: string) => {
    setBlackoutDates(blackoutDates.filter((d) => d !== dateToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onSaveSchedule({
        workingDays: selectedDays,
        shiftStartTime: shiftStart,
        shiftEndTime: shiftEnd,
        slotDurationMinutes: slotDuration,
        dailyCapacity: dailyCapacity,
        blackoutDates: blackoutDates,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Real-time capacity computation for preview date in Asia/Baghdad
  const isPreviewBlackout = blackoutDates.includes(previewDate);
  const previewDayName = getIraqDayOfWeek(previewDate);
  const isPreviewWorkingDay = selectedDays.includes(previewDayName);

  const confirmedBookingsOnDate = appointments.filter(
    (a) => a.date === previewDate && a.status === 'confirmed'
  );
  const pendingBookingsOnDate = appointments.filter(
    (a) => a.date === previewDate && a.status === 'pending'
  );

  const confirmedCount = confirmedBookingsOnDate.length;
  const pendingCount = pendingBookingsOnDate.length;
  const totalOccupied = confirmedCount + pendingCount;
  const remainingSeats = isPreviewBlackout || !isPreviewWorkingDay ? 0 : Math.max(0, dailyCapacity - totalOccupied);
  const seatFillPercentage = isPreviewBlackout || !isPreviewWorkingDay ? 0 : Math.min(100, Math.round((totalOccupied / dailyCapacity) * 100));

  // Map each slot to status: green = available, amber = pending, red = confirmed
  const previewSlotsStatus = previewCandidateSlots.map((slot) => {
    const confirmedApp = confirmedBookingsOnDate.find((a) => a.timeSlot === slot);
    if (confirmedApp) {
      return { slot, status: 'confirmed' as const, patient: confirmedApp.patientName };
    }
    const pendingApp = pendingBookingsOnDate.find((a) => a.timeSlot === slot);
    if (pendingApp) {
      return { slot, status: 'pending' as const, patient: pendingApp.patientName };
    }
    return { slot, status: 'available' as const, patient: null };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>{isAr ? 'أوقات الدوام وسعة المقاعد السريرية' : 'Clinic Hours & Seat Capacity'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'تحديد جدول العمل الأسبوعي، سعة الاستيعاب اليومية للمراجعين، وإدارة فترات العطل والإجازات.'
              : 'Configure weekly shifts, maximum patient load per day, slot duration, and leave periods.'}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          {isSaving ? (
            <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
          ) : (
            <>
              <Save className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'حفظ إعدادات الجدول' : 'Save Schedule'}</span>
            </>
          )}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? 'تم حفظ ومزامنة إعدادات الدوام وسعة المقاعد بنجاح.' : 'Clinic schedule and capacity saved successfully.'}</span>
        </div>
      )}

      {/* Main Grid: Weekly Schedule + Real-time Capacity Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Working Days Selector */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>{isAr ? 'أيام الدوام الأسبوعية المتاحة للحجز' : 'Weekly Working Days'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'حدد الأيام التي تستقبل فيها المراجعين في العيادة. تظهر هذه الأيام للمرضى عند اختيار موعد الحجز.'
                : 'Select the days patients can book consultations.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {allWeekDays.map((d) => {
                const isSelected = selectedDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block">{isAr ? d.labelAr : d.labelEn}</span>
                    <span
                      className={`text-[10px] mt-1 block font-normal ${
                        isSelected ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {isSelected ? (isAr ? 'مفعل' : 'Active') : (isAr ? 'عطلة' : 'Off')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shift Hours and Slot Duration */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'ساعات المناوبة ومدة الكشف' : 'Shift Hours & Slot Duration'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'بداية الدوام اليومي' : 'Shift Start'}
                </label>
                <input
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'نهاية الدوام اليومي' : 'Shift End'}
                </label>
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'مدة الكشف (بالدقائق)' : 'Slot Duration (min)'}
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(parseInt(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
                >
                  <option value={15}>15 {isAr ? 'دقيقة' : 'minutes'}</option>
                  <option value={20}>20 {isAr ? 'دقيقة' : 'minutes'}</option>
                  <option value={30}>30 {isAr ? 'دقيقة' : 'minutes'}</option>
                  <option value={45}>45 {isAr ? 'دقيقة' : 'minutes'}</option>
                  <option value={60}>60 {isAr ? 'دقيقة (ساعة)' : 'minutes'}</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'الحد الأقصى لسعة المراجعين يومياً (مقاعد الكشف)' : 'Daily Patient Capacity Limit'}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={1}
                  value={dailyCapacity}
                  onChange={(e) => setDailyCapacity(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="w-16 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-center text-xs font-black">
                  {dailyCapacity}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isAr
                  ? 'عند اكتمال هذا العدد من الحجوزات في أي يوم، يتم إغلاق حجز المقاعد تلقائياً لحماية جودة الرعاية الطبية.'
                  : 'Once capacity is reached, new bookings close for that date to preserve care standards.'}
              </p>
            </div>
          </div>

          {/* Holiday / Blackout Dates Manager */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-rose-600" />
              <span>{isAr ? 'أيام العطل والاستراحات الطارئة (Blackout Dates)' : 'Holidays & Off-Days'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'يمكنك حجب أي تاريخ محدد مؤقتاً (مؤتمر، إجازة سنوية، طارئ) لمنع استقبال حجوزات جديدة فيه دون التأثير على الجدول العام.'
                : 'Block specific dates for conferences, leave, or emergencies.'}
            </p>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newBlackoutDate}
                onChange={(e) => setNewBlackoutDate(e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200 text-xs focus:border-rose-500"
              />
              <button
                type="button"
                onClick={addBlackoutDate}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer border border-rose-200"
              >
                <Plus className="w-4 h-4 text-rose-600" />
                <span>{isAr ? 'إضافة يوم عطلة' : 'Add Blackout Date'}</span>
              </button>
            </div>

            {blackoutDates.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                {isAr ? 'لا توجد أيام عطل خاصة مسجلة حالياً.' : 'No special off-dates registered.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-2">
                {blackoutDates.map((bDate) => (
                  <span
                    key={bDate}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-mono border border-slate-200"
                  >
                    <span>{bDate}</span>
                    <button
                      type="button"
                      onClick={() => removeBlackoutDate(bDate)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      title={isAr ? 'حذف العطلة' : 'Remove'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Real-Time Seat Capacity Visualizer */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'حاسبة سعة المقاعد المباشرة' : 'Live Capacity Monitor'}</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                M737 Engine
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-300 font-semibold">
                  {isAr ? 'اختر تاريخاً لمعاينة الإشغال:' : 'Inspect Date Capacity:'}
                </label>
                <span className="text-[10px] font-mono text-amber-300">Asia/Baghdad</span>
              </div>
              <input
                type="date"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-hidden font-mono"
              />
              {previewDate && (
                <div className="text-[11px] text-slate-300 mt-1 font-semibold">
                  {formatIraqDate(previewDate, isAr)}
                </div>
              )}
            </div>

            {/* Capacity Meter */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{isAr ? 'حالة التاريخ:' : 'Status:'}</span>
                {isPreviewBlackout ? (
                  <span className="text-rose-400 font-bold">{isAr ? 'عطلة مغلقة' : 'Blackout Day'}</span>
                ) : !isPreviewWorkingDay ? (
                  <span className="text-amber-400 font-bold">{isAr ? 'عطلة أسبوعية' : 'Off-Day'}</span>
                ) : (
                  <span className="text-emerald-400 font-bold">{isAr ? 'يوم عمل متاح' : 'Available for Booking'}</span>
                )}
              </div>

              {/* Status Breakdown Pills */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                  <span className="block text-emerald-300 font-black text-sm">{remainingSeats}</span>
                  <span className="text-[10px] text-emerald-200">{isAr ? 'متاح (أخضر)' : 'Available'}</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                  <span className="block text-amber-300 font-black text-sm">{pendingCount}</span>
                  <span className="text-[10px] text-amber-200">{isAr ? 'معلق (كهرماني)' : 'Pending'}</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/30">
                  <span className="block text-rose-300 font-black text-sm">{confirmedCount}</span>
                  <span className="text-[10px] text-rose-200">{isAr ? 'محجوز (أحمر)' : 'Booked'}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    seatFillPercentage > 90
                      ? 'bg-rose-500'
                      : seatFillPercentage > 70
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${seatFillPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                <span>{isAr ? 'السعة الكلية:' : 'Total Cap:'} {dailyCapacity}</span>
                <span>{isAr ? 'نسبة الإشغال:' : 'Fill:'} {seatFillPercentage}%</span>
              </div>
            </div>

            {/* Visual Seat/Slot Matrix */}
            <div className="space-y-2">
              <div className="text-xs text-slate-200 font-bold flex items-center justify-between">
                <span>{isAr ? 'خريطة المقاعد والفترات الزمنية:' : 'Shift Slot & Seat Matrix:'}</span>
                <span className="text-[10px] text-slate-400">({previewSlotsStatus.length} {isAr ? 'فترة' : 'slots'})</span>
              </div>

              {previewSlotsStatus.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">
                  {isAr ? 'يرجى تحديد بداية ونهاية المناوبة بشكل صحيح.' : 'Configure shift hours.'}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pe-1">
                  {previewSlotsStatus.map((item) => {
                    const isGreen = item.status === 'available';
                    const isAmber = item.status === 'pending';
                    const isRed = item.status === 'confirmed';

                    return (
                      <div
                        key={item.slot}
                        className={`p-2 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                          isGreen
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                            : isAmber
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                            : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                          <span>{item.slot}</span>
                          <span className="w-2 h-2 rounded-full inline-block shrink-0"
                            style={{
                              backgroundColor: isGreen ? '#34d399' : isAmber ? '#fbbf24' : '#f87171'
                            }}
                          />
                        </div>
                        <div className="text-[10px] truncate mt-0.5 font-sans">
                          {isGreen && (isAr ? 'شاغر متاح' : 'Available')}
                          {isAmber && (item.patient ? `${isAr ? 'معلق: ' : 'Pending: '}${item.patient}` : (isAr ? 'قيد المراجعة' : 'Pending'))}
                          {isRed && (item.patient ? `${isAr ? 'مؤكد: ' : 'Booked: '}${item.patient}` : (isAr ? 'محجوز' : 'Booked'))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Convention Legend */}
              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>{isAr ? 'أخضر: متاح' : 'Available'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span>{isAr ? 'كهرماني: معلق' : 'Pending'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                  <span>{isAr ? 'أحمر: محجوز' : 'Booked'}</span>
                </span>
              </div>
            </div>

            {/* Working Hours Summary Pill */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1.5">
              <div className="text-slate-300 font-semibold">{isAr ? 'ملخص ساعات العمل:' : 'Shift Summary:'}</div>
              <div className="text-slate-200 font-mono text-[11px]">
                {shiftStart} — {shiftEnd} ({slotDuration} {isAr ? 'دقيقة لكل كشف' : 'min / patient'})
              </div>
              <div className="text-[11px] text-slate-400">
                {selectedDays.length} {isAr ? 'أيام دوام أسبوعياً' : 'days per week'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
