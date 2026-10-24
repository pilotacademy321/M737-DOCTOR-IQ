import React from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  FileCheck,
  CheckCheck,
} from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { AdminNotification } from '../../types/auth';

interface AdminNotificationsTabProps {
  notifications: AdminNotification[];
  onMarkAsRead: (notifId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const { language } = useLanguage();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'doctor_application':
        return <FileCheck className="w-5 h-5 text-amber-600" />;
      case 'doctor_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'subscription_expiring':
      case 'subscription_expired':
        return <CreditCard className="w-5 h-5 text-sky-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-600" />
            <span>{language === 'ar' ? 'مركز إشعارات المنظومة' : 'Platform Notification Center'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {language === 'ar'
              ? 'تنبيهات فورية بالطلبات السريرية الجديدة وتحديثات الاشتراكات الموثقة.'
              : 'Real-time alerts on physician applications and subscription lifecycle events.'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark All As Read'}</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Bell className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {language === 'ar' ? 'لا توجد إشعارات مسجلة في النظام' : 'No notifications recorded'}
            </p>
            <p className="text-xs text-slate-400">
              {language === 'ar'
                ? 'ستظهر هنا الإشعارات الحقيقية عند تقديم الأطباء لطلباتهم أو انتهاء تراخيص الاشتراك.'
                : 'Real events will be recorded here from Firestore triggers.'}
            </p>
          </div>
        ) : (
          notifications.map((notif, idx) => {
            const itemKey = notif.id || `admin-notif-${idx}-${notif.createdAt || ''}`;
            return (
              <div
                key={itemKey}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  notif.read ? 'bg-white' : 'bg-amber-50/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {language === 'ar' ? notif.titleAr : notif.titleEn}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {language === 'ar' ? notif.messageAr : notif.messageEn}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block pt-0.5">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>

                {!notif.read && notif.id && (
                  <button
                    type="button"
                    onClick={() => onMarkAsRead(notif.id)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  >
                    {language === 'ar' ? 'تحديد كمقروء' : 'Mark Read'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
