import { UserProfile, UserRole } from './auth';

export interface Clinic {
  id: string;
  nameAr: string;
  nameEn: string;
  governorate: string; // Baghdad, Erbil, Basra, Najaf, etc.
  address: string;
  contactPhone: string;
  contactEmail?: string;
  specialties: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface DoctorListing {
  id: string;
  userId: string;
  fullName: string;
  specialization: string;
  clinicId?: string;
  governorate: string;
  syndicateRegistrationNumber: string;
  isVerified: boolean;
  consultationFeeIqd?: number;
  availableDays?: string[];
  createdAt: string;
}

export interface AppointmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientGender?: string;
  patientAge?: number;
  doctorId: string;
  doctorName?: string;
  specialty?: string;
  clinicName?: string;
  clinicGovernorate?: string;
  secondaryPhone?: string;
  patientGovernorate?: string;
  clinicPhone?: string;
  consultationFee?: number;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes?: string;
  reasonForVisit?: string;
  attachmentIds?: string[];
  clinicalNotes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MedicalAttachment {
  id: string;
  patientId: string;
  doctorId: string;
  bookingReference?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  fileData?: string; // Secure local Base64/Data URI for private preview
  uploadedAt: string;
  notes?: string;
}

export interface DoctorPublicProfile {
  uid: string;
  syndicateId: string;
  displayName: string;
  specialization: string;
  clinicName: string;
  governorate: string;
  consultationFee: number;
  workingDays?: string;
  workingHours?: string;
  photoURL?: string | null;
  bio?: string;
  phoneNumber?: string;
  approvalStatus: string;
  yearsOfExperience?: number;
}

export interface DoctorScheduleConfig {
  doctorId: string;
  workingDays: string[]; // e.g. ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  shiftStartTime: string; // e.g. "09:00"
  shiftEndTime: string; // e.g. "15:00"
  slotDurationMinutes: number; // e.g. 20
  dailyCapacity: number; // e.g. 15
  blackoutDates: string[]; // ISO date strings e.g. "2026-10-25"
  updatedAt: string;
}

export interface PrescriptionMedicationItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface PrescriptionRecord {
  id: string;
  prescriptionNumber: string; // e.g. "RX-2026-0814"
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorSyndicateId?: string;
  clinicName: string;
  clinicGovernorate: string;
  clinicPhone?: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  diagnosis: string;
  medications: PrescriptionMedicationItem[];
  clinicalAdvice?: string;
  appointmentId?: string;
  issuedAt: string;
  digitalSignatureVerified: boolean;
}

export interface LabReportRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName?: string;
  testName: string;
  testType: 'blood' | 'imaging' | 'pathology' | 'biochemistry' | 'urine' | 'other';
  testDate: string;
  laboratoryName: string;
  findings: string;
  normalRange?: string;
  status: 'normal' | 'abnormal' | 'critical' | 'pending';
  notes?: string;
  documentUrl?: string;
  fileName?: string;
  uploadedAt: string;
}

export interface PatientClinicalSummary {
  patientId: string;
  fullName: string;
  phone: string;
  gender?: string;
  age?: number;
  bloodType?: string;
  governorate?: string;
  chronicConditions?: string[];
  allergies?: string[];
  emergencyContact?: string;
  totalVisitsWithDoctor: number;
  lastVisitDate?: string;
}

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'attachment' | 'system';

export interface ClinicalMessage {
  id: string;
  conversationId: string; // Deterministic thread ID: `${doctorId}_${patientId}`
  doctorId: string;
  doctorName?: string;
  patientId: string;
  patientName?: string;
  senderId: string;
  senderName: string;
  senderRole: 'doctor' | 'patient';
  recipientId: string;
  recipientName?: string;
  text: string;
  messageType?: MessageType;
  appointmentId?: string;
  attachmentId?: string;
  attachmentFileName?: string;
  attachmentFileType?: string;
  attachmentUrl?: string;
  status?: MessageDeliveryStatus;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  isRead: boolean;
  serverTimestamp?: unknown;
}

export type ComplaintStatus = 'open' | 'under_review' | 'resolved' | 'closed';

export type ComplaintReason =
  | 'harassment'
  | 'impersonation'
  | 'conflicting_claims'
  | 'disputed_medical_advice'
  | 'unauthorized_sharing'
  | 'inappropriate_conduct'
  | 'financial_dispute'
  | 'other';

export interface ClinicalComplaint {
  id: string;
  caseId: string; // e.g. "CASE-2026-8941"
  conversationId?: string;
  appointmentId?: string;
  reportedBy: string; // reporter UID
  reporterName: string;
  reporterRole: 'patient' | 'doctor';
  reporterEmail?: string;
  reportedPartyUid: string;
  reportedPartyName: string;
  reportedPartyRole: 'patient' | 'doctor';
  reason: ComplaintReason;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  authorizedReviewNotes?: string;
  reviewedByUid?: string;
  reviewedByEmail?: string;
  evidencePreserved: boolean;
  evidenceIntegrityHash?: string;
  evidenceExportCount?: number;
  lastExportedAt?: string;
}

export interface DoctorNotification {
  id: string;
  userId: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: 'new_booking' | 'booking_cancelled' | 'new_message' | 'lab_ready' | 'system' | 'complaint_update';
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface SystemAuditLog {
  id: string;
  performedByUid: string;
  action: string;
  targetCollection: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export type { UserProfile, UserRole };
