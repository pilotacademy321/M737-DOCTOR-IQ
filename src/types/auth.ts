export type UserRole = 'patient' | 'doctor' | 'super_admin';
export type ApprovalStatus = 'active' | 'pending_approval' | 'rejected';
export type AccountStatus = 'active' | 'suspended';

export const SUPER_ADMIN_EMAIL = 'bcgmoc@gmail.com';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  role: UserRole;
  selectedAccountType: UserRole;
  approvalStatus: ApprovalStatus;
  accountStatus?: AccountStatus;
  createdAt: string;
  updatedAt: string;

  // Optional demographic & clinical attributes
  phoneNumber?: string;
  governorate?: string;
  specialization?: string;
  syndicateId?: string;
  clinicName?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  workingHours?: string;
  workingDays?: string;
  gender?: string;
  bloodType?: string;
  emergencyContact?: string;
  medicalHistoryNotes?: string;
}

export interface DoctorApplication {
  doctorId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  syndicateId: string;
  governorate: string;
  clinicName?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  workingHours?: string;
  workingDays?: string;
  gender?: string;
  status: ApprovalStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface PatientProfile {
  userId: string;
  fullName: string;
  phoneNumber: string;
  governorate: string;
  bloodType?: string;
  emergencyContact?: string;
  medicalHistoryNotes?: string;
  updatedAt: string;
}

export type SubscriptionPlanType = 'custom' | '1_month' | '3_months' | '6_months' | '1_year' | 'lifetime';
export type PaymentStatus = 'pending' | 'confirmed' | 'waived';
export type PaymentMethod = 'cash' | 'zain_cash' | 'qi_card' | 'bank_transfer' | 'manual';
export type SubscriptionStatus = 'active' | 'expired' | 'pending_payment' | 'lifetime';

export interface Subscription {
  id: string;
  doctorId: string;
  doctorName: string;
  planType: SubscriptionPlanType;
  durationDays: number;
  priceIqd: number;
  startDate: string;
  expiryDate?: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  status: SubscriptionStatus;
  notes?: string;
  createdByUid: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotification {
  id: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: 'doctor_application' | 'subscription_expiring' | 'subscription_expired' | 'system_alert' | 'doctor_approved';
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface AuditLog {
  logId: string;
  actorUid: string;
  actorEmail?: string;
  action: string;
  targetRecord?: string;
  targetUid: string;
  timestamp: string;
  metadata?: string;
}

export interface AuthContextType {
  currentUser: import('firebase/auth').User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isNewUserPendingRole: boolean;
  authError: string | null;
  isSuperAdmin: boolean;
  signInWithGoogle: () => Promise<{ isNewUser: boolean; profile: UserProfile | null }>;
  registerRoleAndProfile: (
    role: 'patient' | 'doctor',
    details: Partial<UserProfile>
  ) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  refreshProfile: () => Promise<void>;
}
