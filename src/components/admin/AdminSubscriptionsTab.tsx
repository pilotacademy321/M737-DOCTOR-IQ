import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Infinity as InfinityIcon,
  Search,
  Calendar,
  X,
  RefreshCw,
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import {
  Subscription,
  SubscriptionPlanType,
  PaymentStatus,
  PaymentMethod,
  UserProfile,
} from '../../types/auth';
import { PrintableModal } from '../common/PrintableModal';
import { formatIraqDate } from '../../utils/timezoneUtils';

interface AdminSubscriptionsTabProps {
  subscriptions: Subscription[];
  doctors: UserProfile[];
  onAssignSubscription: (subData: Partial<Subscription>) => Promise<void>;
  onRenewSubscription: (subId: string, addDays: number) => Promise<void>;
  onConfirmPayment: (subId: string) => Promise<void>;
}

export const AdminSubscriptionsTab: React.FC<AdminSubscriptionsTabProps> = ({
  subscriptions,
  doctors,
  onAssignSubscription,
  onRenewSubscription,
  onConfirmPayment,
}) => {
  const { language } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'pending_payment' | 'lifetime'>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renewModalSub, setRenewModalSub] = useState<Subscription | null>(null);
  const [renewDays, setRenewDays] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [selectedPrintReceipt, setSelectedPrintReceipt] = useState<Subscription | null>(null);

  // Form states for new subscription
  const approvedDoctors = doctors.filter((d) => d.approvalStatus === 'active');
  const [selectedDoctorId, setSelectedDoctorId] = useState(approvedDoctors[0]?.uid || '');
  const [planType, setPlanType] = useState<SubscriptionPlanType>('1_month');
  const [customDays, setCustomDays] = useState(30);
  const [priceIqd, setPriceIqd] = useState(50000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('confirmed');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('zain_cash');
  const [notes, setNotes] = useState('');

  const calculateExpiry = (plan: SubscriptionPlanType, start: string, cDays: number) => {
    if (plan === 'lifetime') return '';
    const d = new Date(start);
    let daysToAdd = 30;
    if (plan === 'custom') daysToAdd = cDays;
    else if (plan === '1_month') daysToAdd = 30;
    else if (plan === '3_months') daysToAdd = 90;
    else if (plan === '6_months') daysToAdd = 180;
    else if (plan === '1_year') daysToAdd = 365;

    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  };

  const filtered = subscriptions.filter((sub) => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      sub.doctorName.toLowerCase().includes(q) ||
      sub.id.toLowerCase().includes(q) ||
      sub.doctorId.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) return;

    const docObj = doctors.find((d) => d.uid === selectedDoctorId);
    const doctorName = docObj?.displayName || 'طبيب استشاري';
    const expiry = calculateExpiry(planType, startDate, customDays);

    let statusVal: Subscription['status'] = 'active';
    if (planType === 'lifetime') statusVal = 'lifetime';
    else if (paymentStatus === 'pending') statusVal = 'pending_payment';

    setIsProcessing(true);
    try {
      await onAssignSubscription({
        doctorId: selectedDoctorId,
        doctorName,
        planType,
        durationDays: planType === 'lifetime' ? 99999 : planType === 'custom' ? customDays : 30,
        priceIqd,
        startDate: new Date(startDate).toISOString(),
        expiryDate: expiry ? new Date(expiry).toISOString() : undefined,
        paymentStatus,
        paymentMethod,
        status: statusVal,
        notes,
      });
      setCreateModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenew = async () => {
    if (!renewModalSub) return;
    setIsProcessing(true);
    try {
      await onRenewSubscription(renewModalSub.id, renewDays);
      setRenewModalSub(null);
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
            {language === 'ar' ? 'إدارة تراخيص واشتراكات الأطباء' : 'Physician & Clinic Subscriptions'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {language === 'ar'
              ? 'تخصيص الاشتراكات الزمنية، تحديد الأسعار، وتوثيق المدفوعات للعيادات المعتمدة.'
              : 'Provision clinic licenses, configure subscription pricing, and audit payment receipts.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPrintReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title={language === 'ar' ? 'طباعة تقرير الاشتراكات والتحصيلات' : 'Print Subscriptions Report'}
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>{language === 'ar' ? 'طباعة التقرير المالي' : 'Print Report'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A192F] hover:bg-[#142E54] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{language === 'ar' ? 'تخصيص اشتراك جديد' : 'Assign New Subscription'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-[#0A192F] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'الكل' : 'All'} ({subscriptions.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'النشطة' : 'Active'} ({subscriptions.filter((s) => s.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('pending_payment')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'pending_payment' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'بانتظار الدفع' : 'Pending Payment'} ({subscriptions.filter((s) => s.status === 'pending_payment').length})
          </button>
          <button
            onClick={() => setStatusFilter('lifetime')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'lifetime' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'دائم (Lifetime)' : 'Lifetime'} ({subscriptions.filter((s) => s.status === 'lifetime').length})
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'expired' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'منتهية' : 'Expired'} ({subscriptions.filter((s) => s.status === 'expired').length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'بحث باسم الطبيب أو معرف الاشتراك...' : 'Search doctor or sub ID...'}
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {language === 'ar' ? 'لا توجد سجلات اشتراكات مطابقة' : 'No subscription records found'}
            </p>
            <p className="text-xs text-slate-400">
              {language === 'ar'
                ? 'استخدم زر "تخصيص اشتراك جديد" لمنح ترخيص سريري لطبيب معتمد.'
                : 'Click "Assign New Subscription" to license an approved physician.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الطبيب والعيادة' : 'Physician'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'نوع الباقة' : 'Plan'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'السعر المحدد' : 'Price (IQD)'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'البداية والانتهاء' : 'Duration'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الدفع' : 'Payment'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((sub, idx) => (
                  <tr key={sub.id || `sub-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sub.doctorName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {(sub.id || '').substring(0, 10)}...</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {sub.planType === 'lifetime'
                        ? 'مدى الحياة (Lifetime)'
                        : sub.planType === '1_month'
                        ? 'شهر واحد (30 يوم)'
                        : sub.planType === '3_months'
                        ? '3 أشهر (90 يوم)'
                        : sub.planType === '6_months'
                        ? '6 أشهر (180 يوم)'
                        : sub.planType === '1_year'
                        ? 'سنة كاملة (365 يوم)'
                        : `${sub.durationDays} يوم`}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {sub.priceIqd ? `${sub.priceIqd.toLocaleString()} د.ع` : 'مجاني / استثنائي'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      <div>من: {new Date(sub.startDate).toLocaleDateString()}</div>
                      <div>
                        إلى:{' '}
                        {sub.planType === 'lifetime'
                          ? 'غير محدد (دائم)'
                          : sub.expiryDate
                          ? new Date(sub.expiryDate).toLocaleDateString()
                          : '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                            sub.paymentStatus === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.paymentStatus === 'waived'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {sub.paymentStatus === 'confirmed'
                            ? 'تم التأكيد'
                            : sub.paymentStatus === 'waived'
                            ? 'معفى'
                            : 'معلق'}
                        </span>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{sub.paymentMethod}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {sub.status === 'active' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {language === 'ar' ? 'نشط' : 'Active'}
                        </span>
                      )}
                      {sub.status === 'lifetime' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1 w-fit">
                          <InfinityIcon className="w-3 h-3" />
                          <span>{language === 'ar' ? 'دائم' : 'Lifetime'}</span>
                        </span>
                      )}
                      {sub.status === 'expired' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                          {language === 'ar' ? 'منتهي' : 'Expired'}
                        </span>
                      )}
                      {sub.status === 'pending_payment' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          {language === 'ar' ? 'بانتظار الدفع' : 'Unpaid'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {/* Confirm Payment button if pending */}
                        {sub.paymentStatus === 'pending' && (
                          <button
                            type="button"
                            onClick={() => onConfirmPayment(sub.id)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                            title="تأكيد استلام المبلغ"
                          >
                            {language === 'ar' ? 'تأكيد الدفع' : 'Confirm'}
                          </button>
                        )}

                        {/* Renew / Extend button */}
                        {sub.planType !== 'lifetime' && (
                          <button
                            type="button"
                            onClick={() => setRenewModalSub(sub)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] cursor-pointer"
                          >
                            {language === 'ar' ? 'تمديد' : 'Extend'}
                          </button>
                        )}

                        {/* Print Receipt button */}
                        <button
                          type="button"
                          onClick={() => setSelectedPrintReceipt(sub)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                          title={language === 'ar' ? 'طباعة إيصال القبض المالي' : 'Print Receipt'}
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-600" />
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

      {/* CREATE SUBSCRIPTION MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'ar' ? 'تخصيص اشتراك سريري لطبيب' : 'Assign Clinical Subscription'}
                </h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
              {/* Doctor selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  {language === 'ar' ? 'اختر الطبيب المعتمد' : 'Select Approved Doctor'}
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  {approvedDoctors.length === 0 ? (
                    <option value="">لا يوجد أطباء معتمدون حالياً (يرجى اعتماد طبيب أولاً)</option>
                  ) : (
                    approvedDoctors.map((d) => (
                      <option key={d.uid} value={d.uid}>
                        {d.displayName} ({d.specialization || 'طبيب'}) - {d.syndicateId || 'بدون رقم نقابة'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Plan duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    {language === 'ar' ? 'نوع الباقة / المدة' : 'Plan Type'}
                  </label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value as SubscriptionPlanType)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="1_month">{language === 'ar' ? 'شهر واحد (30 يوم)' : '1 Month'}</option>
                    <option value="3_months">{language === 'ar' ? '3 أشهر (90 يوم)' : '3 Months'}</option>
                    <option value="6_months">{language === 'ar' ? '6 أشهر (180 يوم)' : '6 Months'}</option>
                    <option value="1_year">{language === 'ar' ? 'سنة كاملة (365 يوم)' : '1 Year'}</option>
                    <option value="lifetime">{language === 'ar' ? 'ترخيص دائم (Lifetime)' : 'Lifetime'}</option>
                    <option value="custom">{language === 'ar' ? 'أيام مخصصة' : 'Custom Days'}</option>
                  </select>
                </div>

                {planType === 'custom' && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">
                      {language === 'ar' ? 'عدد الأيام' : 'Days Count'}
                    </label>
                    <input
                      type="number"
                      value={customDays}
                      onChange={(e) => setCustomDays(Number(e.target.value))}
                      min="1"
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    {language === 'ar' ? 'السعر المحدد (دينار عراقي)' : 'Configured Price (IQD)'}
                  </label>
                  <input
                    type="number"
                    value={priceIqd}
                    onChange={(e) => setPriceIqd(Number(e.target.value))}
                    step="5000"
                    min="0"
                    required
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    {language === 'ar' ? 'تاريخ البدء' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="zain_cash">Zain Cash (زين كاش)</option>
                    <option value="qi_card">Qi Card (كي كارد)</option>
                    <option value="cash">{language === 'ar' ? 'نقداً (مقر المنصة)' : 'Cash'}</option>
                    <option value="bank_transfer">{language === 'ar' ? 'حوالة مصرفية' : 'Bank Transfer'}</option>
                    <option value="manual">{language === 'ar' ? 'تحقق يدوي إداري' : 'Manual Verified'}</option>
                  </select>
                </div>
              </div>

              {/* Payment status */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  {language === 'ar' ? 'حالة الدفع المسجلة' : 'Payment Status'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('confirmed')}
                    className={`p-2 rounded-lg border text-center font-bold cursor-pointer ${
                      paymentStatus === 'confirmed' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-slate-200'
                    }`}
                  >
                    تم التأكيد
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('pending')}
                    className={`p-2 rounded-lg border text-center font-bold cursor-pointer ${
                      paymentStatus === 'pending' ? 'bg-amber-50 border-amber-500 text-amber-800' : 'border-slate-200'
                    }`}
                  >
                    بانتظار الدفع
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('waived')}
                    className={`p-2 rounded-lg border text-center font-bold cursor-pointer ${
                      paymentStatus === 'waived' ? 'bg-indigo-50 border-indigo-500 text-indigo-800' : 'border-slate-200'
                    }`}
                  >
                    إعفاء إداري
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  {language === 'ar' ? 'ملاحظات إدارية / رقم الوصل' : 'Notes / Receipt Reference'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: وصل تحويل زين كاش رقم #9812..."
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || approvedDoctors.length === 0}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'جاري الحفظ...' : 'حفظ وتفعيل الاشتراك'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENEW MODAL */}
      {renewModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'تمديد اشتراك الطبيب' : 'Extend Subscription'}
            </h3>
            <p className="text-slate-600">
              تمديد صلاحية اشتراك د. <strong>{renewModalSub.doctorName}</strong>:
            </p>

            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">اختر فترة التمديد:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRenewDays(30)}
                  className={`p-2 rounded-lg border text-center font-bold cursor-pointer ${
                    renewDays === 30 ? 'bg-amber-50 border-amber-500 text-amber-900' : 'border-slate-200'
                  }`}
                >
                  +30 يوم
                </button>
                <button
                  type="button"
                  onClick={() => setRenewDays(90)}
                  className={`p-2 rounded-lg border text-center font-bold cursor-pointer ${
                    renewDays === 90 ? 'bg-amber-50 border-amber-500 text-amber-900' : 'border-slate-200'
                  }`}
                >
                  +90 يوم
                </button>
                <button
                  type="button"
                  onClick={() => setRenewDays(365)}
                  className={`p-2 rounded-lg border text-center font-bold cursor-pointer ${
                    renewDays === 365 ? 'bg-amber-50 border-amber-500 text-amber-900' : 'border-slate-200'
                  }`}
                >
                  +سنة كاملة
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRenewModalSub(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleRenew}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-[#0A192F] hover:bg-[#142E54] text-white font-bold cursor-pointer"
              >
                {isProcessing ? 'جاري التمديد...' : 'تأكيد التمديد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE MODAL 1: FINANCIAL & SUBSCRIPTIONS AUDIT REPORT */}
      {isPrintReportOpen && (
        <PrintableModal
          isOpen={isPrintReportOpen}
          onClose={() => setIsPrintReportOpen(false)}
          title={language === 'ar' ? 'تقرير التراخيص والاشتراكات المالية للمنظومة' : 'Clinic Subscriptions & Financial Audit Report'}
          subtitle={language === 'ar' ? 'الإدارة المركزية لمنصة M737 للرعاية الطبية والعيادات التخصصية' : 'M737 Central Administration'}
          docNumber="AUDIT-FIN-SUB"
          badgeText={language === 'ar' ? 'تقرير مالي معتمد' : 'FINANCIAL REPORT'}
          officialStampTitle={language === 'ar' ? 'ختم وتوقيع الإدارة المالية المركزية' : 'Financial Management Seal & Signature'}
          headerDetails={[
            {
              label: language === 'ar' ? 'إجمالي الاشتراكات:' : 'Total Licenses:',
              value: `${subscriptions.length} ${language === 'ar' ? 'عيادة' : 'Clinics'}`,
            },
            {
              label: language === 'ar' ? 'الاشتراكات النشطة:' : 'Active Licenses:',
              value: `${subscriptions.filter((s) => s.status === 'active' || s.status === 'lifetime').length}`,
            },
            {
              label: language === 'ar' ? 'بانتظار التحصيل:' : 'Pending Dues:',
              value: `${subscriptions.filter((s) => s.paymentStatus === 'pending').length}`,
            },
            {
              label: language === 'ar' ? 'إجمالي التحصيلات (د.ع):' : 'Revenue Total (IQD):',
              value: `${subscriptions.reduce((acc, curr) => acc + (curr.paymentStatus === 'confirmed' ? curr.priceIqd || 0 : 0), 0).toLocaleString()} د.ع`,
            },
          ]}
        >
          <div className="border border-slate-300 rounded-xl overflow-hidden avoid-break">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3 text-start">#</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الطبيب والعيادة' : 'Doctor & Clinic'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الخطة والمدة' : 'Plan'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'المبلغ (د.ع)' : 'Fee (IQD)'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'حالة الدفع' : 'Payment'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الصلاحية' : 'Expiry'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subscriptions.map((s, idx) => (
                  <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{s.doctorName}</td>
                    <td className="py-2 px-3 text-slate-700">{s.planType}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">
                      {s.priceIqd ? `${s.priceIqd.toLocaleString()} د.ع` : 'مجاني'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-[10px] uppercase">
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">
                      {s.expiryDate ? s.expiryDate.split('T')[0] : (s.planType === 'lifetime' ? 'دائم' : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrintableModal>
      )}

      {/* PRINTABLE MODAL 2: INDIVIDUAL SUBSCRIPTION PAYMENT RECEIPT */}
      {selectedPrintReceipt && (
        <PrintableModal
          isOpen={!!selectedPrintReceipt}
          onClose={() => setSelectedPrintReceipt(null)}
          title={language === 'ar' ? 'إيصال استلام مالي واشتراك عيادة' : 'Official Clinic Subscription Receipt'}
          subtitle={`${selectedPrintReceipt.doctorName} · ${language === 'ar' ? 'منصة M737 للرعاية الطبية' : 'M737 Healthcare'}`}
          docNumber={`REC-${selectedPrintReceipt.id.slice(0, 8).toUpperCase()}`}
          badgeText={selectedPrintReceipt.paymentStatus.toUpperCase()}
          officialStampTitle={language === 'ar' ? 'ختم وإمضاء التحصيل والمالية' : 'Financial Comptroller Seal'}
          headerDetails={[
            {
              label: language === 'ar' ? 'اسم المشترك:' : 'Subscriber:',
              value: selectedPrintReceipt.doctorName,
            },
            {
              label: language === 'ar' ? 'المبلغ المستلم:' : 'Amount Paid:',
              value: `${(selectedPrintReceipt.priceIqd || 0).toLocaleString()} د.ع (IQD)`,
            },
            {
              label: language === 'ar' ? 'طريقة التحصيل:' : 'Payment Method:',
              value: selectedPrintReceipt.paymentMethod.toUpperCase(),
            },
            {
              label: language === 'ar' ? 'حالة السداد:' : 'Payment Status:',
              value: selectedPrintReceipt.paymentStatus === 'confirmed' ? (language === 'ar' ? 'مدفوع ومؤكد' : 'Confirmed') : selectedPrintReceipt.paymentStatus,
            },
          ]}
        >
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 avoid-break">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'نوع الباقة والترخيص:' : 'Subscription Plan:'}</span>
                <strong className="text-slate-900 block text-sm">{selectedPrintReceipt.planType} ({selectedPrintReceipt.durationDays} يوم)</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">{language === 'ar' ? 'تاريخ السريان والنفاذ:' : 'Validity Range:'}</span>
                <strong className="text-slate-900 block font-mono">
                  {selectedPrintReceipt.startDate.split('T')[0]} ⟶ {selectedPrintReceipt.expiryDate ? selectedPrintReceipt.expiryDate.split('T')[0] : (selectedPrintReceipt.planType === 'lifetime' ? 'دائم' : '—')}
                </strong>
              </div>
            </div>

            {selectedPrintReceipt.notes && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block text-[10px]">{language === 'ar' ? 'ملاحظات المعاملة المالية:' : 'Transaction Notes:'}</span>
                <p className="text-slate-800 font-sans mt-0.5">{selectedPrintReceipt.notes}</p>
              </div>
            )}
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
