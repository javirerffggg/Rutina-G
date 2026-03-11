import React, { useState, useMemo } from 'react';
import { PHASES, SPECIAL_GYM_HOURS } from '../constants';
import { getCurrentPhase } from '../utils';
import { Info, Target, Flame, HeartPulse, ChevronRight, Crown, CalendarClock, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const today = new Date().toISOString().slice(0, 10);

const getReadableDate = (key: string) => {
  const parts = key.split('-');
  if (parts.length === 2) {
    const [month, day] = parts;
    return `${parseInt(day)} ${MONTH_NAMES[parseInt(month) - 1]}`;
  }
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const [, month, day] = parts;
      return `${parseInt(day)} ${MONTH_NAMES[parseInt(month) - 1]}`;
    }
    const [month, day, year] = parts;
    return `${parseInt(day)} ${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
  }
  return key;
};

const getPhaseBadge = (phase: any) => {
  const type = phase.type ?? '';
  if (type === 'bulk' || type === 'volume')   return { label: 'Volumen',       icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (type === 'cut'  || type === 'deficit')  return { label: 'D\u00e9ficit',  icon: TrendingDown, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30' };
  return { label: 'Mantenimiento', icon: Minus, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
};

const Plan: React.FC = () => {
  const currentPhase = getCurrentPhase();
  const navigate = useNavigate();
  const [showSchedule, setShowSchedule] = useState(false);

  const phaseBadge = useMemo(() => getPhaseBadge(currentPhase), [currentPhase]);

  const phaseProgress = useMemo(() => {
    const start   = new Date(currentPhase.startDate).getTime();
    const end     = new Date(currentPhase.endDate).getTime();
    const now     = Date.now();
    const total   = end - start;
    const elapsed = Math.min(Math.max(now - start, 0), total);
    const pct        = total > 0 ? Math.round((elapsed / total) * 100) : 0;
    const totalDays   = Math.round(total / 86400000);
    const elapsedDays = Math.round(elapsed / 86400000);
    const currentWeek = Math.ceil((elapsedDays + 1) / 7);
    const totalWeeks  = Math.ceil(totalDays / 7);
    return { pct, elapsedDays, totalDays, currentWeek, totalWeeks };
  }, [currentPhase]);

  const sortedSchedule = useMemo(
    () => Object.entries(SPECIAL_GYM_HOURS).sort((a, b) => a[0].localeCompare(b[0])),
    []
  );

  return (
    <div className="p-5 space-y-6 pb-24">

      {/* HEADER */}
      <header className="flex justify-between items-center">
        <div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Programa</p>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Roadmap</h1>
          <p className="text-amber-400 text-[10px] font-bold tracking-widest uppercase mt-1 flex items-center gap-1">
            <Crown size={12} /> Elite Definition Program
          </p>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all text-[10px] font-bold uppercase tracking-widest"
        >
          <CalendarClock size={16} /> Festivos
        </button>
      </header>

      {/* HERO CARD */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-brand-900/20 border border-brand-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 via-zinc-900 to-black z-0" />
        <div className="absolute top-0 right-0 p-3 opacity-10"><Target size={120} className="text-white" /></div>
        <div className="relative z-10 p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-[10px] font-bold uppercase tracking-wider">Fase Actual</span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${phaseBadge.bg} ${phaseBadge.color}`}>
                <phaseBadge.icon size={10} /> {phaseBadge.label}
              </span>
            </div>
            <span className="text-zinc-500 text-[10px] font-mono">
              {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold text-white leading-tight">{currentPhase.name}</h2>
            <p className="text-sm text-zinc-300 mt-1 leading-relaxed opacity-90">{currentPhase.description}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <span>Semana {phaseProgress.currentWeek} de {phaseProgress.totalWeeks}</span>
              <span>D\u00eda {phaseProgress.elapsedDays} / {phaseProgress.totalDays}</span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div className="h-full bg-brand-400 rounded-full transition-all duration-700" style={{ width: `${phaseProgress.pct}%` }} />
            </div>
            <div className="text-right text-[10px] font-bold text-brand-400">{phaseProgress.pct}% completado</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card p-2 rounded-lg text-center">
              <Flame size={14} className="text-orange-500 mx-auto mb-1" />
              <p className="text-[10px] text-zinc-400 uppercase font-bold">Dieta</p>
              <p className="text-[10px] text-white leading-tight mt-1 line-clamp-2">{currentPhase.nutritionGoal.split('(')[0].trim()}</p>
            </div>
            <div className="glass-card p-2 rounded-lg text-center">
              <HeartPulse size={14} className="text-red-500 mx-auto mb-1" />
              <p className="text-[10px] text-zinc-400 uppercase font-bold">Cardio</p>
              <p className="text-[10px] text-white leading-tight mt-1 line-clamp-2">{currentPhase.cardio.split('.')[0]}</p>
            </div>
            <div className="glass-card p-2 rounded-lg text-center border-brand-500/30 bg-brand-500/10">
              <Target size={14} className="text-brand-400 mx-auto mb-1" />
              <p className="text-[10px] text-brand-300 uppercase font-bold">Entreno</p>
              <p className="text-[10px] text-white leading-tight mt-1 line-clamp-2">{currentPhase.trainingFocus.split(',')[0]}</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/today')}
            className="w-full py-2.5 bg-white text-zinc-900 font-bold text-sm rounded-xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            Ver Resumen Diario <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* TIMELINE */}
      <section>
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 px-1">L\u00ednea de Tiempo</h3>
        <div className="relative border-l border-zinc-800 ml-2 pl-6">
          {PHASES.map((phase, idx) => {
            const isCurrent = phase.name === currentPhase.name;
            const isPast    = phase.endDate < today;
            const showYear  = new Date(phase.startDate).getFullYear() !== new Date().getFullYear();
            const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', ...(showYear ? { year: '2-digit' } : {}) };
            const dateLabel = `${new Date(phase.startDate).toLocaleDateString('es-ES', dateOpts)} \u2014 ${new Date(phase.endDate).toLocaleDateString('es-ES', dateOpts)}`;
            const totalWeeks = Math.ceil((new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime()) / (86400000 * 7));
            const badge = getPhaseBadge(phase);
            return (
              <div key={idx} className={`relative py-3 transition-opacity ${ isCurrent ? 'opacity-100' : isPast ? 'opacity-40' : 'opacity-60 hover:opacity-80' }`}>
                <div className={`absolute -left-[29px] top-4 w-3 h-3 rounded-full border-2 z-10 transition-all ${
                  isCurrent ? 'bg-brand-500 border-brand-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] scale-125'
                  : isPast   ? 'bg-zinc-700 border-zinc-600'
                  : 'bg-zinc-900 border-zinc-700'
                }`} />
                <div className={`rounded-xl p-3 border transition-all ${
                  isCurrent ? 'bg-gradient-to-r from-zinc-900 to-transparent border-zinc-700 translate-x-1' : 'border-transparent hover:border-zinc-800'
                }`}>
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold ${ isCurrent ? 'text-brand-400' : 'text-zinc-200' }`}>{phase.name}</h4>
                      {isCurrent && <span className="text-[9px] font-bold uppercase tracking-widest bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/30">Ahora</span>}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono tracking-tighter shrink-0 ml-2">{dateLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${badge.color}`}>
                      <badge.icon size={9} /> {badge.label}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-bold">&middot; {totalWeeks} sem.</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{phase.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PHILOSOPHY */}
      <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
        <Info size={18} className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Filosof\u00eda Elite</h3>
          <p className="text-xs text-zinc-300 leading-relaxed">La intensidad y el d\u00e9ficit cal\u00f3rico son las herramientas. La paciencia es el camino. Mant\u00e9n la fuerza para preservar el m\u00fasculo.</p>
        </div>
      </div>

      {/* SPECIAL HOURS MODAL */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSchedule(false)} />
          <div className="relative w-full max-w-sm bg-zinc-950/95 backdrop-blur-md border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2 text-amber-400">
                <CalendarClock size={18} />
                <span className="font-bold text-sm uppercase tracking-widest">Horarios Festivos</span>
              </div>
              <button onClick={() => setShowSchedule(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {sortedSchedule.map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-zinc-300 font-medium text-sm">{getReadableDate(key)}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${ value === 'Cerrado' ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-400' }`}>{value}</span>
                </div>
              ))}
              {sortedSchedule.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-6">No hay horarios especiales configurados.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plan;
