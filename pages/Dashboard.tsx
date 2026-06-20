import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPhase, getTodayDateString, getGymSchedule } from '../utils';
import { getLogs, saveLog } from '../services/storage';
import { DailyLog } from '../types';
import { Activity, Battery, Moon, Scale, Utensils, CheckCircle2, AlertTriangle, Clock, Flame, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { EXERCISE_MUSCLE_MAP } from '../constants';
import { BodyHeatmap } from '../components/BodyHeatmap';
import { calculate7DayAverage, calculate7DayTrend } from '../utils/bodyComposition';
import { useProgression } from '../hooks/useProgression';
import { RankBadge } from '../components/RankBadge';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 13) return 'Buenos días';
  if (h < 21) return 'Buenas tardes';
  return 'Buenas noches';
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const today = getTodayDateString();
  const phase = getCurrentPhase();
  const [log, setLog] = useState<DailyLog>({ date: today });
  const [weightInput, setWeightInput] = useState('');
  const [allLogs, setAllLogs] = useState<Record<string, DailyLog>>({});
  const [muscleVolume, setMuscleVolume] = useState<Record<string, number>>({});
  const [muscleSets, setMuscleSets] = useState<Record<string, number>>({});
  const [weightAvg7d, setWeightAvg7d] = useState<number | undefined>(undefined);
  const [weightTrend, setWeightTrend] = useState<number | undefined>(undefined);

  const specialSchedule = getGymSchedule(today);

  // Hook del nuevo sistema de progresión RPG
  const { rankInfo, addXP } = useProgression();

  useEffect(() => {
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

    // Volumen + series musculares semanales
    const todayDate = new Date(today);
    const volumeData: Record<string, number> = {};
    const setsData: Record<string, number> = {};

    Object.keys(saved).forEach(dateStr => {
      const logDate = new Date(dateStr);
      const diffTime = Math.abs(todayDate.getTime() - logDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7 && saved[dateStr].exercises) {
        saved[dateStr].exercises!.forEach(ex => {
          const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
          const reps = ex.sets.reduce((sum, set) => sum + (set.reps || 0), 0);
          const sets = ex.sets.length;
          muscles.forEach(m => {
            volumeData[m] = (volumeData[m] || 0) + reps;
            setsData[m] = (setsData[m] || 0) + sets;
          });
        });
      }
    });

    setMuscleVolume(volumeData);
    setMuscleSets(setsData);
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

  const renderCompactRating = (field: 'sleep' | 'energy' | 'stress', icon: React.ReactNode, iconColor: string, activeClass: string) => (
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
        <div
          onClick={() => navigate('/plan')}
          className="bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer flex items-center gap-1 transition-all hover:border-zinc-700 hover:text-white"
        >
          {phase.name.split(' ')[0]}
          <ChevronRight size={12} />
        </div>
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

      {/* ── CARD PRINCIPAL ENTRENO ── */}
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
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 truncate">
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
          <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-amber-500 transition-colors">
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

      {/* ── RPG RANK BADGE ── */}
      <div className="mb-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center">
        <RankBadge rankInfo={rankInfo} size="lg" showLabel showProgress animated />
      </div>

      {/* ── MAPA DE CALOR MUSCULAR ── */}
      <section className="bg-zinc-900/50 border border-zinc-800/50 p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Flame size={18} className="text-brand-400" /> Carga Muscular
            </h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Volumen últimos 7 días</p>
          </div>
          <div className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700" /> Descanso</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Óptimo</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Fatiga</span>
          </div>
        </div>
        <BodyHeatmap muscleVolume={muscleVolume} muscleSets={muscleSets} />
      </section>

    </div>
  );
};

export default Dashboard;
