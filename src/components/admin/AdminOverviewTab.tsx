import React, { useState } from 'react';
import {
  Users,
  Stethoscope,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Printer,
} from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { DoctorApplication, Subscription, UserProfile } from '../../types/auth';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { AdminTab } from './AdminSidebar';
import { PrintableModal } from '../common/PrintableModal';

interface AdminOverviewTabProps {
  isLoading: boolean;
  doctors: UserProfile[];
  applications: DoctorApplication[];
  patients: UserProfile[];
  subscriptions: Subscription[];
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  isLoading,
  doctors,
  applications,
  patients,
  subscriptions,
  onNavigateTab,
}) => {
  const { language, direction } = useLanguage();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingIndicator size="lg" label={language === 'ar' ? 'جاري استعلام مؤشرات المنصة...' : 'Querying metrics...'} />
      </div>
    );
  }

  // Real Database Totals
  const totalDoctors = doctors.length;
  const approvedDoctors = doctors.filter((d) => d.approvalStatus === 'active').length;
  const pendingApplications = applications.filter((a) => a.status === 'pending_approval').length;
  const rejectedApplications = applications.filter((a) => a.status === 'rejected').length;
  const totalPatients = patients.length;

  const nowIso = new Date().toISOString();
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'lifetime'
  ).length;
  const expiredSubscriptions = subscriptions.filter((s) => s.status === 'expired').length;

  const recentApplications = [...applications]
    .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))
    .slice(0, 5);

  // Group applications by month for real timeline chart
  const timelineMap: Record<string, number> = {};
  applications.forEach((app) => {
    if (app.submittedAt) {
      const date = new Date(app.submittedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      timelineMap[key] = (timelineMap[key] || 0) + 1;
    }
  });

  const timelineEntries = Object.entries(timelineMap).sort(([a], [b]) => a.localeCompare(b));
  const maxTimelineCount = Math.max(...Object.values(timelineMap), 1);
  const [isPrintExecutiveReportOpen, setIsPrintExecutiveReportOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {language === 'ar' ? 'نظرة عامة على أداء المنصة' : 'Platform Executive Overview'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {language === 'ar'
              ? 'مؤشرات وبيانات حقيقية مستعلمة مباشرة من قاعدة بيانات Cloud Firestore.'
              : 'Live real-time operational telemetry queried directly from Cloud Firestore.'}
          </p>
        </div>

        <button
          onClick={() => setIsPrintExecutiveReportOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          title={language === 'ar' ? 'طباعة تقرير المؤشرات التنفيذي' : 'Print Executive Report'}
        >
          <Printer className="w-4 h-4 text-amber-600" />
          <span>{language === 'ar' ? 'طباعة تقرير المؤشرات' : 'Print Executive Report'}</span>
        </button>
      </div>

      {/* Summary Cards Grid (8 Core Real Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Registered Doctors */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{language === 'ar' ? 'إجمالي الأطباء المسجلين' : 'Total Doctors'}</span>
            <Stethoscope className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tabular-nums">
            {totalDoctors}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>{language === 'ar' ? 'يشمل المعتمدين وقيد التدقيق' : 'Includes approved & pending'}</span>
          </div>
        </div>

        {/* 2. Approved Doctors */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
            <span>{language === 'ar' ? 'الأطباء المعتمدون' : 'Approved Doctors'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono tabular-nums">
            {approvedDoctors}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>{language === 'ar' ? 'عياداتهم مفعلة للمرضى' : 'Clinics active for patients'}</span>
          </div>
        </div>

        {/* 3. Pending Doctor Applications */}
        <div
          onClick={() => onNavigateTab('applications')}
          className="p-5 rounded-2xl bg-amber-50/80 border border-amber-300 shadow-xs space-y-2 cursor-pointer hover:bg-amber-100/80 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
            <span>{language === 'ar' ? 'طلبات قيد التدقيق' : 'Pending Applications'}</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-3xl font-black text-amber-800 font-mono tabular-nums">
            {pendingApplications}
          </div>
          <div className="text-[11px] text-amber-900 flex items-center justify-between">
            <span>{language === 'ar' ? 'تتطلب قرار الإدارة' : 'Requires admin action'}</span>
            <ArrowIcon className="w-3.5 h-3.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. Rejected Applications */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-red-800 font-semibold">
            <span>{language === 'ar' ? 'الطلبات المرفوضة' : 'Rejected Applications'}</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-3xl font-black text-red-700 font-mono tabular-nums">
            {rejectedApplications}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>{language === 'ar' ? 'عدم استيفاء الشروط' : 'Non-compliant submissions'}</span>
          </div>
        </div>

        {/* 5. Registered Patients */}
        <div
          onClick={() => onNavigateTab('patients')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{language === 'ar' ? 'المراجعون المسجلون' : 'Registered Patients'}</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tabular-nums">
            {totalPatients}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>{language === 'ar' ? 'سجلات مراجعين موثقة' : 'Verified patient accounts'}</span>
          </div>
        </div>

        {/* 6. Active Subscriptions */}
        <div
          onClick={() => onNavigateTab('subscriptions')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{language === 'ar' ? 'الاشتراكات النشطة' : 'Active Subscriptions'}</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono tabular-nums">
            {activeSubscriptions}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>{language === 'ar' ? 'تراخيص سارية المفعول' : 'Valid clinical licenses'}</span>
          </div>
        </div>

        {/* 7. Expired Subscriptions */}
        <div
          onClick={() => onNavigateTab('subscriptions')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{language === 'ar' ? 'اشتراكات منتهية الصلاحية' : 'Expired Subscriptions'}</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-700 font-mono tabular-nums">
            {expiredSubscriptions}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>{language === 'ar' ? 'تحتاج إلى تمديد أو تجديد' : 'Requires renewal'}</span>
          </div>
        </div>

        {/* 8. Recent Registration Requests */}
        <div
          onClick={() => onNavigateTab('applications')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{language === 'ar' ? 'أحدث طلبات التسجيل' : 'Recent Submissions'}</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tabular-nums">
            {applications.length}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>{language === 'ar' ? 'إجمالي الطلبات الواردة' : 'Total inbound submissions'}</span>
          </div>
        </div>
      </div>

      {/* Chart Section: Real Registrations Over Time */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'المخطط الزمني لطلبات تسجيل الأطباء' : 'Doctor Registration Timeline'}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {language === 'ar' ? 'مبني على الطوابع الزمنية الفعلية' : 'Based on actual database timestamps'}
          </span>
        </div>

        {timelineEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {language === 'ar' ? 'لا توجد بيانات تسجيلات زمنية حتى الآن' : 'No registration history recorded yet'}
          </div>
        ) : (
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {timelineEntries.map(([month, count]) => {
                const heightPercent = Math.max(15, Math.round((count / maxTimelineCount) * 100));
                return (
                  <div key={month} className="flex flex-col items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                      {count} {language === 'ar' ? 'طلب' : 'apps'}
                    </span>
                    <div className="w-full h-24 bg-slate-100 rounded-lg flex items-end p-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-[#0A192F] rounded-md transition-all duration-300"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent Applications Preview */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {language === 'ar' ? 'آخر طلبات الاعتماد المقدمة' : 'Recent Application Influx'}
          </h3>
          <button
            onClick={() => onNavigateTab('applications')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'ar' ? 'عرض كافة الطلبات' : 'View All'}</span>
            <ArrowIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentApplications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            {language === 'ar' ? 'لا توجد طلبات حديثة في قاعدة البيانات.' : 'No recent applications found in database.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الطبيب' : 'Doctor'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'التخصص' : 'Specialty'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'رقم النقابة' : 'Syndicate ID'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'المحافظة' : 'Governorate'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApplications.map((app, idx) => (
                  <tr key={app.doctorId || `app-recent-${idx}`} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-bold text-slate-900">{app.fullName}</td>
                    <td className="py-3 px-3 text-slate-700">{app.specialization}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{app.syndicateId}</td>
                    <td className="py-3 px-3 text-slate-600">{app.governorate}</td>
                    <td className="py-3 px-3">
                      {app.status === 'pending_approval' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          {language === 'ar' ? 'قيد التدقيق' : 'Pending'}
                        </span>
                      )}
                      {app.status === 'active' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">
                          {language === 'ar' ? 'معتمد' : 'Approved'}
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-900">
                          {language === 'ar' ? 'مرفوض' : 'Rejected'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRINTABLE EXECUTIVE GOVERNANCE REPORT */}
      {isPrintExecutiveReportOpen && (
        <PrintableModal
          isOpen={isPrintExecutiveReportOpen}
          onClose={() => setIsPrintExecutiveReportOpen(false)}
          title={language === 'ar' ? 'التقرير التنفيذي الشامل لمؤشرات المنصة الطبية' : 'Platform Executive Telemetry & Governance Report'}
          subtitle={language === 'ar' ? 'المؤشرات والبيانات السحابية المستعلمة من Cloud Firestore' : 'Official Firestore Operational Telemetry Report'}
          docNumber={`EXEC-${new Date().toISOString().slice(0, 10)}`}
          badgeText={language === 'ar' ? 'تقرير قيادي رسمي' : 'Executive Report'}
          officialStampTitle={language === 'ar' ? 'مصادقة الإدارة العامة للمنصة' : 'Executive Board Seal & Signature'}
          headerDetails={[
            {
              label: language === 'ar' ? 'إجمالي الأطباء:' : 'Total Doctors:',
              value: `${totalDoctors} (${approvedDoctors} ${language === 'ar' ? 'معتمد' : 'Approved'})`,
            },
            {
              label: language === 'ar' ? 'طلبات الاعتماد:' : 'Licensing Queue:',
              value: `${pendingApplications} ${language === 'ar' ? 'قيد التدقيق' : 'Pending'}`,
            },
            {
              label: language === 'ar' ? 'المراجعون المسجلون:' : 'Registered Patients:',
              value: `${totalPatients} ${language === 'ar' ? 'مراجع' : 'Patients'}`,
            },
            {
              label: language === 'ar' ? 'الاشتراكات المفعلة:' : 'Active Subscriptions:',
              value: `${activeSubscriptions} ${language === 'ar' ? 'اشتراك' : 'Active'}`,
            },
          ]}
        >
          {/* Executive KPI Summary Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden avoid-break">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-4 text-start">{language === 'ar' ? 'المؤشر التشغيلي / الحقل' : 'Telemetry Metric'}</th>
                  <th className="py-2.5 px-4 text-start">{language === 'ar' ? 'القيمة الإجمالية' : 'Current Value'}</th>
                  <th className="py-2.5 px-4 text-start">{language === 'ar' ? 'الحالة والتقييم النظامي' : 'System Evaluation'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">{language === 'ar' ? 'الكوادر الطبية والعيادات المعتمدة' : 'Accredited Doctors & Clinics'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">{approvedDoctors} / {totalDoctors}</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">{language === 'ar' ? 'مفعلة وتستقبل الحجوزات' : 'Active for Bookings'}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">{language === 'ar' ? 'طلبات الانضمام قيد التدقيق' : 'Physician Licensing Queue'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-800 text-sm">{pendingApplications}</td>
                  <td className="py-3 px-4 text-amber-700 font-bold">{language === 'ar' ? 'بانتظار التحقق من نقابة الأطباء' : 'Syndicate ID Verification'}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">{language === 'ar' ? 'قاعدة المراجعين والمرضى' : 'Registered Patient Base'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">{totalPatients}</td>
                  <td className="py-3 px-4 text-slate-600">{language === 'ar' ? 'حسابات مراجعين نشطة' : 'Active Patient Accounts'}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">{language === 'ar' ? 'الاشتراكات النشطة للعيادات' : 'Active Clinic Subscriptions'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-sky-800 text-sm">{activeSubscriptions}</td>
                  <td className="py-3 px-4 text-sky-700 font-bold">{language === 'ar' ? 'تغطية اشتراكات سارية' : 'In Good Standing'}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">{language === 'ar' ? 'الاشتراكات المنتهية' : 'Expired Subscriptions'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-700 text-sm">{expiredSubscriptions}</td>
                  <td className="py-3 px-4 text-rose-600">{language === 'ar' ? 'تتطلب التجديد والتواصل' : 'Follow-up Required'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 avoid-break">
            {language === 'ar'
              ? 'تقرير رسمي صادر آلياً عن منظومة الإدارة المركزية لمنصة M737 الطبية لجمهورية العراق.'
              : 'Official automated governance report generated from M737 Iraq Central Management Console.'}
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
