import React, { useState } from 'react';
import {
  FileSignature,
  Printer,
  Search,
  Calendar,
  Building,
  ShieldCheck,
  Stethoscope,
  X,
  FileText,
} from 'lucide-react';
import { PrescriptionRecord } from '../../types/database';
import { useLanguage } from '../../localization/LanguageContext';
import { PrintableModal } from '../common/PrintableModal';

interface PatientPrescriptionsTabProps {
  prescriptions: PrescriptionRecord[];
  isLoading: boolean;
}

export const PatientPrescriptionsTab: React.FC<PatientPrescriptionsTabProps> = ({
  prescriptions,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrintPrescription, setSelectedPrintPrescription] = useState<PrescriptionRecord | null>(null);

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rx.doctorName.toLowerCase().includes(q) ||
      rx.prescriptionNumber.toLowerCase().includes(q) ||
      rx.diagnosis.toLowerCase().includes(q) ||
      rx.medications.some((m) => m.medicineName.toLowerCase().includes(q))
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
            <span>{isAr ? 'وصفاتي الطبية المعتمدة (Rx)' : 'My E-Prescriptions (Rx)'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'سجل الوصفات الدوائية الصادرة لك من قبل أطباء المنصة، مع إمكانية المعاينة والطباعة الرسمية.'
              : 'Prescriptions issued by your treating physicians with official printable pad views.'}
          </p>
        </div>

        <div className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {prescriptions.length} {isAr ? 'وصفة محررة' : 'Prescriptions'}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث باسم الطبيب، الدواء، أو التشخيص...' : 'Search doctor, drug name, or diagnosis...'}
            className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-amber-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Prescriptions Cards */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {filteredPrescriptions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileSignature className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isAr ? 'لا توجد وصفات طبية صادرة لك حتى الآن' : 'No prescriptions issued yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAr
                ? 'ستظهر هنا الوصفات الإلكترونية فور إصدارها وتوثيقها من قبل طبيبك بعد إتمام الكشف الطبي.'
                : 'Prescriptions issued after consultations will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-amber-800 px-2.5 py-0.5 rounded-md bg-amber-100/80">
                      {rx.prescriptionNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{rx.doctorName}</h3>
                    <span className="text-xs font-semibold text-sky-700">{rx.doctorSpecialty}</span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="font-mono text-xs text-slate-500">
                      {rx.issuedAt.split('T')[0]}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {isAr ? 'موثق نقابياً' : 'Verified'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">{isAr ? 'التشخيص الطبي:' : 'Diagnosis:'}</strong> {rx.diagnosis}
                  </p>

                  {/* Medications Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rx.medications.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                      >
                        <strong>{m.medicineName}</strong> <span className="text-slate-500 font-mono">({m.dosage})</span> — {m.frequency} ({m.duration})
                      </span>
                    ))}
                  </div>

                  {rx.clinicalAdvice && (
                    <p className="text-xs text-amber-900 bg-amber-50/70 p-2 rounded-lg border border-amber-200 max-w-xl">
                      <strong>{isAr ? 'إرشادات الطبيب:' : 'Advice:'}</strong> {rx.clinicalAdvice}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => handlePrint(rx)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'معاينة وطباعة الوصفة' : 'Print Rx Pad'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OFFICIAL IRAQI M737 PRESCRIPTION PAD MODAL (PRINTABLE MODAL) */}
      {selectedPrintPrescription && (
        <PrintableModal
          isOpen={!!selectedPrintPrescription}
          onClose={() => setSelectedPrintPrescription(null)}
          title={isAr ? 'كليشة وصفة طبية إلكترونية رسمية' : 'Official Digital Prescription (Rx)'}
          subtitle={`${selectedPrintPrescription.doctorName} · ${selectedPrintPrescription.clinicName} (${selectedPrintPrescription.clinicGovernorate})`}
          docNumber={selectedPrintPrescription.prescriptionNumber}
          badgeText="E-PRESCRIPTION (Rx)"
          officialStampTitle={isAr ? 'ختم وتوقيع الطبيب المعالج' : 'Doctor Seal & Signature'}
          headerDetails={[
            {
              label: isAr ? 'المراجع:' : 'Patient Name:',
              value: selectedPrintPrescription.patientName,
            },
            {
              label: isAr ? 'العمر والجنس:' : 'Age / Sex:',
              value: `${selectedPrintPrescription.patientAge || '—'} ${isAr ? 'سنة' : 'yrs'} / ${selectedPrintPrescription.patientGender === 'female' ? (isAr ? 'أنثى' : 'F') : (isAr ? 'ذكر' : 'M')}`,
            },
            {
              label: isAr ? 'هوية نقابة الأطباء:' : 'Syndicate Reg:',
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
