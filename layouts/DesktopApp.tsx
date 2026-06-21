import React, { useState, lazy, Suspense } from 'react';
import { DesktopSidebar, DesktopView } from '../components/desktop/DesktopSidebar';
import { DesktopDashboard } from '../views/desktop/DesktopDashboard';
import { DesktopStats } from '../views/desktop/DesktopStats';
import { DesktopPlan } from '../views/desktop/DesktopPlan';

const TrophyRoom = lazy(() => import('../pages/TrophyRoom'));
const Settings   = lazy(() => import('../pages/Settings'));

const Loader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
  </div>
);

export const DesktopApp: React.FC = () => {
  const [view, setView] = useState<DesktopView>('dashboard');

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <DesktopSidebar currentView={view} onNavigate={setView} />
      <main className="flex-1 overflow-y-auto p-8">
        <Suspense fallback={<Loader />}>
          {view === 'dashboard' && <DesktopDashboard />}
          {view === 'stats'     && <DesktopStats />}
          {view === 'plan'      && <DesktopPlan />}
          {view === 'trophies'  && <TrophyRoom />}
          {view === 'settings'  && <Settings />}
        </Suspense>
      </main>
    </div>
  );
};
