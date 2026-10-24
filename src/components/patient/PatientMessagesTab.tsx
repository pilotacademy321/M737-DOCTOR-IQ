import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Search,
  CheckCheck,
  Check,
  ShieldCheck,
  Stethoscope,
  AlertTriangle,
  ShieldAlert,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ClinicalMessage, AppointmentRecord, ComplaintReason } from '../../types/database';
import { UserProfile } from '../../types/auth';
import { useLanguage } from '../../localization/LanguageContext';
import { PRIVACY_NOTICES, recordAdminAuditLog } from '../../utils/auditEvidenceUtils';
import { cleanFirestoreData } from '../../utils/firestoreUtils';

interface PatientMessagesTabProps {
  messages: ClinicalMessage[];
  appointments: AppointmentRecord[];
  userProfile: UserProfile | null;
  onSendMessage: (doctorId: string, text: string) => Promise<void>;
  preselectedDoctorId?: string | null;
}

export const PatientMessagesTab: React.FC<PatientMessagesTabProps> = ({
  messages,
  appointments,
  userProfile,
  onSendMessage,
  preselectedDoctorId,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(
    preselectedDoctorId || null
  );
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Authorized treating doctors list (where patient has had an appointment or active conversation)
  const doctorMap = new Map<string, { id: string; name: string; specialty: string; lastMessage?: ClinicalMessage }>();

  appointments.forEach((app) => {
    if (!doctorMap.has(app.doctorId)) {
      doctorMap.set(app.doctorId, {
        id: app.doctorId,
        name: app.doctorName || (isAr ? 'طبيب اختصاص' : 'Specialist Doctor'),
        specialty: app.specialty || (isAr ? 'عيادة تخصصية' : 'Clinic'),
      });
    }
  });

  messages.forEach((m) => {
    const existing = doctorMap.get(m.doctorId);
    if (existing) {
      if (!existing.lastMessage || m.sentAt > existing.lastMessage.sentAt) {
        existing.lastMessage = m;
      }
    } else {
      doctorMap.set(m.doctorId, {
        id: m.doctorId,
        name: m.senderRole === 'doctor' ? m.senderName : (isAr ? 'طبيب استشاري' : 'Consultant'),
        specialty: isAr ? 'استشارات سريرية' : 'Consultation',
        lastMessage: m,
      });
    }
  });

  const doctorList = Array.from(doctorMap.values());

  // Default active doctor
  React.useEffect(() => {
    if (!activeDoctorId && doctorList.length > 0) {
      setActiveDoctorId(doctorList[0].id);
    }
  }, [doctorList, activeDoctorId]);

  const activeDoctor = activeDoctorId ? doctorMap.get(activeDoctorId) : null;

  // Filter messages for active conversation
  const currentThreadMessages = activeDoctorId
    ? messages
        .filter((m) => m.doctorId === activeDoctorId)
        .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
    : [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoctorId || !inputText.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(activeDoctorId, inputText.trim());
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  const filteredDoctors = doctorList.filter((d) => {
    if (!searchQuery.trim()) return true;
    return d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Complaint reporting state for patients
  const [isReportingComplaint, setIsReportingComplaint] = useState(false);
  const [complaintReason, setComplaintReason] = useState<ComplaintReason>('disputed_medical_advice');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintSuccessNotice, setComplaintSuccessNotice] = useState<string | null>(null);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !activeDoctorId || !complaintDescription.trim()) return;

    setComplaintSubmitting(true);
    try {
      const now = new Date().toISOString();
      const caseId = `CASE-${Date.now().toString().slice(-6)}`;
      const conversationId = `${activeDoctorId}_${userProfile.uid}`;

      const complaintData = cleanFirestoreData({
        caseId,
        conversationId,
        reportedBy: userProfile.uid,
        reporterName: userProfile.displayName || (isAr ? 'المراجع' : 'Patient'),
        reporterRole: 'patient',
        reporterEmail: userProfile.email || '',
        reportedPartyUid: activeDoctorId,
        reportedPartyName: activeDoctor?.name || (isAr ? 'طبيب العيادة' : 'Treating Doctor'),
        reportedPartyRole: 'doctor',
        reason: complaintReason,
        description: complaintDescription.trim(),
        status: 'open',
        evidencePreserved: true,
        createdAt: now,
        updatedAt: now,
      });

      await addDoc(collection(db, 'complaints'), complaintData);

      // Record immutable audit log
      await recordAdminAuditLog({
        actorUid: userProfile.uid,
        actorEmail: userProfile.email || '',
        action: 'patient_filed_dispute_complaint',
        targetRecord: caseId,
        targetUid: activeDoctorId,
        metadata: `Reason: ${complaintReason}, Conversation: ${conversationId}`,
      });

      setComplaintSuccessNotice(
        isAr
          ? `تم توثيق البلاغ وحفظ سجلات المحادثة كأدلة رسمية تحت رقم القضية (${caseId}). سيقوم المشرف الإداري المعتمد بالتدقيق.`
          : `Dispute complaint logged successfully under case (${caseId}). Super Admin notified for audit review.`
      );
      setIsReportingComplaint(false);
      setComplaintDescription('');
      setTimeout(() => setComplaintSuccessNotice(null), 6000);
    } catch (err) {
      console.error('Error submitting dispute complaint:', err);
    } finally {
      setComplaintSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            <span>{isAr ? 'المحادثات والاستشارات مع أطباء العيادات' : 'Doctor-Patient Clinical Consultations'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'تواصل سريري آمن ومباشر مع أطبائك المعالجين لمتابعة الحالة بعد الكشف أو الاستفسار عن الوصفات.'
              : 'Secure messaging with your treating physicians for post-visit care and advisory.'}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>{isAr ? 'قناة استشارية مشفرة' : 'Encrypted Health Channel'}</span>
        </div>
      </div>

      {/* Main Messaging Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs h-[600px] flex overflow-hidden">
        {/* Left Doctors List */}
        <div className="w-72 sm:w-80 border-e border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث في قائمة الأطباء...' : 'Search doctors...'}
                className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredDoctors.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {isAr
                  ? 'ستتاح محادثات الأطباء بعد تأكيد أو إتمام حجز موعد في العيادة.'
                  : 'Physician messaging opens with booked appointments.'}
              </div>
            ) : (
              filteredDoctors.map((d) => {
                const isSelected = activeDoctorId === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveDoctorId(d.id)}
                    className={`w-full p-3.5 text-start flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-teal-50/70 border-s-4 border-teal-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0">
                      {d.name.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{d.name}</h4>
                        {d.lastMessage && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(d.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-sky-700 font-semibold truncate">{d.specialty}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {d.lastMessage ? d.lastMessage.text : (isAr ? 'محادثة استشارية' : 'Clinical chat')}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          {activeDoctor ? (
            <>
              {/* Active Header */}
              <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center">
                    {activeDoctor.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{activeDoctor.name}</h3>
                    <p className="text-[10px] text-sky-700 font-semibold">{activeDoctor.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportingComplaint(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/70 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    title={isAr ? 'تقديم شكوى أو إبلاغ للإدارة العليا' : 'Report Dispute or Incident to Administration'}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{isAr ? 'تقديم شكوى / إبلاغ' : 'Report Dispute'}</span>
                  </button>
                  <div className="text-[11px] text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg font-bold">
                    {isAr ? 'محادثة مفعلة' : 'Active Channel'}
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {/* Mandatory Regulatory & Privacy Notice */}
                <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-700 flex items-start gap-2.5 shadow-2xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-start space-y-1">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{isAr ? 'إشعار الخصوصية وحماية المراجعين' : 'Clinical Privacy & Audit Notice'}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-normal">
                        (Super Admin Audit Protected)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {isAr ? PRIVACY_NOTICES.ar : PRIVACY_NOTICES.en}
                    </p>
                  </div>
                </div>

                {complaintSuccessNotice && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{complaintSuccessNotice}</span>
                  </div>
                )}

                {currentThreadMessages.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-xs text-slate-400 italic">
                    {isAr
                      ? 'لا توجد رسائل سابقة. يمكنك إرسال استفسارك الطبي لطبيبك الآن.'
                      : 'No messages yet. Send your query below.'}
                  </div>
                ) : (
                  currentThreadMessages.map((msg) => {
                    const isPatient = msg.senderRole === 'patient';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                            isPatient
                              ? 'bg-slate-900 text-white rounded-ee-xs shadow-xs'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-es-xs shadow-xs'
                          }`}
                        >
                          <div className="text-[10px] font-bold mb-1 opacity-75">
                            {isPatient ? userProfile?.displayName || (isAr ? 'أنا' : 'Me') : msg.senderName}
                          </div>
                          <div>{msg.text}</div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                          <span>
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isPatient && (
                            msg.isRead ? (
                              <CheckCheck className="w-3 h-3 text-sky-500" />
                            ) : (
                              <Check className="w-3 h-3 text-slate-400" />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSend}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب استفسارك أو متابعتك السريرية للطبيب...'
                      : 'Type your message to the doctor...'
                  }
                  className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-teal-500 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white transition-colors cursor-pointer"
                  title={isAr ? 'إرسال' : 'Send'}
                >
                  <Send className="w-4 h-4 text-amber-400" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              {isAr ? 'اختر طبيباً من القائمة للبدء بالمحادثة' : 'Select a doctor to open consultation chat'}
            </div>
          )}
        </div>
      </div>

      {/* Patient Dispute & Complaint Report Modal */}
      {isReportingComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {isAr ? 'تقديم شكوى أو إبلاغ رسمي للإدارة العليا' : 'File Official Dispute Complaint'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {isAr ? `الطبيب المعني: ${activeDoctor?.name}` : `Doctor: ${activeDoctor?.name}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportingComplaint(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitComplaint} className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-slate-700 text-[11px] leading-relaxed">
                {isAr
                  ? 'يتم تجميد وحفظ كافة رسائل المحادثة الحالية كأدلة رقمية مؤرخة (Evidence Trail)، وإحالتها للإدارة العليا المعتمدة (bcgmoc@gmail.com) للتدقيق والتحقيق وحماية حقوقك الطبية والقانونية.'
                  : 'All conversation messages will be preserved as tamper-evident digital evidence and submitted to Super Admin (bcgmoc@gmail.com) for investigation.'}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'تصنيف الشكوى أو النزاع' : 'Complaint Classification'}
                </label>
                <select
                  value={complaintReason}
                  onChange={(e) => setComplaintReason(e.target.value as ComplaintReason)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500"
                >
                  <option value="disputed_medical_advice">{isAr ? 'نزاع حول تعليمات أو وصفة طبية (Disputed Medical Advice)' : 'Disputed Medical Advice'}</option>
                  <option value="conflicting_claims">{isAr ? 'ادعاءات أو تشخيص متضارب (Conflicting Claims)' : 'Conflicting Claims'}</option>
                  <option value="harassment">{isAr ? 'إساءة لفظية أو مضايقة (Harassment)' : 'Harassment'}</option>
                  <option value="inappropriate_conduct">{isAr ? 'سلوك غير مهني أو مخالف للآداب الطبية' : 'Inappropriate Professional Conduct'}</option>
                  <option value="financial_dispute">{isAr ? 'نزاع مالي أو في أجور الكشف' : 'Financial / Fee Dispute'}</option>
                  <option value="impersonation">{isAr ? 'شكوك حول هوية الطبيب (Impersonation)' : 'Suspected Impersonation'}</option>
                  <option value="other">{isAr ? 'أسباب أخرى' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'شرح الشكوى والملاحظات' : 'Detailed Complaint Narrative'}
                </label>
                <textarea
                  rows={4}
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  placeholder={
                    isAr
                      ? 'يرجى كتابة ما حدث بوضوح لدعم مراجعة الإدارة العليا...'
                      : 'Describe the issue clearly for administrative audit...'
                  }
                  required
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportingComplaint(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={complaintSubmitting || !complaintDescription.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>
                    {complaintSubmitting
                      ? (isAr ? 'جاري توثيق الأدلة...' : 'Preserving Evidence...')
                      : (isAr ? 'إرسال الشكوى للإدارة' : 'Submit Official Complaint')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
