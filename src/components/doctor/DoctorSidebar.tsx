import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Users,
  FileSignature,
  FlaskConical,
  MessageSquare,
  Settings,
  LogOut,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile } from '../../types/auth';
import { useLanguage } from '../../localization/LanguageContext';

export type DoctorTab =
  | 'overview'
  | 'appointments'
  | 'schedule'
  | 'patients'
  | 'prescriptions'
  | 'lab_reports'
  | 'messages'
  | 'settings';

interface DoctorSidebarProps {
  currentTab: DoctorTab;
  onSelectTab: (tab: DoctorTab) => void;
  userProfile: UserProfile | null;
  pendingBookingsCount: number;
  unreadMessagesCount: number;
  onSignOut: () => void;
}

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
  currentTab,
  onSelectTab,
  userProfile,
  pendingBookingsCount,
  unreadMessagesCount,
  onSignOut,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const isPending = userProfile?.approvalStatus === 'pending_approval';

  const menuItems: {
    id: DoctorTab;
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
      id: 'appointments',
      labelAr: 'إدارة المواعيد',
      labelEn: 'Appointments',
      icon: CalendarCheck,
      badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'schedule',
      labelAr: 'الدوام وسعة المقاعد',
      labelEn: 'Hours & Capacity',
      icon: Clock,
    },
    {
      id: 'patients',
      labelAr: 'سجلات المراجعين',
      labelEn: 'Patient Records',
      icon: Users,
    },
    {
      id: 'prescriptions',
      labelAr: 'الوصفات الإلكترونية (Rx)',
      labelEn: 'E-Prescriptions (Rx)',
      icon: FileSignature,
    },
    {
      id: 'lab_reports',
      labelAr: 'التقارير المخبرية',
      labelEn: 'Lab Reports',
      icon: FlaskConical,
    },
    {
      id: 'messages',
      labelAr: 'الاستشارات والمحادثات',
      labelEn: 'Patient Messaging',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'bg-sky-600 text-white',
    },
    {
      id: 'settings',
      labelAr: 'إعدادات العيادة والحساب',
      labelEn: 'Clinic Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Doctor Identity Header */}
        <div className="p-3.5 rounded-xl bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
              {userProfile?.displayName ? userProfile.displayName.charAt(0) : <Stethoscope className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold truncate text-white">
                {userProfile?.displayName || (isAr ? 'طبيب اختصاص' : 'Specialist Doctor')}
              </h3>
              <p className="text-xs text-amber-300 font-medium truncate">
                {userProfile?.specialization || (isAr ? 'استشاري عام' : 'Consultant')}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300">
                <span>{userProfile?.governorate || (isAr ? 'العراق' : 'Iraq')}</span>
                <span>•</span>
                <span className="font-mono text-[10px] text-amber-200">
                  {userProfile?.syndicateId ? `#${userProfile.syndicateId}` : (isAr ? 'نقابة الأطباء' : 'Syndicate')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{isAr ? 'حالة الاعتماد:' : 'Status:'}</span>
            {isPending ? (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                <AlertTriangle className="w-3 h-3" />
                {isAr ? 'قيد التدقيق' : 'Pending Audit'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                {isAr ? 'معتمد ومفعل' : 'Verified & Active'}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
            {isAr ? 'مساحة العمل السريرية' : 'Clinical Workspace'}
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
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
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
