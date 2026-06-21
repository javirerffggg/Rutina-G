import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPhase, getTodayDateString, getGymSchedule } from '../utils';
import { getLogs, saveLog } from '../services/storage';
import { DailyLog } from '../types';
import { Activity, Battery, Moon, Scale, Utensils, CheckCircle2, AlertTriangle, Clock, Flame, ChevronRight, TrendingUp, TrendingDown, Minus, HeartPulse, CalendarRange, Dumbbell, Target, Crown } from 'lucide-react';
import { EXERCISE_MUSCLE_MAP, PHASES } from '../constants';
import { calculate7DayAverage, calculate7DayTrend } from '../utils/bodyComposition';
import { useProgression } from '../hooks/useProgression';
import { getSettings } from '../services/settings';
import {
  ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip,
} from 'recharts';

// ── Radar axes ───────────────────────────────────────────────────────────────
const RADAR_MUSCLES: { key: string; label: string }[] = [
  { key: 'chest',      label: 'Pecho' },
  { key: 'back',       label: 'Espalda' },
  { key: 'shoulders',  label: 'Hombros' },
  { key: 'biceps',     label: 'Bíceps' },
  { key: 'triceps',    label: 'Tríceps' },
  { key: 'core',       label: 'Core' },
  { key: 'quads',      label: 'Cuádriceps' },
  { key: 'hamstrings', label: 'Isquios' },
];

const RadarTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const { muscle, sets } = payload[0].payload;
  return (
    <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-bold text-white">{muscle}</p>
      <p className="text-xs text-amber-400">{sets} series</p>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 13) return 'Buenos días';
  if (h < 21) return 'Buenas tardes';
  return 'Buenas noches';
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const today = getTodayDateString();
  const settings = useMemo(() => getSettings(), []);
  const initialLogs = useMemo(() => getLogs(), []);
  const [allLogs, setAllLogs] = useState<Record<string, DailyLog>>(initialLogs);
  const phase = useMemo(() => getCurrentPhase(today, allLogs, settings.autoDeload ? settings.deloadFrequency : 0), [today, allLogs, settings.deloadFrequency, settings.autoDeload]);
  
  const [log, setLog] = useState<DailyLog>({ date: today });
  const [weightInput, setWeightInput] = useState('');
  const [muscleSets, setMuscleSets] = useState<Record<string, number>>({});
  const [weightAvg7d, setWeightAvg7d] = useState<number | undefined>(undefined);
  const [weightTrend, setWeightTrend] = useState<number | undefined>(undefined);

  const specialSchedule = getGymSchedule(today);

  const [activeFocusTab, setActiveFocusTab] = useState<'nutrition' | 'training'>('nutrition');

  // Hook del nuevo sistema de progresión RPG
  const { rankInfo, addXP } = useProgression();

  // Plan logic
  const colors = useMemo(() => getSemanticColors(phase.name), [phase]);
  const phaseProgress = useMemo(() => {
    if (!phase.startDate || !phase.endDate) {
      return { pct: 0, elapsedDays: 0, totalDays: 0, currentWeek: 0, totalWeeks: 0, remainingDays: 0 };
    }
    const start   = new Date(phase.startDate).getTime();
    const end     = new Date(phase.endDate).getTime();
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
  }, [phase]);

  useEffect(() => {
    const load = () => {
      const saved = getLogs();
      setAllLogs(saved);
      if (saved[today]) {
        setLog(saved[today]);
        if (saved[today].weight) setWeightInput(saved[today].weight.toString());
      }

      // Calcular media y tendencia de peso 7d
      const weightValues = Object.keys(saved)
        .sort()
        .slice(-7)
        .map(d => saved[d].weight)
        .filter((w): w is number => w !== undefined);
        
      const avg = calculate7DayAverage(weightValues);
      setWeightAvg7d(avg);
      
      if (saved[today]?.weight && avg) {
        setWeightTrend(calculate7DayTrend(saved[today].weight!, avg));
      }

      // Series musculares semanales (solo sets completados con reps reales)
      const todayDate = new Date(today);
      const setsData: Record<string, number> = {};

      Object.keys(saved).forEach(dateStr => {
        const logDate = new Date(dateStr);
        const diffTime = Math.abs(todayDate.getTime() - logDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 && saved[dateStr].exercises) {
          saved[dateStr].exercises!.forEach(ex => {
            const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
            const completedSets = ex.sets.filter((s: any) => s.completed && ((s.reps || 0) > 0 || (s.weight || 0) > 0));
            if (completedSets.length === 0) return;
            muscles.forEach((m: string) => {
              setsData[m] = (setsData[m] || 0) + completedSets.length;
            });
          });
        }
      });

      setMuscleSets(setsData);
    };

    load();
    window.addEventListener('storage-update', load);
    return () => window.removeEventListener('storage-update', load);
  }, [today]);

  const handleWeightSave = () => {
    if (!weightInput) return;
    const updated = { ...log, weight: parseFloat(weightInput) };
    setLog(updated);
    saveLog(updated);
    
    addXP(5, 'WEIGHT_LOGGED');

    // Recalcular tendencia al vuelo
    if (weightAvg7d) {
      setWeightTrend(calculate7DayTrend(parseFloat(weightInput), weightAvg7d));
    }
  };

  const updateBiofeedback = (field: 'sleep' | 'energy' | 'stress', value: number) => {
    const isNew = log[field] === undefined;
    const updated = { ...log, [field]: value };
    setLog(updated);
    saveLog(updated);
    
    if (isNew) {
      addXP(5, 'BIOFEEDBACK_LOGGED');
    }
  };

  // Progreso real del entreno de hoy
  const workoutProgress = useMemo(() => {
    if (!log.exercises || log.exercises.length === 0) return 0;
    const totalSets = log.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = log.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed !== false).length, 0
    );
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  }, [log.exercises]);

  // ── Radar data ─────────────────────────────────────────────────────────────
  const { radarData, hasMuscleData, maxSets } = useMemo(() => {
    const radar = RADAR_MUSCLES.map(({ key, label }) => ({
      muscle: label,
      sets: muscleSets[key] || 0,
    }));
    const max = Math.max(...radar.map(d => d.sets), 1);
    const hasData = radar.some(d => d.sets > 0);
    return { radarData: radar, hasMuscleData: hasData, maxSets: max };
  }, [muscleSets]);

  const renderCompactRating = (field: 'sleep' | 'energy' | 'stress', icon: React.ReactNode, iconColor: string, activeClass: string) => (
    <div className="flex flex-col gap-1.5 mb-2">
      <div className="flex justify-between pl-[84px] text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
         <span>Muy bajo</span>
         <span>Muy alto</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 w-[72px] ${iconColor}`}>
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {field === 'sleep' ? 'Sueño' : field === 'energy' ? 'Energía' : 'Estrés'}
          </span>
        </div>
        <div className="flex flex-1 justify-between gap-1.5">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              onClick={() => updateBiofeedback(field, val)}
              className={`h-8 flex-1 rounded text-[10px] font-bold transition-all border ${
                log[field] === val
                  ? `${activeClass} shadow-md scale-105`
                  : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:bg-zinc-700/80 hover:text-zinc-300'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTrendIcon = (trend: number | undefined) => {
    if (trend === undefined) return <Minus size={12} className="text-zinc-600" />;
    if (trend < 0) return <TrendingDown size={12} className="text-emerald-400" />;
    if (trend > 0) return <TrendingUp size={12} className="text-rose-400" />;
    return <Minus size={12} className="text-zinc-600" />;
  };

  return (
    <div className="p-4 sm:p-6 pb-24">

      {/* ── HEADER COMPACTO ── */}
      <header className="flex justify-between items-end mb-5">
        <div>
          <p className="text-zinc-500 text-[10px] font-bold mb-1 uppercase tracking-[0.2em]">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">{getGreeting()}</h1>
        </div>
        <p className="text-brand-400 text-[10px] font-bold tracking-widest uppercase mt-1 flex items-center gap-1">
          <Crown size={12} /> EDP
        </p>
      </header>

      {/* ── ALERTA HORARIO ESPECIAL ── */}
      {specialSchedule && (
        <div className={`mb-5 p-4 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-4 ${
          specialSchedule === 'Cerrado'
            ? 'bg-red-950/30 border-red-500/30'
            : 'bg-amber-950/30 border-amber-500/30'
        }`}>
          <div className={`p-2.5 rounded-full shrink-0 ${
            specialSchedule === 'Cerrado' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
          }`}>
            {specialSchedule === 'Cerrado' ? <AlertTriangle size={20} /> : <Clock size={20} />}
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
              specialSchedule === 'Cerrado' ? 'text-red-400' : 'text-amber-500'
            }`}>Horario Especial Hoy</p>
            <p className="text-white font-bold text-lg leading-none mt-0.5">{specialSchedule}</p>
          </div>
        </div>
      )}

      {/* ── CARD PRINCIPAL ENTRENO (MAIN CTA) ── */}
      <div
        onClick={() => navigate('/workout')}
        className={`mb-5 relative overflow-hidden p-6 rounded-3xl border transition-all cursor-pointer group shadow-2xl active:scale-[0.98] ${
          log.workoutCompleted
            ? 'bg-zinc-900 border-emerald-500/30'
            : 'bg-brand-600 border-brand-400/50 shadow-brand-900/20'
        }`}
      >
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <h3 className={`text-2xl font-display font-bold mb-1 ${
              log.workoutCompleted ? 'text-emerald-400' : 'text-white'
            }`}>
              {log.workoutCompleted ? 'Entreno Completado' : 'Entreno de Hoy'}
            </h3>
            <p className={`text-xs font-medium ${
              log.workoutCompleted ? 'text-zinc-500' : 'text-brand-100'
            }`}>
              {log.workoutCompleted
                ? '¡Buen trabajo! Descansa y recupera.'
                : log.exercises && log.exercises.length > 0
                  ? `${workoutProgress}% completado — toca para continuar`
                  : 'Toca para registrar tu sesión.'}
            </p>
            {!log.workoutCompleted && log.exercises && log.exercises.length > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/20 text-brand-100/90 border border-white/5">
                <Flame size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{log.exercises.length} ejercicios pendientes</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full transition-all group-hover:scale-110 shrink-0 ${
            log.workoutCompleted
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-white/20 text-white'
          }`}>
            {log.workoutCompleted ? <CheckCircle2 size={28} /> : <Activity size={28} />}
          </div>
        </div>

        {/* Barra de progreso real */}
        {!log.workoutCompleted && log.exercises && log.exercises.length > 0 && (
          <div className="mt-5 w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full transition-all duration-500"
              style={{ width: `${workoutProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* ── FASE ACTUAL (COMPACT STATUS PILL) ── */}
      <div className={`mb-5 rounded-2xl border p-4 ${colors.bg} ${colors.border}`}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className={`text-[10px] uppercase font-bold tracking-widest ${colors.text}`}>Fase Actual</p>
            <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
              <colors.icon size={16} className={colors.text} />
              {phase.name}
            </h3>
          </div>
          <div className="text-right">
             <p className="text-[10px] uppercase font-bold text-zinc-500">Progreso</p>
             <p className={`text-sm font-bold ${colors.text}`}>{phaseProgress.pct}%</p>
          </div>
        </div>
        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
           <div className={`h-full ${colors.bar} rounded-full transition-all duration-700`} style={{ width: `${phaseProgress.pct}%` }} />
        </div>
        {phase.name === 'Descarga (Deload)' && (
          <div className="mt-3 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
             <AlertTriangle size={12} /> ¡Semana de descarga! Reduce el volumen.
          </div>
        )}
      </div>

      {/* ── FOCO ACTUAL (TABS) ── */}
      <section className="mb-5 bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/5">
           <button 
             onClick={() => setActiveFocusTab('nutrition')}
             className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
               activeFocusTab === 'nutrition' ? 'bg-orange-500/10 text-orange-400 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'
             }`}
           >
             <Flame size={14}/> Nutrición
           </button>
           <button 
             onClick={() => setActiveFocusTab('training')}
             className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
               activeFocusTab === 'training' ? 'bg-brand-500/10 text-brand-400 border-b-2 border-brand-500' : 'text-zinc-500 hover:text-zinc-300'
             }`}
           >
             <Dumbbell size={14}/> Entrenamiento
           </button>
        </div>
        <div className="p-4">
           {activeFocusTab === 'nutrition' ? (
              <ul className="space-y-2 animate-in fade-in">
                 {parseToBullets(phase.nutritionGoal).map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400 font-medium">
                       <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50 mt-1.5 shrink-0"/>
                       <span className="leading-relaxed">{bullet}</span>
                    </li>
                 ))}
              </ul>
           ) : (
              <ul className="space-y-2 animate-in fade-in">
                 {parseToBullets(phase.trainingFocus).map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400 font-medium">
                       <div className="w-1.5 h-1.5 rounded-full bg-brand-500/50 mt-1.5 shrink-0"/>
                       <span className="leading-relaxed">{bullet}</span>
                    </li>
                 ))}
              </ul>
           )}
        </div>
      </section>

      {/* ── GRID PESO + NUTRICIÓN ── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Peso */}
        <section className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl flex flex-col h-full">
          <div className="flex items-center gap-1.5 mb-2 text-brand-400">
            <Scale size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Peso Hoy</span>
          </div>
          <div className="flex items-baseline gap-1 flex-1">
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onBlur={handleWeightSave}
              placeholder="00.0"
              className="w-full bg-transparent text-2xl font-display font-bold text-white placeholder-zinc-800 focus:outline-none tracking-tighter"
            />
            <span className="text-[10px] font-bold text-zinc-500 uppercase">kg</span>
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center gap-1.5">
            {renderTrendIcon(weightTrend)}
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">
              Media 7d: <span className="text-zinc-400">{weightAvg7d?.toFixed(1) || '--'}kg</span>
            </span>
          </div>
        </section>

        {/* Nutrición */}
        <section
          className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl flex flex-col h-full cursor-pointer active:scale-[0.98] transition-all group hover:bg-zinc-900"
          onClick={() => navigate('/plan')}
        >
          <div className="flex items-center gap-1.5 mb-2 text-amber-500">
            <Utensils size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Objetivo</span>
          </div>
          <p className="text-xs font-medium text-zinc-300 leading-relaxed flex-1 line-clamp-2">
            {phase.nutritionGoal.split('.')[0]}.
          </p>
          <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-amber-500 transition-colors">
            Ver plan <ChevronRight size={10} />
          </div>
        </section>
      </div>

      {/* ── BIOFEEDBACK COMPACTO ── */}
      <section className="mb-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3">Biofeedback</h2>
        <div className="space-y-2">
          {renderCompactRating('energy', <Battery size={14} />, 'text-yellow-400', 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30')}
          {renderCompactRating('sleep', <Moon size={14} />, 'text-purple-400', 'bg-purple-500/20 text-purple-400 border-purple-500/30')}
          {renderCompactRating('stress', <Activity size={14} />, 'text-red-400', 'bg-red-500/20 text-red-400 border-red-500/30')}
        </div>
      </section>

      {/* ── RADAR CHART: CARGA MUSCULAR ── */}
      <section className="bg-zinc-900/50 border border-zinc-800/50 p-5 rounded-2xl">
        <div className="mb-4">
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
            <Flame size={18} className="text-brand-400" /> Carga Muscular
          </h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
            Series por grupo — últimos 7 días
          </p>
        </div>

        {hasMuscleData ? (
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="muscle"
                tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, maxSets]}
                tick={{ fill: '#52525b', fontSize: 9 }}
                axisLine={false}
                tickCount={4}
              />
              <Radar
                name="Series"
                dataKey="sets"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#fbbf24', stroke: '#92400e', strokeWidth: 1 }}
              />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Flame size={28} className="text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-xs font-bold">Sin entrenamientos esta semana</p>
            <p className="text-zinc-600 text-[10px] mt-1">Completa una sesión para ver la carga muscular</p>
          </div>
        )}
      </section>

    </div>
  );
};

export default Dashboard;
