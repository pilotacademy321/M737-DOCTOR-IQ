import React from 'react';
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  FileSignature,
  FlaskConical,
  MessageSquare,
  Bell,
  User,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../../types/auth';
import { useLanguage } from '../../localization/LanguageContext';

export type PatientTab =
  | 'overview'
  | 'search_doctors'
  | 'appointments'
  | 'prescriptions'
  | 'lab_reports'
  | 'messages'
  | 'notifications'
  | 'profile';

interface PatientSidebarProps {
  currentTab: PatientTab;
  onSelectTab: (tab: PatientTab) => void;
  userProfile: UserProfile | null;
  unreadNotifsCount: number;
  unreadMessagesCount: number;
  onSignOut: () => void;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  currentTab,
  onSelectTab,
  userProfile,
  unreadNotifsCount,
  unreadMessagesCount,
  onSignOut,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const menuItems: {
    id: PatientTab;
    labelAr: string;
    labelEn: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      labelAr: 'نظرة عامة',
      labelEn: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'search_doctors',
      labelAr: 'البحث عن طبيب وحجز',
      labelEn: 'Find a Doctor & Book',
      icon: Search,
    },
    {
      id: 'appointments',
      labelAr: 'مواعيدي وحجوزاتي',
      labelEn: 'My Appointments',
      icon: CalendarCheck,
    },
    {
      id: 'prescriptions',
      labelAr: 'وصفاتي الطبية (Rx)',
      labelEn: 'My Prescriptions',
      icon: FileSignature,
    },
    {
      id: 'lab_reports',
      labelAr: 'الفحوصات والتقارير',
      labelEn: 'Lab Reports',
      icon: FlaskConical,
    },
    {
      id: 'messages',
      labelAr: 'محادثات الأطباء',
      labelEn: 'Doctor Messaging',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'bg-teal-600 text-white',
    },
    {
      id: 'notifications',
      labelAr: 'الإشعارات والتنبيهات',
      labelEn: 'Notifications',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'profile',
      labelAr: 'الملف الشخصي',
      labelEn: 'Patient Profile',
      icon: User,
    },
  ];

  return (
    <aside className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Patient Identity Header */}
        <div className="p-3.5 rounded-xl bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
              {userProfile?.displayName ? userProfile.displayName.charAt(0) : <User className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold truncate text-white">
                {userProfile?.displayName || (isAr ? 'المراجع' : 'Patient')}
              </h3>
              <p className="text-xs text-sky-300 font-medium truncate font-mono">
                {userProfile?.phoneNumber || userProfile?.email || 'M737 Patient'}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300">
                <span>{userProfile?.governorate || (isAr ? 'بغداد' : 'Baghdad')}</span>
                <span>•</span>
                <span className="font-mono text-[10px] text-sky-200">
                  {userProfile?.bloodType ? `Blood: ${userProfile.bloodType}` : (isAr ? 'حساب مراجع' : 'Verified')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{isAr ? 'حالة الحساب:' : 'Account:'}</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              {isAr ? 'مراجع معتمد' : 'Verified Patient'}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
            {isAr ? 'بوابة الرعاية السريرية' : 'Patient Portal'}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span>{isAr ? item.labelAr : item.labelEn}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                      item.badgeColor || 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Sign Out */}
      <div className="pt-4 border-t border-slate-100 mt-6">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{isAr ? 'تسجيل الخروج الآمن' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
};
