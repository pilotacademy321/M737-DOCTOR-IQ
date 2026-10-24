import React, { useState } from 'react';
import {
  Settings,
  Save,
  Building,
  MapPin,
  DollarSign,
  Phone,
  MessageCircle,
  Award,
  Stethoscope,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { UserProfile } from '../../types/auth';
import { useLanguage } from '../../localization/LanguageContext';
import { IRAQI_GOVERNORATES } from '../../config/brand';

interface DoctorSettingsTabProps {
  userProfile: UserProfile | null;
  onUpdateProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
}

export const DoctorSettingsTab: React.FC<DoctorSettingsTabProps> = ({
  userProfile,
  onUpdateProfile,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [specialization, setSpecialization] = useState(userProfile?.specialization || '');
  const [clinicName, setClinicName] = useState(userProfile?.clinicName || '');
  const [governorate, setGovernorate] = useState(userProfile?.governorate || 'بغداد');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [consultationFee, setConsultationFee] = useState<number>(userProfile?.consultationFee || 25000);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(userProfile?.yearsOfExperience || 10);
  const [medicalHistoryNotes, setMedicalHistoryNotes] = useState(userProfile?.medicalHistoryNotes || '');
  const [workingDays, setWorkingDays] = useState(userProfile?.workingDays || (isAr ? 'الأحد — الخميس' : 'Sun — Thu'));
  const [workingHours, setWorkingHours] = useState(userProfile?.workingHours || '09:00 - 15:00');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await onUpdateProfile({
        displayName,
        specialization,
        clinicName,
        governorate,
        phoneNumber,
        consultationFee,
        yearsOfExperience,
        medicalHistoryNotes,
        workingDays,
        workingHours,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
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
            <Settings className="w-5 h-5 text-slate-700" />
            <span>{isAr ? 'إعدادات الملف المهني والعيادة' : 'Physician & Clinic Profile Settings'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'تحديث بيانات العيادة التخصصية، المحافظة، أجور الكشفية (د.ع)، وأرقام التواصل المعتمدة.'
              : 'Manage clinic identity, governorate, consultation fees (IQD), and public credentials.'}
          </p>
        </div>

        <button
          form="doctor-settings-form"
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          {isSaving ? (
            <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
          ) : (
            <>
              <Save className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'حفظ ومزامنة البيانات' : 'Save Changes'}</span>
            </>
          )}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? 'تم تحديث بيانات ملف الطبيب والعيادة في Firestore بنجاح.' : 'Profile settings synchronized successfully.'}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form
        id="doctor-settings-form"
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6"
      >
        {/* Section 1: Professional Identity */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <span>{isAr ? 'البيانات المهنية والتخصص' : 'Professional Credentials'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'الاسم المهني الكامل للطبيب' : 'Full Professional Name'}
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
                {isAr ? 'التخصص الطبي الدقيق' : 'Medical Specialization'}
              </label>
              <input
                type="text"
                required
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder={isAr ? 'مثال: جراحة العظام والمفاصل، باطنية وقلبية...' : 'Specialty'}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'رقم هوية نقابة أطباء العراق' : 'Syndicate Registration ID'}
              </label>
              <input
                type="text"
                disabled
                value={userProfile?.syndicateId || 'IRQ-VERIFIED'}
                className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isAr ? 'خاضع لتدقيق وموافقة الإدارة العليا ولا يعدل ذاتياً' : 'Audited and verified by Super Admin.'}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'سنوات الخبرة السريرية' : 'Years of Experience'}
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(parseInt(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinic & Location */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'موقع العيادة والتواصل' : 'Clinic & Practice Location'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'اسم العيادة أو المجمع الطبي' : 'Clinic / Center Name'}
              </label>
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder={isAr ? 'عيادة النور التخصصية' : 'Clinic name'}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'المحافظة العراقية' : 'Iraqi Governorate'}
              </label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-500"
              >
                {IRAQI_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'رقم هاتف العيادة والحجوزات' : 'Clinic Phone'}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="07XXXXXXXXX"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'أجور الكشفية الطبية (بالدينار العراقي IQD)' : 'Consultation Fee (IQD)'}
              </label>
              <input
                type="number"
                step={1000}
                min={5000}
                max={250000}
                value={consultationFee}
                onChange={(e) => setConsultationFee(parseInt(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {consultationFee.toLocaleString()} {isAr ? 'دينار عراقي' : 'IQD'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Summary of Working Hours */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'مواعيد الدوام والنبذة التعريفية' : 'Schedule Description & Bio'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'وصف أيام الدوام للمرضى' : 'Working Days Summary'}
              </label>
              <input
                type="text"
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
                placeholder={isAr ? 'الأحد — الخميس' : 'Sun — Thu'}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAr ? 'وصف ساعات الدوام للمرضى' : 'Working Hours Summary'}
              </label>
              <input
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="09:00 - 15:00"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {isAr ? 'نبذة عن الطبيب والمؤهلات والشهادات' : 'Physician Bio & Credentials'}
            </label>
            <textarea
              rows={3}
              value={medicalHistoryNotes}
              onChange={(e) => setMedicalHistoryNotes(e.target.value)}
              placeholder={
                isAr
                  ? 'بورد عراقي/عربي، عضو الجمعية الطبية، خبرة في مستشفيات بغداد التعليمية...'
                  : 'Board certification, qualifications, clinical focus...'
              }
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ ومزامنة التغييرات' : 'Save Changes')}
          </button>
        </div>
      </form>
    </div>
  );
};
