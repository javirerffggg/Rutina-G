import React, { useEffect, useRef } from 'react';
import { X, Dumbbell, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LiveActivityState } from '../hooks/useLiveActivity';

interface Props {
  state: LiveActivityState;
  onDismissRest: () => void;
  onAddRest: () => void;
  showNav: boolean;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const fmtElapsed = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

export const LiveActivityPill: React.FC<Props> = ({ state, onDismissRest, onAddRest, showNav }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { active, restTimer, restTotal, elapsedSeconds, exerciseName, setsCompleted, setsTotal, sessionState } = state;

  // Hide pill when already on the workout page
  const onWorkoutPage = location.pathname === '/' || location.pathname === '/workout';

  const isResting = restTimer !== null && restTimer > 0;
  const progress = isResting ? restTimer! / restTotal : 0;
  const CIRC = 2 * Math.PI * 11; // r=11 on 26×26 viewBox

  // Vibrate at 10 s left
  const didPulse = useRef(false);
  useEffect(() => {
    if (isResting && restTimer === 10 && !didPulse.current) {
      didPulse.current = true;
      if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
    }
    if (!isResting) didPulse.current = false;
  }, [restTimer, isResting]);

  // Don't render on workout screen or when idle
  if (!active || sessionState === 'idle' || onWorkoutPage) return null;

  const isFinished = sessionState === 'finished';
  const isUrgent   = isResting && restTimer! <= 10;

  return (
    <div
      className="fixed left-3 right-3 z-[60] transition-all duration-500 ease-in-out"
      style={{ bottom: `calc(max(16px, env(safe-area-inset-bottom, 16px)) + ${showNav ? '72px' : '16px'})` }}
    >
      {/* Animated entry */}
      <div
        onClick={() => navigate('/')}
        className={`
          w-full rounded-[22px] border cursor-pointer
          active:scale-[0.97] transition-all duration-300
          shadow-[0_8px_32px_rgba(0,0,0,0.85)]
          overflow-hidden
          ${
            isUrgent
              ? 'bg-[#1a0a0a] border-red-500/50 shadow-red-900/20'
              : isResting
              ? 'bg-[#090914] border-brand-500/40'
              : isFinished
              ? 'bg-[#051410] border-emerald-500/40'
              : 'bg-[#0a0a0a] border-white/8'
          }
        `}
      >
        {/* Top progress bar (rest countdown) */}
        {isResting && (
          <div className="h-[2.5px] w-full bg-white/5">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                isUrgent
                  ? 'bg-gradient-to-r from-red-600 to-red-400'
                  : 'bg-gradient-to-r from-brand-500 to-cyan-400'
              }`}
              style={{ width: `${(1 - progress) * 100}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3">

          {/* Left icon / ring */}
          <div className="shrink-0 relative w-[28px] h-[28px]">
            {isResting ? (
              <svg viewBox="0 0 26 26" className="w-full h-full -rotate-90">
                <circle cx="13" cy="13" r="11" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                <circle
                  cx="13" cy="13" r="11" fill="none"
                  stroke={isUrgent ? '#ef4444' : '#38bdf8'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * CIRC} ${CIRC}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
            ) : isFinished ? (
              <div className="w-full h-full rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 text-[12px] font-black">✓</span>
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-brand-500/20 flex items-center justify-center">
                <Dumbbell size={14} className="text-brand-400" />
              </div>
            )}
          </div>

          {/* Center info */}
          <div className="flex-1 min-w-0">
            {isResting ? (
              <>
                <p className={`text-[9px] font-bold uppercase tracking-[0.2em] leading-none mb-0.5 ${
                  isUrgent ? 'text-red-400' : 'text-brand-400'
                }`}>
                  {isUrgent ? '⚡ ¡Prepárate!' : 'Descansando'}
                </p>
                <p className={`text-xl font-display font-black tabular-nums leading-none tracking-tighter ${
                  isUrgent ? 'text-red-400' : 'text-white'
                }`}>
                  {fmt(restTimer!)}
                </p>
              </>
            ) : isFinished ? (
              <>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400 leading-none mb-0.5">Sesión completada</p>
                <p className="text-sm font-display font-bold text-white truncate">{fmtElapsed(elapsedSeconds)}</p>
              </>
            ) : (
              <>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 leading-none mb-0.5 truncate">
                  {exerciseName || 'Entrenando'}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-display font-bold text-white tabular-nums">{fmtElapsed(elapsedSeconds)}</p>
                  {setsTotal > 0 && (
                    <p className="text-[10px] font-bold tabular-nums">
                      <span className="text-zinc-300">{setsCompleted}</span>
                      <span className="text-zinc-700">/{setsTotal} sets</span>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
            {isResting && (
              <>
                <button
                  onClick={onAddRest}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[9px] font-bold uppercase tracking-widest text-zinc-300 active:scale-95 transition-all border border-white/5"
                >+30s</button>
                <button
                  onClick={onDismissRest}
                  className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl active:scale-95 transition-all border border-red-500/20"
                ><X size={14} /></button>
              </>
            )}
            {!isResting && (
              <ChevronRight size={16} className="text-zinc-600" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
