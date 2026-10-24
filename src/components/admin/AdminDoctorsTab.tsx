import React, { useState } from 'react';
import {
  Stethoscope,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Shield,
  Eye,
  MapPin,
  Building,
  Phone,
  Mail,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  Printer,
} from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { UserProfile } from '../../types/auth';
import { PrintableModal } from '../common/PrintableModal';

interface AdminDoctorsTabProps {
  doctors: UserProfile[];
  onToggleAccountStatus: (doctor: UserProfile, targetStatus: 'active' | 'suspended') => Promise<void>;
}

export const AdminDoctorsTab: React.FC<AdminDoctorsTabProps> = ({
  doctors,
  onToggleAccountStatus,
}) => {
  const { language, direction } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [governorateFilter, setGovernorateFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState<UserProfile | null>(null);
  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const [isPrintDirectoryOpen, setIsPrintDirectoryOpen] = useState(false);
  const [isPrintDoctorCredentialOpen, setIsPrintDoctorCredentialOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const specialties = Array.from(new Set(doctors.map((d) => d.specialization).filter(Boolean)));
  const governorates = Array.from(new Set(doctors.map((d) => d.governorate).filter(Boolean)));

  const filtered = doctors.filter((doc) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (doc.displayName && doc.displayName.toLowerCase().includes(q)) ||
      (doc.email && doc.email.toLowerCase().includes(q)) ||
      (doc.uid && doc.uid.toLowerCase().includes(q)) ||
      (doc.clinicName && doc.clinicName.toLowerCase().includes(q)) ||
      (doc.syndicateId && doc.syndicateId.toLowerCase().includes(q));

    const matchesSpecialty = specialtyFilter === 'all' || doc.specialization === specialtyFilter;
    const matchesGovernorate = governorateFilter === 'all' || doc.governorate === governorateFilter;
    const matchesApproval = approvalFilter === 'all' || doc.approvalStatus === approvalFilter;
    const currentStatus = doc.accountStatus || 'active';
    const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter;

    return matchesSearch && matchesSpecialty && matchesGovernorate && matchesApproval && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleToggleStatus = async (doctor: UserProfile) => {
    const nextStatus = (doctor.accountStatus || 'active') === 'active' ? 'suspended' : 'active';
    setProcessingUid(doctor.uid);
    try {
      await onToggleAccountStatus(doctor, nextStatus);
      if (selectedDoctor?.uid === doctor.uid) {
        setSelectedDoctor({ ...doctor, accountStatus: nextStatus });
      }
    } finally {
      setProcessingUid(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {language === 'ar' ? 'إدارة الأطباء والعيادات التخصصية' : 'Physician & Clinic Registry'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {language === 'ar'
              ? 'سجل شامل للأطباء المعتمدين والمجمع الطبي، مع إمكانية تعليق أو إعادة تفعيل الحسابات.'
              : 'Complete registry of registered clinicians, with suspension and reactivation governance.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPrintDirectoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title={language === 'ar' ? 'طباعة دليل الكوادر الطبية' : 'Print Doctors Directory'}
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ar' ? 'طباعة دليل الأطباء' : 'Print Directory'}</span>
          </button>

          <div className="text-xs font-mono font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            {language === 'ar' ? 'إجمالي الأطباء:' : 'Total:'} <span className="text-slate-900">{doctors.length}</span>
          </div>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={
              language === 'ar'
                ? 'البحث بالاسم، البريد، المعرف، العيادة، رقم النقابة...'
                : 'Search name, email, UID, clinic, syndicate ID...'
            }
            className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <select
            value={specialtyFilter}
            onChange={(e) => {
              setSpecialtyFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">{language === 'ar' ? 'كل التخصصات' : 'All Specialties'}</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={governorateFilter}
            onChange={(e) => {
              setGovernorateFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">{language === 'ar' ? 'كل المحافظات' : 'All Governorates'}</option>
            {governorates.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={approvalFilter}
            onChange={(e) => {
              setApprovalFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">{language === 'ar' ? 'كل حالات الاعتماد' : 'All Approvals'}</option>
            <option value="active">{language === 'ar' ? 'معتمد' : 'Approved'}</option>
            <option value="pending_approval">{language === 'ar' ? 'قيد التدقيق' : 'Pending'}</option>
            <option value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">{language === 'ar' ? 'كل حالات الحساب' : 'All Account States'}</option>
            <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="suspended">{language === 'ar' ? 'معلق / موقوف' : 'Suspended'}</option>
          </select>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            {language === 'ar' ? 'لا يوجد أطباء مطابقون لخيارات البحث والتصفية.' : 'No doctors match current filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الطبيب' : 'Doctor'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الاختصاص' : 'Specialty'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'رقم النقابة' : 'Syndicate ID'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'العيادة / المحافظة' : 'Clinic / Location'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'حالة الاعتماد' : 'Approval'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'حالة الحساب' : 'Standing'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((doc) => {
                  const isSuspended = doc.accountStatus === 'suspended';
                  return (
                    <tr key={doc.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{doc.displayName || 'طبيب استشاري'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{doc.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {doc.specialization || 'طب عام'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {doc.syndicateId || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{doc.clinicName || 'عيادة خاصة'}</div>
                        <div className="text-[11px] text-slate-400">{doc.governorate || 'بغداد'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {doc.approvalStatus === 'active' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {language === 'ar' ? 'معتمد' : 'Approved'}
                          </span>
                        )}
                        {doc.approvalStatus === 'pending_approval' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            {language === 'ar' ? 'قيد التدقيق' : 'Pending'}
                          </span>
                        )}
                        {doc.approvalStatus === 'rejected' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-900">
                            {language === 'ar' ? 'مرفوض' : 'Rejected'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuspended ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                            <Ban className="w-3 h-3 text-red-600" />
                            <span>{language === 'ar' ? 'موقوف' : 'Suspended'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 w-fit">
                            {language === 'ar' ? 'نشط' : 'Active'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDoctor(doc)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="عرض الملف"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(doc)}
                            disabled={processingUid === doc.uid}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                              isSuspended
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-red-50 hover:bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {isSuspended
                              ? language === 'ar' ? 'تفعيل' : 'Activate'
                              : language === 'ar' ? 'تعليق' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              {language === 'ar' ? 'الصفحة' : 'Page'} {page} {language === 'ar' ? 'من' : 'of'} {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Doctor Profile Drawer/Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {selectedDoctor.displayName || 'طبيب استشاري'}
                </h3>
              </div>
              <button onClick={() => setSelectedDoctor(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px]">البريد الإلكتروني</span>
                <p className="font-mono font-bold text-slate-900 truncate">{selectedDoctor.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px]">رقم النقابة</span>
                <p className="font-mono font-bold text-amber-800">{selectedDoctor.syndicateId || '—'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px]">التخصص</span>
                <p className="font-bold text-slate-900">{selectedDoctor.specialization || 'طب عام'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px]">المحافظة</span>
                <p className="font-bold text-slate-900">{selectedDoctor.governorate || 'بغداد'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px]">العيادة</span>
                <p className="font-bold text-slate-900">{selectedDoctor.clinicName || 'عيادة خاصة'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px]">رقم الهاتف</span>
                <p className="font-mono font-bold text-slate-900">{selectedDoctor.phoneNumber || '—'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPrintDoctorCredentialOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>{language === 'ar' ? 'طباعة وثيقة الاعتماد' : 'Print Certificate'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedDoctor)}
                  disabled={processingUid === selectedDoctor.uid}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedDoctor.accountStatus === 'suspended'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {selectedDoctor.accountStatus === 'suspended'
                    ? language === 'ar' ? 'إعادة التفعيل' : 'Reactivate'
                    : language === 'ar' ? 'تعليق الحساب' : 'Suspend Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE MODAL 1: ACCREDITED DOCTORS DIRECTORY */}
      {isPrintDirectoryOpen && (
        <PrintableModal
          isOpen={isPrintDirectoryOpen}
          onClose={() => setIsPrintDirectoryOpen(false)}
          title={language === 'ar' ? 'دليل وسجل الكوادر الطبية التخصصية المعتمدة' : 'Official Accredited Physicians & Clinics Register'}
          subtitle={language === 'ar' ? 'سجل رسمي بأسماء وعيادات واختصاصات الأطباء المسجلين' : 'Official Physician Registry - M737 National Healthcare'}
          docNumber={`REG-DOCS-${doctors.length}`}
          badgeText={language === 'ar' ? 'دليل الأطباء الرسمي' : 'Official Directory'}
          officialStampTitle={language === 'ar' ? 'ختم ومصادقة شؤون الأطباء والعيادات' : 'Medical Affairs & Credentialing Seal'}
          headerDetails={[
            {
              label: language === 'ar' ? 'إجمالي الأطباء:' : 'Total Physicians:',
              value: `${filtered.length} ${language === 'ar' ? 'طبيب' : 'Doctors'}`,
            },
            {
              label: language === 'ar' ? 'تاريخ التقرير:' : 'Report Date:',
              value: new Date().toLocaleDateString(),
            },
            {
              label: language === 'ar' ? 'الاختصاص المفلتر:' : 'Specialty Filter:',
              value: specialtyFilter === 'all' ? (language === 'ar' ? 'كافة الاختصاصات' : 'All') : specialtyFilter,
            },
            {
              label: language === 'ar' ? 'المحافظة:' : 'Governorate Filter:',
              value: governorateFilter === 'all' ? (language === 'ar' ? 'كافة المحافظات' : 'All') : governorateFilter,
            },
          ]}
        >
          <div className="border border-slate-300 rounded-xl overflow-hidden avoid-break">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3 text-start">#</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'اسم الطبيب' : 'Doctor Name'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الاختصاص' : 'Specialization'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'العيادة والمحافظة' : 'Clinic & Gov'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'رقم النقابة' : 'Syndicate ID'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th className="py-2.5 px-3 text-start">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((doc, idx) => (
                  <tr key={doc.uid} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{doc.displayName}</td>
                    <td className="py-2 px-3 text-sky-800 font-semibold">{doc.specialization || 'طبيب استشاري'}</td>
                    <td className="py-2 px-3 text-slate-700">{doc.clinicName || 'عيادة خاصة'} · {doc.governorate || 'بغداد'}</td>
                    <td className="py-2 px-3 font-mono text-slate-800 font-bold">{doc.syndicateId || 'IRQ-VERIFIED'}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{doc.phoneNumber || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.approvalStatus === 'active' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {doc.approvalStatus === 'active' ? (language === 'ar' ? 'معتمد' : 'Approved') : (language === 'ar' ? 'قيد التدقيق' : 'Pending')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrintableModal>
      )}

      {/* PRINTABLE MODAL 2: INDIVIDUAL DOCTOR ACCREDITATION CERTIFICATE */}
      {isPrintDoctorCredentialOpen && selectedDoctor && (
        <PrintableModal
          isOpen={isPrintDoctorCredentialOpen}
          onClose={() => setIsPrintDoctorCredentialOpen(false)}
          title={language === 'ar' ? 'وثيقة اعتماد وتسجيل طبيب استشاري' : 'Official Physician Accreditation Certificate'}
          subtitle={language === 'ar' ? 'صادرة عن منصة M737 للرعاية الطبية والعيادات التخصصية' : 'Accreditation Document - M737 Healthcare Platform'}
          docNumber={`ACC-DOC-${selectedDoctor.uid.substring(0, 8).toUpperCase()}`}
          badgeText={language === 'ar' ? 'وثيقة رسمية معتمدة' : 'Accreditation Certificate'}
          officialStampTitle={language === 'ar' ? 'ختم وتوقيع لجنة الاعتماد والرقابة المهنية' : 'Credentialing Board Seal & Signature'}
          headerDetails={[
            {
              label: language === 'ar' ? 'اسم الطبيب الاستشاري:' : 'Doctor Full Name:',
              value: selectedDoctor.displayName || '—',
            },
            {
              label: language === 'ar' ? 'رقم هوية النقابة:' : 'Iraqi Syndicate ID:',
              value: selectedDoctor.syndicateId || 'IRQ-VERIFIED',
            },
            {
              label: language === 'ar' ? 'الاختصاص الطبي:' : 'Clinical Specialty:',
              value: selectedDoctor.specialization || 'استشاري',
            },
            {
              label: language === 'ar' ? 'المحافظة والعيادة:' : 'Clinic & Governorate:',
              value: `${selectedDoctor.clinicName || 'عيادة خاصة'} · ${selectedDoctor.governorate || 'بغداد'}`,
            },
          ]}
        >
          {/* Certificate Body Presentation */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-4 text-center avoid-break">
            <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase block">
              REPUBLIC OF IRAQ · MINISTRY & SYNDICATE STANDARDS
            </span>
            <h3 className="text-xl font-black text-white">
              {language === 'ar' ? `شهادة قيد واعتماد د. ${selectedDoctor.displayName}` : `Certificate of Practice: Dr. ${selectedDoctor.displayName}`}
            </h3>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              {language === 'ar'
                ? `تشهد إدارة المنصة بأن الطبيب مسجل ومعتمد بموجب رقم القيد النقابي [${selectedDoctor.syndicateId || 'IRQ-VERIFIED'}]، ومصرح له باستقبال واستشارة المراجعين وإصدار الوصفات الطبية الإلكترونية.`
                : `Certifies that this practitioner is accredited in good standing under Syndicate ID [${selectedDoctor.syndicateId || 'IRQ-VERIFIED'}].`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 gap-4 avoid-break">
            <div>
              <span className="text-slate-400 text-[10px] block">{language === 'ar' ? 'عنوان العيادة والمقر' : 'Clinic Address'}</span>
              <strong className="text-slate-900">{selectedDoctor.clinicName} — {selectedDoctor.governorate}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{language === 'ar' ? 'أجور الكشفية الرسمية' : 'Consultation Fee'}</span>
              <strong className="text-amber-800 font-mono font-bold">{(selectedDoctor.consultationFee || 25000).toLocaleString()} IQD</strong>
            </div>
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
