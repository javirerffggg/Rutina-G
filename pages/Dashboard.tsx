import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPhase, getTodayDateString, getGymSchedule } from '../utils';
import { getLogs, saveLog } from '../services/storage';
import { DailyLog } from '../types';
import { Activity, Battery, Moon, Scale, Utensils, CheckCircle2, Circle, AlertTriangle, Clock, Flame, Settings2 } from 'lucide-react';
import { EXERCISE_MUSCLE_MAP } from '../constants';
import { BodyHeatmap } from '../components/BodyHeatmap';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const today = getTodayDateString();
  const phase = getCurrentPhase();
  const [log, setLog] = useState<DailyLog>({ date: today });
  const [weightInput, setWeightInput] = useState('');
  
  // --- NUEVO: Estado para el volumen muscular ---
  const [muscleVolume, setMuscleVolume] = useState<Record<string, number>>({});
  
  // --- NUEVO: Estado para el modo OLED ---
  const [isOledMode, setIsOledMode] = useState(() => {
    return localStorage.getItem('oledMode') === 'true';
  });

  const specialSchedule = getGymSchedule(today);

  useEffect(() => {
    if (isOledMode) {
      document.body.classList.add('oled-mode');
    } else {
      document.body.classList.remove('oled-mode');
    }
  }, [isOledMode]);

  const toggleOledMode = () => {
    const newValue = !isOledMode;
    setIsOledMode(newValue);
    localStorage.setItem('oledMode', newValue.toString());
  };

  useEffect(() => {
    const saved = getLogs();
    if (saved) {
      setLog(saved[today] || { date: today });
      if (saved[today]?.weight) setWeightInput(saved[today].weight.toString());
    }

    // --- NUEVO: Cálculo de fatiga semanal ---
    const calculateWeeklyVolume = () => {
      const todayDate = new Date(today);
      const volumeData: Record<string, number> = {
        chest: 0, back: 0, shoulders: 0, biceps: 0, triceps: 0,
        quads: 0, hamstrings: 0, glutes: 0, calves: 0, abs: 0
      };

      Object.keys(saved).forEach(dateStr => {
        const logDate = new Date(dateStr);
        const diffTime = Math.abs(todayDate.getTime() - logDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 && saved[dateStr].exercises) {
          saved[dateStr].exercises!.forEach(ex => {
             const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
             const reps = ex.sets.reduce((sum, set) => sum + (set.reps || 0), 0);
             muscles.forEach(m => {
               if (volumeData[m] !== undefined) volumeData[m] += reps;
             });
          });
        }
      });
      setMuscleVolume(volumeData);
    };

    calculateWeeklyVolume();
  }, [today]);

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

  const renderRating = (field: 'sleep' | 'energy' | 'stress', icon: React.ReactNode, colorClass: string) => (
    <div className="glass-card p-3 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-300">
          {icon}
          <span className="capitalize text-xs font-bold uppercase tracking-wider">{field === 'sleep' ? 'Sueño' : field === 'energy' ? 'Energía' : 'Estrés'}</span>
        </div>
        <span className={`text-sm font-bold ${log[field] ? colorClass : 'text-slate-600'}`}>{log[field] || '-'} / 5</span>
      </div>
      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            onClick={() => updateBiofeedback(field, val)}
            className={`h-8 flex-1 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
              log[field] === val 
                ? 'bg-white text-dark-bg shadow-lg scale-105' 
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
    <div className="p-6 space-y-8 pb-32">
      <header className="flex justify-between items-start">
        <div>
          <p className="text-zinc-500 text-[10px] font-bold mb-1 uppercase tracking-[0.2em]">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Resumen Diario</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={toggleOledMode}
            className={`p-2.5 rounded-xl border transition-premium ${isOledMode ? 'bg-brand-500/20 border-brand-500/50 text-brand-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}
            title="Modo OLED (Ahorro de batería)"
          >
            <Settings2 size={18} />
          </button>
          <div 
            onClick={() => navigate('/plan')}
            className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer flex items-center transition-premium hover:border-zinc-700"
          >
            {phase.name.split(' ')[0]}
          </div>
        </div>
      </header>

      {/* Special Hours Alert */}
      {specialSchedule && (
        <div className={`p-5 rounded-3xl border flex items-center gap-4 animate-in slide-in-from-top-4 transition-premium
          ${specialSchedule === 'Cerrado' 
            ? 'bg-red-950/30 border-red-500/30' 
            : 'bg-amber-950/30 border-amber-500/30'}`}
        >
          <div className={`p-3 rounded-full ${specialSchedule === 'Cerrado' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
             {specialSchedule === 'Cerrado' ? <AlertTriangle size={24} /> : <Clock size={24} />}
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${specialSchedule === 'Cerrado' ? 'text-red-400' : 'text-amber-500'}`}>
              Horario Especial Hoy
            </p>
            <p className="text-white font-display font-bold text-2xl leading-none mt-1">
              {specialSchedule}
            </p>
          </div>
        </div>
      )}

      {/* Main Action Card */}
      <div 
        onClick={() => navigate('/')}
        className={`relative overflow-hidden p-6 rounded-[32px] border transition-premium cursor-pointer group shadow-2xl
          ${log.workoutCompleted 
            ? 'bg-zinc-900 border-emerald-500/30' 
            : 'bg-brand-600 border-brand-400/50 shadow-brand-900/20'}`}
      >
        <div className="flex justify-between items-start z-10 relative">
          <div>
             <h3 className={`text-2xl font-display font-bold mb-1 ${log.workoutCompleted ? 'text-emerald-400' : 'text-white'}`}>
               {log.workoutCompleted ? 'Entreno Completado' : 'Entreno de Hoy'}
             </h3>
             <p className={`text-xs font-medium ${log.workoutCompleted ? 'text-zinc-500' : 'text-brand-100'}`}>
               {log.workoutCompleted ? '¡Buen trabajo! Descansa.' : 'Toca registrar tu sesión.'}
             </p>
          </div>
          <div className={`p-3 rounded-full transition-premium group-hover:scale-110 ${log.workoutCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/20 text-white'}`}>
            {log.workoutCompleted ? <CheckCircle2 size={28} /> : <Activity size={28} />}
          </div>
        </div>
        
        {/* Progress bar decoration */}
        {!log.workoutCompleted && (
           <div className="mt-6 w-full bg-black/20 h-2 rounded-full overflow-hidden">
             <div className="h-full bg-white/40 w-1/3 rounded-full"></div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Weight Input - Premium */}
        <section className="glass-card p-6 rounded-3xl flex flex-col justify-between premium-bisel">
          <div className="flex items-center gap-2 mb-4 text-brand-400">
            <Scale size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Peso</span>
          </div>
          <div className="flex items-baseline gap-1">
             <input 
              type="number" 
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onBlur={handleWeightSave}
              placeholder="00.0" 
              className="w-full bg-transparent text-4xl font-display font-bold text-white placeholder-zinc-800 focus:outline-none tracking-tighter"
            />
            <span className="text-xs font-bold text-zinc-500 uppercase">kg</span>
          </div>
        </section>

        {/* Nutrition Info */}
        <section className="glass-card p-6 rounded-3xl flex flex-col justify-between premium-bisel">
          <div className="flex items-center gap-2 mb-3 text-amber-500">
            <Utensils size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Nutrición</span>
          </div>
          <p className="text-xs font-medium text-zinc-300 leading-relaxed">
            {phase.nutritionGoal.split('.')[0]}
          </p>
        </section>
      </div>

      {/* Biofeedback */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">Biofeedback</h2>
        <div className="space-y-3">
          {renderRating('energy', <Battery size={18} />, 'text-yellow-400')}
          {renderRating('sleep', <Moon size={18} />, 'text-purple-400')}
          {renderRating('stress', <Activity size={18} />, 'text-red-400')}
        </div>
      </section>

      {/* --- NUEVO: MAPA DE CALOR MUSCULAR --- */}
      <section className="glass-panel p-6 rounded-[32px] space-y-6 premium-bisel">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Flame size={20} className="text-brand-400" /> Carga Muscular
            </h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Volumen 7 Días</p>
          </div>
          <div className="flex flex-col gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700"></div> Descanso</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Óptimo</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div> Fatiga</span>
          </div>
        </div>

        <BodyHeatmap muscleVolume={muscleVolume} />
      </section>
    </div>
  );
};

export default Dashboard;