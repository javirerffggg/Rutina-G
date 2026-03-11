import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Timer, Dumbbell, X, ChevronRight, Zap } from 'lucide-react';

// ─── Types for the live activity state ───────────────────────────────────────
export interface LiveActivityState {
  active: boolean;          // session running
  restTimer: number | null; // seconds remaining in rest, null = no rest
  restTotal: number;        // original rest duration for progress arc
  elapsedSeconds: number;   // total session time
  exerciseName: string;     // current exercise label
  setsCompleted: number;    // sets done this session
  totalSets: number;        // total planned sets
  progressPct: number;      // 0-100 overall workout progress
}

const INITIAL: LiveActivityState = {
  active: false,
  restTimer: null,
  restTotal: 90,
  elapsedSeconds: 0,
  exerciseName: '',
  setsCompleted: 0,
  totalSets: 0,
  progressPct: 0,
};

// ─── Global event bus ─────────────────────────────────────────────────────────
export const emitLiveActivity = (state: Partial<LiveActivityState>) => {
  window.dispatchEvent(new CustomEvent('live-activity-update', { detail: state }));
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

const ARC_R = 16;
const ARC_C = 2 * Math.PI * ARC_R;

// ─── Component ────────────────────────────────────────────────────────────────
const LiveActivityPill: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<LiveActivityState>(INITIAL);
  const [expanded, setExpanded] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const expandTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for updates from Workout page
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Partial<LiveActivityState>>).detail;
      setState(prev => ({ ...prev, ...detail }));

      // Auto-expand pill when rest timer starts
      if (detail.restTimer != null && detail.restTimer > 0) {
        setExpanded(true);
        if (expandTimeout.current) clearTimeout(expandTimeout.current);
        expandTimeout.current = setTimeout(() => setExpanded(false), 5000);
      }

      // Flash "¡Listo!" when rest ends
      if (detail.restTimer === 0) {
        setJustFinished(true);
        setExpanded(true);
        setTimeout(() => { setJustFinished(false); setExpanded(false); }, 3000);
      }
    };
    window.addEventListener('live-activity-update', handler);
    return () => window.removeEventListener('live-activity-update', handler);
  }, []);

  // Don't render if session not active, or already on workout page
  const onWorkout = location.pathname === '/' || location.pathname === '/workout';
  if (!state.active || onWorkout) return null;

  const restFraction = state.restTimer != null
    ? state.restTimer / Math.max(state.restTotal, 1)
    : 0;
  const restOffset = ARC_C * (1 - restFraction);
  const isResting = state.restTimer != null && state.restTimer > 0;

  return (
    <div
      className="fixed left-4 right-4 z-[90] transition-all duration-500 ease-out pointer-events-none"
      style={{ bottom: 'max(88px, calc(env(safe-area-inset-bottom, 16px) + 72px))' }}
    >
      <div
        onClick={() => {
          if (expanded) { navigate('/'); }
          else { setExpanded(true); if (expandTimeout.current) clearTimeout(expandTimeout.current); expandTimeout.current = setTimeout(() => setExpanded(false), 5000); }
        }}
        className={`pointer-events-auto mx-auto transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer
          ${ expanded ? 'max-w-full' : 'max-w-[200px]' }
        `}
      >
        {/* ── PILL SHELL ── */}
        <div className={`relative overflow-hidden rounded-[24px] border shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500
          ${ isResting
            ? 'bg-[#0a1628] border-brand-500/60 shadow-brand-900/40'
            : justFinished
              ? 'bg-[#0a2010] border-emerald-500/60 shadow-emerald-900/40'
              : 'bg-[#0d0d0f] border-white/10'
          }
        `}>

          {/* Animated top accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] transition-all duration-500
            ${ isResting ? 'bg-gradient-to-r from-transparent via-brand-400 to-transparent'
              : justFinished ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent'
              : 'bg-gradient-to-r from-transparent via-white/10 to-transparent' }
          `} />

          <div className="flex items-center gap-3 px-4 py-3">

            {/* ── LEFT: arc timer or dumbbell ── */}
            { isResting ? (
              <div className="relative w-9 h-9 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r={ARC_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                  <circle
                    cx="20" cy="20" r={ARC_R} fill="none"
                    stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={`${ARC_C}`}
                    strokeDashoffset={restOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-black text-brand-300 tabular-nums leading-none">
                    {state.restTimer}s
                  </span>
                </div>
              </div>
            ) : justFinished ? (
              <div className="w-9 h-9 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Zap size={18} className="text-emerald-400" />
              </div>
            ) : (
              <div className="w-9 h-9 shrink-0 rounded-full bg-brand-500/15 flex items-center justify-center">
                <Dumbbell size={16} className="text-brand-400" />
              </div>
            )}

            {/* ── CENTER: info ── */}
            <div className="flex-1 min-w-0">
              { isResting ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-400 leading-none">Descansando</p>
                  <p className="text-white font-display font-bold text-sm leading-tight mt-0.5 tabular-nums">{fmt(state.restTimer!)}</p>
                </>
              ) : justFinished ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400 leading-none">¡Listo!</p>
                  <p className="text-white font-display font-bold text-sm leading-tight mt-0.5">Siguiente serie</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 leading-none truncate">{state.exerciseName || 'Entrenando'}</p>
                  <p className="text-white font-display font-bold text-sm leading-tight mt-0.5 tabular-nums">{fmt(state.elapsedSeconds)}</p>
                </>
              )}
            </div>

            {/* ── RIGHT: progress + expand hint ── */}
            { expanded ? (
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Progreso</p>
                  <p className="text-white font-display font-bold text-sm leading-tight tabular-nums">{state.progressPct}%</p>
                </div>
                <div className="flex items-center gap-1 text-brand-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Abrir</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ) : (
              <div className="shrink-0 relative w-8 h-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#d97706" strokeWidth="3"
                    strokeDasharray={`${state.progressPct}, 100`} strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-black text-white leading-none">{state.progressPct}%</span>
                </div>
              </div>
            )}

          </div>

          {/* ── EXPANDED EXTRA ROW ── */}
          { expanded && (
            <div className="px-4 pb-3 pt-0 flex items-center justify-between border-t border-white/5 mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Series</p>
                  <p className="text-white font-display font-bold text-xs tabular-nums">{state.setsCompleted}<span className="text-zinc-500">/{state.totalSets}</span></p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Tiempo</p>
                  <p className="text-white font-display font-bold text-xs tabular-nums">{fmt(state.elapsedSeconds)}</p>
                </div>
                { isResting && (
                  <div>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Descanso</p>
                    <p className="text-brand-400 font-display font-bold text-xs tabular-nums">{fmt(state.restTimer!)}</p>
                  </div>
                )}
              </div>
              <button
                onClick={e => { e.stopPropagation(); navigate('/'); }}
                className="flex items-center gap-1.5 bg-brand-600/80 hover:bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all active:scale-95"
              >
                <Dumbbell size={12} /> Ir al entreno
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LiveActivityPill;
