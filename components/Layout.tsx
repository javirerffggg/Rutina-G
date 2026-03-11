import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, CalendarRange, Scale, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, AchievementDef } from '../achievements';
import * as Icons from 'lucide-react';

const TIER_META: Record<string, { border: string; bg: string; text: string }> = {
  BRONZE:  { border: 'border-orange-700/50',                                       bg: 'bg-orange-900/20',  text: 'text-orange-500' },
  SILVER:  { border: 'border-slate-300/50 shadow-[0_0_10px_rgba(203,213,225,0.2)]', bg: 'bg-slate-300/10',  text: 'text-slate-300' },
  GOLD:    { border: 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]',  bg: 'bg-amber-500/20',  text: 'text-amber-400' },
  DIAMOND: { border: 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.4)]',   bg: 'bg-cyan-500/20',   text: 'text-cyan-400' },
  ELITE:   { border: 'border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.5)]', bg: 'bg-purple-900/30', text: 'text-purple-400' },
};
const FALLBACK_TIER = { border: 'border-zinc-700', bg: 'bg-zinc-800', text: 'text-zinc-500' };
const getTierStyles = (tier: string) => TIER_META[tier] ?? FALLBACK_TIER;

const Layout: React.FC = () => {
  const [showNav, setShowNav] = useState(true);
  const lastScrollYRef = useRef(0);
  const [toastQueue, setToastQueue] = useState<AchievementDef[]>([]);
  const toastAchievement = toastQueue[0] ?? null;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nav-visibility-change', { detail: showNav }));
  }, [showNav]);

  const handleUnlock = useCallback((e: Event) => {
    const ids = (e as CustomEvent<string[]>).detail;
    if (!ids?.length) return;
    const newAchs = ids
      .map(id => ACHIEVEMENTS.find(a => a.id === id))
      .filter(Boolean) as AchievementDef[];
    if (newAchs.length === 0) return;
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setToastQueue(prev => [...prev, ...newAchs]);
    newAchs.forEach((_, i) => {
      setTimeout(() => {
        setToastQueue(prev => prev.slice(1));
      }, 5000 * (i + 1));
    });
  }, []);

  useEffect(() => {
    window.addEventListener('achievements-unlocked', handleUnlock);
    return () => window.removeEventListener('achievements-unlocked', handleUnlock);
  }, [handleUnlock]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const currentY = (e.target as HTMLElement).scrollTop;
    if (currentY > lastScrollYRef.current && currentY > 50) {
      setShowNav(false);
    } else {
      setShowNav(true);
    }
    lastScrollYRef.current = currentY;
  }, []);

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden font-sans bg-black">

      {/* Achievement toast — respects iOS notch (safe-area-inset-top) */}
      {toastAchievement && (() => {
        const styles = getTierStyles(toastAchievement.tier);
        return (
          <div
            className="fixed left-4 right-4 z-[100] animate-in slide-in-from-top-10 fade-in duration-500"
            style={{ top: 'max(16px, env(safe-area-inset-top, 16px))' }}
          >
            <div className={`p-5 rounded-3xl border shadow-2xl flex items-center gap-5 glass-panel premium-bisel ${styles.border}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${styles.bg}`}>
                {React.createElement(
                  (Icons as any)[toastAchievement.icon] || Icons.Trophy,
                  { size: 28, className: styles.text }
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400 mb-1">
                  \u00a1Logro Desbloqueado!
                  {toastQueue.length > 1 && (
                    <span className="ml-2 text-zinc-500">+{toastQueue.length - 1} m\u00e1s</span>
                  )}
                </p>
                <h3 className="text-white font-display font-bold text-lg leading-tight tracking-tight truncate">
                  {toastAchievement.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                  {toastAchievement.description}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/*
        <main> respects iOS notch (safe-area-inset-top) via paddingTop.
        pb-28 keeps content above the floating nav bar.
        The extra safe-area-inset-bottom is handled by the nav pill itself.
      */}
      <main
        className="flex-1 overflow-y-auto no-scrollbar pb-28 relative z-10"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        onScroll={handleScroll}
      >
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-brand-900/10 to-transparent pointer-events-none z-0" />
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>

      {/*
        Nav pill — bottom-4 + safe-area-inset-bottom so it clears the
        home indicator on iPhone 13 Pro Max (34 pt).
        pb-2 gives internal breathing room above that inset.
      */}
      <nav
        className={`fixed left-0 right-0 flex justify-center z-50 transition-all duration-300 ease-in-out ${
          showNav ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'
        }`}
        style={{ bottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      >
        <div className="glass-panel rounded-[28px] shadow-[0_8px_40px_rgba(0,0,0,0.7)] border border-white/10 px-8 pt-2 pb-2 w-fit">
          <div className="flex items-center h-16 gap-8">
            <NavLink to="/plan" className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 transition-all ${ isActive ? 'text-amber-500 scale-110' : 'text-zinc-500 hover:text-zinc-300' }`
            }>
              {({ isActive }) => (<>
                <CalendarRange size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Plan</span>
              </>)}
            </NavLink>

            <NavLink to="/today" className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 transition-all ${ isActive ? 'text-brand-500 scale-110' : 'text-zinc-500 hover:text-zinc-300' }`
            }>
              {({ isActive }) => (<>
                <LayoutDashboard size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Hoy</span>
              </>)}
            </NavLink>

            <NavLink to="/" end className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 transition-all ${ isActive ? 'text-emerald-400 scale-110' : 'text-zinc-500 hover:text-zinc-300' }`
            }>
              {({ isActive }) => (<>
                <Dumbbell size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Entreno</span>
              </>)}
            </NavLink>

            <NavLink to="/stats" className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 transition-all ${ isActive ? 'text-purple-400 scale-110' : 'text-zinc-500 hover:text-zinc-300' }`
            }>
              {({ isActive }) => (<>
                <Scale size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Peso</span>
              </>)}
            </NavLink>

            <NavLink to="/trophies" className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 transition-all ${ isActive ? 'text-amber-500 scale-110' : 'text-zinc-500 hover:text-zinc-300' }`
            }>
              {({ isActive }) => (<>
                <Trophy size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Logros</span>
              </>)}
            </NavLink>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
