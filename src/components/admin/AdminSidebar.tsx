import React from 'react';
import {
  LayoutDashboard,
  FileCheck,
  Stethoscope,
  Users,
  CreditCard,
  Calendar,
  Bell,
  ScrollText,
  Settings,
  LogOut,
  ShieldCheck,
  X,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';
import { SUPER_ADMIN_EMAIL } from '../../types/auth';

export type AdminTab =
  | 'overview'
  | 'applications'
  | 'doctors'
  | 'patients'
  | 'subscriptions'
  | 'bookings'
  | 'conversations'
  | 'notifications'
  | 'audit'
  | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingApplicationsCount: number;
  unreadNotificationsCount: number;
  openComplaintsCount?: number;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingApplicationsCount,
  unreadNotificationsCount,
  openComplaintsCount = 0,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}) => {
  const { language } = useLanguage();

  const menuItems: { id: AdminTab; labelAr: string; labelEn: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', icon: LayoutDashboard },
    {
      id: 'applications',
      labelAr: 'طلبات الاعتماد المعلقة',
      labelEn: 'Doctor Applications',
      icon: FileCheck,
      badge: pendingApplicationsCount,
    },
    { id: 'doctors', labelAr: 'الأطباء والعيادات', labelEn: 'Doctors & Clinics', icon: Stethoscope },
    { id: 'patients', labelAr: 'سجل المراجعين', labelEn: 'Patients', icon: Users },
    { id: 'subscriptions', labelAr: 'الاشتراكات والتراخيص', labelEn: 'Subscriptions', icon: CreditCard },
    { id: 'bookings', labelAr: 'المواعيد السريرية', labelEn: 'Bookings', icon: Calendar },
    {
      id: 'conversations',
      labelAr: 'تدقيق المحادثات والشكاوى',
      labelEn: 'Audit & Complaints',
      icon: MessageSquare,
      badge: openComplaintsCount,
    },
    {
      id: 'notifications',
      labelAr: 'مركز الإشعارات',
      labelEn: 'Notifications',
      icon: Bell,
      badge: unreadNotificationsCount,
    },
    { id: 'audit', labelAr: 'سجل الرقابة والعمليات', labelEn: 'Audit Log', icon: ScrollText },
    { id: 'settings', labelAr: 'إعدادات المنظومة', labelEn: 'Settings', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#0A192F] text-slate-200 border-e border-[#142E54]">
      {/* Super Admin Identity Badge */}
      <div className="p-5 border-b border-[#142E54] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-300 tracking-wide uppercase">
              {language === 'ar' ? 'الإدارة العليا الموحدة' : 'Super Admin'}
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-extrabold text-white truncate">
            {language === 'ar' ? 'مجمع الطب الأول بالعراق' : 'M737 Medical Platform'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{SUPER_ADMIN_EMAIL}</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              type="button"
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span className="truncate">{language === 'ar' ? item.labelAr : item.labelEn}</span>
              </div>

              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                    isActive ? 'bg-slate-950 text-amber-300' : 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-[#142E54]">
        <button
          onClick={onSignOut}
          type="button"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-red-950/40 text-slate-300 hover:text-red-200 border border-white/10 hover:border-red-800 text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'تسجيل الخروج الآمن' : 'Secure Sign Out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed width) */}
      <aside className="hidden lg:block w-72 shrink-0 h-[calc(100vh-4.5rem)] sticky top-18 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-80 max-w-[85%] h-full z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
