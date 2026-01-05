import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, CalendarRange, Scale } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen text-dark-text overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand-900/20 to-transparent pointer-events-none z-0"></div>
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 glass-panel pb-safe pt-2 px-6 z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
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
        </div>
      </nav>
    </div>
  );
};

export default Layout;