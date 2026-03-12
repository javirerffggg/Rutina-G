import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPhase, getTodayDateString, getGymSchedule } from '../utils';
import { getLogs, saveLog } from '../services/storage';
import { DailyLog } from '../types';
import { Activity, Battery, Moon, Scale, Utensils, CheckCircle2, AlertTriangle, Clock, Flame, ChevronRight } from 'lucide-react';
import { EXERCISE_MUSCLE_MAP } from '../constants';
import { BodyHeatmap } from '../components/BodyHeatmap';
import { useRPGStats } from '../hooks/useRPGStats';
import { RPGProgressBar } from '../components/dashboard/RPGProgressBar';
import { LevelUpCelebration } from '../components/dashboard/LevelUpCelebration';

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
  const [isOledMode, setIsOledMode] = useState(() => localStorage.getItem('oledMode') === 'true');
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);

  const specialSchedule = getGymSchedule(today);

  // Calcular estadísticas RPG usando el hook optimizado
  const rpgStats = useRPGStats(allLogs);

  useEffect(() => {
    if (isOledMode) document.body.classList.add('oled-mode');
    else document.body.classList.remove('oled-mode');
  }, [isOledMode]);

  const toggleOledMode = () => {
    const newValue = !isOledMode;
    setIsOledMode(newValue);
    localStorage.setItem('oledMode', newValue.toString());
  };

  useEffect(() => {
    const saved = getLogs();
    setAllLogs(saved);
    if (saved[today]) {
      setLog(saved[today]);
      if (saved[today].weight) setWeightInput(saved[today].weight.toString());
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

  // Detectar level-up y mostrar celebración
  useEffect(() => {
    const lastSeenLevel = parseInt(localStorage.getItem('rpg_last_seen_level') ?? '1', 10);
    
    if (rpgStats.level > lastSeenLevel) {
      // Nuevo nivel alcanzado
      setPreviousLevel(lastSeenLevel);
      setShowLevelUpModal(true);
      localStorage.setItem('rpg_last_seen_level', rpgStats.level.toString());
    }
  }, [rpgStats.level]);

  const handleWeightSave = () => {
    if (!weightInput) return;
    const updated = { ...log, weight: parseFloat(weightInput) };
    setLog(updated);
    saveLog(updated);
  };

  const updateBiofeedback = (field: 'sleep' | 'energy' | 'stress', value: number) => {
    const updated = { ...log, [field]: value };
    setLog(updated);
    saveLog(updated);
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

  const renderRating = (field: 'sleep' | 'energy' | 'stress', icon: React.ReactNode, colorClass: string, activeColor: string) => (
    <div className="glass-card p-3 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-300">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider">
            {field === 'sleep' ? 'Sueño' : field === 'energy' ? 'Energía' : 'Estrés'}
          </span>
        </div>
        <span className={`text-sm font-bold ${log[field] ? colorClass : 'text-slate-600'}`}>
          {log[field] || '-'} / 5
        </span>
      </div>
      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            onClick={() => updateBiofeedback(field, val)}
            className={`h-8 flex-1 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
              log[field] === val
                ? `${activeColor} text-white shadow-lg scale-105`
                : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700'
            }`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 pb-24">

      {/* ── MODAL DE LEVEL UP ── */}
      {showLevelUpModal && (
        <LevelUpCelebration
          stats={rpgStats}
          previousLevel={previousLevel}
          onClose={() => setShowLevelUpModal(false)}
        />
      )}

      {/* ── HEADER ── */}
      <header className="flex justify-between items-start">
        <div>
          <p className="text-zinc-500 text-[10px] font-bold mb-1 uppercase tracking-[0.2em]">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">{getGreeting()}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleOledMode}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
              isOledMode
                ? 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'
            }`}
          >
            OLED
          </button>
          <div
            onClick={() => navigate('/plan')}
            className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer flex items-center gap-1 transition-all hover:border-zinc-700"
          >
            {phase.name.split(' ')[0]}
            <ChevronRight size={10} />
          </div>
        </div>
      </header>

      {/* ── RPG PROGRESS BAR ── */}
      <RPGProgressBar stats={rpgStats} />

      {/* ── ALERTA HORARIO ESPECIAL ── */}
      {specialSchedule && (
        <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-4 ${
          specialSchedule === 'Cerrado'
            ? 'bg-red-950/30 border-red-500/30'
            : 'bg-amber-950/30 border-amber-500/30'
        }`}>
          <div className={`p-2.5 rounded-full ${
            specialSchedule === 'Cerrado' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
          }`}>
            {specialSchedule === 'Cerrado' ? <AlertTriangle size={20} /> : <Clock size={20} />}
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
              specialSchedule === 'Cerrado' ? 'text-red-400' : 'text-amber-500'
            }`}>Horario Especial Hoy</p>
            <p className="text-white font-bold text-xl leading-none mt-0.5">{specialSchedule}</p>
          </div>
        </div>
      )}

      {/* ── CARD PRINCIPAL ENTRENO ── */}
      <div
        onClick={() => navigate('/workout')}
        className={`relative overflow-hidden p-6 rounded-3xl border transition-all cursor-pointer group shadow-2xl active:scale-[0.98] ${
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
          </div>
          <div className={`p-3 rounded-full transition-all group-hover:scale-110 ${
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
      <div className="grid grid-cols-2 gap-4">
        {/* Peso */}
        <section className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3 text-brand-400">
            <Scale size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Peso Hoy</span>
          </div>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onBlur={handleWeightSave}
              placeholder="00.0"
              className="w-full bg-transparent text-3xl font-display font-bold text-white placeholder-zinc-800 focus:outline-none tracking-tighter"
            />
            <span className="text-xs font-bold text-zinc-500 uppercase">kg</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-2">Guardar al perder foco</p>
        </section>

        {/* Nutrición */}
        <section
          className="glass-card p-5 rounded-2xl flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all"
          onClick={() => navigate('/plan')}
        >
          <div className="flex items-center gap-2 mb-3 text-amber-500">
            <Utensils size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Objetivo</span>
          </div>
          <p className="text-xs font-medium text-zinc-300 leading-relaxed flex-1">
            {phase.nutritionGoal.split('.')[0]}.
          </p>
          <div className="flex items-center gap-1 mt-3 text-[10px] text-zinc-600 font-bold uppercase">
            Ver plan <ChevronRight size={10} />
          </div>
        </section>
      </div>

      {/* ── BIOFEEDBACK ── */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">Biofeedback</h2>
        <div className="space-y-2.5">
          {renderRating('energy', <Battery size={16} />, 'text-yellow-400', 'bg-yellow-500')}
          {renderRating('sleep', <Moon size={16} />, 'text-purple-400', 'bg-purple-500')}
          {renderRating('stress', <Activity size={16} />, 'text-red-400', 'bg-red-500')}
        </div>
      </section>

      {/* ── MAPA DE CALOR MUSCULAR ── */}
      <section className="glass-panel p-5 rounded-2xl space-y-4">
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
