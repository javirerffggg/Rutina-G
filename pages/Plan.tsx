import React, { useState, useMemo } from 'react';
import { PHASES, SPECIAL_GYM_HOURS } from '../constants';
import { getCurrentPhase } from '../utils';
import { Info, Target, Flame, HeartPulse, Crown, CalendarClock, X, TrendingUp, TrendingDown, Minus, Dumbbell, CalendarRange, Clock } from 'lucide-react';

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

const getSemanticColors = (type?: string) => {
  if (type === 'bulk' || type === 'volume') {
    return {
      label: 'Volumen',
      gradient: 'from-amber-900/80 via-zinc-900 to-black',
      border: 'border-amber-500/30',
      shadow: 'shadow-amber-900/20',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      bar: 'bg-amber-400',
      icon: TrendingUp
    };
  }
  if (type === 'cut' || type === 'deficit') {
    return {
      label: 'Déficit',
      gradient: 'from-red-900/80 via-zinc-900 to-black',
      border: 'border-red-500/30',
      shadow: 'shadow-red-900/20',
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      bar: 'bg-red-400',
      icon: TrendingDown
    };
  }
  return {
    label: 'Mantenimiento',
    gradient: 'from-blue-900/80 via-zinc-900 to-black',
    border: 'border-blue-500/30',
    shadow: 'shadow-blue-900/20',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    bar: 'bg-blue-400',
    icon: Minus
  };
};

const parseToBullets = (text: string) => {
  return text.split(/(?:\. |;|\n)/).map(s => s.trim()).filter(s => s.length > 0);
};

const Plan: React.FC = () => {
  const currentPhase = getCurrentPhase();
  const [showSchedule, setShowSchedule] = useState(false);

  const colors = useMemo(() => getSemanticColors(currentPhase.type), [currentPhase]);

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
    const remainingDays = totalDays - elapsedDays;
    return { pct, elapsedDays, totalDays, currentWeek, totalWeeks, remainingDays };
  }, [currentPhase]);

  const macrocycleProgress = useMemo(() => {
    if (PHASES.length === 0) return { pct: 0, totalDays: 0, elapsedDays: 0 };
    const macroStart = new Date(PHASES[0].startDate).getTime();
    const macroEnd = new Date(PHASES[PHASES.length - 1].endDate).getTime();
    const now = Date.now();
    const total = macroEnd - macroStart;
    const elapsed = Math.min(Math.max(now - macroStart, 0), total);
    const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
    return { pct, totalDays: Math.round(total / 86400000), elapsedDays: Math.round(elapsed / 86400000) };
  }, []);

  const sortedSchedule = useMemo(
    () => Object.entries(SPECIAL_GYM_HOURS).sort((a, b) => a[0].localeCompare(b[0])),
    []
  );

  return (
    <div className="p-5 space-y-6 pb-32">

      {/* HEADER */}
      <header className="flex justify-between items-start">
        <div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Contexto Diario</p>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Tu Plan</h1>
          <p className="text-brand-400 text-[10px] font-bold tracking-widest uppercase mt-1 flex items-center gap-1">
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

      {/* HERO CARD - ACTUAL PHASE */}
      <div className={`relative rounded-3xl overflow-hidden shadow-2xl ${colors.shadow} border ${colors.border} premium-bisel`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} z-0`} />
        <div className="absolute top-0 right-0 p-3 opacity-10"><Target size={140} className="text-white" /></div>
        <div className="relative z-10 p-6 space-y-5">
          <div className="flex justify-between items-start">
            <div>
               <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${colors.bg} ${colors.text} ${colors.border}`}>
                 <colors.icon size={12} strokeWidth={3} /> {colors.label}
               </span>
               <h2 className="text-3xl font-display font-bold text-white leading-tight mt-3">{currentPhase.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-zinc-300">
             <div className="flex items-center gap-1.5"><Clock size={14} className={colors.text}/> {phaseProgress.remainingDays} días restantes</div>
             <div className="flex items-center gap-1.5"><CalendarRange size={14} className={colors.text}/> Semana {phaseProgress.currentWeek}/{phaseProgress.totalWeeks}</div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <span>Progreso de Fase</span>
              <span className={colors.text}>{phaseProgress.pct}%</span>
            </div>
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
              <div className={`h-full ${colors.bar} rounded-full transition-all duration-700`} style={{ width: `${phaseProgress.pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* HOY EN ESTA FASE */}
      <section className="space-y-4">
         <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">Hoy en esta fase</h3>
         
         <div className="grid grid-cols-1 gap-3">
            {/* DIETA */}
            <div className={`p-4 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-orange-500/30 transition-all`}>
               <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400"><Flame size={16}/></div>
                  <h4 className="font-bold text-sm text-white">Nutrición</h4>
               </div>
               <ul className="space-y-2">
                  {parseToBullets(currentPhase.nutritionGoal).map((bullet, idx) => (
                     <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50 mt-1.5 shrink-0"/>
                        <span className="leading-relaxed">{bullet}</span>
                     </li>
                  ))}
               </ul>
            </div>

            {/* ENTRENO */}
            <div className={`p-4 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-brand-500/30 transition-all`}>
               <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400"><Dumbbell size={16}/></div>
                  <h4 className="font-bold text-sm text-white">Entrenamiento</h4>
               </div>
               <ul className="space-y-2">
                  {parseToBullets(currentPhase.trainingFocus).map((bullet, idx) => (
                     <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500/50 mt-1.5 shrink-0"/>
                        <span className="leading-relaxed">{bullet}</span>
                     </li>
                  ))}
               </ul>
            </div>

            {/* CARDIO */}
            <div className={`p-4 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-rose-500/30 transition-all`}>
               <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"><HeartPulse size={16}/></div>
                  <h4 className="font-bold text-sm text-white">Cardio</h4>
               </div>
               <ul className="space-y-2">
                  {parseToBullets(currentPhase.cardio).map((bullet, idx) => (
                     <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50 mt-1.5 shrink-0"/>
                        <span className="leading-relaxed">{bullet}</span>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </section>

      {/* TIMELINE */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
           <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Macrociclo Anual</h3>
           <span className="text-[10px] font-bold text-zinc-400">{macrocycleProgress.pct}%</span>
        </div>
        <div className="w-full h-1 bg-zinc-900 rounded-full mb-6 overflow-hidden">
           <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${macrocycleProgress.pct}%` }} />
        </div>

        <div className="relative border-l-2 border-zinc-800 ml-3 pl-6 space-y-4">
          {PHASES.map((phase, idx) => {
            const isCurrent = phase.name === currentPhase.name;
            const isPast    = phase.endDate < today;
            const isFuture  = phase.startDate > today;
            
            const showYear  = new Date(phase.startDate).getFullYear() !== new Date().getFullYear();
            const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', ...(showYear ? { year: '2-digit' } : {}) };
            const dateLabel = `${new Date(phase.startDate).toLocaleDateString('es-ES', dateOpts)} \u2014 ${new Date(phase.endDate).toLocaleDateString('es-ES', dateOpts)}`;
            const totalWeeks = Math.ceil((new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime()) / (86400000 * 7));
            const badge = getSemanticColors(phase.type);
            
            // PAST PHASES
            if (isPast) {
               return (
                 <div key={idx} className="relative py-1 opacity-40">
                   <div className="absolute -left-[31px] top-2.5 w-3 h-3 rounded-full bg-zinc-800 border-2 border-zinc-900 z-10" />
                   <div className="flex justify-between items-center bg-zinc-900/30 px-4 py-2 rounded-xl border border-transparent">
                      <span className="text-xs font-bold text-zinc-500 line-through">{phase.name}</span>
                      <span className="text-[9px] text-zinc-600 font-mono tracking-tighter">{dateLabel}</span>
                   </div>
                 </div>
               );
            }

            // FUTURE PHASES
            if (isFuture) {
               return (
                 <div key={idx} className="relative py-1 opacity-60">
                   <div className="absolute -left-[31px] top-2.5 w-3 h-3 rounded-full bg-zinc-900 border-2 border-zinc-800 z-10" />
                   <div className="flex justify-between items-center bg-zinc-900/30 px-4 py-2 rounded-xl border border-zinc-800/50">
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-zinc-300">{phase.name}</span>
                         <span className={`text-[8px] font-bold uppercase ${badge.text}`}><badge.icon size={8} className="inline mr-0.5" />{badge.label}</span>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono tracking-tighter">{dateLabel}</span>
                   </div>
                 </div>
               );
            }

            // CURRENT PHASE
            return (
              <div key={idx} className={`relative py-2 opacity-100`}>
                <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border-4 z-10 ${colors.bg} ${colors.border}`} />
                <div className={`rounded-2xl p-4 border ${colors.border} ${colors.bg} shadow-lg ${colors.shadow}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-base font-bold text-white leading-tight`}>{phase.name}</h4>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${colors.bg} ${colors.text} px-2 py-0.5 rounded-full border ${colors.border}`}>Activa</span>
                    </div>
                  </div>
                  <span className={`text-[10px] ${colors.text} font-mono tracking-tighter block mb-2 opacity-80`}>{dateLabel} &middot; {totalWeeks} semanas</span>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-2">{phase.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SPECIAL HOURS MODAL */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSchedule(false)} />
          <div className="relative w-full max-w-sm bg-zinc-950/95 backdrop-blur-md border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col premium-bisel">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2 text-amber-400">
                <CalendarClock size={18} />
                <span className="font-bold text-sm uppercase tracking-widest">Horarios Festivos</span>
              </div>
              <button onClick={() => setShowSchedule(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-3 custom-scrollbar">
              {sortedSchedule.map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3.5 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-zinc-200 font-bold text-sm">{getReadableDate(key)}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 uppercase tracking-widest rounded-lg ${ value === 'Cerrado' ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-400' }`}>{value}</span>
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
