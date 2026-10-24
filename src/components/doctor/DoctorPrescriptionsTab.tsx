import React, { useState } from 'react';
import {
  FileSignature,
  Plus,
  Printer,
  Trash2,
  Search,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Stethoscope,
  X,
  FileText,
  AlertCircle,
  Download,
} from 'lucide-react';
import {
  PrescriptionRecord,
  PrescriptionMedicationItem,
  AppointmentRecord,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { useLanguage } from '../../localization/LanguageContext';
import { BRAND_CONFIG } from '../../config/brand';
import { PrintableModal } from '../common/PrintableModal';

interface DoctorPrescriptionsTabProps {
  prescriptions: PrescriptionRecord[];
  userProfile: UserProfile | null;
  appointments: AppointmentRecord[];
  onIssuePrescription: (newPrescription: Omit<PrescriptionRecord, 'id'>) => Promise<void>;
  prefilledPatientData?: {
    id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    appointmentId?: string;
  } | null;
  onClearPrefilledPatient?: () => void;
  isLoading: boolean;
}

export const DoctorPrescriptionsTab: React.FC<DoctorPrescriptionsTabProps> = ({
  prescriptions,
  userProfile,
  appointments,
  onIssuePrescription,
  prefilledPatientData,
  onClearPrefilledPatient,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(!!prefilledPatientData);
  const [selectedPrintPrescription, setSelectedPrintPrescription] = useState<PrescriptionRecord | null>(null);

  // Form states
  const [patientId, setPatientId] = useState(prefilledPatientData?.id || '');
  const [patientName, setPatientName] = useState(prefilledPatientData?.name || '');
  const [patientPhone, setPatientPhone] = useState(prefilledPatientData?.phone || '');
  const [patientAge, setPatientAge] = useState<string>(prefilledPatientData?.age ? String(prefilledPatientData.age) : '35');
  const [patientGender, setPatientGender] = useState<string>(prefilledPatientData?.gender || 'male');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalAdvice, setClinicalAdvice] = useState('');
  const [appointmentId, setAppointmentId] = useState(prefilledPatientData?.appointmentId || '');

  const [medications, setMedications] = useState<PrescriptionMedicationItem[]>([
    {
      id: 'med_1',
      medicineName: '',
      dosage: '500 mg',
      frequency: isAr ? 'مرتين يومياً بعد الطعام' : 'Twice daily after meals',
      duration: isAr ? '5 أيام' : '5 days',
      instructions: isAr ? 'الالتزام بالجرعة دون انقطاع' : 'Complete course',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form if prefilledPatientData changes
  React.useEffect(() => {
    if (prefilledPatientData) {
      setPatientId(prefilledPatientData.id);
      setPatientName(prefilledPatientData.name);
      setPatientPhone(prefilledPatientData.phone);
      if (prefilledPatientData.age) setPatientAge(String(prefilledPatientData.age));
      if (prefilledPatientData.gender) setPatientGender(prefilledPatientData.gender);
      if (prefilledPatientData.appointmentId) setAppointmentId(prefilledPatientData.appointmentId);
      setIsCreateModalOpen(true);
    }
  }, [prefilledPatientData]);

  const addMedicationRow = () => {
    setMedications([
      ...medications,
      {
        id: `med_${Date.now()}`,
        medicineName: '',
        dosage: '1 قرص',
        frequency: isAr ? 'مرة واحدة يومياً' : 'Once daily',
        duration: isAr ? '7 أيام' : '7 days',
        instructions: '',
      },
    ]);
  };

  const removeMedicationRow = (id: string) => {
    if (medications.length <= 1) return;
    setMedications(medications.filter((m) => m.id !== id));
  };

  const updateMedication = (id: string, field: keyof PrescriptionMedicationItem, value: string) => {
    setMedications(
      medications.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSelectRecentPatient = (app: AppointmentRecord) => {
    setPatientId(app.patientId);
    setPatientName(app.patientName);
    setPatientPhone(app.patientPhone);
    if (app.patientAge) setPatientAge(String(app.patientAge));
    if (app.patientGender) setPatientGender(app.patientGender);
    setAppointmentId(app.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !diagnosis || medications.some((m) => !m.medicineName.trim())) {
      return;
    }

    setIsSubmitting(true);
    try {
      const rxNumber = `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await onIssuePrescription({
        prescriptionNumber: rxNumber,
        doctorId: userProfile?.uid || '',
        doctorName: userProfile?.displayName || 'طبيب استشاري',
        doctorSpecialty: userProfile?.specialization || 'طب عام',
        doctorSyndicateId: userProfile?.syndicateId,
        clinicName: userProfile?.clinicName || 'العيادة التخصصية',
        clinicGovernorate: userProfile?.governorate || 'بغداد',
        clinicPhone: userProfile?.phoneNumber,
        patientId: patientId || `p_${Date.now()}`,
        patientName,
        patientAge: patientAge ? parseInt(patientAge) : undefined,
        patientGender,
        patientPhone,
        diagnosis,
        medications,
        clinicalAdvice,
        appointmentId: appointmentId || undefined,
        issuedAt: new Date().toISOString(),
        digitalSignatureVerified: true,
      });

      setIsCreateModalOpen(false);
      if (onClearPrefilledPatient) onClearPrefilledPatient();

      // Reset
      setDiagnosis('');
      setClinicalAdvice('');
      setMedications([
        {
          id: 'med_1',
          medicineName: '',
          dosage: '500 mg',
          frequency: isAr ? 'مرتين يومياً بعد الطعام' : 'Twice daily after meals',
          duration: isAr ? '5 أيام' : '5 days',
          instructions: '',
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rx.patientName.toLowerCase().includes(q) ||
      rx.prescriptionNumber.toLowerCase().includes(q) ||
      rx.diagnosis.toLowerCase().includes(q)
    );
  });

  const handlePrint = (rx: PrescriptionRecord) => {
    setSelectedPrintPrescription(rx);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'الوصفات الطبية الإلكترونية (E-Prescriptions)' : 'Digital Prescriptions (Rx)'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'إصدار وتوثيق الوصفات الدوائية المعتمدة بنقابة الأطباء، مع كليشة رسمية وطباعة مباشرة.'
              : 'Issue verified electronic prescriptions with official Iraqi medical emblem and print-ready pad.'}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'تحرير وصفة طبية جديدة (Rx)' : 'New Prescription'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث برقم الوصفة، اسم المراجع، أو التشخيص...' : 'Search by Rx number, patient name, or diagnosis...'}
            className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-amber-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {filteredPrescriptions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileSignature className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isAr ? 'لا توجد وصفات طبية محررة حتى الآن' : 'No prescriptions issued yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAr
                ? 'اضغط على "تحرير وصفة طبية جديدة" لتسجيل الأدوية والجرعات والتشخيص وطباعتها على الكليشة الرسمية.'
                : 'Click "New Prescription" to prescribe medicines and generate official print pads.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-amber-800 px-2 py-0.5 rounded-md bg-amber-100/80">
                      {rx.prescriptionNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{rx.patientName}</h3>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(rx.issuedAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {isAr ? 'توقيع سريري موثق' : 'Signed'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">{isAr ? 'التشخيص:' : 'Diagnosis:'}</strong> {rx.diagnosis}
                  </p>

                  {/* Medications Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rx.medications.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                      >
                        <strong>{m.medicineName}</strong> <span className="text-slate-500 font-mono">({m.dosage})</span> — {m.frequency}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  <button
                    onClick={() => handlePrint(rx)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'معاينة وطباعة الكليشة' : 'Print Rx Pad'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE PRESCRIPTION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-amber-600" />
                <span>{isAr ? 'تحرير وصفة طبية إلكترونية معتمدة (Rx)' : 'Issue Digital Prescription (Rx)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onClearPrefilledPatient) onClearPrefilledPatient();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick autofill from recent appointments */}
            {appointments.length > 0 && !prefilledPatientData && (
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  {isAr ? 'اختيار سريع من مراجعي اليوم / الحجوزات القائمة:' : 'Quick Select from Today’s Patients:'}
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {appointments.slice(0, 6).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleSelectRecentPatient(a)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {a.patientName} ({a.timeSlot})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Patient Header Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {isAr ? 'اسم المراجع الثلاثي *' : 'Patient Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={isAr ? 'اسم المراجع' : 'Patient name'}
                  className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {isAr ? 'رقم الهاتف' : 'Phone'}
                </label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="07XXXXXXXXX"
                  className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-mono focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {isAr ? 'العمر' : 'Age'}
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {isAr ? 'الجنس' : 'Gender'}
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-xs focus:border-amber-500"
                  >
                    <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                    <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                {isAr ? 'التشخيص الطبي السريري (Diagnosis) *' : 'Clinical Diagnosis *'}
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder={isAr ? 'مثال: التهاب الشعب الهوائية الحاد، نزلة معوية، ارتفاع ضغط الدم...' : 'e.g. Acute bronchitis, Hypertension...'}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-500"
              />
            </div>

            {/* Medication Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="font-serif font-black text-amber-700 text-base">℞</span>
                  <span>{isAr ? 'قائمة الأدوية الموصوفة والجرعات:' : 'Prescribed Medications (Rx):'}</span>
                </label>
                <button
                  type="button"
                  onClick={addMedicationRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة دواء آخر' : 'Add Medication'}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {medications.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500 font-mono">
                        #{index + 1}
                      </span>
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicationRow(item.id)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          title={isAr ? 'حذف' : 'Remove'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          value={item.medicineName}
                          onChange={(e) => updateMedication(item.id, 'medicineName', e.target.value)}
                          placeholder={isAr ? 'اسم الدواء (العلمي أو التجاري)' : 'Medicine Name'}
                          className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => updateMedication(item.id, 'dosage', e.target.value)}
                          placeholder={isAr ? 'الجرعة (مثال: 500mg)' : 'Dosage'}
                          className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => updateMedication(item.id, 'frequency', e.target.value)}
                          placeholder={isAr ? 'التكرار (مثال: 3 مرات/يوم)' : 'Frequency'}
                          className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => updateMedication(item.id, 'duration', e.target.value)}
                        placeholder={isAr ? 'المدة (مثال: لمدة 7 أيام)' : 'Duration'}
                        className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs focus:border-amber-500"
                      />
                      <input
                        type="text"
                        value={item.instructions || ''}
                        onChange={(e) => updateMedication(item.id, 'instructions', e.target.value)}
                        placeholder={isAr ? 'تعليمات الاستخدام (بعد الأكل، قبل النوم...)' : 'Instructions (after meals...)'}
                        className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs focus:border-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advice / Notes */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                {isAr ? 'نصائح طبية وإرشادات للمراجع (اختياري)' : 'Physician Instructions & Diet/Care Advice'}
              </label>
              <textarea
                value={clinicalAdvice}
                onChange={(e) => setClinicalAdvice(e.target.value)}
                rows={2}
                placeholder={isAr ? 'الراحة، الإكثار من السوائل، مراجعة الطوارئ عند استمرار الحرارة...' : 'Rest, fluids, return if fever persists...'}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-500"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onClearPrefilledPatient) onClearPrefilledPatient();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isSubmitting ? (isAr ? 'جاري الاعتماد والإصدار...' : 'Issuing...') : (isAr ? 'إصدار الوصفة وحفظها' : 'Issue & Sign Prescription')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OFFICIAL IRAQI M737 PRESCRIPTION PAD VIEW (PRINTABLE MODAL) */}
      {selectedPrintPrescription && (
        <PrintableModal
          isOpen={!!selectedPrintPrescription}
          onClose={() => setSelectedPrintPrescription(null)}
          title={isAr ? 'كليشة وصفة طبية إلكترونية رسمية' : 'Official Digital Prescription (Rx)'}
          subtitle={`${selectedPrintPrescription.doctorName} · ${selectedPrintPrescription.clinicName} (${selectedPrintPrescription.clinicGovernorate})`}
          docNumber={selectedPrintPrescription.prescriptionNumber}
          badgeText="E-PRESCRIPTION (Rx)"
          officialStampTitle={isAr ? 'ختم وتوقيع الطبيب المعالج' : 'Attending Physician Seal & Signature'}
          headerDetails={[
            {
              label: isAr ? 'اسم المراجع:' : 'Patient Name:',
              value: selectedPrintPrescription.patientName,
            },
            {
              label: isAr ? 'العمر والجنس:' : 'Age / Sex:',
              value: `${selectedPrintPrescription.patientAge || '—'} ${isAr ? 'سنة' : 'yrs'} / ${selectedPrintPrescription.patientGender === 'female' ? (isAr ? 'أنثى' : 'F') : (isAr ? 'ذكر' : 'M')}`,
            },
            {
              label: isAr ? 'هوية نقابة الأطباء:' : 'Syndicate ID:',
              value: selectedPrintPrescription.doctorSyndicateId ? `#${selectedPrintPrescription.doctorSyndicateId}` : '#IRQ-VERIFIED',
            },
            {
              label: isAr ? 'تاريخ التحرير:' : 'Issued Date:',
              value: selectedPrintPrescription.issuedAt.split('T')[0],
            },
          ]}
        >
          {/* Diagnosis Bar */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs avoid-break">
            <span className="text-amber-900 font-bold block text-[11px] mb-1">
              {isAr ? 'التشخيص السريري المعتمد (Clinical Diagnosis):' : 'Certified Clinical Diagnosis:'}
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {selectedPrintPrescription.diagnosis}
            </span>
          </div>

          {/* Rx Symbol & Medication Body */}
          <div className="space-y-4 pt-2 min-h-[180px] avoid-break">
            <div className="font-serif font-black text-4xl text-slate-900 leading-none">
              ℞
            </div>

            <div className="space-y-3 ps-2">
              {selectedPrintPrescription.medications.map((item, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1 text-xs">
                  <div className="font-bold text-slate-950 flex items-baseline gap-2">
                    <span className="text-amber-800 font-mono text-[11px] font-bold">{i + 1}.</span>
                    <span className="text-sm font-black">{item.medicineName}</span>
                    <span className="font-mono text-slate-600 text-xs">({item.dosage})</span>
                  </div>
                  <div className="text-[11px] text-slate-600 ps-4 flex flex-wrap gap-2">
                    <span className="font-medium text-slate-800">{isAr ? 'التكرار:' : 'Freq:'} {item.frequency}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-800">{isAr ? 'المدة:' : 'Duration:'} {item.duration}</span>
                    {item.instructions && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-700">{item.instructions}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advisory notes */}
          {selectedPrintPrescription.clinicalAdvice && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1 avoid-break">
              <span className="font-bold text-slate-900 block text-[11px]">
                {isAr ? 'تعليمات وإرشادات الطبيب للمريض والصيدلي:' : 'Clinical Advice & Instructions:'}
              </span>
              <p className="text-[11px] leading-relaxed">{selectedPrintPrescription.clinicalAdvice}</p>
            </div>
          )}
        </PrintableModal>
      )}
    </div>
  );
};
