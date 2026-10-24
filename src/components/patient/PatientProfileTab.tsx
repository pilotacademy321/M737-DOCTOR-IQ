import React, { useState } from 'react';
import {
  User,
  Save,
  Phone,
  MapPin,
  Heart,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Printer,
} from 'lucide-react';
import { UserProfile } from '../../types/auth';
import { useLanguage } from '../../localization/LanguageContext';
import { IRAQI_GOVERNORATES } from '../../config/brand';
import { PrintableModal } from '../common/PrintableModal';

interface PatientProfileTabProps {
  userProfile: UserProfile | null;
  onUpdateProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
}

export const PatientProfileTab: React.FC<PatientProfileTabProps> = ({
  userProfile,
  onUpdateProfile,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [governorate, setGovernorate] = useState(userProfile?.governorate || 'بغداد');
  const [gender, setGender] = useState(userProfile?.gender || 'male');
  const [bloodType, setBloodType] = useState(userProfile?.bloodType || 'A+');
  const [emergencyContact, setEmergencyContact] = useState(userProfile?.emergencyContact || '');
  const [medicalNotes, setMedicalNotes] = useState(userProfile?.medicalHistoryNotes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPrintHealthCardOpen, setIsPrintHealthCardOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!displayName.trim()) {
      setValidationError(isAr ? 'يرجى إدخال اسم المراجع الكامل.' : 'Full name is required.');
      return;
    }

    if (!phoneNumber.trim() || !/^07\d{8,9}$/.test(phoneNumber.replace(/\s+/g, ''))) {
      setValidationError(
        isAr
          ? 'يرجى إدخال رقم هاتف عراقي صالح يبدأ بـ 07 (مثال: 07885663748).'
          : 'Valid Iraqi phone number starting with 07 is required.'
      );
      return;
    }

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await onUpdateProfile({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        governorate,
        gender,
        bloodType,
        emergencyContact: emergencyContact.trim(),
        medicalHistoryNotes: medicalNotes.trim(),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: unknown) {
      console.error('Error updating patient profile:', err);
      const e = err as Error;
      setValidationError(e.message || (isAr ? 'تعذر حفظ البيانات في قاعدة البيانات.' : 'Failed to update profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-sky-600" />
            <span>{isAr ? 'الملف الطبي والبيانات الشخصية' : 'Personal & Medical Health Profile'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'تحديث بيانات التواصل، المحافظة، فصيلة الدم، وأرقام الطوارئ لتسريع الحجز لدى العيادات.'
              : 'Keep your contact numbers, blood group, and emergency contacts up to date.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPrintHealthCardOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title={isAr ? 'طباعة البطاقة الصحية للمراجع' : 'Print Patient Health Card'}
          >
            <Printer className="w-4 h-4 text-sky-600" />
            <span>{isAr ? 'طباعة البطاقة الصحية' : 'Print Health Card'}</span>
          </button>

          <button
            form="patient-profile-form"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Profile')}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? 'تم تحديث الملف الطبي للمراجع في Firestore بنجاح.' : 'Profile updated successfully.'}</span>
        </div>
      )}

      {validationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Profile Form */}
      <form
        id="patient-profile-form"
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6"
      >
        {/* Immutable Identity Fields */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">{isAr ? 'المعرف الثابت للحساب (UID)' : 'Account UID'}</span>
            <span className="font-mono text-slate-700 font-bold">{userProfile?.uid}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">{isAr ? 'البريد الإلكتروني الموثق (Google)' : 'Verified Google Email'}</span>
            <span className="font-mono text-slate-700 font-bold">{userProfile?.email}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">{isAr ? 'نوع الحساب والصلاحية' : 'Role & Status'}</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'مراجع معتمد' : 'Verified Patient'}</span>
            </span>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'الاسم الثلاثي الكامل *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'رقم الهاتف الأساسي (07XXXXXXXXX) *' : 'Primary Phone *'}
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="07XXXXXXXXX"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'المحافظة العراقية' : 'Governorate'}
              </label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
              >
                {IRAQI_GOVERNORATES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'الجنس' : 'Gender'}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
              >
                <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'فصيلة الدم' : 'Blood Group'}
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-sky-500"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'رقم هاتف الطوارئ (اختياري)' : 'Emergency Contact Phone'}
              </label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="07XXXXXXXXX"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {isAr ? 'الأمراض المزمنة، التحسس الدوائي، أو سوابق جراحية (اختياري)' : 'Chronic Illnesses, Allergies, or Medical Notes (Optional)'}
            </label>
            <textarea
              rows={3}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder={isAr ? 'مثال: حساسية البنسلين، داء السكري النوع الثاني...' : 'e.g. Penicillin allergy, Type 2 Diabetes...'}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Profile')}
          </button>
        </div>
      </form>

      {/* PRINTABLE HEALTH CARD MODAL */}
      {isPrintHealthCardOpen && (
        <PrintableModal
          isOpen={isPrintHealthCardOpen}
          onClose={() => setIsPrintHealthCardOpen(false)}
          title={isAr ? 'بطاقة السجل الطبي والمراجع الصحية الموحدة' : 'Unified Health & Patient Identity Card'}
          subtitle={isAr ? 'الهوية الطبية الرسمية للمراجع المعتمدة لدى شبكة العيادات' : 'Official Patient Healthcare Identification'}
          docNumber={`MRN-${userProfile?.uid?.substring(0, 8).toUpperCase() || 'PATIENT'}`}
          badgeText={isAr ? 'مراجع معتمد' : 'Verified Patient'}
          officialStampTitle={isAr ? 'مصادقة السجل الطبي الموحد' : 'Medical Records Certification'}
          headerDetails={[
            {
              label: isAr ? 'اسم المراجع:' : 'Patient Name:',
              value: displayName || userProfile?.displayName || '—',
            },
            {
              label: isAr ? 'رقم الهاتف:' : 'Phone:',
              value: phoneNumber || userProfile?.phoneNumber || '—',
            },
            {
              label: isAr ? 'المحافظة:' : 'Governorate:',
              value: governorate || 'بغداد',
            },
            {
              label: isAr ? 'فصيلة الدم:' : 'Blood Group:',
              value: bloodType || 'A+',
            },
          ]}
        >
          {/* Card Presentation */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-4 avoid-break">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm">
                  M
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight">M737 IRAQ HEALTH IDENTIFICATION</h4>
                  <p className="text-[10px] text-slate-400 font-mono">REPUBLIC OF IRAQ HEALTH NETWORK</p>
                </div>
              </div>
              <div className="text-end">
                <span className="px-3 py-1 rounded-lg bg-rose-600 text-white font-black text-sm font-mono shadow-sm">
                  {bloodType || 'A+'}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">{isAr ? 'فصيلة الدم' : 'Blood Group'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">{isAr ? 'الاسم الثلاثي:' : 'Full Name:'}</span>
                <strong className="text-white text-sm block">{displayName || '—'}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">{isAr ? 'الجنس:' : 'Gender:'}</span>
                <strong className="text-white">{gender === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">{isAr ? 'المحافظة السكنية:' : 'Governorate:'}</span>
                <strong className="text-white">{governorate}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">{isAr ? 'هاتف الطوارئ:' : 'Emergency Contact:'}</span>
                <strong className="text-amber-400 font-mono">{emergencyContact || phoneNumber || '—'}</strong>
              </div>
            </div>
          </div>

          {/* Medical Notes / Allergies Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 avoid-break">
            <span className="text-slate-900 font-bold block text-[11px]">
              {isAr ? 'تنبيهات الحساسية الدوائية والأمراض المزمنة:' : 'Allergy Warnings & Chronic Conditions:'}
            </span>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 font-sans leading-relaxed">
              {medicalNotes || (isAr ? 'لا توجد ملاحظات أو تحسسات مسجلة في الملف الطبي.' : 'No recorded clinical allergies or chronic notes.')}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 avoid-break">
            {isAr
              ? 'تعتمد هذه البطاقة الصحية لتسهيل الفرز السريري وفتح الملف الطبي لدى كافة العيادات والمراكز الصحية الشريكة.'
              : 'Used for clinical triage and record intake across all accredited network partner clinics.'}
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
