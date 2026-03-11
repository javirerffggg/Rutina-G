import React, { useEffect, useRef } from 'react';
import { Timer, X, Dumbbell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const { active, restTimer, restTotal, elapsedSeconds, exerciseName, setsCompleted, setsTotal, sessionState } = state;

  const isResting = restTimer !== null;
  const progress = isResting ? restTimer! / restTotal : 0;
  const CIRC = 2 * Math.PI * 11; // r=11 on 26x26 viewBox

  // Pulse animation ref — vibrate at 10s left
  const didPulse = useRef(false);
  useEffect(() => {
    if (isResting && restTimer === 10 && !didPulse.current) {
      didPulse.current = true;
      if (navigator.vibrate) navigator.vibrate([100]);
    }
    if (!isResting) didPulse.current = false;
  }, [restTimer, isResting]);

  if (!active || sessionState === 'idle') return null;

  return (
    <div
      className={`fixed left-3 right-3 z-[60] transition-all duration-500 ease-in-out ${
        showNav ? '' : ''
      }`}
      style={{ bottom: `calc(max(16px, env(safe-area-inset-bottom, 16px)) + 72px)` }}
    >
      <div
        onClick={() => navigate('/')}
        className={`w-full rounded-[22px] border shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-300 ${
          isResting
            ? 'bg-[#0a0a14] border-brand-500/40 shadow-brand-900/30'
            : sessionState === 'finished'
              ? 'bg-[#061410] border-emerald-500/40'
              : 'bg-[#0a0a0a] border-white/10'
        }`}
      >
        {/* Arc progress bar top edge */}
        {isResting && (
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-[22px]">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(1 - progress) * 100}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3">

          {/* Left: ring timer or icon */}
          <div className="shrink-0 relative w-[26px] h-[26px]">
            {isResting ? (
              <svg viewBox="0 0 26 26" className="w-full h-full -rotate-90">
                <circle cx="13" cy="13" r="11" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
                <circle
                  cx="13" cy="13" r="11" fill="none"
                  stroke={restTimer! <= 10 ? '#ef4444' : '#38bdf8'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * CIRC} ${CIRC}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
            ) : sessionState === 'finished' ? (
              <div className="w-full h-full rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 text-[10px]">✓</span>
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-brand-500/20 flex items-center justify-center">
                <Dumbbell size={13} className="text-brand-400" />
              </div>
            )}
          </div>

          {/* Center info */}
          <div className="flex-1 min-w-0">
            {isResting ? (
              <>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-400 leading-none mb-0.5">Descansando</p>
                <p className={`text-xl font-display font-black tabular-nums leading-none tracking-tighter ${
                  restTimer! <= 10 ? 'text-red-400' : 'text-white'
                }`}>{fmt(restTimer!)}</p>
              </>
            ) : sessionState === 'finished' ? (
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
                    <p className="text-[10px] text-zinc-500 font-bold">
                      {setsCompleted}<span className="text-zinc-700">/{setsTotal}</span>
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
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[9px] font-bold uppercase tracking-widest text-zinc-300 active:scale-95 transition-all"
                >+30s</button>
                <button
                  onClick={onDismissRest}
                  className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl active:scale-95 transition-all"
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
