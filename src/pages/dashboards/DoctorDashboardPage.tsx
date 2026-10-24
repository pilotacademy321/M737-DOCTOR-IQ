import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { Menu, LogOut, RefreshCw, Stethoscope, AlertTriangle } from 'lucide-react';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../localization/LanguageContext';
import { PageContainer } from '../../components/common/PageContainer';
import { SuccessNotification } from '../../components/common/SuccessNotification';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import {
  AppointmentRecord,
  DoctorScheduleConfig,
  PrescriptionRecord,
  LabReportRecord,
  ClinicalMessage,
  DoctorNotification,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { cleanFirestoreData } from '../../utils/firestoreUtils';
import { updateSlotOnAppointmentStatusChange } from '../../utils/appointmentAvailabilityUtils';

import { DoctorSidebar, DoctorTab } from '../../components/doctor/DoctorSidebar';
import { DoctorOverviewTab } from '../../components/doctor/DoctorOverviewTab';
import { DoctorAppointmentsTab } from '../../components/doctor/DoctorAppointmentsTab';
import { DoctorScheduleTab } from '../../components/doctor/DoctorScheduleTab';
import { DoctorPatientsTab } from '../../components/doctor/DoctorPatientsTab';
import { DoctorPrescriptionsTab } from '../../components/doctor/DoctorPrescriptionsTab';
import { DoctorLabReportsTab } from '../../components/doctor/DoctorLabReportsTab';
import { DoctorMessagesTab } from '../../components/doctor/DoctorMessagesTab';
import { DoctorSettingsTab } from '../../components/doctor/DoctorSettingsTab';

export const DoctorDashboardPage: React.FC = () => {
  const { userProfile, currentUser, signOut, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [currentTab, setCurrentTab] = useState<DoctorTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Live Clinical Data States
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [schedule, setSchedule] = useState<DoctorScheduleConfig | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [labReports, setLabReports] = useState<LabReportRecord[]>([]);
  const [messages, setMessages] = useState<ClinicalMessage[]>([]);
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);

  // Cross-tab interaction state: e.g. opening prescription from appointment/patient
  const [prefilledPatientForRx, setPrefilledPatientForRx] = useState<{
    id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    appointmentId?: string;
  } | null>(null);

  // Preselected patient for messages tab
  const [preselectedMessagePatientId, setPreselectedMessagePatientId] = useState<string | null>(null);

  const fetchDoctorData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorNotice(null);

    try {
      const uid = currentUser.uid;

      // 1. Fetch Appointments
      try {
        const appQuery = query(collection(db, 'appointments'), where('doctorId', '==', uid));
        const appSnap = await getDocs(appQuery);
        const appList: AppointmentRecord[] = [];
        appSnap.forEach((d) => {
          appList.push({ id: d.id, ...d.data() } as AppointmentRecord);
        });
        appList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setAppointments(appList);
      } catch (err) {
        console.warn('Could not query appointments by doctorId, checking default collection', err);
      }

      // 2. Fetch Doctor Schedule
      try {
        const schedDoc = await getDoc(doc(db, 'doctor_schedules', uid));
        if (schedDoc.exists()) {
          setSchedule(schedDoc.data() as DoctorScheduleConfig);
        } else {
          // Initialize fallback schedule if not yet set
          const defaultSched: DoctorScheduleConfig = {
            doctorId: uid,
            workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
            shiftStartTime: userProfile?.workingHours ? userProfile.workingHours.split('-')[0].trim() : '09:00',
            shiftEndTime: userProfile?.workingHours ? userProfile.workingHours.split('-')[1]?.trim() || '15:00' : '15:00',
            slotDurationMinutes: 20,
            dailyCapacity: 15,
            blackoutDates: [],
            updatedAt: new Date().toISOString(),
          };
          setSchedule(defaultSched);
        }
      } catch (err) {
        console.warn('Schedule fetch note:', err);
      }

      // 3. Fetch Prescriptions
      try {
        const rxQuery = query(collection(db, 'prescriptions'), where('doctorId', '==', uid));
        const rxSnap = await getDocs(rxQuery);
        const rxList: PrescriptionRecord[] = [];
        rxSnap.forEach((d) => {
          rxList.push({ id: d.id, ...d.data() } as PrescriptionRecord);
        });
        rxList.sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''));
        setPrescriptions(rxList);
      } catch (err) {
        console.warn('Prescriptions fetch note:', err);
      }

      // 4. Fetch Lab Reports
      try {
        const labQuery = query(collection(db, 'lab_reports'), where('doctorId', '==', uid));
        const labSnap = await getDocs(labQuery);
        const labList: LabReportRecord[] = [];
        labSnap.forEach((d) => {
          labList.push({ id: d.id, ...d.data() } as LabReportRecord);
        });
        labList.sort((a, b) => (b.testDate || '').localeCompare(a.testDate || ''));
        setLabReports(labList);
      } catch (err) {
        console.warn('Lab reports fetch note:', err);
      }

      // 5. Fetch Messages
      try {
        const msgQuery = query(collection(db, 'messages'), where('doctorId', '==', uid));
        const msgSnap = await getDocs(msgQuery);
        const msgList: ClinicalMessage[] = [];
        msgSnap.forEach((d) => {
          msgList.push({ id: d.id, ...d.data() } as ClinicalMessage);
        });
        msgList.sort((a, b) => (a.sentAt || '').localeCompare(b.sentAt || ''));
        setMessages(msgList);
      } catch (err) {
        console.warn('Messages fetch note:', err);
      }

      // 6. Fetch Notifications
      try {
        const notifQuery = query(collection(db, 'notifications'), where('userId', '==', uid));
        const notifSnap = await getDocs(notifQuery);
        const notifList: DoctorNotification[] = [];
        notifSnap.forEach((d) => {
          notifList.push({ id: d.id, ...d.data() } as DoctorNotification);
        });
        notifList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setNotifications(notifList);
      } catch (err) {
        console.warn('Notifications fetch note:', err);
      }
    } catch (err) {
      console.error('Error fetching clinical workspace data:', err);
      setErrorNotice(isAr ? 'حدث خطأ أثناء تحميل بيانات العيادة من Firestore.' : 'Error loading clinical data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
    if (!currentUser) return;

    // Real-time listener for doctor's appointments
    const q = query(collection(db, 'appointments'), where('doctorId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const appList: AppointmentRecord[] = [];
        snap.forEach((d) => {
          appList.push({ id: d.id, ...d.data() } as AppointmentRecord);
        });
        appList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setAppointments(appList);
      },
      (err) => {
        console.warn('Real-time doctor appointments subscription notice:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    await fetchDoctorData();
    setIsRefreshing(false);
    setSuccessNotice(isAr ? 'تم تحديث البيانات من الخادم بنجاح.' : 'Data refreshed successfully.');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Appointment Status Updates (Confirm, Complete, Cancel, Notes)
  const handleUpdateAppointmentStatus = async (
    appointmentId: string,
    newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected',
    cancellationReason?: string,
    clinicalNotes?: string
  ) => {
    try {
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      if (cancellationReason) {
        updatePayload.cancellationReason = cancellationReason;
      }
      if (clinicalNotes !== undefined) {
        updatePayload.clinicalNotes = clinicalNotes;
      }

      await updateDoc(doc(db, 'appointments', appointmentId), updatePayload);

      // Keep real-time doctor availability document in sync
      const targetApp = appointments.find((a) => a.id === appointmentId);
      if (targetApp) {
        if (newStatus === 'confirmed') {
          await updateSlotOnAppointmentStatusChange(
            targetApp.doctorId || currentUser?.uid || '',
            targetApp.date,
            targetApp.timeSlot,
            'confirm'
          );
        } else if (newStatus === 'cancelled' || newStatus === 'rejected') {
          await updateSlotOnAppointmentStatusChange(
            targetApp.doctorId || currentUser?.uid || '',
            targetApp.date,
            targetApp.timeSlot,
            'cancel'
          );
        }
      }

      // Local update
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status: newStatus,
                ...(cancellationReason && { cancellationReason }),
                ...(clinicalNotes !== undefined && { clinicalNotes }),
                updatedAt: updatePayload.updatedAt as string,
              }
            : a
        )
      );

      setSuccessNotice(
        isAr
          ? newStatus === 'confirmed'
            ? 'تم تأكيد حجز المراجع بنجاح.'
            : newStatus === 'completed'
            ? 'تم توثيق إتمام الكشف الطبي بنجاح.'
            : 'تم إلغاء الموعد وتوثيق سبب الإلغاء.'
          : `Appointment updated to ${newStatus}.`
      );
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error updating appointment:', err);
      setErrorNotice(isAr ? 'تعذر تحديث حالة الموعد في قاعدة البيانات.' : 'Failed to update appointment.');
    }
  };

  // Create Walk-in Appointment
  const handleCreateWalkInAppointment = async (
    walkInData: Omit<AppointmentRecord, 'id' | 'createdAt'>
  ) => {
    if (!currentUser) return;
    try {
      const newId = `WALK-${Date.now().toString().slice(-6)}`;
      const payload: AppointmentRecord = {
        ...walkInData,
        id: newId,
        doctorId: currentUser.uid,
        doctorName: userProfile?.displayName || 'طبيب استشاري',
        specialty: userProfile?.specialization || 'طب عام',
        clinicName: userProfile?.clinicName || 'العيادة التخصصية',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'appointments', newId), cleanFirestoreData(payload));

      // Keep real-time doctor availability document in sync
      await updateSlotOnAppointmentStatusChange(
        currentUser.uid,
        walkInData.date,
        walkInData.timeSlot,
        'add_confirmed'
      );

      setAppointments((prev) => [payload, ...prev]);
      setSuccessNotice(isAr ? 'تم تسجيل وتأكيد موعد المراجع الحضوري بالعيادة.' : 'Walk-in registered.');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error creating walk-in appointment:', err);
      setErrorNotice(isAr ? 'تعذر تسجيل المراجع الحضوري في Firestore.' : 'Failed to register walk-in.');
    }
  };

  // Save Schedule & Capacity
  const handleSaveSchedule = async (newSchedule: Partial<DoctorScheduleConfig>) => {
    if (!currentUser) return;
    try {
      const updatedSchedule: DoctorScheduleConfig = {
        doctorId: currentUser.uid,
        workingDays: newSchedule.workingDays || schedule?.workingDays || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        shiftStartTime: newSchedule.shiftStartTime || schedule?.shiftStartTime || '09:00',
        shiftEndTime: newSchedule.shiftEndTime || schedule?.shiftEndTime || '15:00',
        slotDurationMinutes: newSchedule.slotDurationMinutes || schedule?.slotDurationMinutes || 20,
        dailyCapacity: newSchedule.dailyCapacity || schedule?.dailyCapacity || 15,
        blackoutDates: newSchedule.blackoutDates || schedule?.blackoutDates || [],
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'doctor_schedules', currentUser.uid), updatedSchedule);

      // Sync summary to user profile document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        workingDays: updatedSchedule.workingDays.join(', '),
        workingHours: `${updatedSchedule.shiftStartTime} - ${updatedSchedule.shiftEndTime}`,
        updatedAt: new Date().toISOString(),
      });

      setSchedule(updatedSchedule);
      await refreshProfile();
      setSuccessNotice(isAr ? 'تم حفظ أوقات الدوام وسعة المقاعد ومزامنتها بنجاح.' : 'Schedule saved.');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error saving schedule:', err);
      setErrorNotice(isAr ? 'تعذر حفظ إعدادات الجدول في قاعدة البيانات.' : 'Failed to save schedule.');
    }
  };

  // Issue Digital Prescription
  const handleIssuePrescription = async (newRx: Omit<PrescriptionRecord, 'id'>) => {
    if (!currentUser) return;
    try {
      const payload = cleanFirestoreData({
        ...newRx,
        doctorId: currentUser.uid,
      });

      const rxDocRef = await addDoc(collection(db, 'prescriptions'), payload);

      const fullRx: PrescriptionRecord = {
        ...newRx,
        id: rxDocRef.id,
      };

      setPrescriptions((prev) => [fullRx, ...prev]);
      setSuccessNotice(isAr ? `تم إصدار وحفظ الوصفة الطبية [${fullRx.prescriptionNumber}] بنجاح.` : 'Prescription issued.');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error issuing prescription:', err);
      setErrorNotice(isAr ? 'تعذر إصدار الوصفة الطبية في Firestore.' : 'Failed to issue prescription.');
    }
  };

  // Add Lab Report
  const handleAddLabReport = async (reportData: Omit<LabReportRecord, 'id' | 'uploadedAt'>) => {
    if (!currentUser) return;
    try {
      const payload = cleanFirestoreData({
        ...reportData,
        doctorId: currentUser.uid,
        uploadedAt: new Date().toISOString(),
      });

      const docRef = await addDoc(collection(db, 'lab_reports'), payload);
      const fullReport: LabReportRecord = {
        ...payload,
        id: docRef.id,
      };

      setLabReports((prev) => [fullReport, ...prev]);
      setSuccessNotice(isAr ? 'تم تسجيل وتوثيق الفحص المخبري بنجاح.' : 'Lab report recorded.');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error recording lab report:', err);
      setErrorNotice(isAr ? 'تعذر حفظ الفحص المخبري في Firestore.' : 'Failed to save lab report.');
    }
  };

  // Send Clinical Message with deterministic conversationId, trusted serverTimestamp & status tracking
  const handleSendMessage = async (patientId: string, text: string) => {
    if (!currentUser) return;
    try {
      const conversationId = `${currentUser.uid}_${patientId}`;
      const nowIso = new Date().toISOString();
      const payload: Omit<ClinicalMessage, 'id'> = cleanFirestoreData({
        conversationId,
        doctorId: currentUser.uid,
        doctorName: userProfile?.displayName || (isAr ? 'طبيب استشاري' : 'Consultant'),
        patientId,
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || (isAr ? 'طبيب استشاري' : 'Consultant'),
        senderRole: 'doctor',
        recipientId: patientId,
        recipientName: isAr ? 'المراجع' : 'Patient',
        text,
        messageType: 'text',
        status: 'sent',
        sentAt: nowIso,
        deliveredAt: nowIso,
        isRead: false,
      });

      const docRef = await addDoc(collection(db, 'messages'), {
        ...payload,
        serverTimestamp: serverTimestamp(),
      });
      const fullMsg: ClinicalMessage = {
        ...payload,
        id: docRef.id,
      };

      setMessages((prev) => [...prev, fullMsg]);
    } catch (err) {
      console.error('Error sending message:', err);
      setErrorNotice(isAr ? 'تعذر إرسال الرسالة إلى المراجع.' : 'Failed to send message.');
    }
  };

  // Update Doctor Profile Settings
  const handleUpdateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), cleanFirestoreData({
        ...updatedData,
        updatedAt: new Date().toISOString(),
      }));
      await refreshProfile();
      setSuccessNotice(isAr ? 'تم حفظ ومزامنة بيانات العيادة بنجاح.' : 'Clinic profile updated.');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error updating doctor profile:', err);
      setErrorNotice(isAr ? 'تعذر تحديث بيانات الحساب في Firestore.' : 'Failed to update profile.');
    }
  };

  // Action helper: open prescription for specific patient
  const handleOpenPrescriptionForPatient = (patientData: {
    id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    appointmentId?: string;
  }) => {
    setPrefilledPatientForRx(patientData);
    setCurrentTab('prescriptions');
  };

  // Action helper: open message thread for specific patient
  const handleOpenMessageThread = (patientId: string, patientName: string) => {
    setPreselectedMessagePatientId(patientId);
    setCurrentTab('messages');
  };

  const pendingBookingsCount = appointments.filter((a) => a.status === 'pending').length;
  const unreadMessagesCount = messages.filter((m) => m.senderRole === 'patient' && !m.isRead).length;

  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <PageContainer size="wide">
        {/* Global Notifications */}
        {successNotice && (
          <div className="mb-4">
            <SuccessNotification
              message={successNotice}
              onDismiss={() => setSuccessNotice(null)}
            />
          </div>
        )}

        {errorNotice && (
          <div className="mb-4">
            <ErrorMessage
              message={errorNotice}
              onDismiss={() => setErrorNotice(null)}
            />
          </div>
        )}

        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>M737</span>
                <span aria-hidden="true">/</span>
                <span>{isAr ? 'بوابة الأطباء الاستشاريين' : 'Physician Portal'}</span>
                <span aria-hidden="true">/</span>
                <span className="text-amber-700 font-bold">{userProfile?.displayName || 'طبيب استشاري'}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-sky-600" />
                <span>{isAr ? 'مساحة العمل السريرية' : 'Clinical Workspace'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
              <span>{isAr ? 'تحديث البيانات' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isAr ? 'خروج' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {/* Workspace Layout: Sidebar + Main Content Tab */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Mobile Dropdown or Desktop Sticky Sidebar */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block w-full lg:w-72 shrink-0`}>
            <DoctorSidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              userProfile={userProfile}
              pendingBookingsCount={pendingBookingsCount}
              unreadMessagesCount={unreadMessagesCount}
              onSignOut={() => signOut()}
            />
          </div>

          {/* Active Tab Workspace */}
          <main className="flex-1 w-full min-w-0">
            {currentTab === 'overview' && (
              <DoctorOverviewTab
                userProfile={userProfile}
                appointments={appointments}
                schedule={schedule}
                notifications={notifications}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onRefreshData={handleManualRefresh}
                isRefreshing={isRefreshing}
              />
            )}

            {currentTab === 'appointments' && (
              <DoctorAppointmentsTab
                appointments={appointments}
                onUpdateStatus={handleUpdateAppointmentStatus}
                onCreateWalkInAppointment={handleCreateWalkInAppointment}
                onOpenPrescriptionForPatient={handleOpenPrescriptionForPatient}
                isLoading={isLoading}
              />
            )}

            {currentTab === 'schedule' && (
              <DoctorScheduleTab
                schedule={schedule}
                appointments={appointments}
                onSaveSchedule={handleSaveSchedule}
                isLoading={isLoading}
              />
            )}

            {currentTab === 'patients' && (
              <DoctorPatientsTab
                appointments={appointments}
                prescriptions={prescriptions}
                labReports={labReports}
                onOpenPrescription={handleOpenPrescriptionForPatient}
                onOpenMessageThread={handleOpenMessageThread}
              />
            )}

            {currentTab === 'prescriptions' && (
              <DoctorPrescriptionsTab
                prescriptions={prescriptions}
                userProfile={userProfile}
                appointments={appointments}
                onIssuePrescription={handleIssuePrescription}
                prefilledPatientData={prefilledPatientForRx}
                onClearPrefilledPatient={() => setPrefilledPatientForRx(null)}
                isLoading={isLoading}
              />
            )}

            {currentTab === 'lab_reports' && (
              <DoctorLabReportsTab
                labReports={labReports}
                userProfile={userProfile}
                appointments={appointments}
                onAddLabReport={handleAddLabReport}
                isLoading={isLoading}
              />
            )}

            {currentTab === 'messages' && (
              <DoctorMessagesTab
                messages={messages}
                appointments={appointments}
                userProfile={userProfile}
                onSendMessage={handleSendMessage}
                preselectedPatientId={preselectedMessagePatientId}
              />
            )}

            {currentTab === 'settings' && (
              <DoctorSettingsTab
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                isLoading={isLoading}
              />
            )}
          </main>
        </div>
      </PageContainer>
    </div>
  );
};
