import React, { useState } from 'react';
import { Calendar, Search, Filter, ShieldCheck, Clock, CheckCircle2, XCircle, Printer } from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { AppointmentRecord } from '../../types/database';
import { PrintableModal } from '../common/PrintableModal';
import { formatIraqDate } from '../../utils/timezoneUtils';

interface AdminBookingsTabProps {
  appointments?: AppointmentRecord[];
}

export const AdminBookingsTab: React.FC<AdminBookingsTabProps> = ({ appointments = [] }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  const filtered = appointments.filter((app) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      app.id.toLowerCase().includes(q) ||
      (app.patientName && app.patientName.toLowerCase().includes(q)) ||
      (app.doctorName && app.doctorName.toLowerCase().includes(q)) ||
      (app.clinicName && app.clinicName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBookings = appointments.length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const totalFeesIqd = appointments.reduce((acc, curr) => acc + (curr.consultationFee || 25000), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-600" />
            <span>{isAr ? 'نظرة عامة على المواعيد والحجوزات السريرية' : 'Clinical Bookings Oversight'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {isAr
              ? 'مراقبة حركة الحجوزات الطبية ومواعيد المعاينة في العيادات التخصصية المعتمدة.'
              : 'Oversight of clinical appointments and consultation flow across accredited partner clinics.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPrintReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title={isAr ? 'طباعة تقرير الحجوزات السريرية' : 'Print Bookings Audit Report'}
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'طباعة تقرير الحجوزات' : 'Print Bookings Report'}</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'مراقبة نظامية' : 'Privacy-Guarded'}</span>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
          <span className="text-xs text-slate-500 font-medium">{isAr ? 'إجمالي الحجوزات' : 'Total Bookings'}</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalBookings}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
          <span className="text-xs text-emerald-700 font-medium">{isAr ? 'مواعيد مؤكدة' : 'Confirmed'}</span>
          <div className="text-2xl font-black text-emerald-700 font-mono">{confirmedCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
          <span className="text-xs text-amber-700 font-medium">{isAr ? 'مواعيد قيد الانتظار' : 'Pending'}</span>
          <div className="text-2xl font-black text-amber-700 font-mono">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
          <span className="text-xs text-sky-700 font-medium">{isAr ? 'مكتملة الكشف' : 'Completed'}</span>
          <div className="text-2xl font-black text-sky-700 font-mono">{completedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'البحث برقم الحجز، اسم المراجع، الطبيب أو العيادة...' : 'Search by Ref, patient, doctor, clinic...'}
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 w-full sm:w-auto"
        >
          <option value="all">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
          <option value="confirmed">{isAr ? 'مؤكد' : 'Confirmed'}</option>
          <option value="pending">{isAr ? 'قيد الانتظار' : 'Pending'}</option>
          <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
          <option value="cancelled">{isAr ? 'ملغي' : 'Cancelled'}</option>
        </select>
      </div>

      {/* Bookings Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isAr ? 'لا توجد مواعيد مسجلة مطابقة' : 'No clinical bookings recorded'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {isAr
                ? 'ستظهر هنا كافة المواعيد المجدولة بين المرضى والأطباء فور قيام الأطباء المعتمدين بنشر جداول عياداتهم وحجز المراجعين لها.'
                : 'Appointments will stream in real-time as accredited physicians publish schedules and patients confirm slots.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-start"># {isAr ? 'رمز الحجز' : 'Ref'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'المراجع' : 'Patient'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الطبيب والعيادة' : 'Physician & Clinic'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'التاريخ والوقت' : 'Date & Slot'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الكشفية' : 'Fee'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{app.id}</td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{app.patientName}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">{app.patientPhone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{app.doctorName}</div>
                      <div className="text-[11px] text-slate-500">{app.clinicName} · {app.specialty}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{formatIraqDate(app.date, isAr)}</div>
                      <div className="text-[11px] text-sky-800 font-mono font-bold">{app.timeSlot}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : app.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : app.status === 'completed'
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-800">
                      {(app.consultationFee || 25000).toLocaleString()} IQD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRINTABLE BOOKINGS AUDIT REPORT */}
      {isPrintReportOpen && (
        <PrintableModal
          isOpen={isPrintReportOpen}
          onClose={() => setIsPrintReportOpen(false)}
          title={isAr ? 'تقرير الرقابة والتدقيق الشامل للحجوزات السريرية' : 'Clinical Bookings Audit & Flow Report'}
          subtitle={isAr ? 'تقرير إحصائي بحركة المواعيد والكشوفات الطبية عبر المنصة' : 'Appointments Telemetry & Roster - M737 National Healthcare'}
          docNumber={`REP-BK-${new Date().toISOString().slice(0, 10)}`}
          badgeText={isAr ? 'تقرير رقابي رسمي' : 'Official Report'}
          officialStampTitle={isAr ? 'مصادقة قسم الجودة والرقابة الطبية' : 'Clinical Quality & Audit Board Seal'}
          headerDetails={[
            {
              label: isAr ? 'إجمالي الحجوزات:' : 'Total Bookings:',
              value: `${filtered.length} ${isAr ? 'موعد' : 'Bookings'}`,
            },
            {
              label: isAr ? 'المؤكدة والمكتملة:' : 'Confirmed / Done:',
              value: `${confirmedCount + completedCount}`,
            },
            {
              label: isAr ? 'قيد الانتظار:' : 'Pending Review:',
              value: `${pendingCount}`,
            },
            {
              label: isAr ? 'إجمالي الكشفيات:' : 'Total Fees Tracked:',
              value: `${totalFeesIqd.toLocaleString()} IQD`,
            },
          ]}
        >
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-6 text-center bg-slate-50 rounded-xl">
              {isAr ? 'لا توجد حجوزات مسجلة مطابقة.' : 'No clinical bookings to display.'}
            </p>
          ) : (
            <div className="border border-slate-300 rounded-xl overflow-hidden avoid-break">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                  <tr>
                    <th className="py-2 px-3 text-start">#</th>
                    <th className="py-2 px-3 text-start">{isAr ? 'رمز الحجز' : 'Ref'}</th>
                    <th className="py-2 px-3 text-start">{isAr ? 'المراجع' : 'Patient'}</th>
                    <th className="py-2 px-3 text-start">{isAr ? 'الطبيب' : 'Physician'}</th>
                    <th className="py-2 px-3 text-start">{isAr ? 'العيادة' : 'Clinic'}</th>
                    <th className="py-2 px-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-2 px-3 text-start">{isAr ? 'الوقت' : 'Slot'}</th>
                    <th className="py-2 px-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((app, idx) => (
                    <tr key={app.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{app.id}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{app.patientName}</td>
                      <td className="py-2 px-3 text-slate-800">{app.doctorName}</td>
                      <td className="py-2 px-3 text-slate-600">{app.clinicName}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{app.date}</td>
                      <td className="py-2 px-3 font-mono text-sky-800">{app.timeSlot}</td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-[10px] uppercase">{app.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 avoid-break">
            {isAr
              ? 'وثيقة صادرة عن الرقابة المركزية للمنصة الطبية الوطنية M737 لتوثيق تدفق الحجوزات وضبط المواعيد السريرية.'
              : 'Official clinical oversight document certifying appointment distribution across network clinics.'}
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
