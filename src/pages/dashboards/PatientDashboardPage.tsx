import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { Menu, LogOut, RefreshCw, User, ShieldCheck } from 'lucide-react';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../localization/LanguageContext';
import { PageContainer } from '../../components/common/PageContainer';
import { SuccessNotification } from '../../components/common/SuccessNotification';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import {
  AppointmentRecord,
  PrescriptionRecord,
  LabReportRecord,
  ClinicalMessage,
  DoctorNotification,
  DoctorPublicProfile,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { cleanFirestoreData } from '../../utils/firestoreUtils';
import { updateSlotOnAppointmentStatusChange } from '../../utils/appointmentAvailabilityUtils';

import { PatientSidebar, PatientTab } from '../../components/patient/PatientSidebar';
import { PatientOverviewTab } from '../../components/patient/PatientOverviewTab';
import { PatientDoctorSearchTab } from '../../components/patient/PatientDoctorSearchTab';
import { PatientBookingModal } from '../../components/patient/PatientBookingModal';
import { PatientAppointmentsTab } from '../../components/patient/PatientAppointmentsTab';
import { PatientPrescriptionsTab } from '../../components/patient/PatientPrescriptionsTab';
import { PatientLabReportsTab } from '../../components/patient/PatientLabReportsTab';
import { PatientMessagesTab } from '../../components/patient/PatientMessagesTab';
import { PatientNotificationsTab } from '../../components/patient/PatientNotificationsTab';
import { PatientProfileTab } from '../../components/patient/PatientProfileTab';

export const PatientDashboardPage: React.FC = () => {
  const { userProfile, currentUser, signOut, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [currentTab, setCurrentTab] = useState<PatientTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Live Patient Data States
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [labReports, setLabReports] = useState<LabReportRecord[]>([]);
  const [messages, setMessages] = useState<ClinicalMessage[]>([]);
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);

  // Booking Modal State
  const [bookingModalDoctor, setBookingModalDoctor] = useState<DoctorPublicProfile | null>(null);

  // Cross-tab Search / Chat Preselection
  const [searchTargetDoctorId, setSearchTargetDoctorId] = useState<string | undefined>(undefined);
  const [preselectedChatDoctorId, setPreselectedChatDoctorId] = useState<string | null>(null);

  const fetchPatientData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorNotice(null);

    try {
      const uid = currentUser.uid;

      // 1. Fetch Appointments
      try {
        const appQuery = query(collection(db, 'appointments'), where('patientId', '==', uid));
        const appSnap = await getDocs(appQuery);
        const appList: AppointmentRecord[] = [];
        appSnap.forEach((d) => {
          appList.push({ id: d.id, ...d.data() } as AppointmentRecord);
        });
        appList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setAppointments(appList);
      } catch (err) {
        console.warn('Appointments fetch notice:', err);
      }

      // 2. Fetch Prescriptions
      try {
        const rxQuery = query(collection(db, 'prescriptions'), where('patientId', '==', uid));
        const rxSnap = await getDocs(rxQuery);
        const rxList: PrescriptionRecord[] = [];
        rxSnap.forEach((d) => {
          rxList.push({ id: d.id, ...d.data() } as PrescriptionRecord);
        });
        rxList.sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''));
        setPrescriptions(rxList);
      } catch (err) {
        console.warn('Prescriptions fetch notice:', err);
      }

      // 3. Fetch Lab Reports
      try {
        const labQuery = query(collection(db, 'lab_reports'), where('patientId', '==', uid));
        const labSnap = await getDocs(labQuery);
        const labList: LabReportRecord[] = [];
        labSnap.forEach((d) => {
          labList.push({ id: d.id, ...d.data() } as LabReportRecord);
        });
        labList.sort((a, b) => (b.testDate || '').localeCompare(a.testDate || ''));
        setLabReports(labList);
      } catch (err) {
        console.warn('Lab reports fetch notice:', err);
      }

      // 4. Fetch Messages
      try {
        const msgQuery = query(collection(db, 'messages'), where('patientId', '==', uid));
        const msgSnap = await getDocs(msgQuery);
        const msgList: ClinicalMessage[] = [];
        msgSnap.forEach((d) => {
          msgList.push({ id: d.id, ...d.data() } as ClinicalMessage);
        });
        msgList.sort((a, b) => (a.sentAt || '').localeCompare(b.sentAt || ''));
        setMessages(msgList);
      } catch (err) {
        console.warn('Messages fetch notice:', err);
      }

      // 5. Fetch Notifications
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
        console.warn('Notifications fetch notice:', err);
      }
    } catch (err) {
      console.error('Error fetching patient records:', err);
      setErrorNotice(isAr ? 'تعذر استعلام سجلات المراجع من Firestore.' : 'Error loading patient records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
    if (!currentUser) return;

    // Real-time listener for patient's appointments
    const q = query(collection(db, 'appointments'), where('patientId', '==', currentUser.uid));
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
        console.warn('Real-time patient appointments subscription notice:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    await fetchPatientData();
    setIsRefreshing(false);
    setSuccessNotice(isAr ? 'تم تحديث البيانات من الخادم بنجاح.' : 'Data refreshed.');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Cancel Appointment by Patient
  const handleCancelAppointment = async (appointmentId: string, reason: string) => {
    try {
      const targetApp = appointments.find((a) => a.id === appointmentId);

      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: new Date().toISOString(),
      });

      // Release reserved slot in doctor's real-time schedule availability document
      if (targetApp?.doctorId && targetApp.date && targetApp.timeSlot) {
        await updateSlotOnAppointmentStatusChange(
          targetApp.doctorId,
          targetApp.date,
          targetApp.timeSlot,
          'cancel'
        );
      }

      // Notify Doctor
      if (targetApp?.doctorId) {
        try {
          await addDoc(collection(db, 'notifications'), cleanFirestoreData({
            userId: targetApp.doctorId,
            titleAr: 'تم إلغاء موعد من قبل المراجع',
            titleEn: 'Appointment Cancelled by Patient',
            messageAr: `المراجع [${userProfile?.displayName || 'المراجع'}] ألغى موعده برمز [${appointmentId}] لسبب: ${reason}.`,
            messageEn: `Patient cancelled booking [${appointmentId}]. Reason: ${reason}.`,
            type: 'booking_cancelled',
            read: false,
            relatedId: appointmentId,
            createdAt: new Date().toISOString(),
          }));
        } catch (notifErr) {
          console.warn('Notification error:', notifErr);
        }
      }

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: 'cancelled', cancellationReason: reason } : a
        )
      );

      setSuccessNotice(isAr ? 'تم إلغاء الموعد بنجاح وإشعار العيادة.' : 'Appointment cancelled successfully.');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setErrorNotice(isAr ? 'تعذر إلغاء الموعد في قاعدة البيانات.' : 'Failed to cancel appointment.');
    }
  };

  // Send Message to Doctor with deterministic conversationId, trusted serverTimestamp & status tracking
  const handleSendMessage = async (doctorId: string, text: string) => {
    if (!currentUser) return;
    try {
      const conversationId = `${doctorId}_${currentUser.uid}`;
      const nowIso = new Date().toISOString();
      const payload: Omit<ClinicalMessage, 'id'> = cleanFirestoreData({
        conversationId,
        doctorId,
        patientId: currentUser.uid,
        patientName: userProfile?.displayName || (isAr ? 'المراجع' : 'Patient'),
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || (isAr ? 'المراجع' : 'Patient'),
        senderRole: 'patient',
        recipientId: doctorId,
        recipientName: isAr ? 'طبيب اختصاص' : 'Specialist Doctor',
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
      setMessages((prev) => [...prev, { ...payload, id: docRef.id }]);
    } catch (err) {
      console.error('Error sending message:', err);
      setErrorNotice(isAr ? 'تعذر إرسال الرسالة إلى الطبيب.' : 'Failed to send message.');
    }
  };

  // Mark Notification As Read
  const handleMarkNotifAsRead = async (notificationId: string) => {
    if (!notificationId || typeof notificationId !== 'string') {
      console.warn('handleMarkNotifAsRead called without a valid notificationId:', notificationId);
      return;
    }
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.warn('Error marking notification as read:', err);
    }
  };

  // Mark All Notifications As Read
  const handleMarkAllNotifsAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter((n) => !n.read && n.id);
      if (unreadNotifs.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifs.forEach((n) => {
        if (n.id) {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        }
      });
      await batch.commit();

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setSuccessNotice(isAr ? 'تم تحديد كافة الإشعارات كمقروءة.' : 'All notifications marked as read.');
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err) {
      console.warn('Error marking all notifications:', err);
    }
  };

  // Update Patient Profile
  const handleUpdateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), cleanFirestoreData({
        ...updatedData,
        updatedAt: new Date().toISOString(),
      }));
      await refreshProfile();
      setSuccessNotice(isAr ? 'تم تحديث الملف الطبي للمراجع بنجاح.' : 'Profile updated successfully.');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err) {
      console.error('Error updating patient profile:', err);
      setErrorNotice(isAr ? 'تعذر تحديث الملف الشخصي في قاعدة البيانات.' : 'Failed to update profile.');
    }
  };

  // Helper: jump from Overview or appointment to Doctor Search or Chat
  const handleSearchDoctorId = (docId: string) => {
    setSearchTargetDoctorId(docId);
    setCurrentTab('search_doctors');
  };

  const handleOpenMessageWithDoctor = (doctorId: string, doctorName: string) => {
    setPreselectedChatDoctorId(doctorId);
    setCurrentTab('messages');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const unreadMessagesCount = messages.filter((m) => m.senderRole === 'doctor' && !m.isRead).length;

  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <PageContainer size="wide">
        {/* Global Notifications */}
        {successNotice && (
          <div className="mb-4">
            <SuccessNotification message={successNotice} onDismiss={() => setSuccessNotice(null)} />
          </div>
        )}

        {errorNotice && (
          <div className="mb-4">
            <ErrorMessage message={errorNotice} onDismiss={() => setErrorNotice(null)} />
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
                <span>{isAr ? 'بوابة المراجعين' : 'Patient Portal'}</span>
                <span aria-hidden="true">/</span>
                <span className="text-sky-700 font-bold">{userProfile?.displayName || 'المراجع'}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <User className="w-6 h-6 text-sky-600" />
                <span>{isAr ? 'ملف المراجع والرعاية السريرية' : 'Patient Health Center'}</span>
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
            <PatientSidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              userProfile={userProfile}
              unreadNotifsCount={unreadNotifsCount}
              unreadMessagesCount={unreadMessagesCount}
              onSignOut={() => signOut()}
            />
          </div>

          {/* Active Tab Content */}
          <main className="flex-1 w-full min-w-0">
            {currentTab === 'overview' && (
              <PatientOverviewTab
                userProfile={userProfile}
                appointments={appointments}
                prescriptions={prescriptions}
                labReports={labReports}
                notifications={notifications}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onSearchDoctorId={handleSearchDoctorId}
              />
            )}

            {currentTab === 'search_doctors' && (
              <PatientDoctorSearchTab
                initialSearchDoctorId={searchTargetDoctorId}
                onOpenBookingModal={(doc) => setBookingModalDoctor(doc)}
              />
            )}

            {currentTab === 'appointments' && (
              <PatientAppointmentsTab
                appointments={appointments}
                onCancelAppointment={handleCancelAppointment}
                onOpenMessageWithDoctor={handleOpenMessageWithDoctor}
                isLoading={isLoading}
              />
            )}

            {currentTab === 'prescriptions' && (
              <PatientPrescriptionsTab
                prescriptions={prescriptions}
                isLoading={isLoading}
              />
            )}

            {currentTab === 'lab_reports' && (
              <PatientLabReportsTab
                labReports={labReports}
                isLoading={isLoading}
              />
            )}

            {currentTab === 'messages' && (
              <PatientMessagesTab
                messages={messages}
                appointments={appointments}
                userProfile={userProfile}
                onSendMessage={handleSendMessage}
                preselectedDoctorId={preselectedChatDoctorId}
              />
            )}

            {currentTab === 'notifications' && (
              <PatientNotificationsTab
                notifications={notifications}
                onMarkAsRead={handleMarkNotifAsRead}
                onMarkAllAsRead={handleMarkAllNotifsAsRead}
                isLoading={isLoading}
              />
            )}

            {currentTab === 'profile' && (
              <PatientProfileTab
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                isLoading={isLoading}
              />
            )}
          </main>
        </div>
      </PageContainer>

      {/* BOOKING MODAL */}
      {bookingModalDoctor && (
        <PatientBookingModal
          doctor={bookingModalDoctor}
          userProfile={userProfile}
          onClose={() => setBookingModalDoctor(null)}
          onBookingSuccess={() => {
            fetchPatientData();
          }}
        />
      )}
    </div>
  );
};
