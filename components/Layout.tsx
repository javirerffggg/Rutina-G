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
    <div className="flex flex-col h-screen text-dark-text overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastAchievement && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-in slide-in-from-top-10 fade-in duration-500">
          <div className={`p-4 rounded-2xl border shadow-2xl flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl ${getTierStyles(toastAchievement.tier).border}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 animate-[spin_3s_ease-in-out] ${getTierStyles(toastAchievement.tier).bg}`}>
              {React.createElement((Icons as any)[toastAchievement.icon] || Icons.Trophy, { 
                size: 24, 
                className: getTierStyles(toastAchievement.tier).text 
              })}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-0.5">¡Logro Desbloqueado!</p>
              <h3 className="text-white font-bold leading-tight">{toastAchievement.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{toastAchievement.description}</p>
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
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand-900/20 to-transparent pointer-events-none z-0"></div>
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
      
      <nav className={`fixed bottom-0 left-0 right-0 glass-panel pb-safe pt-2 px-6 z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-transform duration-300 ${showNav ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-between items-center h-16 max-w-md mx-auto">
          <NavLink 
            to="/plan" 
            className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-gold-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {({ isActive }) => (
              <>
                <CalendarRange size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-wide uppercase">Plan</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/today" 
            className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-brand-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-wide uppercase">Hoy</span>
              </>
            )}
          </NavLink>
          
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-emerald-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {({ isActive }) => (
              <>
                <Dumbbell size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-wide uppercase">Entreno</span>
              </>
            )}
          </NavLink>
          
          <NavLink 
            to="/stats" 
            className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-purple-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {({ isActive }) => (
              <>
                <Scale size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-wide uppercase">Peso</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/trophies" 
            className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-amber-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {({ isActive }) => (
              <>
                <Trophy size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-wide uppercase">Logros</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;