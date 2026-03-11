import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, CalendarRange, Scale, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, AchievementDef } from '../achievements';
import * as Icons from 'lucide-react';

const Layout: React.FC = () => {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [toastAchievement, setToastAchievement] = useState<AchievementDef | null>(null);

  useEffect(() => {
    const handleUnlock = (e: CustomEvent<string[]>) => {
      const ids = e.detail;
      if (ids && ids.length > 0) {
        const ach = ACHIEVEMENTS.find(a => a.id === ids[0]);
        if (ach) {
          setToastAchievement(ach);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          setTimeout(() => setToastAchievement(null), 5000);
        }
      }
    };
    window.addEventListener('achievements-unlocked', handleUnlock as EventListener);
    return () => window.removeEventListener('achievements-unlocked', handleUnlock as EventListener);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setShowNav(false);
      } else {
        // Scrolling up
        setShowNav(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const getTierStyles = (tier: string) => {
    switch(tier) {
      case 'BRONZE': return { border: 'border-orange-700/50', bg: 'bg-orange-900/20', text: 'text-orange-500' };
      case 'SILVER': return { border: 'border-slate-300/50 shadow-[0_0_10px_rgba(203,213,225,0.2)]', bg: 'bg-slate-300/10', text: 'text-slate-300' };
      case 'GOLD': return { border: 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]', bg: 'bg-amber-500/20', text: 'text-amber-400' };
      case 'DIAMOND': return { border: 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.4)]', bg: 'bg-cyan-500/20 animate-pulse', text: 'text-cyan-400' };
      case 'ELITE': return { border: 'border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.5)]', bg: 'bg-purple-900/30', text: 'text-purple-400' };
      default: return { border: 'border-slate-700', bg: 'bg-slate-800', text: 'text-slate-500' };
    }
  };

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden font-sans bg-black">
      {/* Toast Notification */}
      {toastAchievement && (
        <div className="fixed top-6 left-6 right-6 z-[100] animate-in slide-in-from-top-10 fade-in duration-700">
          <div className={`p-5 rounded-3xl border shadow-2xl flex items-center gap-5 glass-panel premium-bisel ${getTierStyles(toastAchievement.tier).border}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 animate-[spin_3s_ease-in-out] ${getTierStyles(toastAchievement.tier).bg}`}>
              {React.createElement((Icons as any)[toastAchievement.icon] || Icons.Trophy, { 
                size: 28, 
                className: getTierStyles(toastAchievement.tier).text 
              })}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400 mb-1">¡Logro Desbloqueado!</p>
              <h3 className="text-white font-display font-bold text-lg leading-tight tracking-tight">{toastAchievement.title}</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{toastAchievement.description}</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10" onScroll={(e) => {
        const target = e.target as HTMLElement;
        const currentScrollY = target.scrollTop;
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          setShowNav(false);
        } else {
          setShowNav(true);
        }
        setLastScrollY(currentScrollY);
      }}>
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-brand-900/10 to-transparent pointer-events-none z-0"></div>
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
      
      <nav className={`fixed bottom-0 left-0 right-0 glass-panel pb-safe pt-2 px-6 z-50 rounded-t-[32px] shadow-[0_-8px_40px_rgba(0,0,0,0.6)] transition-premium ${showNav ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-between items-center h-20 max-w-md mx-auto">
          <NavLink 
            to="/plan" 
            className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-premium ${isActive ? 'text-gold-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {({ isActive }) => (
              <>
                <CalendarRange size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Plan</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/today" 
            className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-premium ${isActive ? 'text-brand-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Hoy</span>
              </>
            )}
          </NavLink>
          
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-premium ${isActive ? 'text-emerald-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {({ isActive }) => (
              <>
                <Dumbbell size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Entreno</span>
              </>
            )}
          </NavLink>
          
          <NavLink 
            to="/stats" 
            className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-premium ${isActive ? 'text-purple-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {({ isActive }) => (
              <>
                <Scale size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Peso</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/trophies" 
            className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-premium ${isActive ? 'text-amber-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {({ isActive }) => (
              <>
                <Trophy size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Logros</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;