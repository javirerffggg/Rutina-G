import React from 'react';
import { LayoutDashboard, BarChart2, CalendarDays, Trophy, Settings } from 'lucide-react';

export type DesktopView = 'dashboard' | 'stats' | 'plan' | 'trophies' | 'settings';

interface Props {
  currentView: DesktopView;
  onNavigate: (v: DesktopView) => void;
}

const NAV: { id: DesktopView; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'stats',     label: 'Estadísticas', icon: BarChart2 },
  { id: 'plan',      label: 'Plan',        icon: CalendarDays },
  { id: 'trophies',  label: 'Trofeos',     icon: Trophy },
  { id: 'settings',  label: 'Ajustes',     icon: Settings },
];

export const DesktopSidebar: React.FC<Props> = ({ currentView, onNavigate }) => (
  <aside className="w-56 shrink-0 flex flex-col bg-zinc-950 border-r border-zinc-800/60 h-screen sticky top-0">
    {/* Logo */}
    <div className="px-6 py-5 border-b border-zinc-800/60">
      <span className="text-lg font-bold text-white tracking-tight">Rutina<span className="text-brand-400">-G</span></span>
    </div>

    {/* Nav */}
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV.map(({ id, label, icon: Icon }) => {
        const active = currentView === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              active
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Icon size={18} className={active ? 'text-brand-400' : 'text-zinc-500'} />
            {label}
          </button>
        );
      })}
    </nav>

    {/* Footer */}
    <div className="px-5 py-4 border-t border-zinc-800/60">
      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Vista Desktop</p>
    </div>
  </aside>
);
