import React, { useState } from 'react';
import {
  Users,
  Search,
  User,
  Phone,
  Calendar,
  FileSignature,
  FileText,
  AlertTriangle,
  Heart,
  MessageSquare,
  ShieldCheck,
  X,
  Plus,
  Printer,
} from 'lucide-react';
import {
  AppointmentRecord,
  PrescriptionRecord,
  LabReportRecord,
  PatientClinicalSummary,
} from '../../types/database';
import { useLanguage } from '../../localization/LanguageContext';
import { PrintableModal } from '../common/PrintableModal';

interface DoctorPatientsTabProps {
  appointments: AppointmentRecord[];
  prescriptions: PrescriptionRecord[];
  labReports: LabReportRecord[];
  onOpenPrescription: (patientData: { id: string; name: string; phone: string; age?: number; gender?: string }) => void;
  onOpenMessageThread?: (patientId: string, patientName: string) => void;
}

export const DoctorPatientsTab: React.FC<DoctorPatientsTabProps> = ({
  appointments,
  prescriptions,
  labReports,
  onOpenPrescription,
  onOpenMessageThread,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPrintPatientRecordOpen, setIsPrintPatientRecordOpen] = useState(false);

  // Build aggregated patient summaries from appointments & prescriptions
  const patientMap = new Map<string, PatientClinicalSummary>();

  appointments.forEach((app) => {
    const existing = patientMap.get(app.patientId);
    if (!existing) {
      patientMap.set(app.patientId, {
        patientId: app.patientId,
        fullName: app.patientName,
        phone: app.patientPhone,
        gender: app.patientGender || 'male',
        age: app.patientAge,
        totalVisitsWithDoctor: 1,
        lastVisitDate: app.date,
        chronicConditions: [],
        allergies: [],
      });
    } else {
      existing.totalVisitsWithDoctor += 1;
      if (!existing.lastVisitDate || app.date > existing.lastVisitDate) {
        existing.lastVisitDate = app.date;
      }
    }
  });

  const patientList = Array.from(patientMap.values());

  const filteredPatients = patientList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.patientId.toLowerCase().includes(q)
    );
  });

  const selectedPatient = selectedPatientId ? patientMap.get(selectedPatientId) : null;
  const selectedPatientAppointments = selectedPatient
    ? appointments.filter((a) => a.patientId === selectedPatient.patientId)
    : [];
  const selectedPatientPrescriptions = selectedPatient
    ? prescriptions.filter((p) => p.patientId === selectedPatient.patientId)
    : [];
  const selectedPatientLabReports = selectedPatient
    ? labReports.filter((l) => l.patientId === selectedPatient.patientId)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>{isAr ? 'سجلات المراجعين والملفات السريرية' : 'Patient Clinical Records'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'أرشيف المراجعين المسجلين في عيادتك، مراجعة السوابق المرضية، الوصفات السابقة، والتقارير المخبرية.'
              : 'Directory of clinic patients with visit history, allergies, chronic conditions, and past Rx.'}
          </p>
        </div>

        <div className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {patientList.length} {isAr ? 'مراجع مسجل' : 'Total Patients'}
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
            placeholder={isAr ? 'بحث بالاسم، رقم الهاتف، أو كود المراجع...' : 'Search by name, phone, or patient ID...'}
            className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isAr ? 'لا يوجد مراجعين مسجلين يطابقون البحث' : 'No patients match your query'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'ستظهر هنا سجلات المراجعين بمجرد تسجيل مواعيد أو حضورهم في العيادة.'
                : 'Patients will appear once bookings or walk-in appointments are registered.'}
            </p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.patientId}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-base flex items-center justify-center shrink-0">
                      {patient.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{patient.fullName}</h3>
                      <p className="text-xs text-slate-500 font-mono">{patient.phone}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                    {patient.totalVisitsWithDoctor} {isAr ? 'زيارات' : 'visits'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'العمر / الجنس' : 'Age / Gender'}</span>
                    <span className="font-semibold text-slate-800">
                      {patient.age ? `${patient.age} ${isAr ? 'سنة' : 'yrs'}` : (isAr ? 'غير محدد' : 'N/A')} ·{' '}
                      {patient.gender === 'female' ? (isAr ? 'أنثى' : 'F') : (isAr ? 'ذكر' : 'M')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'آخر زيارة' : 'Last Visit'}</span>
                    <span className="font-mono text-slate-800">{patient.lastVisitDate || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedPatientId(patient.patientId)}
                  className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  {isAr ? 'فتح الملف السريري' : 'View Record'}
                </button>

                <button
                  onClick={() => {
                    setSelectedPatientId(patient.patientId);
                    setIsPrintPatientRecordOpen(true);
                  }}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  title={isAr ? 'طباعة السجل الطبي' : 'Print Medical Record'}
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                </button>

                <button
                  onClick={() =>
                    onOpenPrescription({
                      id: patient.patientId,
                      name: patient.fullName,
                      phone: patient.phone,
                      age: patient.age,
                      gender: patient.gender,
                    })
                  }
                  className="p-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                  title={isAr ? 'إصدار وصفة Rx' : 'Write Rx'}
                >
                  <FileSignature className="w-4 h-4" />
                </button>

                {onOpenMessageThread && (
                  <button
                    onClick={() => onOpenMessageThread(patient.patientId, patient.fullName)}
                    className="p-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 transition-colors cursor-pointer"
                    title={isAr ? 'إرسال رسالة للمراجع' : 'Message Patient'}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PATIENT CLINICAL RECORD MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center">
                  {selectedPatient.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedPatient.fullName}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedPatient.phone} · ID: {selectedPatient.patientId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatientId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">{isAr ? 'العمر' : 'Age'}</span>
                <span className="font-bold text-slate-900 font-mono">{selectedPatient.age || 38} {isAr ? 'سنة' : 'yrs'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">{isAr ? 'الجنس' : 'Gender'}</span>
                <span className="font-bold text-slate-900">
                  {selectedPatient.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">{isAr ? 'عدد الزيارات' : 'Visits'}</span>
                <span className="font-bold text-slate-900 font-mono">{selectedPatientAppointments.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">{isAr ? 'الوصفات الصادرة' : 'Prescriptions'}</span>
                <span className="font-bold text-slate-900 font-mono">{selectedPatientPrescriptions.length}</span>
              </div>
            </div>

            {/* Past Visits & Consultations */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span>{isAr ? 'سجل الزيارات والاستشارات مع هذه العيادة' : 'Consultation History'}</span>
              </h4>

              {selectedPatientAppointments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">{isAr ? 'لا توجد استشارات سابقة' : 'No past visits'}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedPatientAppointments.map((app) => (
                    <div key={app.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800">{app.date} — {app.timeSlot}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          {app.status}
                        </span>
                      </div>
                      {app.clinicalNotes && (
                        <p className="text-xs text-sky-900 bg-sky-50/80 p-2 rounded-lg">
                          <strong className="text-sky-950">{isAr ? 'التشخيص / الملاحظات:' : 'Notes:'}</strong> {app.clinicalNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Prescriptions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <FileSignature className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'الوصفات الطبية الإلكترونية المسجلة' : 'E-Prescriptions Issued'}</span>
              </h4>

              {selectedPatientPrescriptions.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  {isAr ? 'لم تصدر وصفات دوائية سابقة لهذا المراجع' : 'No prescriptions issued yet'}
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedPatientPrescriptions.map((rx) => (
                    <div key={rx.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-900">Rx #{rx.prescriptionNumber}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{rx.issuedAt.split('T')[0]}</span>
                      </div>
                      <div className="font-semibold text-slate-800">{rx.diagnosis}</div>
                      <div className="text-[11px] text-slate-600">
                        {rx.medications.map((m) => `${m.medicineName} (${m.dosage})`).join(' • ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsPrintPatientRecordOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-700" />
                <span>{isAr ? 'طباعة السجل الطبي' : 'Print Medical Record'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPatientId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    const p = selectedPatient;
                    setSelectedPatientId(null);
                    onOpenPrescription({
                      id: p.patientId,
                      name: p.fullName,
                      phone: p.phone,
                      age: p.age,
                      gender: p.gender,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <FileSignature className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'إصدار وصفة جديدة للمراجع' : 'Issue Prescription'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE PATIENT MEDICAL DOSSIER MODAL */}
      {isPrintPatientRecordOpen && selectedPatient && (
        <PrintableModal
          isOpen={isPrintPatientRecordOpen}
          onClose={() => setIsPrintPatientRecordOpen(false)}
          title={isAr ? 'السجل الطبي والمستخلص السريري للمراجع' : 'Patient Clinical Dossier & Medical Summary'}
          subtitle={isAr ? 'ملخص التاريخ المرضي، الكشوفات، والوصفات الطبية الصادرة' : 'Cumulative Clinic Record, Consultations & Rx'}
          docNumber={`PAT-${selectedPatient.patientId.substring(0, 8).toUpperCase()}`}
          badgeText={isAr ? 'سجل عيادة معتمد' : 'Clinic Medical Dossier'}
          officialStampTitle={isAr ? 'ختم وتوقيع الطبيب المشرف على الحالة' : 'Supervising Physician Seal & Signature'}
          headerDetails={[
            {
              label: isAr ? 'اسم المراجع:' : 'Patient Name:',
              value: selectedPatient.fullName,
            },
            {
              label: isAr ? 'رقم الهاتف:' : 'Phone:',
              value: selectedPatient.phone,
            },
            {
              label: isAr ? 'العمر والجنس:' : 'Age & Sex:',
              value: `${selectedPatient.age || '—'} ${isAr ? 'سنة' : 'yrs'} / ${selectedPatient.gender === 'female' ? (isAr ? 'أنثى' : 'F') : (isAr ? 'ذكر' : 'M')}`,
            },
            {
              label: isAr ? 'إجمالي الزيارات:' : 'Total Visits:',
              value: `${selectedPatient.totalVisitsWithDoctor} ${isAr ? 'زيارة' : 'Visits'}`,
            },
          ]}
        >
          {/* Visits Timeline Table */}
          <div className="space-y-2 avoid-break">
            <h4 className="text-xs font-bold text-slate-900">
              {isAr ? 'سجل المواعيد والزيارات السابقة للعيادة:' : 'Consultation Visits History:'}
            </h4>
            {selectedPatientAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                {isAr ? 'لا توجد زيارات سابقة موثقة.' : 'No recorded visits.'}
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold uppercase">
                    <tr>
                      <th className="py-2 px-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="py-2 px-3 text-start">{isAr ? 'الوقت' : 'Slot'}</th>
                      <th className="py-2 px-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-2 px-3 text-start">{isAr ? 'ملاحظات الكشف السريري' : 'Notes'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPatientAppointments.map((app) => (
                      <tr key={app.id}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{app.date}</td>
                        <td className="py-2 px-3 font-mono text-sky-800">{app.timeSlot}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-[10px] uppercase">{app.status}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{app.clinicalNotes || app.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Past Prescriptions Table */}
          <div className="space-y-2 avoid-break">
            <h4 className="text-xs font-bold text-slate-900">
              {isAr ? 'الوصفات الطبية (Rx) الصادرة للمراجع:' : 'Prescription Records (Rx):'}
            </h4>
            {selectedPatientPrescriptions.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                {isAr ? 'لا توجد وصفات دوائية سابقة.' : 'No issued prescriptions.'}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedPatientPrescriptions.map((rx) => (
                  <div key={rx.id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-amber-950">
                      <span>Rx #{rx.prescriptionNumber} — {rx.diagnosis}</span>
                      <span className="font-mono text-[10px]">{rx.issuedAt.split('T')[0]}</span>
                    </div>
                    <div className="text-slate-700 text-[11px]">
                      {rx.medications.map((m) => `${m.medicineName} (${m.dosage} - ${m.frequency})`).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 avoid-break">
            {isAr
              ? 'مستند طبي سري مخصص لتوثيق ومتابعة الرعاية السريرية للمريض داخل العيادة.'
              : 'Confidential clinical dossier for continuity of care.'}
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
