import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { Menu, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../localization/LanguageContext';
import {
  UserProfile,
  DoctorApplication,
  Subscription,
  AdminNotification,
  AuditLog,
  SUPER_ADMIN_EMAIL,
} from '../../types/auth';
import { AppointmentRecord } from '../../types/database';
import { PageContainer } from '../../components/common/PageContainer';
import { SuccessNotification } from '../../components/common/SuccessNotification';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { AdminSidebar, AdminTab } from '../../components/admin/AdminSidebar';
import { AdminOverviewTab } from '../../components/admin/AdminOverviewTab';
import { AdminApplicationsTab } from '../../components/admin/AdminApplicationsTab';
import { AdminDoctorsTab } from '../../components/admin/AdminDoctorsTab';
import { AdminPatientsTab } from '../../components/admin/AdminPatientsTab';
import { AdminSubscriptionsTab } from '../../components/admin/AdminSubscriptionsTab';
import { AdminBookingsTab } from '../../components/admin/AdminBookingsTab';
import { AdminConversationsTab } from '../../components/admin/AdminConversationsTab';
import { AdminNotificationsTab } from '../../components/admin/AdminNotificationsTab';
import { AdminAuditLogTab } from '../../components/admin/AdminAuditLogTab';
import { AdminSettingsTab } from '../../components/admin/AdminSettingsTab';

export const AdminDashboardPage: React.FC = () => {
  const { userProfile, currentUser, signOut, isSuperAdmin } = useAuth();
  const { language } = useLanguage();

  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Live Database States
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [openComplaintsCount, setOpenComplaintsCount] = useState<number>(0);

  const fetchPlatformData = async () => {
    setIsLoading(true);
    setErrorNotice(null);

    try {
      // 1. Fetch Users
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList: UserProfile[] = [];
        usersSnap.forEach((d) => {
          const data = d.data() as UserProfile;
          usersList.push({ ...data, uid: data.uid || d.id });
        });
        setAllUsers(usersList);
      } catch (e) {
        console.warn('Users fetch notice:', e);
      }

      // 2. Fetch Doctor Applications
      try {
        const appsSnap = await getDocs(collection(db, 'doctor_applications'));
        const appsList: DoctorApplication[] = [];
        appsSnap.forEach((d) => {
          const data = d.data() as DoctorApplication;
          appsList.push({ ...data, doctorId: data.doctorId || d.id });
        });
        appsList.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
        setApplications(appsList);
      } catch (e) {
        console.warn('Applications fetch notice:', e);
      }

      // 3. Fetch Subscriptions
      try {
        const subsSnap = await getDocs(collection(db, 'subscriptions'));
        const subsList: Subscription[] = [];
        subsSnap.forEach((d) => {
          const data = d.data() as Subscription;
          subsList.push({ ...data, id: data.id || d.id });
        });
        subsList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setSubscriptions(subsList);
      } catch (e) {
        console.warn('Subscriptions fetch notice:', e);
      }

      // 4. Fetch Notifications
      try {
        const notifsSnap = await getDocs(collection(db, 'notifications'));
        const notifsList: AdminNotification[] = [];
        notifsSnap.forEach((d) => {
          const data = d.data() as AdminNotification;
          notifsList.push({ ...data, id: data.id || d.id });
        });
        notifsList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setNotifications(notifsList);
      } catch (e) {
        console.warn('Notifications fetch notice:', e);
      }

      // 5. Fetch Audit Logs
      try {
        const auditSnap = await getDocs(collection(db, 'audit_logs'));
        const logsList: AuditLog[] = [];
        auditSnap.forEach((d) => {
          const data = d.data() as AuditLog;
          logsList.push({ ...data, logId: data.logId || d.id });
        });
        logsList.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setAuditLogs(logsList);
      } catch (e) {
        console.warn('Audit logs fetch notice:', e);
      }

      // 6. Fetch Complaints Count
      try {
        const compSnap = await getDocs(collection(db, 'complaints'));
        let openCount = 0;
        compSnap.forEach((d) => {
          const c = d.data();
          if (c.status === 'open' || c.status === 'under_review') {
            openCount++;
          }
        });
        setOpenComplaintsCount(openCount);
      } catch (e) {
        console.warn('Complaints count notice:', e);
      }

      // 7. Fetch Appointments
      try {
        const appSnap = await getDocs(collection(db, 'appointments'));
        const appList: AppointmentRecord[] = [];
        appSnap.forEach((d) => {
          const data = d.data() as AppointmentRecord;
          appList.push({ ...data, id: data.id || d.id });
        });
        appList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setAppointments(appList);
      } catch (e) {
        console.warn('Appointments fetch notice:', e);
      }
    } catch (err: unknown) {
      console.error('Error fetching platform data:', err);
      setErrorNotice('تعذر استعلام بيانات المنصة من Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchPlatformData();
    }
  }, [isSuperAdmin]);

  // Trusted Backend Action: Approve Doctor
  const handleApproveDoctor = async (app: DoctorApplication) => {
    if (!currentUser) return;
    const now = new Date().toISOString();

    try {
      // 1. Update /doctor_applications/{doctorId}
      const appRef = doc(db, 'doctor_applications', app.doctorId);
      await updateDoc(appRef, {
        status: 'active',
        reviewedAt: now,
        reviewedBy: currentUser.uid,
        reviewNotes: 'تم التدقيق والاعتماد السريري من قبل الإدارة العليا للمنصة.',
      });

      // 2. Update /users/{doctorId}
      const userRef = doc(db, 'users', app.doctorId);
      await updateDoc(userRef, {
        approvalStatus: 'active',
        updatedAt: now,
      });

      // 3. Immutable audit log
      const logId = `log_${Date.now()}_approve_${app.doctorId}`;
      const logRef = doc(db, 'audit_logs', logId);
      await setDoc(logRef, {
        logId,
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        action: 'APPROVE_DOCTOR_APPLICATION',
        targetUid: app.doctorId,
        timestamp: now,
        metadata: JSON.stringify({
          doctorName: app.fullName,
          syndicateId: app.syndicateId,
          specialization: app.specialization,
        }),
      });

      // 4. Notification
      const notifId = `notif_${Date.now()}_approved`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        titleAr: 'تم اعتماد طبيب بنجاح',
        titleEn: 'Doctor Application Approved',
        messageAr: `تم تفعيل حساب د. ${app.fullName} في اختصاص ${app.specialization}.`,
        messageEn: `Activated account for Dr. ${app.fullName} in ${app.specialization}.`,
        type: 'doctor_approved',
        read: false,
        relatedId: app.doctorId,
        createdAt: now,
      });

      setSuccessNotice(`تم اعتماد وتفعيل حساب الطبيب [${app.fullName}] بنجاح.`);
      await fetchPlatformData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorNotice(e.message || 'حدث خطأ أثناء اعتماد الطبيب.');
      throw err;
    }
  };

  // Trusted Backend Action: Reject Doctor
  const handleRejectDoctor = async (app: DoctorApplication, reason?: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const finalReason = reason || 'عدم استيفاء شروط الاعتماد أو عدم صحة رقم النقابة.';

    try {
      // 1. Update /doctor_applications/{doctorId}
      const appRef = doc(db, 'doctor_applications', app.doctorId);
      await updateDoc(appRef, {
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: currentUser.uid,
        reviewNotes: finalReason,
      });

      // 2. Update /users/{doctorId}
      const userRef = doc(db, 'users', app.doctorId);
      await updateDoc(userRef, {
        approvalStatus: 'rejected',
        updatedAt: now,
      });

      // 3. Immutable audit log
      const logId = `log_${Date.now()}_reject_${app.doctorId}`;
      const logRef = doc(db, 'audit_logs', logId);
      await setDoc(logRef, {
        logId,
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        action: 'REJECT_DOCTOR_APPLICATION',
        targetUid: app.doctorId,
        timestamp: now,
        metadata: JSON.stringify({
          doctorName: app.fullName,
          syndicateId: app.syndicateId,
          reason: finalReason,
        }),
      });

      setSuccessNotice(`تم تسجيل رفض طلب الاعتماد للطبيب [${app.fullName}].`);
      await fetchPlatformData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorNotice(e.message || 'حدث خطأ أثناء رفض الطلب.');
      throw err;
    }
  };

  // Trusted Backend Action: Request Additional Info
  const handleRequestInfo = async (app: DoctorApplication, message: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();

    try {
      const appRef = doc(db, 'doctor_applications', app.doctorId);
      await updateDoc(appRef, {
        reviewNotes: `طلب استيضاح إداري: ${message}`,
        reviewedAt: now,
        reviewedBy: currentUser.uid,
      });

      const logId = `log_${Date.now()}_info_${app.doctorId}`;
      await setDoc(doc(db, 'audit_logs', logId), {
        logId,
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        action: 'REQUEST_ADDITIONAL_INFO',
        targetUid: app.doctorId,
        timestamp: now,
        metadata: JSON.stringify({ message }),
      });

      setSuccessNotice(`تم تدوين طلب المعلومات الإضافية للطبيب [${app.fullName}].`);
      await fetchPlatformData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorNotice(e.message || 'تعذر تسجيل طلب المعلومات.');
      throw err;
    }
  };

  // Trusted Backend Action: Suspend / Reactivate Doctor Account
  const handleToggleDoctorAccountStatus = async (doctor: UserProfile, targetStatus: 'active' | 'suspended') => {
    if (!currentUser) return;
    const now = new Date().toISOString();

    try {
      const userRef = doc(db, 'users', doctor.uid);
      await updateDoc(userRef, {
        accountStatus: targetStatus,
        updatedAt: now,
      });

      const action = targetStatus === 'suspended' ? 'SUSPEND_DOCTOR_ACCOUNT' : 'ACTIVATE_DOCTOR_ACCOUNT';
      const logId = `log_${Date.now()}_standing_${doctor.uid}`;
      await setDoc(doc(db, 'audit_logs', logId), {
        logId,
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        action,
        targetUid: doctor.uid,
        timestamp: now,
        metadata: JSON.stringify({ doctorName: doctor.displayName, targetStatus }),
      });

      setSuccessNotice(`تم تحديث حالة حساب الطبيب [${doctor.displayName}] إلى [${targetStatus}].`);
      await fetchPlatformData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorNotice(e.message || 'حدث خطأ أثناء تعديل حالة الحساب.');
      throw err;
    }
  };

  // Trusted Backend Action: Assign Subscription
  const handleAssignSubscription = async (subData: Partial<Subscription>) => {
    if (!currentUser || !subData.doctorId) return;
    const now = new Date().toISOString();
    const subId = `sub_${Date.now()}_${subData.doctorId.substring(0, 5)}`;

    try {
      const fullSub: Subscription = {
        id: subId,
        doctorId: subData.doctorId,
        doctorName: subData.doctorName || 'طبيب استشاري',
        planType: subData.planType || '1_month',
        durationDays: subData.durationDays || 30,
        priceIqd: subData.priceIqd || 50000,
        startDate: subData.startDate || now,
        expiryDate: subData.expiryDate,
        paymentStatus: subData.paymentStatus || 'confirmed',
        paymentMethod: subData.paymentMethod || 'manual',
        status: subData.status || 'active',
        notes: subData.notes || '',
        createdByUid: currentUser.uid,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'subscriptions', subId), fullSub);

      // Audit Log
      const logId = `log_${Date.now()}_assign_sub_${subId}`;
      await setDoc(doc(db, 'audit_logs', logId), {
        logId,
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        action: 'ASSIGN_SUBSCRIPTION',
        targetUid: subData.doctorId,
        timestamp: now,
        metadata: JSON.stringify({ subId, planType: fullSub.planType, priceIqd: fullSub.priceIqd }),
      });

      setSuccessNotice(`تم تخصيص وتفعيل الاشتراك بنجاح لدكتور [${fullSub.doctorName}].`);
      await fetchPlatformData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorNotice(e.message || 'حدث خطأ أثناء حفظ الاشتراك.');
      throw err;
    }
  };

  // Trusted Backend Action: Renew / Extend Subscription
  const handleRenewSubscription = async (subId: string, addDays: number) => {
    if (!currentUser) return;
    const sub = subscriptions.find((s) => s.id === subId);
    if (!sub) return;

    const now = new Date();
    let currentExpiry = sub.expiryDate ? new Date(sub.expiryDate) : now;
    if (currentExpiry < now) currentExpiry = now;
    currentExpiry.setDate(currentExpiry.getDate() + addDays);

    const nowIso = new Date().toISOString();

    try {
      await updateDoc(doc(db, 'subscriptions', subId), {
        expiryDate: currentExpiry.toISOString(),
        status: 'active',
        updatedAt: nowIso,
      });

      const logId = `log_${Date.now()}_renew_sub_${subId}`;
      await setDoc(doc(db, 'audit_logs', logId), {
        logId,
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        action: 'EXTEND_SUBSCRIPTION',
        targetUid: sub.doctorId,
        timestamp: nowIso,
        metadata: JSON.stringify({ subId, addDays, newExpiry: currentExpiry.toISOString() }),
      });

      setSuccessNotice(`تم تمديد اشتراك د. [${sub.doctorName}] بمقدار ${addDays} يوماً بنجاح.`);
      await fetchPlatformData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorNotice(e.message || 'حدث خطأ أثناء تمديد الاشتراك.');
      throw err;
    }
  };

  // Trusted Backend Action: Confirm Manual Payment
  const handleConfirmPayment = async (subId: string) => {
    if (!currentUser) return;
    const nowIso = new Date().toISOString();

    try {
      await updateDoc(doc(db, 'subscriptions', subId), {
        paymentStatus: 'confirmed',
        status: 'active',
        updatedAt: nowIso,
      });

      const logId = `log_${Date.now()}_confirm_pay_${subId}`;
      await setDoc(doc(db, 'audit_logs', logId), {
        logId,
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        action: 'CONFIRM_SUBSCRIPTION_PAYMENT',
        targetUid: subId,
        timestamp: nowIso,
      });

      setSuccessNotice('تم توثيق وتأكيد استلام دفعة الاشتراك بنجاح.');
      await fetchPlatformData();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorNotice(e.message || 'حدث خطأ أثناء تأكيد الدفع.');
      throw err;
    }
  };

  // Notification: Mark as read
  const handleMarkAsRead = async (notifId: string) => {
    if (!notifId || typeof notifId !== 'string') {
      console.warn('handleMarkAsRead called without a valid notifId:', notifId);
      return;
    }
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Notification: Mark all as read
  const handleMarkAllAsRead = async () => {
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
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const doctorsList = allUsers.filter((u) => u.role === 'doctor');
  const patientsList = allUsers.filter((u) => u.role === 'patient');
  const pendingAppsCount = applications.filter((a) => a.status === 'pending_approval').length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingApplicationsCount={pendingAppsCount}
        unreadNotificationsCount={unreadNotifsCount}
        openComplaintsCount={openComplaintsCount}
        onSignOut={signOut}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Administrative Viewport */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-slate-100 text-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-900">
            {language === 'ar' ? 'لوحة تحكم الإدارة العليا' : 'Super Admin Console'}
          </span>
          <button
            onClick={fetchPlatformData}
            className="p-2 rounded-lg bg-slate-100 text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content Container */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {successNotice && (
            <SuccessNotification
              message={successNotice}
              onDismiss={() => setSuccessNotice(null)}
            />
          )}

          {errorNotice && (
            <ErrorMessage
              message={errorNotice}
              onDismiss={() => setErrorNotice(null)}
            />
          )}

          {/* Active Tab View */}
          {currentTab === 'overview' && (
            <AdminOverviewTab
              isLoading={isLoading}
              doctors={doctorsList}
              applications={applications}
              patients={patientsList}
              subscriptions={subscriptions}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'applications' && (
            <AdminApplicationsTab
              applications={applications}
              onApprove={handleApproveDoctor}
              onReject={handleRejectDoctor}
              onRequestInfo={handleRequestInfo}
            />
          )}

          {currentTab === 'doctors' && (
            <AdminDoctorsTab
              doctors={doctorsList}
              onToggleAccountStatus={handleToggleDoctorAccountStatus}
            />
          )}

          {currentTab === 'patients' && (
            <AdminPatientsTab patients={patientsList} />
          )}

          {currentTab === 'subscriptions' && (
            <AdminSubscriptionsTab
              subscriptions={subscriptions}
              doctors={doctorsList}
              onAssignSubscription={handleAssignSubscription}
              onRenewSubscription={handleRenewSubscription}
              onConfirmPayment={handleConfirmPayment}
            />
          )}

          {currentTab === 'bookings' && <AdminBookingsTab appointments={appointments} />}

          {currentTab === 'conversations' && (
            <AdminConversationsTab
              currentUser={currentUser}
              userProfile={userProfile}
              allUsers={allUsers}
            />
          )}

          {currentTab === 'notifications' && (
            <AdminNotificationsTab
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          )}

          {currentTab === 'audit' && (
            <AdminAuditLogTab logs={auditLogs} />
          )}

          {currentTab === 'settings' && <AdminSettingsTab />}
        </main>
      </div>
    </div>
  );
};
