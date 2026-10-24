import React from 'react';
import { Outlet } from 'react-router-dom';
import { ResponsiveNavigation } from '../components/navigation/ResponsiveNavigation';
import { SupportFooter } from '../components/common/SupportFooter';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <ResponsiveNavigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <SupportFooter />
    </div>
  );
};
