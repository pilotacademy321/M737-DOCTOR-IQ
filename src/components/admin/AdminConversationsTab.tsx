import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  User,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Eye,
  X,
  FileCheck,
  Hash,
  Paperclip,
  Lock,
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, isDesignatedSuperAdminUser } from '../../config/firebase';
import { useLanguage } from '../../localization/LanguageContext';
import { UserProfile, SUPER_ADMIN_EMAIL } from '../../types/auth';
import {
  ClinicalMessage,
  ClinicalComplaint,
  ComplaintStatus,
  MedicalAttachment,
} from '../../types/database';
import {
  PRIVACY_NOTICES,
  recordAdminAuditLog,
  createEvidenceExportPackage,
} from '../../utils/auditEvidenceUtils';
import { formatIraqDate, formatIraqTime } from '../../utils/timezoneUtils';

interface AdminConversationsTabProps {
  currentUser: import('firebase/auth').User | null;
  userProfile: UserProfile | null;
  allUsers: UserProfile[];
}

export const AdminConversationsTab: React.FC<AdminConversationsTabProps> = ({
  currentUser,
  userProfile,
  allUsers,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Strict Super Admin Verification Guard
  const isVerifiedSuperAdmin = Boolean(
    currentUser &&
    isDesignatedSuperAdminUser(currentUser) &&
    userProfile?.role === 'super_admin'
  );

  const [activeSubTab, setActiveSubTab] = useState<'complaints' | 'conversations'>('complaints');
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ClinicalMessage[]>([]);
  const [complaints, setComplaints] = useState<ClinicalComplaint[]>([]);

  // Filters
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>('all');
  const [conversationSearch, setConversationSearch] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState('');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');

  // Selected state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [reviewingComplaint, setReviewingComplaint] = useState<ClinicalComplaint | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState('');
  const [newStatusInput, setNewStatusInput] = useState<ComplaintStatus>('under_review');
  const [isUpdatingComplaint, setIsUpdatingComplaint] = useState(false);

  // Attachment review modal state
  const [attachmentReviewTarget, setAttachmentReviewTarget] = useState<{
    attachmentId: string;
    fileName?: string;
    messageText?: string;
  } | null>(null);
  const [attachmentData, setAttachmentData] = useState<MedicalAttachment | null>(null);
  const [loadingAttachment, setLoadingAttachment] = useState(false);
  const [attachmentAuthConfirmed, setAttachmentAuthConfirmed] = useState(false);

  // Evidence export modal state
  const [exportPackageData, setExportPackageData] = useState<{
    packageData: Record<string, unknown>;
    checksumSha256: string;
    exportJsonString: string;
  } | null>(null);
  const [isExportingEvidence, setIsExportingEvidence] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Helper to safely convert any Firestore Timestamp, Date, or string to standard ISO string
  const toSafeIsoString = (val: unknown): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (val instanceof Date) return isNaN(val.getTime()) ? '' : val.toISOString();
    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      if (typeof obj.toDate === 'function') {
        try {
          const d = (obj.toDate as () => unknown)();
          if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString();
        } catch {
          // ignore
        }
      }
      if (typeof obj.seconds === 'number' && isFinite(obj.seconds)) {
        const d = new Date(obj.seconds * 1000);
        return !isNaN(d.getTime()) ? d.toISOString() : '';
      }
      if (typeof obj._seconds === 'number' && isFinite(obj._seconds)) {
        const d = new Date(obj._seconds * 1000);
        return !isNaN(d.getTime()) ? d.toISOString() : '';
      }
    }
    if (typeof val === 'number') {
      const d = new Date(val < 1e11 ? val * 1000 : val);
      return !isNaN(d.getTime()) ? d.toISOString() : '';
    }
    return String(val);
  };

  // Fetch all messages and complaints
  const fetchData = async () => {
    if (!isVerifiedSuperAdmin) return;
    setIsLoading(true);
    try {
      // 1. Fetch complaints
      const complaintsSnap = await getDocs(collection(db, 'complaints'));
      const complaintsList: ClinicalComplaint[] = [];
      complaintsSnap.forEach((d) => {
        const raw = d.data();
        const data = raw as ClinicalComplaint;
        const normalizedCreatedAt = toSafeIsoString(
          data.createdAt || (raw as Record<string, unknown>).timestamp
        );
        complaintsList.push({
          ...data,
          id: d.id,
          createdAt: normalizedCreatedAt,
        });
      });
      complaintsList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setComplaints(complaintsList);

      // 2. Fetch messages
      const messagesSnap = await getDocs(collection(db, 'messages'));
      const msgList: ClinicalMessage[] = [];
      messagesSnap.forEach((d) => {
        const raw = d.data();
        const data = raw as ClinicalMessage;
        const convId = data.conversationId || `${data.doctorId}_${data.patientId}`;
        const normalizedSentAt = toSafeIsoString(
          data.sentAt ||
            (raw as Record<string, unknown>).timestamp ||
            (raw as Record<string, unknown>).createdAt
        );
        msgList.push({
          ...data,
          id: d.id,
          conversationId: convId,
          sentAt: normalizedSentAt,
        });
      });
      msgList.sort((a, b) => (a.sentAt || '').localeCompare(b.sentAt || ''));
      setMessages(msgList);

      // Record audit log for admin accessing the audit center
      await recordAdminAuditLog({
        actorUid: currentUser?.uid || 'super_admin',
        actorEmail: currentUser?.email || SUPER_ADMIN_EMAIL,
        action: 'super_admin_accessed_conversation_audit_dashboard',
        targetUid: 'system_conversations_and_disputes',
        metadata: `Retrieved ${msgList.length} messages, ${complaintsList.length} complaints`,
      });
    } catch (err) {
      console.error('Failed to fetch conversation audit data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVerifiedSuperAdmin) {
      fetchData();
    }
  }, [isVerifiedSuperAdmin]);

  // Group messages by conversation
  const conversationsMap = new Map<
    string,
    {
      conversationId: string;
      doctorId: string;
      patientId: string;
      messages: ClinicalMessage[];
      lastMessage?: ClinicalMessage;
      complaintCount: number;
    }
  >();

  messages.forEach((m) => {
    const convId = m.conversationId || `${m.doctorId}_${m.patientId}`;
    if (!conversationsMap.has(convId)) {
      conversationsMap.set(convId, {
        conversationId: convId,
        doctorId: m.doctorId,
        patientId: m.patientId,
        messages: [],
        complaintCount: 0,
      });
    }
    const entry = conversationsMap.get(convId)!;
    entry.messages.push(m);
    const mTime = typeof m.sentAt === 'string' ? m.sentAt : toSafeIsoString(m.sentAt);
    const lastTime = entry.lastMessage
      ? typeof entry.lastMessage.sentAt === 'string'
        ? entry.lastMessage.sentAt
        : toSafeIsoString(entry.lastMessage.sentAt)
      : '';
    if (!entry.lastMessage || mTime > lastTime) {
      entry.lastMessage = m;
    }
  });

  // Attach complaint counts
  complaints.forEach((c) => {
    if (c.conversationId && conversationsMap.has(c.conversationId)) {
      conversationsMap.get(c.conversationId)!.complaintCount += 1;
    }
  });

  const conversationList = Array.from(conversationsMap.values()).sort((a, b) => {
    const timeA = a.lastMessage?.sentAt || '';
    const timeB = b.lastMessage?.sentAt || '';
    return timeB.localeCompare(timeA);
  });

  // Helper to look up user name
  const getUserDisplayName = (uid: string, fallback: string) => {
    const u = allUsers.find((usr) => usr.uid === uid);
    return u?.displayName || fallback;
  };

  // Filtered complaints
  const filteredComplaints = complaints.filter((c) => {
    const q = complaintSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.caseId.toLowerCase().includes(q) ||
      c.reporterName.toLowerCase().includes(q) ||
      c.reportedPartyName.toLowerCase().includes(q) ||
      c.reason.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);

    const matchesStatus = complaintStatusFilter === 'all' || c.status === complaintStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered conversations
  const filteredConversations = conversationList.filter((conv) => {
    const q = conversationSearch.toLowerCase().trim();
    const docName = getUserDisplayName(conv.doctorId, '').toLowerCase();
    const patName = getUserDisplayName(conv.patientId, '').toLowerCase();

    const matchesSearch =
      !q ||
      conv.conversationId.toLowerCase().includes(q) ||
      docName.includes(q) ||
      patName.includes(q) ||
      conv.doctorId.toLowerCase().includes(q) ||
      conv.patientId.toLowerCase().includes(q);

    const matchesAppointment =
      !appointmentFilter.trim() ||
      conv.messages.some((m) => m.appointmentId === appointmentFilter.trim());

    const matchesDateStart =
      !dateFilterStart ||
      conv.messages.some((m) => {
        const s = typeof m.sentAt === 'string' ? m.sentAt : toSafeIsoString(m.sentAt);
        return s.split('T')[0] >= dateFilterStart;
      });

    const matchesDateEnd =
      !dateFilterEnd ||
      conv.messages.some((m) => {
        const s = typeof m.sentAt === 'string' ? m.sentAt : toSafeIsoString(m.sentAt);
        return s.split('T')[0] <= dateFilterEnd;
      });

    return matchesSearch && matchesAppointment && matchesDateStart && matchesDateEnd;
  });

  // Active selected conversation
  const activeConversation = selectedConversationId
    ? conversationsMap.get(selectedConversationId) || null
    : null;

  // Active thread messages
  const activeThreadMessages = activeConversation
    ? [...activeConversation.messages].sort((a, b) =>
        (a.sentAt || '').localeCompare(b.sentAt || '')
      )
    : [];

  // Update Complaint Status & Notes
  const handleSaveComplaintReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingComplaint || !currentUser) return;

    setIsUpdatingComplaint(true);
    try {
      const now = new Date().toISOString();
      const compRef = doc(db, 'complaints', reviewingComplaint.id);

      await updateDoc(compRef, {
        status: newStatusInput,
        authorizedReviewNotes: reviewNotesInput,
        reviewedByUid: currentUser.uid,
        reviewedByEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        updatedAt: now,
      });

      // Record immutable audit log
      await recordAdminAuditLog({
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        action: 'super_admin_updated_dispute_complaint',
        targetRecord: reviewingComplaint.caseId,
        targetUid: reviewingComplaint.reportedPartyUid,
        metadata: `Status changed to ${newStatusInput}. Notes: ${reviewNotesInput}`,
      });

      setSuccessNotice(
        isAr
          ? `تم تحديث ملف القضية (${reviewingComplaint.caseId}) وتسجيل القرار في سجل الرقابة.`
          : `Case (${reviewingComplaint.caseId}) updated and decision logged to audit trail.`
      );

      setReviewingComplaint(null);
      await fetchData();
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err) {
      console.error('Failed to update complaint review:', err);
    } finally {
      setIsUpdatingComplaint(false);
    }
  };

  // Open Attachment Review with separate authorization
  const handleRequestAttachmentReview = async (attachmentId: string, fileName?: string) => {
    setAttachmentReviewTarget({ attachmentId, fileName });
    setAttachmentAuthConfirmed(false);
    setAttachmentData(null);
  };

  // Confirm authorization & load attachment
  const handleConfirmAttachmentAccess = async () => {
    if (!attachmentReviewTarget || !currentUser) return;
    setLoadingAttachment(true);
    try {
      // Record immutable audit log
      await recordAdminAuditLog({
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        action: 'admin_reviewed_sensitive_attachment',
        targetRecord: attachmentReviewTarget.attachmentId,
        targetUid: selectedConversationId || 'unknown_conversation',
        metadata: `Inspected medical attachment (${attachmentReviewTarget.fileName || attachmentReviewTarget.attachmentId})`,
      });

      // Query attachment from medical_attachments
      const snap = await getDocs(collection(db, 'medical_attachments'));
      let found: MedicalAttachment | null = null;
      snap.forEach((d) => {
        if (d.id === attachmentReviewTarget.attachmentId) {
          found = { ...d.data(), id: d.id } as MedicalAttachment;
        }
      });

      setAttachmentData(found);
      setAttachmentAuthConfirmed(true);
    } catch (err) {
      console.error('Failed to load attachment:', err);
    } finally {
      setLoadingAttachment(false);
    }
  };

  // Generate & Export Evidence Package with SHA-256 seal
  const handleExportEvidence = async (convId: string, complaintTarget?: ClinicalComplaint | null) => {
    const conv = conversationsMap.get(convId);
    if (!conv || !currentUser) return;

    setIsExportingEvidence(true);
    try {
      const packageResult = await createEvidenceExportPackage({
        complaint: complaintTarget || null,
        conversationId: convId,
        messages: conv.messages,
        auditorUid: currentUser.uid,
        auditorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        reasonForExport: complaintTarget
          ? `Dispute Investigation (${complaintTarget.caseId})`
          : 'Administrative Conversation Audit',
      });

      // Record immutable audit log
      await recordAdminAuditLog({
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || SUPER_ADMIN_EMAIL,
        action: 'super_admin_exported_conversation_evidence',
        targetRecord: complaintTarget?.caseId || convId,
        targetUid: conv.doctorId,
        metadata: `Generated evidence bundle with SHA-256: ${packageResult.checksumSha256}`,
      });

      setExportPackageData(packageResult);
    } catch (err) {
      console.error('Failed to create evidence package:', err);
    } finally {
      setIsExportingEvidence(false);
    }
  };

  // Download Evidence JSON file
  const handleDownloadEvidenceFile = () => {
    if (!exportPackageData) return;
    const blob = new Blob([exportPackageData.exportJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `M737_EVIDENCE_${Date.now()}_SEALED.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // If identity check fails
  if (!isVerifiedSuperAdmin) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-rose-950">
          {isAr ? 'قسم محمي: صلاحيات الإدارة العليا فقط' : 'Protected Section: Super Admin Only'}
        </h3>
        <p className="text-xs text-rose-800 max-w-lg mx-auto leading-relaxed">
          {isAr
            ? `هذا القسم مخصص حصرياً للمشرف الإداري المعتمد (${SUPER_ADMIN_EMAIL}) الموثق ببريد إلكتروني نشط ومعتمد عبر خوادم Google Auth. لا تتوفر صلاحية التدقيق للحسابات الأخرى.`
            : `This section is restricted strictly to the designated Super Admin (${SUPER_ADMIN_EMAIL}) with a verified email token.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            <span>
              {isAr
                ? 'تدقيق المحادثات السريرية وسجل النزاعات والشكاوى'
                : 'Conversation Audit & Dispute Investigation'}
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {isAr
              ? 'نظام الرقابة الإدارية المحمي لتوثيق الأدلة الرقمية والتحقيق في الشكاوى وضمان السلامة المهنية.'
              : 'Protected administrative system for conversation audits, dispute investigation, and evidence preservation.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{SUPER_ADMIN_EMAIL}</span>
          </div>
        </div>
      </div>

      {/* Mandatory Regulatory & Privacy Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-slate-800 shadow-2xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-start">
          <div className="text-xs font-extrabold text-amber-950 flex items-center gap-2">
            <span>{isAr ? 'إشعار الخصوصية والرقابة القانونية الصارمة' : 'Statutory Privacy & Evidence Notice'}</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-200/70 text-amber-900 font-mono font-bold">
              Strict Non-Repudiation
            </span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            {isAr ? PRIVACY_NOTICES.ar : PRIVACY_NOTICES.en}
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('complaints')}
          className={`pb-3 px-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'complaints'
              ? 'border-teal-600 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{isAr ? 'سجل بلاغات النزاعات والشكاوى' : 'Reported Disputes & Complaints'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-mono font-bold">
            {complaints.filter((c) => c.status === 'open' || c.status === 'under_review').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('conversations')}
          className={`pb-3 px-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'conversations'
              ? 'border-teal-600 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-teal-600" />
          <span>{isAr ? 'أرشيف وتدقيق المحادثات السريرية' : 'Clinical Conversation Audit Archive'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono font-bold">
            {conversationList.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: COMPLAINTS & DISPUTES MANAGEMENT */}
      {activeSubTab === 'complaints' && (
        <div className="space-y-4">
          {/* Complaints Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={complaintSearch}
                onChange={(e) => setComplaintSearch(e.target.value)}
                placeholder={
                  isAr
                    ? 'بحث برقم القضية، اسم الشاكي، الطرف المشكو بحقه، أو السبب...'
                    : 'Search by case ID, parties, reason...'
                }
                className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={complaintStatusFilter}
              onChange={(e) => setComplaintStatusFilter(e.target.value)}
              className="p-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 w-full sm:w-auto font-semibold"
            >
              <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="open">{isAr ? 'مفتوحة (Open)' : 'Open'}</option>
              <option value="under_review">{isAr ? 'قيد التدقيق (Under Review)' : 'Under Review'}</option>
              <option value="resolved">{isAr ? 'تمت التسوية (Resolved)' : 'Resolved'}</option>
              <option value="closed">{isAr ? 'مغلقة (Closed)' : 'Closed'}</option>
            </select>
          </div>

          {/* Complaints List / Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredComplaints.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-1" />
                <p className="font-bold text-slate-700">
                  {isAr ? 'لا توجد شكاوى أو بلاغات مسجلة تطابق البحث' : 'No dispute complaints found'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'جميع المحادثات والاستشارات السريرية تسير بنظام.' : 'All clinical messaging is operating normally.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredComplaints.map((c) => {
                  const statusColors: Record<ComplaintStatus, string> = {
                    open: 'bg-amber-100 text-amber-800 border-amber-200',
                    under_review: 'bg-sky-100 text-sky-800 border-sky-200',
                    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    closed: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  const reasonLabels: Record<string, string> = {
                    harassment: isAr ? 'مضايقة أو إساءة' : 'Harassment',
                    conflicting_claims: isAr ? 'ادعاءات متضاربة' : 'Conflicting Claims',
                    disputed_medical_advice: isAr ? 'نزاع استشارة طبية' : 'Disputed Advice',
                    inappropriate_conduct: isAr ? 'سلوك غير لائق' : 'Inappropriate Conduct',
                    impersonation: isAr ? 'انتحال هوية' : 'Impersonation',
                    financial_dispute: isAr ? 'نزاع مالي' : 'Financial Dispute',
                    other: isAr ? 'أخرى' : 'Other',
                  };

                  return (
                    <div
                      key={c.id}
                      className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {c.caseId}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              statusColors[c.status] || statusColors.open
                            }`}
                          >
                            {c.status.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            {reasonLabels[c.reason] || c.reason}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatIraqDate(c.createdAt, isAr)} - {formatIraqTime(c.createdAt, isAr)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">{isAr ? 'الجهة الشاكية:' : 'Reporter:'} </span>
                            <strong className="text-slate-800 font-bold">{c.reporterName}</strong>{' '}
                            <span className="text-[10px] text-slate-400">({c.reporterRole})</span>
                          </div>
                          <div>
                            <span className="text-slate-500">{isAr ? 'الطرف المشكو بحقه:' : 'Reported Party:'} </span>
                            <strong className="text-rose-900 font-bold">{c.reportedPartyName}</strong>{' '}
                            <span className="text-[10px] text-slate-400">({c.reportedPartyRole})</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                          {c.description}
                        </p>

                        {c.authorizedReviewNotes && (
                          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-0.5">
                            <strong className="font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                              <span>{isAr ? 'ملاحظات وتوجيهات الإدارة العليا:' : 'Admin Audit Notes:'}</span>
                            </strong>
                            <p className="text-[11px] leading-relaxed">{c.authorizedReviewNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 self-end lg:self-center">
                        {c.conversationId && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedConversationId(c.conversationId || null);
                              setActiveSubTab('conversations');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>{isAr ? 'فتح المحادثة المرتبطة' : 'Audit Conversation'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setReviewingComplaint(c);
                            setReviewNotesInput(c.authorizedReviewNotes || '');
                            setNewStatusInput(c.status);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isAr ? 'تحديث قرار التحقيق' : 'Update Review'}</span>
                        </button>

                        {c.conversationId && (
                          <button
                            type="button"
                            onClick={() => handleExportEvidence(c.conversationId!, c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>{isAr ? 'تصدير حزمة الأدلة' : 'Export Evidence'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CONVERSATION AUDIT ARCHIVE */}
      {activeSubTab === 'conversations' && (
        <div className="space-y-4">
          {/* Audit Search Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isAr ? 'بحث بالاسم أو المعرف (UID / Conv ID)' : 'Search by Name / ID'}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                  placeholder={isAr ? 'اسم الطبيب أو المراجع...' : 'Search doctor or patient...'}
                  className="w-full ps-8 pe-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isAr ? 'تصفية برقم الموعد (Appointment ID)' : 'Appointment ID'}
              </label>
              <input
                type="text"
                value={appointmentFilter}
                onChange={(e) => setAppointmentFilter(e.target.value)}
                placeholder="e.g. appt_xyz"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isAr ? 'من تاريخ (توقيت العراق)' : 'From Date'}
              </label>
              <input
                type="date"
                value={dateFilterStart}
                onChange={(e) => setDateFilterStart(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isAr ? 'إلى تاريخ (توقيت العراق)' : 'To Date'}
              </label>
              <input
                type="date"
                value={dateFilterEnd}
                onChange={(e) => setDateFilterEnd(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Main 2-Column Investigation View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs h-[650px] flex overflow-hidden">
            {/* Left Conversations Sidebar */}
            <div className="w-80 sm:w-96 border-e border-slate-200 flex flex-col shrink-0">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700">
                  {isAr ? 'المحادثات السريرية الموثقة' : 'Archived Conversations'} ({filteredConversations.length})
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    {isAr ? 'لا توجد محادثات تطابق معايير البحث' : 'No conversations found'}
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = selectedConversationId === conv.conversationId;
                    const docName = getUserDisplayName(conv.doctorId, isAr ? 'طبيب استشاري' : 'Doctor');
                    const patName = getUserDisplayName(conv.patientId, isAr ? 'مراجع المنصة' : 'Patient');

                    return (
                      <button
                        key={conv.conversationId}
                        onClick={() => setSelectedConversationId(conv.conversationId)}
                        className={`w-full p-4 text-start transition-colors cursor-pointer space-y-1.5 ${
                          isSelected ? 'bg-teal-50/70 border-s-4 border-teal-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold text-slate-900 truncate">
                            {docName} ↔ {patName}
                          </span>
                          {conv.complaintCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              {isAr ? 'نزاع مفتوح' : 'Dispute'}
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          ID: {conv.conversationId}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>{conv.messages.length} {isAr ? 'رسائل' : 'msgs'}</span>
                          {conv.lastMessage && (
                            <span className="font-mono text-[10px] text-slate-400">
                              {formatIraqDate(conv.lastMessage.sentAt, isAr)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Conversation Timeline */}
            <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
              {activeConversation ? (
                <>
                  {/* Active Header with Participants & Export Action */}
                  <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                        <span>
                          {getUserDisplayName(activeConversation.doctorId, 'Doctor')} (طبيب) ↔{' '}
                          {getUserDisplayName(activeConversation.patientId, 'Patient')} (مراجع)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                          {activeConversation.conversationId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {activeConversation.messages.length} {isAr ? 'رسالة مسجلة بأختام زمنية مؤكدة' : 'messages cryptographically indexed'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExportEvidence(activeConversation.conversationId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'تصدير حزمة الأدلة الرقمية (SHA-256)' : 'Export Sealed Evidence'}</span>
                    </button>
                  </div>

                  {/* Chronological Timeline */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {activeThreadMessages.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                        {isAr ? 'لا توجد رسائل في هذه المحادثة' : 'No messages recorded'}
                      </div>
                    ) : (
                      activeThreadMessages.map((msg) => {
                        const isDoctor = msg.senderRole === 'doctor';
                        const deliveryStatus = msg.status || (msg.isRead ? 'read' : 'sent');

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                                isDoctor
                                  ? 'bg-slate-900 text-white rounded-ss-xs'
                                  : 'bg-white text-slate-900 border border-slate-200 rounded-se-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 border-b border-white/10 pb-1">
                                <span className="font-bold flex items-center gap-1">
                                  {isDoctor ? (
                                    <Stethoscope className="w-3 h-3 text-teal-400" />
                                  ) : (
                                    <User className="w-3 h-3 text-sky-400" />
                                  )}
                                  <span>{msg.senderName} ({isDoctor ? (isAr ? 'طبيب' : 'Doctor') : (isAr ? 'مراجع' : 'Patient')})</span>
                                </span>
                                <span className="font-mono text-[9px]">UID: {msg.senderId.slice(0, 8)}...</span>
                              </div>

                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                              {/* Attachment preview trigger if message includes attachment */}
                              {msg.attachmentId && (
                                <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-[11px] truncate">
                                    <Paperclip className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="truncate">{msg.attachmentFileName || 'Medical Attachment'}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRequestAttachmentReview(msg.attachmentId!, msg.attachmentFileName)}
                                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold cursor-pointer shrink-0"
                                  >
                                    {isAr ? 'معاينة المرفق' : 'Inspect'}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Meta & Status */}
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 px-1 font-mono">
                              <span>
                                {formatIraqDate(msg.sentAt, isAr)} {formatIraqTime(msg.sentAt, isAr)}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{deliveryStatus}</span>
                              {msg.appointmentId && (
                                <>
                                  <span>•</span>
                                  <span>Appt: {msg.appointmentId}</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                  {isAr ? 'اختر محادثة من القائمة لاستعراض شريط الرسائل الزمني' : 'Select a conversation from the sidebar'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINT INVESTIGATION & REVIEW NOTES MODAL */}
      {reviewingComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-extrabold">{isAr ? 'تحديث قرار التحقيق والملاحظات' : 'Update Audit Decision'}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Case: {reviewingComplaint.caseId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewingComplaint(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComplaintReview} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'حالة ملف النزاع' : 'Investigation Status'}
                </label>
                <select
                  value={newStatusInput}
                  onChange={(e) => setNewStatusInput(e.target.value as ComplaintStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-bold focus:bg-white focus:outline-none"
                >
                  <option value="open">{isAr ? 'مفتوحة (Open)' : 'Open'}</option>
                  <option value="under_review">{isAr ? 'قيد التدقيق والتحقيق (Under Review)' : 'Under Review'}</option>
                  <option value="resolved">{isAr ? 'تمت التسوية وإنهاء النزاع (Resolved)' : 'Resolved'}</option>
                  <option value="closed">{isAr ? 'مغلقة وحفظ الأوراق (Closed)' : 'Closed'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'ملاحظات التحقيق وقرار الإدارة العليا' : 'Authorized Review Notes & Verdict'}
                </label>
                <textarea
                  rows={4}
                  value={reviewNotesInput}
                  onChange={(e) => setReviewNotesInput(e.target.value)}
                  placeholder={
                    isAr
                      ? 'سجل التوجيهات الإدارية، نتائج تدقيق المحادثة، أو القرارات المتخذة...'
                      : 'Record administrative audit findings and disciplinary actions...'
                  }
                  required
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingComplaint(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingComplaint || !reviewNotesInput.trim()}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isUpdatingComplaint ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ وتثبيت القرار' : 'Commit Decision')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEPARATE AUTHORIZATION ATTACHMENT REVIEW MODAL */}
      {attachmentReviewTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-700" />
                <h3 className="text-sm font-extrabold text-purple-950">
                  {isAr ? 'طلب إذن فحص مرفق طبي سري' : 'Confidential Medical Attachment Audit'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAttachmentReviewTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!attachmentAuthConfirmed ? (
                <>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                    <p className="font-bold">
                      {isAr
                        ? 'تنبيه سرية السجلات الطبية (HIPAA / Syndicate Compliance):'
                        : 'Confidentiality & Compliance Warning:'}
                    </p>
                    <p className="leading-relaxed">
                      {isAr
                        ? 'هذا المستند مشفر ويتضمن بيانات طبية خاصة. بالنقر على زر المتابعة، تؤكد بصفتك المشرف الإداري المعتمد أنك تفحص هذا الملف لغرض التحقيق في شكوى رسمية أو نزاع مسجل، وسيتم توثيق هذا الإجراء فوراً في سجل الرقابة الحكومي غير القابل للإلغاء.'
                        : 'Accessing this medical attachment is subject to strict audit. Your inspection will be permanently recorded in the immutable audit log.'}
                    </p>
                  </div>

                  <div className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>Attachment ID: {attachmentReviewTarget.attachmentId}</div>
                    {attachmentReviewTarget.fileName && <div>File Name: {attachmentReviewTarget.fileName}</div>}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAttachmentReviewTarget(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAttachmentAccess}
                      disabled={loadingAttachment}
                      className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{loadingAttachment ? (isAr ? 'جاري التحقق...' : 'Authenticating...') : (isAr ? 'تأكيد الإذن واستعراض المرفق' : 'Confirm & Authorize Access')}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isAr ? 'تم التحقق من الصلاحية وتسجيل الوصول الإداري في سجل الرقابة.' : 'Authorized audit access logged.'}</span>
                  </div>

                  {attachmentData?.fileData ? (
                    <div className="rounded-xl border border-slate-200 overflow-hidden max-h-80 flex items-center justify-center bg-slate-100">
                      {attachmentData.fileType.startsWith('image/') ? (
                        <img
                          src={attachmentData.fileData}
                          alt={attachmentData.fileName}
                          className="max-h-80 object-contain w-full"
                        />
                      ) : (
                        <div className="p-8 text-center space-y-2">
                          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                          <div className="text-xs font-bold text-slate-700">{attachmentData.fileName}</div>
                          <a
                            href={attachmentData.fileData}
                            download={attachmentData.fileName}
                            className="inline-block px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold"
                          >
                            {isAr ? 'تحميل المستند الطبي' : 'Download Document'}
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                      {isAr ? 'الملف الطبي محفوظ في مسار التخزين الخاص.' : 'Attachment file reference stored.'}
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAttachmentReviewTarget(null)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                    >
                      {isAr ? 'إغلاق نافذة المعاينة' : 'Close Preview'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEALED EVIDENCE EXPORT MODAL */}
      {exportPackageData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black">{isAr ? 'حزمة الأدلة الرقمية المعتمدة' : 'Tamper-Evident Evidence Package'}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">SEALED WITH SHA-256</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportPackageData(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4" />
                    <span>Cryptographic SHA-256 Checksum:</span>
                  </span>
                  <span>VALID</span>
                </div>
                <div className="p-2 rounded bg-black/50 text-[11px] break-all text-amber-300 font-bold">
                  {exportPackageData.checksumSha256}
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">
                  {isAr ? 'شهادة التوثيق الرقمي وعدم الإنكار:' : 'Non-Repudiation Certificate:'}
                </p>
                <p>
                  {isAr
                    ? 'تم تجميع وتشفير كافة السجلات الزمنية لهذه المحادثة والشكاوى المرتبطة بها في حزمة بيانات رسمية موحدة. أي تغيير في حرف واحد أو طابع زمني يبطل صحة هذا الختم المشفر.'
                    : 'All message records and metadata are cryptographically sealed. Any tampering will invalidate the SHA-256 hash checksum.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExportPackageData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadEvidenceFile}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'تحميل ملف الأدلة الرسمي (.json)' : 'Download Sealed Evidence File'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
