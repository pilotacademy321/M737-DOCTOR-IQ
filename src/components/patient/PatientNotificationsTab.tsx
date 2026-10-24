import React from 'react';
import {
  Bell,
  CheckCircle2,
  CalendarCheck,
  FileSignature,
  FlaskConical,
  MessageSquare,
  AlertCircle,
  XCircle,
  Check,
} from 'lucide-react';
import { DoctorNotification } from '../../types/database';
import { useLanguage } from '../../localization/LanguageContext';

interface PatientNotificationsTabProps {
  notifications: DoctorNotification[];
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  isLoading: boolean;
}

export const PatientNotificationsTab: React.FC<PatientNotificationsTabProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <span>{isAr ? 'الإشعارات والتنبيهات السريرية' : 'Notifications & Clinical Alerts'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'متابعة تحديثات طلبات الحجز، تأكيدات المواعيد، الوصفات الجديدة، والتقارير المخبرية.'
              : 'Track booking confirmations, doctor advisories, and lab reports.'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Check className="w-3.5 h-3.5 text-slate-600" />
            <span>{isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isAr ? 'لا توجد إشعارات مسجلة لديك حالياً' : 'No notifications yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAr
                ? 'ستصلك هنا إشعارات فورية بكل جديد بخصوص مواعيدك ونتائج فحوصاتك.'
                : 'Alerts regarding your clinic appointments and reports will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n, idx) => {
              const isUnread = !n.read;
              const notifKey = n.id || `patient-notif-${idx}-${n.createdAt || ''}`;
              return (
                <div
                  key={notifKey}
                  onClick={() => isUnread && n.id && onMarkAsRead(n.id)}
                  className={`p-4 sm:p-5 transition-colors flex items-start justify-between gap-4 cursor-pointer ${
                    isUnread ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnread ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          {isAr ? n.titleAr : n.titleEn}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {isAr ? n.messageAr : n.messageEn}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>

                  {isUnread && n.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(n.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-colors shrink-0"
                    >
                      {isAr ? 'تمت القراءة' : 'Mark read'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
