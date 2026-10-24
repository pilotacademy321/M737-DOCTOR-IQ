import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Stethoscope, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../localization/LanguageContext';
import { PageContainer } from '../components/common/PageContainer';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { BrandLogo } from '../components/brand/BrandLogo';

export const OnboardingPage: React.FC = () => {
  const { currentUser, registerRoleAndProfile, signOut } = useAuth();
  const { t, language, direction } = useLanguage();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [governorate, setGovernorate] = useState('بغداد');
  
  // Patient fields
  const [bloodType, setBloodType] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalHistoryNotes, setMedicalHistoryNotes] = useState('');

  // Doctor fields
  const [specialization, setSpecialization] = useState('طب وجراحة عامة');
  const [syndicateId, setSyndicateId] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(5);
  const [consultationFee, setConsultationFee] = useState<number>(25000);
  const [workingHours, setWorkingHours] = useState('4:00 PM - 9:00 PM');
  const [workingDays, setWorkingDays] = useState('السبت - الأربعاء');
  const [gender, setGender] = useState('طبيب');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const governorates = [
    'بغداد', 'أربيل', 'البصرة', 'النجف', 'كربلاء', 'السليمانية', 'دهوك',
    'نينوى', 'كركوك', 'بابل', 'ديالى', 'الأنبار', 'واسط', 'ميسان',
    'ذي قار', 'المثنى', 'القادسية', 'صلاح الدين'
  ];

  const specialties = [
    'طب وجراحة عامة', 'أمراض القلب والأوعية الدموية', 'طب الأطفال',
    'طب النساء والولادة', 'جراحة العظام والمفاصل', 'الأمراض الباطنية',
    'طب العيون', 'طب وجراحة الأسنان', 'طب الأعصاب', 'الأمراض الجلدية',
    'طب الأنف والأذن والحنجرة', 'الأشعة والتصوير الطبي'
  ];

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError(language === 'ar' ? 'يرجى اختيار نوع الحساب أولاً' : 'Please select an account type first');
      return;
    }

    if (!fullName || !phoneNumber) {
      setError(language === 'ar' ? 'يرجى إكمال الاسم ورقم الهاتف' : 'Please provide full name and phone number');
      return;
    }

    if (selectedRole === 'doctor' && (!syndicateId || !specialization)) {
      setError(language === 'ar' ? 'يرجى إدخال رقم تسجيل نقابة الأطباء والاختصاص' : 'Please provide syndicate ID and specialty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (selectedRole === 'patient') {
        await registerRoleAndProfile('patient', {
          displayName: fullName,
          phoneNumber,
          governorate,
          bloodType,
          emergencyContact,
          medicalHistoryNotes,
        });
        navigate('/dashboard/patient');
      } else {
        await registerRoleAndProfile('doctor', {
          displayName: fullName,
          phoneNumber,
          governorate,
          specialization,
          syndicateId,
          clinicName,
          yearsOfExperience,
          consultationFee,
          workingHours,
          workingDays,
          gender,
        });
        navigate('/dashboard/doctor');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'حدث خطأ أثناء حفظ الملف التعريفي');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <PageContainer size="narrow">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-block">
              <BrandLogo size="md" variant="dark" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === 'ar' ? 'إكمال تسجيل الحساب في M737' : 'Complete Your M737 Account Registration'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              {language === 'ar'
                ? `مرحباً بك ${currentUser?.displayName || ''}. يرجى تحديد نوع حسابك للبدء في استخدام المنصة.`
                : `Welcome ${currentUser?.displayName || ''}. Please select your role to proceed.`}
            </p>
            <div className="text-xs text-slate-500 font-mono">
              {currentUser?.email}
            </div>
          </div>

          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

          {/* Step 1: Role Selection Cards */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800">
              {language === 'ar' ? 'الخطوة 1: اختر نوع الحساب' : 'Step 1: Choose Account Type'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option: Patient */}
              <button
                type="button"
                onClick={() => setSelectedRole('patient')}
                className={`p-5 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedRole === 'patient'
                    ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-10 h-10 rounded-lg bg-amber-100/80 text-amber-800 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedRole === 'patient' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                    }`}
                  >
                    {selectedRole === 'patient' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'ar' ? 'أنا مريض' : 'I am a Patient'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {language === 'ar'
                      ? 'حجز المواعيد الطبية، متابعة السجلات الصحية والفحوصات، والتواصل مع الأطباء.'
                      : 'Book appointments, view medical records, and consult verified physicians.'}
                  </p>
                </div>
              </button>

              {/* Option: Doctor */}
              <button
                type="button"
                onClick={() => setSelectedRole('doctor')}
                className={`p-5 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedRole === 'doctor'
                    ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-10 h-10 rounded-lg bg-sky-100/80 text-sky-800 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedRole === 'doctor' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                    }`}
                  >
                    {selectedRole === 'doctor' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'ar' ? 'أنا طبيب' : 'I am a Doctor'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {language === 'ar'
                      ? 'إدارة العيادة والمواعيد، فحص سجلات المرضى. يتطلب تدقيق ترخيص نقابة الأطباء.'
                      : 'Manage clinic schedules and medical consultations. Requires Syndicate credential auditing.'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Detailed Profile Form */}
          {selectedRole && (
            <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-slate-200">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedRole === 'patient'
                    ? language === 'ar'
                      ? 'الخطوة 2: استمارة بيانات المراجع'
                      : 'Step 2: Patient Registration Details'
                    : language === 'ar'
                    ? 'الخطوة 2: استمارة اعتماد الطبيب الاستشاري'
                    : 'Step 2: Physician Credential Application'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRole === 'doctor'
                    ? language === 'ar'
                      ? 'ملاحظة: طلب انضمام الطبيب يظل قيد المراجعة (Pending) حتى تدقيقه من قبل الإدارة العليا.'
                      : 'Note: Doctor applications remain pending until verified by the Super Admin.'
                    : language === 'ar'
                    ? 'يتم حفظ بياناتك بأمان وسرية تامة.'
                    : 'Your personal data is protected under strict medical privacy standards.'}
                </p>
              </div>

              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    {language === 'ar' ? 'الاسم الكامل الثلاثي' : 'Official Full Name'}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    {language === 'ar' ? 'رقم الهاتف (العراق)' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="07XXXXXXXXX"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    {language === 'ar' ? 'المحافظة' : 'Governorate'}
                  </label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {governorates.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Patient specific: Blood type */}
                {selectedRole === 'patient' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {language === 'ar' ? 'فصيلة الدم' : 'Blood Group'}
                    </label>
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Doctor specific: Specialty */}
                {selectedRole === 'doctor' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {language === 'ar' ? 'الاختصاص الطبي' : 'Medical Specialty'}
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      {specialties.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Doctor specific: Syndicate Registration Number */}
                {selectedRole === 'doctor' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {language === 'ar' ? 'رقم هوية نقابة الأطباء العراقية' : 'Iraqi Syndicate Registration ID'}
                    </label>
                    <input
                      type="text"
                      value={syndicateId}
                      onChange={(e) => setSyndicateId(e.target.value)}
                      placeholder="IRQ-MED-XXXXX"
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                    />
                  </div>
                )}

                {/* Doctor specific: Clinic or Hospital Name */}
                {selectedRole === 'doctor' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {language === 'ar' ? 'اسم العيادة أو المجمع الطبي' : 'Clinic or Complex Name'}
                      </label>
                      <input
                        type="text"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        placeholder="مثال: مجمع اليرموك التخصصي"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {language === 'ar' ? 'أجر الاستشارة التقريبي (دينار عراقي)' : 'Consultation Fee (IQD)'}
                      </label>
                      <input
                        type="number"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(Number(e.target.value))}
                        step="5000"
                        min="5000"
                        placeholder="25000"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {language === 'ar' ? 'أوقات الدوام والعيادة' : 'Working Hours'}
                      </label>
                      <input
                        type="text"
                        value={workingHours}
                        onChange={(e) => setWorkingHours(e.target.value)}
                        placeholder="مثال: 4:00 عصراً - 9:00 مساءً"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {language === 'ar' ? 'أيام الاستشارة الأسبوعية' : 'Working Days'}
                      </label>
                      <input
                        type="text"
                        value={workingDays}
                        onChange={(e) => setWorkingDays(e.target.value)}
                        placeholder="مثال: السبت إلى الأربعاء"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {language === 'ar' ? 'الجنس' : 'Gender'}
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                      >
                        <option value="طبيب">{language === 'ar' ? 'طبيب (ذكر)' : 'Male Doctor'}</option>
                        <option value="طبيبة">{language === 'ar' ? 'طبيبة (أنثى)' : 'Female Doctor'}</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Patient Emergency & History */}
              {selectedRole === 'patient' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {language === 'ar' ? 'جهة اتصال الطوارئ (الاسم ورقم الهاتف)' : 'Emergency Contact'}
                    </label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="مثال: الأخ / 0770XXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      {language === 'ar' ? 'ملاحظات صحية أو حساسيات دوائية (اختياري)' : 'Allergies / Health Notes (Optional)'}
                    </label>
                    <textarea
                      value={medicalHistoryNotes}
                      onChange={(e) => setMedicalHistoryNotes(e.target.value)}
                      rows={2}
                      placeholder={language === 'ar' ? 'حساسية البنسلين، ضغط دم، سكري...' : 'Penicillin allergy, hypertension...'}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Doctor Governance Auditing Notice */}
              {selectedRole === 'doctor' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{language === 'ar' ? 'حوكمة التسجيل السريري' : 'Clinical Credential Governance'}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {language === 'ar'
                      ? 'بمجرد إرسال الطلب، سيتم مراجعته من قبل إدارة المنصة (Super Admin). سيبقى الحساب في حالة "قيد التدقيق" ولن يتمكن من استقبال المواعيد حتى تدقيق التراخيص المهنية.'
                      : 'Upon submission, your application will be verified by Platform Super Admin. Clinical booking will activate once credentials are authenticated.'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {language === 'ar' ? 'تسجيل الخروج والإلغاء' : 'Cancel & Sign Out'}
                </button>

                <PrimaryButton
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  icon={<ArrowIcon className="w-4 h-4" />}
                >
                  {selectedRole === 'patient'
                    ? language === 'ar'
                      ? 'إتمام التسجيل والدخول'
                      : 'Complete Patient Registration'
                    : language === 'ar'
                    ? 'تقديم طلب اعتماد الطبيب'
                    : 'Submit Physician Application'}
                </PrimaryButton>
              </div>
            </form>
          )}
        </div>
      </PageContainer>
    </div>
  );
};
