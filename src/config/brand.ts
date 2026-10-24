/**
 * Brand Identity & Contact Configuration for M737
 * مجمع الطب الأول بالعراق
 */

export const BRAND_CONFIG = {
  name: 'M737',
  arabicName: 'مجمع الطب الأول بالعراق',
  englishSubtitle: 'Premier Medical Healthcare Platform of Iraq',
  taglineAr: 'المنصة الوطنية لربط المرضى والأطباء والمجمعات التخصصية بأعلى معايير الرعاية',
  taglineEn: 'The national platform uniting patients, doctors, and specialized clinics with elite care standards',
  
  support: {
    email: 'bcgmoc@gmail.com',
    whatsappNumber: '07885663748',
    whatsappInternational: '+9647885663748',
    whatsappRawDigits: '9647885663748',
    defaultMessageAr: 'السلام عليكم، أحتاج مساعدة بخصوص منصة M737.',
    defaultMessageEn: 'Hello, I need assistance regarding the M737 platform.',
    helpPromptAr: 'تحتاج مساعدة؟ راسل الدعم الفني إذا واجهت أي مشكلة.',
    helpPromptEn: 'Need help? Contact technical support if you face any issue.',
  },

  colors: {
    navyDark: '#061120',
    navyDeep: '#0A192F',
    navyLight: '#142E54',
    gold: '#D4AF37',
    goldLight: '#F3E5AB',
    goldMuted: '#C5A059',
    emerald: '#0F766E',
    ivory: '#FAF9F6',
  },

  roles: {
    patient: {
      id: 'patient',
      nameAr: 'مريض / مراجع',
      nameEn: 'Patient',
      descriptionAr: 'حجز المواعيد، متابعة السجلات الطبية والاستشارات',
      descriptionEn: 'Book appointments, track medical records and consultations',
    },
    doctor: {
      id: 'doctor',
      nameAr: 'طبيب استشاري / أخصائي',
      nameEn: 'Specialist Doctor',
      descriptionAr: 'إدارة العيادة والمواعيد والتشخيص الرقمي الآمن',
      descriptionEn: 'Manage clinic schedules, appointments, and secure digital diagnostics',
    },
    super_admin: {
      id: 'super_admin',
      nameAr: 'إدارة المنصة الموحدة',
      nameEn: 'Platform Super Admin',
      descriptionAr: 'حوكمة المنصة، تدقيق التراخيص والرقابة الإدارية',
      descriptionEn: 'Platform governance, credential auditing, and system operations',
    },
  },
} as const;

/**
 * Returns formatted WhatsApp direct link with URL-encoded greeting message.
 */
export function getWhatsAppSupportUrl(message?: string): string {
  const text = message || BRAND_CONFIG.support.defaultMessageAr;
  return `https://wa.me/${BRAND_CONFIG.support.whatsappRawDigits}?text=${encodeURIComponent(text)}`;
}

/**
 * Returns formatted mailto link.
 */
export function getEmailSupportUrl(subject?: string): string {
  const sub = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${BRAND_CONFIG.support.email}${sub}`;
}

export const IRAQI_GOVERNORATES = [
  'بغداد',
  'البصرة',
  'أربيل',
  'النجف الأشرف',
  'كربلاء المقدسة',
  'نينوى (الموصل)',
  'كركوك',
  'السليمانية',
  'دهوك',
  'بابل (الحلة)',
  'الأنبار',
  'ذي قار (الناصرية)',
  'ميسان (العمارة)',
  'ديالى',
  'واسط (الكوت)',
  'صلاح الدين',
  'القادسية (الديوانية)',
  'المثنى (السماوة)',
] as const;
