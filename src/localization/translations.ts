export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

export interface Translations {
  // Brand
  brandName: string;
  brandArabicName: string;
  brandSubtitle: string;
  brandTagline: string;

  // Navigation
  navHome: string;
  navServices: string;
  navDoctors: string;
  navClinics: string;
  navSupport: string;
  navSignIn: string;
  navSignUp: string;
  navDashboard: string;
  navPatientDashboard: string;
  navDoctorDashboard: string;
  navAdminDashboard: string;
  navPrivacy: string;
  navTerms: string;

  // Support
  needHelpPrompt: string;
  contactSupport: string;
  emailSupport: string;
  whatsappSupport: string;
  whatsappButtonText: string;
  supportHours: string;
  supportHoursValue: string;
  sendSupportEmail: string;

  // Common UI
  languageToggle: string;
  backToHome: string;
  loading: string;
  close: string;
  role: string;
  status: string;
  actions: string;
  learnMore: string;
  getStarted: string;
  orContinueWith: string;
  googleSignIn: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;

  // Home Page
  heroKicker: string;
  heroTitle: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  pillar1Title: string;
  pillar1Desc: string;
  pillar2Title: string;
  pillar2Desc: string;
  pillar3Title: string;
  pillar3Desc: string;
  pillar4Title: string;
  pillar4Desc: string;
  networkTitle: string;
  networkSubtitle: string;
  securityNoticeTitle: string;
  securityNoticeDesc: string;

  // Auth Pages
  signInTitle: string;
  signInSubtitle: string;
  signUpTitle: string;
  signUpSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  selectRoleLabel: string;
  rolePatient: string;
  roleDoctor: string;
  roleAdmin: string;
  rolePatientDesc: string;
  roleDoctorDesc: string;
  roleAdminDesc: string;
  authPhaseNotice: string;
  authPhaseNoticeDesc: string;
  termsAgreement: string;

  // Dashboards
  patientDashboardTitle: string;
  patientDashboardDesc: string;
  doctorDashboardTitle: string;
  doctorDashboardDesc: string;
  adminDashboardTitle: string;
  adminDashboardDesc: string;
  dashboardPlaceholderBadge: string;
  dashboardPhase2Notice: string;
  governanceWarning: string;

  // Support Page
  supportPageTitle: string;
  supportPageSubtitle: string;
  directChannelsTitle: string;
  faqTitle: string;
  faq1Q: string;
  faq1A: string;
  faq2Q: string;
  faq2A: string;

  // Legal
  privacyTitle: string;
  privacyLastUpdated: string;
  termsTitle: string;
  termsLastUpdated: string;

  // 404
  notFoundTitle: string;
  notFoundDesc: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    brandName: 'M737',
    brandArabicName: 'مجمع الطب الأول بالعراق',
    brandSubtitle: 'المنصة الطبية الوطنية العراقية المتقدمة',
    brandTagline: 'منظومة الرعاية الصحية الرقمية الموحدة لربط المرضى والأطباء والمراكز التخصصية',

    navHome: 'الرئيسية',
    navServices: 'المنظومة الطبية',
    navDoctors: 'بوابة الأطباء',
    navClinics: 'المجمعات والمراكز',
    navSupport: 'مركز الدعم',
    navSignIn: 'تسجيل الدخول',
    navSignUp: 'إنشاء حساب جديد',
    navDashboard: 'لوحة التحكم',
    navPatientDashboard: 'لوحة المراجع',
    navDoctorDashboard: 'لوحة الطبيب',
    navAdminDashboard: 'لوحة الإدارة العليا',
    navPrivacy: 'سياسة الخصوصية',
    navTerms: 'شروط الاستخدام',

    needHelpPrompt: 'تحتاج مساعدة؟ راسل الدعم الفني إذا واجهت أي مشكلة.',
    contactSupport: 'تواصل مع الدعم الفني',
    emailSupport: 'البريد الإلكتروني للدعم',
    whatsappSupport: 'واتساب الدعم الفني المباشر',
    whatsappButtonText: 'محادثة الدعم عبر واتساب',
    supportHours: 'ساعات العمل',
    supportHoursValue: 'خدمة الدعم الفني متوفرة يومياً',
    sendSupportEmail: 'إرسال بريد إلكتروني',

    languageToggle: 'English',
    backToHome: 'العودة إلى الصفحة الرئيسية',
    loading: 'جاري التحميل...',
    close: 'إغلاق',
    role: 'الصفة المهنية',
    status: 'الحالة',
    actions: 'الإجراءات',
    learnMore: 'تعرف على المنظومة',
    getStarted: 'ابدأ الاستخدام',
    orContinueWith: 'أو المتابعة عبر البريد',
    googleSignIn: 'الدخول بواسطة حساب Google',
    dontHaveAccount: 'ليس لديك حساب بعد؟',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',

    heroKicker: 'المنصة الوطنية الرائدة لجمهورية العراق',
    heroTitle: 'مجمع الطب الأول بالعراق: بنية رقمية صحية متقدمة',
    heroDescription: 'منصة M737 ترسي المعايير الرقمية الحديثة للرعاية الطبية في العراق، موفرةً ربطاً آمناً وموثوقاً بين المرضى والأطباء والمراكز السريرية المعتمدة.',
    heroPrimaryCta: 'الدخول إلى المنصة',
    heroSecondaryCta: 'استعراض الهيكلية الطبية',
    pillar1Title: 'ربط سريري متكامل',
    pillar1Desc: 'تنسيق سلس بين المراجعين والاستشاريين والمراكز الطبية التخصصية في عموم المحافظات العراقية.',
    pillar2Title: 'سجلات صحية موحدة',
    pillar2Desc: 'بنية بيانات سحابية متقدمة لحفظ واسترجاع التاريخ الطبي وفق أعلى معايير الخصوصية والأمان.',
    pillar3Title: 'حوكمة وإشراف مهني',
    pillar3Desc: 'تدقيق نظامي لتراخيص الأطباء والمجمعات المعتمدة لضمان تقديم رعاية سريرية بمستوى استثنائي.',
    pillar4Title: 'دعم فني عراقي مباشر',
    pillar4Desc: 'فريق دعم فني متواجد عبر البريد الرسمي وواتساب لخدمة الكوادر الطبية والمراجعين بكل احترافية.',
    networkTitle: 'أركان المنظومة الصحية في M737',
    networkSubtitle: 'صُممت المنصة وفق معايير هندسية تلبي احتياجات الكوادر الطبية العراقية والمرضى بكفاءة عالية',
    securityNoticeTitle: 'حماية البيانات والامتثال الرقمي',
    securityNoticeDesc: 'تلتزم منصة M737 بالمعايير الصارمة لحفظ البيانات الصحية، مع تشفير ثنائي الاتجاه وضوابط وصول دقيقة حسب الأدوار المصرح بها.',

    signInTitle: 'تسجيل الدخول إلى منصة M737',
    signInSubtitle: 'مرحباً بك في مجمع الطب الأول بالعراق — سجّل دخولك للوصول إلى مساحتك المخصصة',
    signUpTitle: 'إنشاء حساب جديد في M737',
    signUpSubtitle: 'انضم إلى شبكة مجمع الطب الأول بالعراق واختر نوع حسابك للبدء',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    fullNameLabel: 'الاسم الكامل الثلاثي',
    fullNamePlaceholder: 'أدخل اسمك كما في الهوية الرسمية',
    selectRoleLabel: 'نوع الحساب في المنصة',
    rolePatient: 'مراجع / مريض',
    roleDoctor: 'طبيب اختصاص / استشاري',
    roleAdmin: 'إدارة المنصة الموحدة',
    rolePatientDesc: 'حجز ومتابعة المواعيد الطبية، عرض التاريخ الطبي والاستشارات',
    roleDoctorDesc: 'إدارة العيادة والمواعيد ومتابعة السجلات السريرية للمرضى',
    roleAdminDesc: 'حوكمة المنظومة، اعتماد التراخيص وإدارة النظام العام',
    authPhaseNotice: 'جاهزية المرحلة الأولى',
    authPhaseNoticeDesc: 'تم إعداد بنية واجهات الدخول والتحقق بصرياً وهندسياً. تفعيل مصادقة Google وقواعد Firestore سيتم في المرحلة التالية (Part 2).',
    termsAgreement: 'بالتسجيل فإنك توافق على شروط استخدام منصة M737 وسياسة الخصوصية الطبية.',

    patientDashboardTitle: 'لوحة تحكم المراجع',
    patientDashboardDesc: 'المساحة الشخصية للمريض لمتابعة المواعيد، الفحوصات الطبية، والتواصل مع الأطباء.',
    doctorDashboardTitle: 'بوابة الطبيب الاستشاري',
    doctorDashboardDesc: 'إدارة جدول المواعيد، سجلات المرضى السريرية، واستشارات العيادة التخصصية.',
    adminDashboardTitle: 'مركز حوكمة المنصة (Super Admin)',
    adminDashboardDesc: 'الإشراف على المنظومة، التحقق من اعتماد الكوادر الطبية، ومراقبة العمليات الرقمية.',
    dashboardPlaceholderBadge: 'مسار محمي — قيد التجهيز للمرحلة 2',
    dashboardPhase2Notice: 'هذه الواجهة تمثل هيكل التوجيه الأولي. سيتم ربط الصلاحيات الحقيقية مع Firebase Auth و Firestore في المرحلة 2.',
    governanceWarning: 'تنبيه أمني: الوصول إلى هذه اللوحة مقيّد بقواعد وصول صارمة (RBAC) ولن يُمنح الوصول إلا للمسؤولين المعتمدين.',

    supportPageTitle: 'مركز الدعم الفني والتواصل',
    supportPageSubtitle: 'فريق الدعم الفني لمنصة M737 على أتم الاستعداد لمساعدتك والرد على كافة استفساراتك',
    directChannelsTitle: 'قنوات التواصل المباشرة المعتمدة',
    faqTitle: 'الأسئلة الشائعة حول المنصة',
    faq1Q: 'كيف يمكنني التواصل مع الدعم الفني إذا واجهت مشكلة في الدخول؟',
    faq1A: 'يمكنك التواصل مباشرة مع فريق الدعم عبر الواتساب على الرقم 07885663748 أو إرسال رسالة إلى البريد الإلكتروني bcgmoc@gmail.com.',
    faq2Q: 'ما هي الخطوات المطلوبة لانضمام طبيب أو عيادة تخصصية إلى M737؟',
    faq2A: 'يتم تقديم طلب الانضمام عبر إنشاء حساب طبيب، ويتم تدقيق شهادة الاختصاص والترخيص المهني قبل التفعيل من قبل إدارة المنصة.',

    privacyTitle: 'سياسة الخصوصية وحماية البيانات الطبية',
    privacyLastUpdated: 'آخر تحديث: تشرين الأول 2026',
    termsTitle: 'شروط وأحكام استخدام منصة M737',
    termsLastUpdated: 'آخر تحديث: تشرين الأول 2026',

    notFoundTitle: 'الصفحة غير موجودة (404)',
    notFoundDesc: 'عذراً، الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله.',
  },
  en: {
    brandName: 'M737',
    brandArabicName: 'مجمع الطب الأول بالعراق',
    brandSubtitle: 'Premier Iraqi Medical Platform',
    brandTagline: 'Unified digital healthcare platform connecting patients, physicians, and specialized clinical centers',

    navHome: 'Home',
    navServices: 'Medical Network',
    navDoctors: 'Doctors Portal',
    navClinics: 'Clinics & Centers',
    navSupport: 'Support Center',
    navSignIn: 'Sign In',
    navSignUp: 'Create Account',
    navDashboard: 'Dashboard',
    navPatientDashboard: 'Patient Dashboard',
    navDoctorDashboard: 'Doctor Dashboard',
    navAdminDashboard: 'Super Admin Portal',
    navPrivacy: 'Privacy Policy',
    navTerms: 'Terms of Use',

    needHelpPrompt: 'Need help? Contact technical support if you face any issue.',
    contactSupport: 'Contact Technical Support',
    emailSupport: 'Support Email',
    whatsappSupport: 'Direct WhatsApp Support',
    whatsappButtonText: 'Chat on WhatsApp',
    supportHours: 'Working Hours',
    supportHoursValue: 'Support is available daily',
    sendSupportEmail: 'Send Support Email',

    languageToggle: 'العربية',
    backToHome: 'Back to Home',
    loading: 'Loading...',
    close: 'Close',
    role: 'Role',
    status: 'Status',
    actions: 'Actions',
    learnMore: 'Learn More',
    getStarted: 'Get Started',
    orContinueWith: 'Or continue with email',
    googleSignIn: 'Sign in with Google',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',

    heroKicker: 'National Medical Platform of Iraq',
    heroTitle: 'M737: Advanced Healthcare Infrastructure for Iraq',
    heroDescription: 'The M737 platform establishes advanced standards for clinical coordination across Iraq, securely connecting patients, physicians, and verified medical centers.',
    heroPrimaryCta: 'Enter Platform',
    heroSecondaryCta: 'Explore Architecture',
    pillar1Title: 'Integrated Clinical Network',
    pillar1Desc: 'Seamless coordination between patients, consulting specialists, and clinics across Iraqi governorates.',
    pillar2Title: 'Unified Health Records',
    pillar2Desc: 'Resilient cloud infrastructure for maintaining patient history with highest privacy and encryption standards.',
    pillar3Title: 'Governance & Auditing',
    pillar3Desc: 'Systematic verification of physician credentials and clinical accreditation for quality healthcare.',
    pillar4Title: 'Dedicated Iraqi Support',
    pillar4Desc: 'Direct assistance via official email and WhatsApp to assist medical personnel and patients.',
    networkTitle: 'Core Pillars of the M737 Ecosystem',
    networkSubtitle: 'Architected to meet the operational demands of Iraqi medical staff and patients with precision',
    securityNoticeTitle: 'Data Protection & Regulatory Compliance',
    securityNoticeDesc: 'M737 strictly safeguards medical records with end-to-end encryption and robust role-based access control.',

    signInTitle: 'Sign in to M737 Platform',
    signInSubtitle: 'Welcome to Iraq Premier Medical Complex — access your secure medical portal',
    signUpTitle: 'Create an Account on M737',
    signUpSubtitle: 'Join the M737 medical network and select your account role to begin',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    fullNameLabel: 'Full Official Name',
    fullNamePlaceholder: 'Enter your name as in official identification',
    selectRoleLabel: 'Account Role in Platform',
    rolePatient: 'Patient / Visitor',
    roleDoctor: 'Specialist Physician',
    roleAdmin: 'Platform Super Admin',
    rolePatientDesc: 'Book appointments, review medical records and telehealth consultations',
    roleDoctorDesc: 'Manage clinic schedules, patient histories, and clinical diagnostics',
    roleAdminDesc: 'Platform governance, credential validation, and system administration',
    authPhaseNotice: 'Phase 1 Architecture Ready',
    authPhaseNoticeDesc: 'Sign-in and sign-up interfaces are fully structured. Live Google Auth and Firestore role bindings will be activated in Phase 2.',
    termsAgreement: 'By registering, you agree to the M737 Terms of Use and Medical Privacy Policy.',

    patientDashboardTitle: 'Patient Portal',
    patientDashboardDesc: 'Personal space to manage appointments, diagnostic reports, and physician communication.',
    doctorDashboardTitle: 'Specialist Physician Hub',
    doctorDashboardDesc: 'Manage schedule availability, patient records, and specialized clinical sessions.',
    adminDashboardTitle: 'Platform Governance (Super Admin)',
    adminDashboardDesc: 'Platform auditing, physician accreditation review, and operational telemetry.',
    dashboardPlaceholderBadge: 'Protected Route — Phase 2 Pending',
    dashboardPhase2Notice: 'This view establishes route structure. Role-based enforcement and live Firestore connection will be integrated in Phase 2.',
    governanceWarning: 'Security Notice: This portal is restricted under strict RBAC rules. Privileged access requires verified administrator credentials.',

    supportPageTitle: 'Technical Support & Help Center',
    supportPageSubtitle: 'The M737 dedicated technical support team is ready to assist you with any inquiries',
    directChannelsTitle: 'Verified Direct Support Channels',
    faqTitle: 'Frequently Asked Questions',
    faq1Q: 'How do I contact technical support if I face sign-in issues?',
    faq1A: 'You can contact the support team directly via WhatsApp at 07885663748 or by emailing bcgmoc@gmail.com.',
    faq2Q: 'What are the requirements for doctors and clinics to join M737?',
    faq2A: 'Doctors can register an account, after which medical credentials and licensing are verified by platform administration before activation.',

    privacyTitle: 'Privacy Policy & Medical Data Protection',
    privacyLastUpdated: 'Last Updated: October 2026',
    termsTitle: 'Terms of Use — M737 Platform',
    termsLastUpdated: 'Last Updated: October 2026',

    notFoundTitle: 'Page Not Found (404)',
    notFoundDesc: 'The link you are trying to reach does not exist or has been moved.',
  },
};
