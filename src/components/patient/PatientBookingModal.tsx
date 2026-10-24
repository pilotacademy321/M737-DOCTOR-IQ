import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  addDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  X,
  CalendarCheck,
  Clock,
  Calendar,
  User,
  Users,
  Phone,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Lock,
  Building,
  MapPin,
  Sparkles,
  Paperclip,
  Printer,
} from 'lucide-react';
import { db, auth } from '../../config/firebase';
import {
  DoctorPublicProfile,
  DoctorScheduleConfig,
  AppointmentRecord,
  MedicalAttachment,
} from '../../types/database';
import {
  DoctorDailyAvailability,
  generateShiftSlots,
  reserveSlotInTransaction,
} from '../../utils/appointmentAvailabilityUtils';
import { UserProfile } from '../../types/auth';
import { useLanguage } from '../../localization/LanguageContext';
import { IRAQI_GOVERNORATES } from '../../config/brand';
import {
  compressImageToDataUrl,
  readFileAsDataUrl,
  isSafeForInlineFirestore,
  MAX_SAFE_FIRESTORE_DATAURL_LENGTH,
} from '../../utils/fileCompression';
import { cleanFirestoreData } from '../../utils/firestoreUtils';
import {
  getIraqToday,
  getIraqTomorrow,
  getIraqDayOfWeek,
  formatIraqDate,
  formatIraqTime,
  isIraqDateInPast,
} from '../../utils/timezoneUtils';
import { PrintableModal } from '../common/PrintableModal';

interface PatientBookingModalProps {
  doctor: DoctorPublicProfile;
  userProfile: UserProfile | null;
  onClose: () => void;
  onBookingSuccess: (bookingRef: string) => void;
}

export const PatientBookingModal: React.FC<PatientBookingModalProps> = ({
  doctor,
  userProfile,
  onClose,
  onBookingSuccess,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Form inputs pre-filled from userProfile
  const [fullName, setFullName] = useState(userProfile?.displayName || '');
  const [primaryPhone, setPrimaryPhone] = useState(userProfile?.phoneNumber || '');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [age, setAge] = useState<string>('30');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [governorate, setGovernorate] = useState(userProfile?.governorate || 'بغداد');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Date and slot selection in Iraq Timezone (Asia/Baghdad)
  const tomorrowStr = getIraqTomorrow();
  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Doctor Schedule state & visual slot map
  const [scheduleConfig, setScheduleConfig] = useState<DoctorScheduleConfig | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [allSlotsWithStatus, setAllSlotsWithStatus] = useState<Array<{
    slot: string;
    status: 'available' | 'pending' | 'confirmed';
  }>>([]);
  const [capacityStats, setCapacityStats] = useState<{
    dailyCap: number;
    confirmedCount: number;
    pendingCount: number;
    remainingAvailable: number;
  }>({ dailyCap: 15, confirmedCount: 0, pendingCount: 0, remainingAvailable: 15 });
  const [isDateValid, setIsDateValid] = useState(true);
  const [dateValidationMsg, setDateValidationMsg] = useState<string | null>(null);

  // Attachment state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFileBase64, setAttachedFileBase64] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Success Confirmation Screen state
  const [confirmedBookingData, setConfirmedBookingData] = useState<{
    bookingRef: string;
    doctorName: string;
    specialty: string;
    clinicName: string;
    date: string;
    timeSlot: string;
    fee: number;
    status: string;
  } | null>(null);
  const [isPrintTicketModalOpen, setIsPrintTicketModalOpen] = useState(false);

  // 1. Load Doctor Schedule
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const schedDoc = await getDoc(doc(db, 'doctor_schedules', doctor.uid));
        if (schedDoc.exists()) {
          setScheduleConfig(schedDoc.data() as DoctorScheduleConfig);
        } else {
          // Default schedule
          setScheduleConfig({
            doctorId: doctor.uid,
            workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
            shiftStartTime: '09:00',
            shiftEndTime: '15:00',
            slotDurationMinutes: 20,
            dailyCapacity: 15,
            blackoutDates: [],
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Error loading schedule:', err);
      }
    };
    loadSchedule();
  }, [doctor.uid]);

  // 2. Real-time availability listener for selected date & schedule
  useEffect(() => {
    if (!selectedDate || !scheduleConfig) return;

    // Prevent booking in past or today in Asia/Baghdad timezone
    const todayIraq = getIraqToday();
    if (selectedDate <= todayIraq || isIraqDateInPast(selectedDate)) {
      setIsDateValid(false);
      setDateValidationMsg(
        isAr
          ? 'لا يمكن حجز موعد بتاريخ سابق أو في نفس اليوم. تبدأ الحجوزات من يوم غد فصاعداً.'
          : 'Bookings must be scheduled at least one day in advance.'
      );
      setAvailableSlots([]);
      setAllSlotsWithStatus([]);
      return;
    }

    // Check blackout dates
    if (scheduleConfig.blackoutDates?.includes(selectedDate)) {
      setIsDateValid(false);
      setDateValidationMsg(isAr ? 'العيادة في عطلة رسمية أو استراحة في هذا التاريخ.' : 'Doctor is on leave this date.');
      setAvailableSlots([]);
      setAllSlotsWithStatus([]);
      return;
    }

    // Check day of week using canonical Iraq timezone
    const dayName = getIraqDayOfWeek(selectedDate);
    if (!scheduleConfig.workingDays?.includes(dayName)) {
      setIsDateValid(false);
      setDateValidationMsg(
        isAr
          ? `يوم (${dayName}) غير مشمول بأيام عمل العيادة. أيام الدوام المتاحة: ${scheduleConfig.workingDays?.join(', ')}`
          : `Doctor does not practice on ${dayName}. Available: ${scheduleConfig.workingDays?.join(', ')}`
      );
      setAvailableSlots([]);
      setAllSlotsWithStatus([]);
      return;
    }

    // Date is working day! Generate candidate time slots
    const startTime = scheduleConfig.shiftStartTime || '09:00';
    const endTime = scheduleConfig.shiftEndTime || '15:00';
    const duration = scheduleConfig.slotDurationMinutes || 20;
    const dailyCap = scheduleConfig.dailyCapacity || 15;
    const candidateSlots = generateShiftSlots(startTime, endTime, duration);

    // Keep cached collections for real-time union of appointments records and availability document
    let latestAppointments: AppointmentRecord[] = [];
    let latestAvailabilityDoc: DoctorDailyAvailability | null = null;

    const recomputeAvailability = () => {
      const confirmedSet = new Set<string>();
      const pendingSet = new Set<string>();

      // 1. Process real appointments from the database
      latestAppointments.forEach((app) => {
        if (app.status === 'confirmed') {
          confirmedSet.add(app.timeSlot);
        } else if (app.status === 'pending') {
          pendingSet.add(app.timeSlot);
        }
        // 'cancelled' or 'rejected' are ignored to free up the slot immediately
      });

      // 2. Also incorporate real-time atomic availability document slots
      if (latestAvailabilityDoc) {
        if (Array.isArray(latestAvailabilityDoc.confirmedSlots)) {
          latestAvailabilityDoc.confirmedSlots.forEach((slot) => {
            const app = latestAppointments.find((a) => a.timeSlot === slot);
            if (!app || (app.status !== 'cancelled' && app.status !== 'rejected')) {
              confirmedSet.add(slot);
            }
          });
        }
        if (Array.isArray(latestAvailabilityDoc.pendingSlots)) {
          latestAvailabilityDoc.pendingSlots.forEach((slot) => {
            const app = latestAppointments.find((a) => a.timeSlot === slot);
            if (!app || (app.status !== 'cancelled' && app.status !== 'rejected')) {
              if (!confirmedSet.has(slot)) {
                pendingSet.add(slot);
              }
            }
          });
        }
      }

      const confirmedCount = confirmedSet.size;
      const pendingCount = pendingSet.size;
      const totalActive = confirmedCount + pendingCount;
      const remainingAvailable = Math.max(0, dailyCap - totalActive);

      setCapacityStats({
        dailyCap,
        confirmedCount,
        pendingCount,
        remainingAvailable,
      });

      // Map each candidate slot to status
      const slotsWithStatus = candidateSlots.map((s) => {
        if (confirmedSet.has(s)) {
          return { slot: s, status: 'confirmed' as const };
        }
        if (pendingSet.has(s)) {
          return { slot: s, status: 'pending' as const };
        }
        return { slot: s, status: 'available' as const };
      });

      setAllSlotsWithStatus(slotsWithStatus);
      const freeSlots = slotsWithStatus.filter((s) => s.status === 'available').map((s) => s.slot);

      if (totalActive >= dailyCap) {
        setIsDateValid(false);
        setDateValidationMsg(
          isAr
            ? 'عذراً، هذا الموعد امتلأ. يرجى اختيار موعد آخر.'
            : 'Daily capacity reached. Please select another date.'
        );
        setAvailableSlots([]);
      } else if (freeSlots.length === 0) {
        setIsDateValid(false);
        setDateValidationMsg(
          isAr
            ? 'عذراً، هذا الموعد امتلأ. يرجى اختيار موعد آخر.'
            : 'All slots booked for this date. Please select another date.'
        );
        setAvailableSlots([]);
      } else {
        setIsDateValid(true);
        setDateValidationMsg(null);
        setAvailableSlots(freeSlots);
        setSelectedSlot((prevSlot) => {
          if (prevSlot && !freeSlots.includes(prevSlot)) {
            setSubmissionError(
              isAr
                ? 'عذراً، هذا الموعد امتلأ. يرجى اختيار موعد آخر.'
                : 'The previously selected slot has just been booked. Please choose another.'
            );
            return freeSlots[0] || '';
          }
          if (!prevSlot && freeSlots.length > 0) {
            return freeSlots[0];
          }
          return prevSlot;
        });
      }
    };

    // Subscriptions:
    // A. Real-time listener on appointments collection
    const appQuery = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctor.uid),
      where('date', '==', selectedDate)
    );
    const unsubAppointments = onSnapshot(
      appQuery,
      (snap) => {
        const apps: AppointmentRecord[] = [];
        snap.forEach((d) => {
          apps.push({ id: d.id, ...d.data() } as AppointmentRecord);
        });
        latestAppointments = apps;
        recomputeAvailability();
      },
      (err) => {
        console.warn('Real-time appointment query notice:', err);
      }
    );

    // B. Real-time listener on doctor daily availability document
    const availDocRef = doc(db, 'doctor_schedules', doctor.uid, 'availability', selectedDate);
    const unsubAvailability = onSnapshot(
      availDocRef,
      (snap) => {
        if (snap.exists()) {
          latestAvailabilityDoc = snap.data() as DoctorDailyAvailability;
        } else {
          latestAvailabilityDoc = null;
        }
        recomputeAvailability();
      },
      (err) => {
        console.warn('Real-time availability doc notice:', err);
      }
    );

    return () => {
      unsubAppointments();
      unsubAvailability();
    };
  }, [selectedDate, scheduleConfig, doctor.uid, isAr]);

  // Handle file attachment with auto-compression for images and safe metadata handling
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setAttachedFile(null);
      setAttachedFileBase64(null);
      return;
    }

    const file = e.target.files[0];
    // Validate size < 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(isAr ? 'حجم الملف يجب ألا يتجاوز 10 ميغابايت.' : 'File size must be under 10MB.');
      return;
    }

    // Validate type (PDF or Image)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError(isAr ? 'الأنواع المسموحة هي: PDF أو صور (JPG, PNG, WEBP).' : 'Allowed types: PDF or images.');
      return;
    }

    setAttachedFile(file);

    try {
      if (file.type.startsWith('image/')) {
        // Automatically compress image client-side to ensure it is well below 1MB
        const compressedBase64 = await compressImageToDataUrl(file);
        setAttachedFileBase64(compressedBase64);
      } else if (isSafeForInlineFirestore(file)) {
        // For small PDF documents under 320KB
        const base64 = await readFileAsDataUrl(file);
        setAttachedFileBase64(base64);
      } else {
        // Larger PDFs will be saved with full metadata in database, while hardcopy is presented in clinic
        setAttachedFileBase64(null);
      }
    } catch (readErr) {
      console.warn('Error reading or compressing file:', readErr);
      setUploadError(isAr ? 'تعذر معالجة الملف المرفق. يرجى تجربة ملف آخر.' : 'Error processing file attachment.');
    }
  };

  // Submit Booking Form with atomic transaction concurrency control & click protection
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    // Prevent duplicate submissions and rapid double clicks
    if (isSubmittingRef.current || isSubmitting) return;

    if (!fullName.trim()) {
      setSubmissionError(isAr ? 'يرجى إدخال اسم المراجع الثلاثي.' : 'Full name is required.');
      return;
    }

    if (!primaryPhone.trim() || !/^07\d{8,9}$/.test(primaryPhone.replace(/\s+/g, ''))) {
      setSubmissionError(
        isAr
          ? 'يرجى إدخال رقم هاتف عراقي صالح يبدأ بـ 07 (مثال: 07885663748).'
          : 'Valid Iraqi phone number starting with 07 is required.'
      );
      return;
    }

    if (!selectedSlot || !isDateValid) {
      setSubmissionError(
        isAr ? 'عذراً، هذا الموعد امتلأ. يرجى اختيار موعد آخر.' : 'Please select an available slot.'
      );
      return;
    }

    if (!privacyAgreed) {
      setSubmissionError(isAr ? 'يرجى الموافقة على إقرار سرية السجلات والبيانات.' : 'Please acknowledge privacy terms.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // Generate Unique Booking Reference
      const bookingRef = `M737-BK-${Math.floor(100000 + Math.random() * 900000)}`;
      const patientUid = auth.currentUser?.uid || userProfile?.uid;
      if (!patientUid) {
        setSubmissionError(
          isAr
            ? 'جلسة تسجيل الدخول غير صالحة. يرجى تسجيل الدخول بحساب مراجع لإتمام الحجز.'
            : 'Authentication required. Please sign in as a patient to complete booking.'
        );
        return;
      }

      // 1. Optional Attachment metadata upload (Strictly limited to prevent exceeding 1MB doc size)
      let attachmentId: string | undefined = undefined;
      if (attachedFile) {
        let safeFileData: string | undefined = undefined;
        let attachmentNote = isAr ? 'مرفق مع طلب الحجز الأولي' : 'Initial booking attachment';

        if (attachedFileBase64 && attachedFileBase64.length <= MAX_SAFE_FIRESTORE_DATAURL_LENGTH) {
          safeFileData = attachedFileBase64;
        } else {
          attachmentNote = isAr
            ? `مستند مرفق (${attachedFile.name} - ${(attachedFile.size / (1024 * 1024)).toFixed(1)} ميغابايت) - يرجى جلب النسخة الورقية للمعاينة`
            : `Attached file (${attachedFile.name}) - hardcopy for in-clinic review`;
        }

        const rawAttPayload: Record<string, any> = {
          patientId: patientUid,
          doctorId: doctor.uid,
          bookingReference: bookingRef,
          fileName: attachedFile.name,
          fileType: attachedFile.type,
          fileSize: attachedFile.size,
          storagePath: `patient_attachments/${patientUid}_${Date.now()}_${attachedFile.name.replace(/\s+/g, '_')}`,
          fileData: safeFileData,
          uploadedAt: new Date().toISOString(),
          notes: attachmentNote,
        };
        const attPayload = cleanFirestoreData(rawAttPayload);

        try {
          const attDocRef = await addDoc(collection(db, 'medical_attachments'), attPayload);
          attachmentId = attDocRef.id;
        } catch (attErr) {
          console.warn('Could not store full attachment, falling back to metadata record:', attErr);
          try {
            const { fileData: _unused, ...metadataOnly } = rawAttPayload;
            const fallbackPayload = cleanFirestoreData(metadataOnly);
            const attDocRef = await addDoc(collection(db, 'medical_attachments'), fallbackPayload);
            attachmentId = attDocRef.id;
          } catch (metaErr) {
            console.warn('Attachment metadata skipped, proceeding with booking transaction:', metaErr);
          }
        }
      }

      // 2. Perform Atomic Booking Reservation via Firestore Transaction
      // Enforces strict concurrency control: if two patients attempt to book the last available
      // place or same slot simultaneously, only the allowed capacity succeeds.
      const appDocRef = doc(db, 'appointments', bookingRef);

      await runTransaction(db, async (transaction) => {
        // Read Doctor's active profile from DB to revalidate fee and active status
        const doctorDoc = await transaction.get(doc(db, 'users', doctor.uid));
        if (!doctorDoc.exists()) {
          throw new Error(isAr ? 'الطبيب غير موجود في النظام.' : 'Doctor record not found.');
        }

        const doctorDbData = doctorDoc.data();
        if (doctorDbData.approvalStatus !== 'active' || doctorDbData.role !== 'doctor') {
          throw new Error(
            isAr
              ? 'الطبيب غير مفعل لاستقبال الحجوزات في الوقت الحالي.'
              : 'Doctor is not currently active for bookings.'
          );
        }

        // Authoritative consultation fee from Doctor's profile document
        const authoritativeFee = doctorDbData.consultationFee || doctor.consultationFee || 25000;

        // Revalidate Capacity
        const schedDoc = await transaction.get(doc(db, 'doctor_schedules', doctor.uid));
        const maxCapacity = schedDoc.exists() ? schedDoc.data().dailyCapacity || 15 : 15;

        // Atomic check & reserve inside availability tracking document
        await reserveSlotInTransaction(
          transaction,
          doctor.uid,
          selectedDate,
          selectedSlot,
          maxCapacity
        );

        // Create the appointment record (strictly sanitized to prevent undefined field values)
        const appointmentData: Record<string, any> = {
          id: bookingRef,
          patientId: patientUid,
          patientName: fullName.trim(),
          patientPhone: primaryPhone.trim(),
          patientGender: gender,
          patientGovernorate: governorate,
          doctorId: doctor.uid,
          doctorName: doctor.displayName || '',
          specialty: doctor.specialization || '',
          clinicName: doctor.clinicName || '',
          clinicGovernorate: doctor.governorate || '',
          consultationFee: authoritativeFee,
          date: selectedDate,
          timeSlot: selectedSlot,
          status: 'pending', // Initial status is pending doctor confirmation
          attachmentIds: attachmentId ? [attachmentId] : [],
          createdAt: new Date().toISOString(),
        };

        if (secondaryPhone.trim()) {
          appointmentData.secondaryPhone = secondaryPhone.trim();
        }

        if (age && !isNaN(parseInt(age, 10))) {
          appointmentData.patientAge = parseInt(age, 10);
        }

        if (doctor.phoneNumber) {
          appointmentData.clinicPhone = doctor.phoneNumber;
        }

        if (reasonForVisit.trim()) {
          appointmentData.notes = reasonForVisit.trim();
          appointmentData.reasonForVisit = reasonForVisit.trim();
        }

        const cleanPayload = cleanFirestoreData(appointmentData);
        transaction.set(appDocRef, cleanPayload);
      });

      // 3. Create Doctor Clinical Notification
      try {
        await addDoc(collection(db, 'notifications'), cleanFirestoreData({
          userId: doctor.uid,
          titleAr: 'طلب حجز موعد جديد',
          titleEn: 'New Appointment Booking Request',
          messageAr: `المراجع [${fullName}] طلب حجز موعد ليوم ${selectedDate} في تمام ${selectedSlot}.`,
          messageEn: `Patient [${fullName}] requested a booking on ${selectedDate} at ${selectedSlot}.`,
          type: 'new_booking',
          read: false,
          relatedId: bookingRef,
          createdAt: new Date().toISOString(),
        }));
      } catch (notifErr) {
        console.warn('Doctor notification note:', notifErr);
      }

      // 4. Create Patient Notification
      try {
        await addDoc(collection(db, 'notifications'), cleanFirestoreData({
          userId: patientUid,
          titleAr: 'تم إرسال طلب الحجز بنجاح',
          titleEn: 'Booking Request Submitted',
          messageAr: `تم إرسال طلب حجزك لدى د. ${doctor.displayName} برمز [${bookingRef}]. وهو بانتظار تأكيد الطبيب.`,
          messageEn: `Your booking request [${bookingRef}] with Dr. ${doctor.displayName} is submitted and pending confirmation.`,
          type: 'new_booking',
          read: false,
          relatedId: bookingRef,
          createdAt: new Date().toISOString(),
        }));
      } catch (notifErr) {
        console.warn('Patient notification note:', notifErr);
      }

      // Display Confirmation Screen
      setConfirmedBookingData({
        bookingRef,
        doctorName: doctor.displayName,
        specialty: doctor.specialization,
        clinicName: doctor.clinicName,
        date: selectedDate,
        timeSlot: selectedSlot,
        fee: doctor.consultationFee,
        status: 'pending',
      });

      onBookingSuccess(bookingRef);
    } catch (err: unknown) {
      console.error('Error submitting booking:', err);
      const e = err as Error;
      const msg = e.message || '';
      if (
        msg.includes('امتلأ') ||
        msg.includes('محجوز') ||
        msg.includes('سعة') ||
        msg.includes('capacity') ||
        msg.includes('already')
      ) {
        setSubmissionError('عذراً، هذا الموعد امتلأ. يرجى اختيار موعد آخر.');
      } else {
        setSubmissionError(
          e.message || (isAr ? 'عذراً، هذا الموعد امتلأ. يرجى اختيار موعد آخر.' : 'Failed to submit booking.')
        );
      }
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* SUCCESS CONFIRMATION SCREEN */}
        {confirmedBookingData ? (
          <div className="p-6 sm:p-8 text-center space-y-6 printable-document">
            {/* Top Toolbar for print */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
              <span className="text-xs font-bold text-slate-700">
                {isAr ? 'تأكيد الحجز وتذكرة المراجعة' : 'Booking Confirmation Slip'}
              </span>
              <button
                onClick={() => setIsPrintTicketModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة تذكرة الحجز الرسمية' : 'Print Official Ticket'}</span>
              </button>
            </div>

            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm no-print">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            {/* Official Header for Print */}
            <div className="text-start pb-4 border-b-2 border-slate-900 space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isAr ? 'جمهورية العراق - المنظومة الطبية M737' : 'Republic of Iraq - M737 Health Platform'}
                  </h3>
                  <p className="text-[11px] text-amber-800 font-bold">
                    {isAr ? 'تذكرة حجز موعد عيادة استشارية رسمية' : 'Official Clinic Appointment Voucher'}
                  </p>
                </div>
                <div className="text-end">
                  <span className="text-[10px] font-mono font-bold text-slate-600 block">
                    REF: {confirmedBookingData.bookingRef}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {formatIraqDate(confirmedBookingData.date, isAr)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 no-print">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
                {isAr ? 'الحالة: قيد المراجعة بانتظار تأكيد الطبيب' : 'Status: Pending Doctor Confirmation'}
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {isAr ? 'تم إرسال طلب الحجز بنجاح' : 'Appointment Request Submitted'}
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {isAr
                  ? `تم استلام طلب حجزك وتثبيته في النظام. سيقوم فريق العيادة بتدقيق الموعد وتأكيده لك.`
                  : `Your booking reference has been securely registered in the clinic system.`}
              </p>
            </div>

            {/* Confirmation Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-start space-y-3 text-xs avoid-break">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'كود الحجز المرجعي:' : 'Booking Ref:'}</span>
                <span className="font-mono font-black text-sm text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {confirmedBookingData.bookingRef}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'اسم المراجع الثلاثي' : 'Patient Name'}</span>
                  <strong className="text-slate-900 block text-xs">{fullName}</strong>
                  <span className="text-[11px] text-slate-500 font-mono">{primaryPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الطبيب والعيادة' : 'Physician & Clinic'}</span>
                  <strong className="text-slate-900 block text-xs">{confirmedBookingData.doctorName}</strong>
                  <span className="text-[11px] text-slate-500">{confirmedBookingData.specialty} · {confirmedBookingData.clinicName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'التاريخ والفترة (توقيت العراق)' : 'Date & Slot (Iraq Time)'}</span>
                  <strong className="text-slate-900 block text-xs">{formatIraqDate(confirmedBookingData.date, isAr)}</strong>
                  <span className="text-[11px] text-sky-700 font-bold block">{formatIraqTime(confirmedBookingData.timeSlot, isAr)}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Asia/Baghdad (UTC+3)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'أجور الكشفية الرسمية:' : 'Consultation Fee:'}</span>
                  <strong className="text-amber-800 text-sm font-black">
                    {confirmedBookingData.fee.toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    {isAr ? 'تدفع في قسم الاستقبال بالعيادة' : 'Payable at clinic reception'}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps Prompt */}
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-start text-xs text-sky-950 space-y-1 avoid-break">
              <h4 className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600 no-print" />
                <span>{isAr ? 'تعليمات وإرشادات الحضور للعيادة:' : 'Clinic Attendance Instructions:'}</span>
              </h4>
              <p className="text-[11px] text-sky-900 leading-relaxed">
                {isAr
                  ? 'يرجى الحضور قبل الموعد بـ 15 دقيقة مع إبراز هذه التذكرة أو رقم الحجز لموظف الاستقبال بالعيادة، وجلب الفحوصات والتقارير الطبية السابقة إن وجدت.'
                  : 'Please arrive 15 minutes prior to your slot and present this voucher or booking code to reception.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 no-print">
              <button
                onClick={() => setIsPrintTicketModalOpen(true)}
                className="w-full sm:w-1/2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة وصل الحجز' : 'Print Booking Ticket'}</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-1/2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'العودة إلى لوحة المراجع' : 'Return to Dashboard'}
              </button>
            </div>
          </div>
        ) : (
          /* BOOKING SUBMISSION FORM */
          <form onSubmit={handleSubmitBooking} className="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {isAr ? 'طلب حجز موعد استشارة سريرية' : 'Request Clinic Appointment'}
                </h3>
              </div>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor Info Banner */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-base flex items-center justify-center shrink-0">
                  {doctor.displayName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">{doctor.displayName}</h4>
                  <p className="text-[11px] text-amber-300 font-semibold">{doctor.specialization}</p>
                  <p className="text-[10px] text-slate-300">{doctor.clinicName} · {doctor.governorate}</p>
                </div>
              </div>

              <div className="text-start sm:text-end bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
                <span className="text-[10px] text-slate-300 block">{isAr ? 'أجور الكشفية' : 'Fee'}</span>
                <span className="text-xs font-black text-amber-300">
                  {doctor.consultationFee.toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
                </span>
              </div>
            </div>

            {/* Submission Error Alert */}
            {submissionError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            {/* Date and Time Slot Picker with Visual Seat Capacity Display */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>{isAr ? 'اختيار تاريخ الموعد وسعة المقاعد *' : 'Select Date & Seat Availability *'}</span>
                </h4>
                <span className="text-[11px] font-mono font-bold text-sky-900 bg-sky-100/70 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                  توقيت العراق (Asia/Baghdad)
                </span>
              </div>

              {/* Date Input with Iraq Local Date Preview */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  {isAr ? 'تاريخ الموعد السريري' : 'Appointment Date'}
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="date"
                    required
                    min={tomorrowStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono focus:border-sky-500 shadow-2xs"
                  />
                  {selectedDate && (
                    <span className="text-xs font-bold text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                      {formatIraqDate(selectedDate, isAr)}
                    </span>
                  )}
                </div>
              </div>

              {/* Real-time Seat Capacity Status Banner */}
              {isDateValid && (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      <span>{isAr ? 'حالة السعة الاستيعابية لليوم:' : 'Daily Seat Capacity:'}</span>
                    </span>
                    <span className="font-mono text-slate-600 text-[11px]">
                      {capacityStats.confirmedCount + capacityStats.pendingCount} / {capacityStats.dailyCap} {isAr ? 'مقعد' : 'seats'}
                    </span>
                  </div>

                  {/* Visual Status Pills */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="block text-emerald-900 font-black text-sm">{capacityStats.remainingAvailable}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">{isAr ? 'مقاعد شاغرة (متاح)' : 'Available'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="block text-amber-900 font-black text-sm">{capacityStats.pendingCount}</span>
                      <span className="text-[10px] text-amber-700 font-semibold">{isAr ? 'قيد التأكيد (معلق)' : 'Pending'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                      <span className="block text-rose-900 font-black text-sm">{capacityStats.confirmedCount}</span>
                      <span className="text-[10px] text-rose-700 font-semibold">{isAr ? 'محجوز بالكامل' : 'Confirmed'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Date validation warning */}
              {!isDateValid && dateValidationMsg && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{dateValidationMsg}</span>
                </div>
              )}

              {/* Visual Seat / Slot Grid */}
              {isDateValid && allSlotsWithStatus.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800 block">
                      {isAr ? 'اختر الفترة الزمنية المناسبة لك من المقاعد المتاحة:' : 'Select Available Time Slot:'}
                    </label>
                    {selectedSlot && (
                      <span className="text-sky-800 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                        {isAr ? 'المحدد: ' : 'Selected: '}
                        {formatIraqTime(selectedSlot, isAr)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {allSlotsWithStatus.map((s) => {
                      const isAvailable = s.status === 'available';
                      const isPending = s.status === 'pending';
                      const isConfirmed = s.status === 'confirmed';
                      const isSelected = selectedSlot === s.slot;

                      return (
                        <button
                          key={s.slot}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            if (isAvailable) setSelectedSlot(s.slot);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                              : isAvailable
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer shadow-2xs'
                              : isPending
                              ? 'bg-amber-100 text-amber-950 border-amber-300 opacity-80 cursor-not-allowed'
                              : 'bg-rose-100 text-rose-950 border-rose-300 opacity-80 cursor-not-allowed'
                          }`}
                        >
                          <span className="font-mono text-xs">{s.slot}</span>
                          <span className="text-[10px] font-semibold">
                            {isSelected && (
                              <span className="flex items-center gap-1 text-white">
                                <CheckCircle2 className="w-3 h-3" />
                                {isAr ? 'تم الاختيار' : 'Selected'}
                              </span>
                            )}
                            {!isSelected && isAvailable && (
                              <span className="text-emerald-700 font-bold">{isAr ? 'متاح' : 'Available'}</span>
                            )}
                            {isPending && (
                              <span className="text-amber-800 font-bold">{isAr ? 'قيد التأكيد' : 'Pending'}</span>
                            )}
                            {isConfirmed && (
                              <span className="text-rose-800 font-bold">{isAr ? 'محجوز' : 'Booked'}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Visual Convention Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] pt-2 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>{isAr ? 'أخضر: متاح للحجز' : 'Green: Available'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span>{isAr ? 'كهرماني: بانتظار التأكيد' : 'Amber: Pending Confirmation'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <span>{isAr ? 'أحمر: محجوز' : 'Red: Booked'}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Patient Details Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'بيانات المراجع للحجز' : 'Patient Booking Details'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAr ? 'الاسم الثلاثي للمراجع *' : 'Full Patient Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isAr ? 'الاسم الثلاثي' : 'Full name'}
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
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    placeholder="07XXXXXXXXX"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAr ? 'رقم هاتف إضافي (اختياري)' : 'Secondary Phone (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    placeholder="07XXXXXXXXX"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAr ? 'المحافظة' : 'Governorate'}
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
                    {isAr ? 'العمر' : 'Age'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAr ? 'الجنس' : 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
                  >
                    <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                    <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'سبب الزيارة أو الشكوى الطبية (اختياري)' : 'Reason for Visit / Symptoms (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder={isAr ? 'مراجعة دورية، فحص عام، آلام صدرية...' : 'Symptoms, checkup...'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500"
                />
              </div>
            </div>

            {/* Medical Attachment Upload */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span>{isAr ? 'إرفاق تقارير مخبرية أو فحوصات سابقة (اختياري)' : 'Attach Lab Reports or Medical Tests (Optional)'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {isAr ? 'PDF, JPG, PNG (ضغط وتأمين تلقائي)' : 'PDF, JPG, PNG (Auto-compressed)'}
                </span>
              </label>

              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:me-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
              />

              {uploadError && (
                <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
              )}

              {attachedFile && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedFile(null);
                        setAttachedFileBase64(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {!attachedFileBase64 && (
                    <p className="text-[11px] text-amber-800 bg-amber-50/80 p-1.5 rounded border border-amber-200">
                      {isAr
                        ? 'ملاحظة: تم تسجيل بيانات التقرير الطبي ورمز الحجز للمعاينة السريرية. يرجى إحضار النسخة الورقية عند مراجعة العيادة.'
                        : 'Notice: Document registered for your clinic appointment. Please present hardcopy during consultation.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Privacy Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="booking-privacy-check"
                type="checkbox"
                required
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="booking-privacy-check" className="text-xs text-slate-600 cursor-pointer">
                {isAr
                  ? 'أوافق على سياسة الخصوصية وأقر بأن البيانات المدخلة صحيحة لغرض التنسيق الطبي مع العيادة.'
                  : 'I acknowledge the privacy terms and certify the entered information is accurate.'}
              </label>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !isDateValid || !selectedSlot}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isAr ? 'جاري تثبيت الحجز...' : 'Securing booking...'}</span>
                  </>
                ) : (
                  <span>{isAr ? 'تأكيد وإرسال طلب الحجز' : 'Submit Booking Request'}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* PRINTABLE BOOKING TICKET MODAL */}
      {isPrintTicketModalOpen && confirmedBookingData && (
        <PrintableModal
          isOpen={isPrintTicketModalOpen}
          onClose={() => setIsPrintTicketModalOpen(false)}
          title={isAr ? 'تذكرة حجز موعد عيادة استشارية' : 'Clinic Appointment Voucher'}
          subtitle={`${confirmedBookingData.doctorName} · ${confirmedBookingData.specialty} (${confirmedBookingData.clinicName})`}
          docNumber={confirmedBookingData.bookingRef}
          badgeText={confirmedBookingData.status.toUpperCase()}
          officialStampTitle={isAr ? 'ختم إدارة العيادة والاستقبال' : 'Clinic Reception & Administration Seal'}
          headerDetails={[
            {
              label: isAr ? 'المراجع:' : 'Patient Name:',
              value: fullName,
            },
            {
              label: isAr ? 'رقم الهاتف:' : 'Phone:',
              value: primaryPhone,
            },
            {
              label: isAr ? 'تاريخ الموعد:' : 'Appointment Date:',
              value: formatIraqDate(confirmedBookingData.date, isAr),
            },
            {
              label: isAr ? 'الفترة الزمنية:' : 'Time Slot:',
              value: `${formatIraqTime(confirmedBookingData.timeSlot, isAr)} (Asia/Baghdad)`,
            },
          ]}
        >
          {/* Booking Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 avoid-break">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-bold">{isAr ? 'كود الحجز الرقمي المعتمد:' : 'Booking Reference Code:'}</span>
              <strong className="font-mono text-base text-amber-800 bg-white px-3 py-1 rounded-lg border border-slate-300">
                {confirmedBookingData.bookingRef}
              </strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">{isAr ? 'الطبيب المعالج:' : 'Doctor:'}</span>
                <strong className="text-slate-900 block">{confirmedBookingData.doctorName}</strong>
                <span className="text-[11px] text-slate-600">{confirmedBookingData.specialty}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">{isAr ? 'مقر العيادة:' : 'Clinic:'}</span>
                <strong className="text-slate-900 block">{confirmedBookingData.clinicName}</strong>
                <span className="text-[11px] text-slate-600">{doctor.governorate || (isAr ? 'العراق' : 'Iraq')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-500">{isAr ? 'أجور الاستشارة الطبية:' : 'Consultation Fee:'}</span>
              <strong className="text-slate-900 font-mono font-bold text-sm">
                {confirmedBookingData.fee.toLocaleString()} {isAr ? 'د.ع' : 'IQD'}
              </strong>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-1 avoid-break">
            <h4 className="font-bold">{isAr ? 'توجيهات الحضور والمراجعة:' : 'Important Clinic Visit Notes:'}</h4>
            <p className="text-[11px] text-sky-900 leading-relaxed">
              {isAr
                ? 'يرجى التواجد في العيادة قبل الموعد بـ 15 دقيقة مع إبراز هذه التذكرة أو رقم الحجز المرجعي عند مكتب الاستقبال.'
                : 'Please arrive 15 minutes prior to your designated slot with this voucher.'}
            </p>
          </div>
        </PrintableModal>
      )}
    </div>
  );
};
