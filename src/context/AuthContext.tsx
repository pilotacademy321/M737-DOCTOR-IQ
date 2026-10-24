import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  AuthError,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  normalizeEmail,
  isDesignatedSuperAdminUser,
  validateFirestoreConnection,
} from '../config/firebase';
import {
  UserProfile,
  AuthContextType,
  UserRole,
  ApprovalStatus,
  DoctorApplication,
  PatientProfile,
} from '../types/auth';
import { cleanFirestoreData } from '../utils/firestoreUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNewUserPendingRole, setIsNewUserPendingRole] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Connectivity check on mount
  useEffect(() => {
    validateFirestoreConnection();

    // Auto-refresh profile when network comes back online
    const handleOnline = () => {
      if (auth.currentUser) {
        refreshProfile();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setCurrentUser(firebaseUser);

      if (!firebaseUser) {
        setUserProfile(null);
        setIsNewUserPendingRole(false);
        setIsLoading(false);
        return;
      }

      const isSuperAdminEmail = isDesignatedSuperAdminUser(firebaseUser);

      // Load profile with automatic retry on temporary offline states
      const loadProfile = async (retries = 3, delayMs = 1200): Promise<void> => {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;

            // If designated super admin, guarantee super_admin role on profile
            if (isSuperAdminEmail && data.role !== 'super_admin') {
              const updatedProfile: UserProfile = {
                ...data,
                role: 'super_admin',
                selectedAccountType: 'super_admin',
                approvalStatus: 'active',
                updatedAt: new Date().toISOString(),
              };
              try {
                await updateDoc(userDocRef, {
                  role: 'super_admin',
                  selectedAccountType: 'super_admin',
                  approvalStatus: 'active',
                  updatedAt: updatedProfile.updatedAt,
                });
              } catch (e) {
                console.warn('Could not update super admin doc right now:', e);
              }
              setUserProfile(updatedProfile);
            } else {
              setUserProfile(data);
            }
            setIsNewUserPendingRole(false);
          } else {
            // If no doc exists:
            if (isSuperAdminEmail) {
              // Auto-provision Super Admin doc
              const now = new Date().toISOString();
              const superAdminProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: normalizeEmail(firebaseUser.email),
                displayName: firebaseUser.displayName || 'Super Admin M737',
                photoURL: firebaseUser.photoURL || null,
                emailVerified: true,
                role: 'super_admin',
                selectedAccountType: 'super_admin',
                approvalStatus: 'active',
                createdAt: now,
                updatedAt: now,
              };
              try {
                await setDoc(userDocRef, superAdminProfile);
              } catch (e) {
                console.warn('Could not set super admin doc right now:', e);
              }
              setUserProfile(superAdminProfile);
              setIsNewUserPendingRole(false);
            } else {
              // Normal user who has not completed role onboarding
              setUserProfile(null);
              setIsNewUserPendingRole(true);
            }
          }
          setAuthError(null);
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const isOfflineOrUnavailable =
            errMsg.includes('client is offline') ||
            errMsg.includes('unavailable') ||
            errMsg.includes('Failed to get document') ||
            errMsg.includes('timed out');

          if (isOfflineOrUnavailable && retries > 0) {
            console.warn(`Firestore connecting or client offline, retrying profile fetch in ${delayMs}ms... (${retries} retries left)`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return loadProfile(retries - 1, delayMs * 1.5);
          }

          console.error('Error fetching user profile:', err);

          // If designated super admin with verified Google token, ensure uninterrupted access
          if (isSuperAdminEmail) {
            const now = new Date().toISOString();
            const fallbackSuperAdmin: UserProfile = {
              uid: firebaseUser.uid,
              email: normalizeEmail(firebaseUser.email),
              displayName: firebaseUser.displayName || 'Super Admin M737',
              photoURL: firebaseUser.photoURL || null,
              emailVerified: true,
              role: 'super_admin',
              selectedAccountType: 'super_admin',
              approvalStatus: 'active',
              createdAt: now,
              updatedAt: now,
            };
            setUserProfile(fallbackSuperAdmin);
            setIsNewUserPendingRole(false);
            setAuthError(null);
          } else {
            setAuthError('حدث تأخير في الاتصال بقاعدة البيانات. جاري إعادة المحاولة تلقائياً عند استقرار الاتصال.');
          }
        }
      };

      await loadProfile();
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => {
    setAuthError(null);
  };

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (err) {
      console.warn('Failed to refresh profile (may be offline):', err);
    }
  };

  const signInWithGoogle = async (): Promise<{ isNewUser: boolean; profile: UserProfile | null }> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const isSuperAdminEmail = isDesignatedSuperAdminUser(user);

      // Check existing profile (resilient if offline)
      let snap = null;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        snap = await getDoc(userDocRef);
      } catch (docErr) {
        console.warn('Notice checking user profile on sign in:', docErr);
      }

      if (snap && snap.exists()) {
        const profile = snap.data() as UserProfile;
        setUserProfile(profile);
        setIsNewUserPendingRole(false);
        setIsLoading(false);
        return { isNewUser: false, profile };
      } else if (isSuperAdminEmail) {
        const now = new Date().toISOString();
        const superAdminProfile: UserProfile = {
          uid: user.uid,
          email: normalizeEmail(user.email),
          displayName: user.displayName || 'Super Admin M737',
          photoURL: user.photoURL || null,
          emailVerified: true,
          role: 'super_admin',
          selectedAccountType: 'super_admin',
          approvalStatus: 'active',
          createdAt: now,
          updatedAt: now,
        };
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, superAdminProfile);
        } catch (setErr) {
          console.warn('Could not persist super admin doc immediately:', setErr);
        }
        setUserProfile(superAdminProfile);
        setIsNewUserPendingRole(false);
        setIsLoading(false);
        return { isNewUser: false, profile: superAdminProfile };
      } else {
        // New regular user: needs to choose Patient or Doctor
        setUserProfile(null);
        setIsNewUserPendingRole(true);
        setIsLoading(false);
        return { isNewUser: true, profile: null };
      }
    } catch (error: unknown) {
      setIsLoading(false);
      const err = error as AuthError;
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setAuthError('تم إلغاء نافذة تسجيل الدخول من قبل المستخدم.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة (Popups).');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('يرجى تفعيل مزود تسجيل الدخول بحساب Google (Google Sign-In) في لوحة تحكم Firebase Authentication للمشروع operating-league-dv9wh.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError('النطاق الحالي يحتاج إلى إضافته في النطاقات المصرح بها (Authorized Domains) في إعدادات Firebase Authentication.');
      } else {
        setAuthError(err.message || 'فشل تسجيل الدخول بواسطة Google.');
      }
      throw error;
    }
  };

  const registerRoleAndProfile = async (
    role: 'patient' | 'doctor',
    details: Partial<UserProfile>
  ): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('يجب تسجيل الدخول بحساب Google أولاً');
    }

    const firebaseUser = auth.currentUser;
    const now = new Date().toISOString();
    const initialApproval: ApprovalStatus = role === 'doctor' ? 'pending_approval' : 'active';

    const newProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: normalizeEmail(firebaseUser.email),
      displayName: details.displayName || firebaseUser.displayName || 'مستخدم M737',
      photoURL: firebaseUser.photoURL || null,
      emailVerified: firebaseUser.emailVerified,
      role: role,
      selectedAccountType: role,
      approvalStatus: initialApproval,
      createdAt: now,
      updatedAt: now,
      phoneNumber: details.phoneNumber || '',
      governorate: details.governorate || 'بغداد',
      ...(role === 'doctor' && {
        specialization: details.specialization || '',
        syndicateId: details.syndicateId || '',
        clinicName: details.clinicName || '',
        yearsOfExperience: details.yearsOfExperience || 0,
        consultationFee: details.consultationFee || 25000,
        workingHours: details.workingHours || '4:00 PM - 9:00 PM',
        workingDays: details.workingDays || 'السبت - الأربعاء',
        gender: details.gender || 'طبيب',
      }),
      accountStatus: 'active',
      ...(role === 'patient' && {
        bloodType: details.bloodType || '',
        emergencyContact: details.emergencyContact || '',
        medicalHistoryNotes: details.medicalHistoryNotes || '',
      }),
    };

    // Write to /users/{uid}
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userDocRef, cleanFirestoreData(newProfile));

    // If doctor, submit verification application in /doctor_applications/{uid}
    if (role === 'doctor') {
      const appRef = doc(db, 'doctor_applications', firebaseUser.uid);
      const applicationData: DoctorApplication = {
        doctorId: firebaseUser.uid,
        fullName: newProfile.displayName || 'طبيب استشاري',
        email: newProfile.email,
        phoneNumber: newProfile.phoneNumber || '',
        specialization: details.specialization || '',
        syndicateId: details.syndicateId || '',
        governorate: details.governorate || 'بغداد',
        clinicName: details.clinicName || '',
        yearsOfExperience: details.yearsOfExperience || 0,
        consultationFee: details.consultationFee || 25000,
        workingHours: details.workingHours || '4:00 PM - 9:00 PM',
        workingDays: details.workingDays || 'السبت - الأربعاء',
        gender: details.gender || 'طبيب',
        status: 'pending_approval',
        submittedAt: now,
      };
      await setDoc(appRef, cleanFirestoreData(applicationData));

      // Create Admin Notification for Super Admin
      try {
        const notifId = `notif_${Date.now()}_${firebaseUser.uid}`;
        const notifRef = doc(db, 'notifications', notifId);
        await setDoc(notifRef, cleanFirestoreData({
          id: notifId,
          titleAr: 'طلب اعتماد طبيب جديد',
          titleEn: 'New Doctor Application',
          messageAr: `قدم الطبيب د. ${newProfile.displayName} طلب اعتماد في اختصاص ${details.specialization || 'الطب العام'} برقم نقابة ${details.syndicateId || ''}.`,
          messageEn: `Dr. ${newProfile.displayName} submitted a credential application in ${details.specialization || 'General Practice'} with Syndicate ID ${details.syndicateId || ''}.`,
          type: 'doctor_application',
          read: false,
          relatedId: firebaseUser.uid,
          createdAt: now,
        }));
      } catch (err) {
        console.warn('Could not create admin notification:', err);
      }
    }

    // If patient, register in /patients/{uid}
    if (role === 'patient') {
      const patRef = doc(db, 'patients', firebaseUser.uid);
      const patientData: PatientProfile = {
        userId: firebaseUser.uid,
        fullName: newProfile.displayName || 'مريض M737',
        phoneNumber: newProfile.phoneNumber || '',
        governorate: details.governorate || 'بغداد',
        bloodType: details.bloodType || '',
        emergencyContact: details.emergencyContact || '',
        medicalHistoryNotes: details.medicalHistoryNotes || '',
        updatedAt: now,
      };
      await setDoc(patRef, cleanFirestoreData(patientData));
    }

    setUserProfile(newProfile);
    setIsNewUserPendingRole(false);
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setIsNewUserPendingRole(false);
      setAuthError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = Boolean(
    currentUser &&
    isDesignatedSuperAdminUser(currentUser) &&
    userProfile?.role === 'super_admin'
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        isNewUserPendingRole,
        authError,
        isSuperAdmin,
        signInWithGoogle,
        registerRoleAndProfile,
        signOut,
        clearAuthError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
