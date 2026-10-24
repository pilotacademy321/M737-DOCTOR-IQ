import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import {
  Search,
  Stethoscope,
  Building,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Phone,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CalendarCheck,
  User,
  Filter,
} from 'lucide-react';
import { db } from '../../config/firebase';
import { DoctorPublicProfile } from '../../types/database';
import { useLanguage } from '../../localization/LanguageContext';
import { IRAQI_GOVERNORATES, getWhatsAppSupportUrl } from '../../config/brand';

interface PatientDoctorSearchTabProps {
  initialSearchDoctorId?: string;
  onOpenBookingModal: (doctor: DoctorPublicProfile) => void;
}

export const PatientDoctorSearchTab: React.FC<PatientDoctorSearchTabProps> = ({
  initialSearchDoctorId,
  onOpenBookingModal,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [searchDoctorId, setSearchDoctorId] = useState(initialSearchDoctorId || '');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');
  const [searchSpecialty, setSearchSpecialty] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<DoctorPublicProfile[]>([]);
  const [allApprovedDoctors, setAllApprovedDoctors] = useState<DoctorPublicProfile[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // Real-time listener for approved active doctors across the platform
  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'doctor'),
      where('approvalStatus', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: DoctorPublicProfile[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            uid: d.id,
            syndicateId: data.syndicateId || `IRQ-${d.id.slice(0, 4)}`,
            displayName: data.displayName || (isAr ? 'طبيب اختصاص' : 'Specialist Doctor'),
            specialization: data.specialization || (isAr ? 'طب عام واستشارات' : 'General Practice'),
            clinicName: data.clinicName || (isAr ? 'عيادة تخصصية' : 'Clinic'),
            governorate: data.governorate || 'بغداد',
            consultationFee: data.consultationFee || 25000,
            workingDays: data.workingDays || (isAr ? 'الأحد — الخميس' : 'Sun — Thu'),
            workingHours: data.workingHours || '09:00 - 15:00',
            photoURL: data.photoURL || null,
            bio: data.medicalHistoryNotes || undefined,
            phoneNumber: data.phoneNumber || undefined,
            approvalStatus: data.approvalStatus,
            yearsOfExperience: data.yearsOfExperience || 8,
          });
        });

        setAllApprovedDoctors(list);
        setIsLoading(false);

        // If search was active, refresh search results in real time with newest data
        if (hasSearched) {
          const term = searchDoctorId.trim().toLowerCase();
          const specTerm = searchSpecialty.trim().toLowerCase();
          const refreshed = list.filter((doc) => {
            const matchTerm =
              !term ||
              doc.syndicateId?.toLowerCase().includes(term) ||
              doc.uid.toLowerCase().includes(term) ||
              doc.displayName.toLowerCase().includes(term);
            const matchGov = selectedGovernorate === 'all' || doc.governorate === selectedGovernorate;
            const matchSpec = !specTerm || doc.specialization.toLowerCase().includes(specTerm);
            return matchTerm && matchGov && matchSpec;
          });
          setSearchResults(refreshed);
        }
      },
      (err) => {
        console.warn('Real-time doctor subscription notice:', err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [hasSearched, searchDoctorId, searchSpecialty, selectedGovernorate, isAr]);

  // Handle direct Doctor ID search
  const handleSearchDoctor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    setIsLoading(true);
    setSearchMessage(null);

    const term = searchDoctorId.trim().toLowerCase();

    try {
      // Filter from loaded active doctors or query
      let matches = allApprovedDoctors.filter((doc) => {
        const matchSyndicate = doc.syndicateId?.toLowerCase().includes(term);
        const matchUid = doc.uid.toLowerCase().includes(term);
        const matchName = doc.displayName.toLowerCase().includes(term);
        const matchSpecialty = doc.specialization.toLowerCase().includes(term);

        if (term) {
          if (!matchSyndicate && !matchUid && !matchName && !matchSpecialty) return false;
        }

        if (selectedGovernorate !== 'all' && doc.governorate !== selectedGovernorate) {
          return false;
        }

        return true;
      });

      setSearchResults(matches);

      if (matches.length === 0) {
        setSearchMessage(
          isAr
            ? 'لم يتم العثور على طبيب متاح بهذا الرقم التعريفي أو أن الطبيب قيد التدقيق الإداري حالياً.'
            : 'No active approved doctor was found with this ID or criteria.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If initialSearchDoctorId was passed, trigger search
  useEffect(() => {
    if (initialSearchDoctorId && allApprovedDoctors.length > 0) {
      setSearchDoctorId(initialSearchDoctorId);
      handleSearchDoctor();
    }
  }, [initialSearchDoctorId, allApprovedDoctors.length]);

  const displayedDoctors = hasSearched ? searchResults : allApprovedDoctors;

  return (
    <div className="space-y-6">
      {/* Search Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-sky-600" />
            <span>{isAr ? 'البحث عن طبيب بواسطة المعرف (Doctor ID) أو النقابة' : 'Find Doctor by Doctor ID / Syndicate'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'أدخل رقم تسجيل نقابة الأطباء (مثال: IRQ-1044 أو رقم النقابة) أو ابحث حسب المحافظة والتخصص لعرض جدول المواعيد والحجز المباشر.'
              : 'Search by unique doctor ID, syndicate registration, or filter by governorate.'}
          </p>
        </div>

        {/* Search Inputs */}
        <form onSubmit={handleSearchDoctor} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Doctor ID / Name */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                value={searchDoctorId}
                onChange={(e) => setSearchDoctorId(e.target.value)}
                placeholder={isAr ? 'أدخل كود الطبيب (Doctor ID)، رقم النقابة، أو اسم الطبيب...' : 'Enter doctor ID, syndicate number, or name...'}
                className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Governorate Filter */}
            <div>
              <select
                value={selectedGovernorate}
                onChange={(e) => setSelectedGovernorate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:border-sky-500"
              >
                <option value="all">{isAr ? 'كافة المحافظات العراقية' : 'All Governorates'}</option>
                {IRAQI_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-slate-400">
              {isAr ? 'يتم عرض الأطباء المعتمدين والمفعلين فقط من نقابة الأطباء' : 'Only approved and verified physicians are shown'}
            </span>
            <div className="flex items-center gap-2">
              {hasSearched && (
                <button
                  type="button"
                  onClick={() => {
                    setHasSearched(false);
                    setSearchDoctorId('');
                    setSelectedGovernorate('all');
                    setSearchMessage(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  {isAr ? 'عرض الكل' : 'Reset'}
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>{isLoading ? (isAr ? 'جاري البحث...' : 'Searching...') : (isAr ? 'بحث عن الطبيب' : 'Search Doctor')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Search Not Found Alert Message */}
      {searchMessage && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-950">{isAr ? 'نتيجة البحث' : 'Search Result'}</h4>
            <p className="text-xs text-amber-900 leading-relaxed">{searchMessage}</p>
          </div>
        </div>
      )}

      {/* Doctors Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <span className="font-bold">
            {isAr
              ? `الأطباء المتاحون للحجز (${displayedDoctors.length})`
              : `Available Physicians (${displayedDoctors.length})`}
          </span>
          <span className="text-slate-400">
            {isAr ? 'معايير حوكمة M737' : 'M737 Standards'}
          </span>
        </div>

        {displayedDoctors.length === 0 && !searchMessage ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isAr ? 'لا يوجد أطباء مفعلون متاحون للحجز حالياً' : 'No approved active doctors available'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAr
                ? 'يقوم مسؤولو الإدارة بتدقيق التراخيص السريرية باستمرار قبل تفعيل الحجز العام.'
                : 'Super Admin audits doctor syndicates before activating public booking.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedDoctors.map((doctor) => {
              // Normalized WhatsApp link if public number provided
              const whatsappUrl = doctor.phoneNumber
                ? `https://wa.me/964${doctor.phoneNumber.replace(/^0/, '').replace(/\D/g, '')}?text=${encodeURIComponent(
                    isAr
                      ? `السلام عليكم دكتور ${doctor.displayName}، أستفسر عن المواعيد في منصة M737`
                      : `Hello Dr. ${doctor.displayName}, inquiring about M737 appointment`
                  )}`
                : null;

              return (
                <div
                  key={doctor.uid}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between p-5 space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Identity Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-800 font-extrabold text-xl flex items-center justify-center shrink-0">
                          {doctor.displayName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                            {doctor.displayName}
                          </h3>
                          <p className="text-xs font-bold text-sky-700 mt-0.5">
                            {doctor.specialization}
                          </p>
                          <span className="font-mono text-[10px] text-amber-700 font-bold block mt-0.5">
                            ID: {doctor.syndicateId}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{isAr ? 'معتمد' : 'Verified'}</span>
                      </span>
                    </div>

                    {/* Clinic & Location Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{doctor.clinicName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doctor.governorate}</span>
                      </div>
                    </div>

                    {/* Bio if available */}
                    {doctor.bio && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg line-clamp-2">
                        {doctor.bio}
                      </p>
                    )}

                    {/* Schedule and Fee Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'أجور الكشفية' : 'Fee'}</span>
                        <span className="text-xs font-black text-amber-800">
                          {doctor.consultationFee.toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'ساعات العيادة' : 'Hours'}</span>
                        <span className="text-xs font-bold text-slate-800 font-mono truncate block">
                          {doctor.workingHours}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-sky-600" />
                      <span>{isAr ? 'أيام الاستقبال:' : 'Days:'} <strong className="text-slate-800">{doctor.workingDays}</strong></span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    {/* Primary Booking Request Button */}
                    <button
                      onClick={() => onOpenBookingModal(doctor)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'طلب حجز موعد' : 'Book Appointment'}</span>
                    </button>

                    {/* Public WhatsApp Contact if public number exists */}
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                        title={isAr ? 'تواصل مع العيادة عبر واتساب' : 'WhatsApp Clinic'}
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-700" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
