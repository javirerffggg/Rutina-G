import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { DailyLog } from '../../types';
import { Dumbbell, Trophy, TrendingUp, Flame, Activity, Clock, Calendar as CalendarIcon, Target } from 'lucide-react';
import { EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS, EXERCISES_UPPER, EXERCISES_LOWER, EXERCISE_MUSCLE_MAP } from '../../constants';
import { calculateOneRM } from '../../utils';
import { BodyHeatmap } from '../BodyHeatmap';

interface PerformanceTabProps {
  logs: Record<string, DailyLog>;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ logs }) => {
  const allExercises = [...EXERCISES_PUSH, ...EXERCISES_PULL, ...EXERCISES_LEGS, ...EXERCISES_UPPER, ...EXERCISES_LOWER];
  const [selectedExercise, setSelectedExercise] = useState<string>(allExercises[0].id);

  const sortedDates = Object.keys(logs).sort();
  const workoutLogs = sortedDates.map(date => logs[date]).filter(l => l.exercises && l.exercises.length > 0);

  // --- General Stats ---
  const totalWorkouts = workoutLogs.length;
  
  const totalVolume = workoutLogs.reduce((acc, log) => {
    return acc + (log.exercises?.reduce((exAcc, ex) => {
      return exAcc + ex.sets.reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0);
    }, 0) || 0);
  }, 0);

  const totalSets = workoutLogs.reduce((acc, log) => {
    return acc + (log.exercises?.reduce((exAcc, ex) => exAcc + ex.sets.length, 0) || 0);
  }, 0);

  const avgDuration = workoutLogs.length > 0 
    ? Math.round(workoutLogs.reduce((acc, log) => acc + (log.duration || 60), 0) / workoutLogs.length)
    : 0;

  // Calculate Streak (consecutive days)
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  sortedDates.forEach(dateStr => {
    const log = logs[dateStr];
    if (log.exercises && log.exercises.length > 0) {
      const currentDate = new Date(dateStr);
      if (lastDate) {
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > maxStreak) maxStreak = tempStreak;
      currentStreak = tempStreak;
      lastDate = currentDate;
    }
  });

  // Check if streak is still active (trained today or yesterday)
  if (lastDate) {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 2) {
      currentStreak = 0;
    }
  }

  // --- Muscle Analysis ---
  const muscleSets: Record<string, number> = {};
  const muscleVolume: Record<string, number> = {};

  workoutLogs.forEach(log => {
    log.exercises?.forEach(ex => {
      const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
      const exVolume = ex.sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
      muscles.forEach(m => {
        muscleSets[m] = (muscleSets[m] || 0) + ex.sets.length;
        muscleVolume[m] = (muscleVolume[m] || 0) + exVolume;
      });
    });
  });

  const muscleChartData = Object.entries(muscleSets)
    .map(([muscle, sets]) => ({ name: muscle, sets }))
    .sort((a, b) => b.sets - a.sets);

  // --- Exercise Stats ---
  const exerciseLogs = sortedDates
    .map(date => {
      const entry = logs[date];
      if (!entry.exercises) return null;
      const exLog = entry.exercises.find(e => e.exerciseId === selectedExercise);
      if (!exLog || exLog.sets.length === 0) return null;
      
      const max1RM = Math.max(...exLog.sets.map(set => calculateOneRM(set.weight, set.reps)));
      const volume = exLog.sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
      const maxWeight = Math.max(...exLog.sets.map(set => set.weight));
      
      return {
        date: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        oneRM: max1RM,
        volume: volume,
        maxWeight: maxWeight
      };
    })
    .filter(Boolean) as { date: string, oneRM: number, volume: number, maxWeight: number }[];

  const maxExercise1RM = exerciseLogs.length > 0 ? Math.max(...exerciseLogs.map(l => l.oneRM)) : 0;
  const maxExercisePR = exerciseLogs.length > 0 ? Math.max(...exerciseLogs.map(l => l.maxWeight)) : 0;
  const maxSessionVolume = exerciseLogs.length > 0 ? Math.max(...exerciseLogs.map(l => l.volume)) : 0;
  const progress1RM = exerciseLogs.length > 1 ? exerciseLogs[exerciseLogs.length - 1].oneRM - exerciseLogs[0].oneRM : 0;

  // Total Volume Chart Data
  const volumeChartData = workoutLogs.map(log => {
    const vol = log.exercises?.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, set) => sAcc + (set.weight * set.reps), 0), 0) || 0;
    return {
      date: new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      volume: vol
    };
  }).slice(-30);

  // Calendar Data (last 28 days)
  const today = new Date();
  const calendarDays = Array.from({ length: 28 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (27 - i));
    const dateStr = d.toISOString().split('T')[0];
    const hasWorkout = logs[dateStr] && logs[dateStr].exercises && logs[dateStr].exercises!.length > 0;
    return { date: dateStr, hasWorkout };
  });

  return (
    <div className="space-y-8 pb-8">
      {/* General Stats */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
          <Activity size={16} /> Visión Global
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-brand-400 uppercase font-bold tracking-wider mb-1">Volumen Total</span>
            <span className="text-2xl font-bold text-white">{(totalVolume / 1000).toFixed(1)}<span className="text-xs text-slate-500 ml-1">ton</span></span>
          </div>
          <div className="glass-card p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider mb-1">Series Totales</span>
            <span className="text-2xl font-bold text-white">{totalSets}</span>
          </div>
          <div className="glass-card p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider mb-1">Entrenamientos</span>
            <span className="text-2xl font-bold text-white">{totalWorkouts}</span>
          </div>
          <div className="glass-card p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider mb-1">Racha Actual</span>
            <span className="text-2xl font-bold text-white">{currentStreak} <span className="text-xs text-slate-500 ml-1">días</span></span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase">Duración Promedio</p>
              <p className="text-[10px] text-slate-400">Tiempo por sesión</p>
            </div>
          </div>
          <div className="text-xl font-bold text-white">{avgDuration} <span className="text-xs text-slate-500">min</span></div>
        </div>

        {/* Calendar Heatmap */}
        <div className="glass-panel p-4 rounded-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CalendarIcon size={14} /> Consistencia (Últimos 28 días)
          </h3>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {calendarDays.map((day, i) => (
              <div 
                key={i} 
                className={`w-6 h-6 rounded-md ${day.hasWorkout ? 'bg-brand-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'bg-slate-800/50 border border-white/5'}`}
                title={day.date}
              />
            ))}
          </div>
        </div>

        {/* Total Volume Chart */}
        {volumeChartData.length > 0 && (
          <div className="glass-panel p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Evolución del Volumen</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={volumeChartData}>
                  <defs>
                    <linearGradient id="colorTotalVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" hide />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    orientation="right" 
                    tick={{fontSize: 9, fill: '#64748b'}} 
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
                    itemStyle={{padding: 0}}
                    labelStyle={{color: '#94a3b8', marginBottom: '4px'}}
                  />
                  <Area type="monotone" dataKey="volume" name="Volumen (kg)" stroke="#0ea5e9" fill="url(#colorTotalVol)" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* Muscle Analysis */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
          <Flame size={16} /> Análisis Muscular
        </h2>
        
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-xs font-bold text-white">Heatmap Histórico</h3>
              <p className="text-[10px] text-slate-400 mt-1">Distribución de volumen total</p>
            </div>
          </div>
          <BodyHeatmap muscleVolume={muscleVolume} />
        </div>

        {muscleChartData.length > 0 && (
          <div className="glass-panel p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Series por Grupo Muscular</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={muscleChartData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} width={60} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
                  />
                  <Bar dataKey="sets" name="Series" radius={[0, 4, 4, 0]}>
                    {muscleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#fb923c' : '#0ea5e9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* Exercise Progression */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
          <Dumbbell size={16} /> Ejercicios Individuales
        </h2>
        
        <div className="glass-panel p-4 rounded-2xl">
          <select 
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full bg-slate-800 text-white text-sm font-bold p-3 rounded-xl border border-white/10 mb-4 focus:outline-none focus:border-brand-500"
          >
            {allExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          {exerciseLogs.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                  <Trophy size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Récord (PR)</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {maxExercisePR} <span className="text-xs text-slate-500 font-normal">kg</span>
                </p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                  <Target size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">1RM Est.</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {maxExercise1RM} <span className="text-xs text-slate-500 font-normal">kg</span>
                </p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-purple-400 mb-1">
                  <Activity size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Vol. Máx Sesión</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {maxSessionVolume} <span className="text-xs text-slate-500 font-normal">kg</span>
                </p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-brand-400 mb-1">
                  <TrendingUp size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Evolución 1RM</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {progress1RM > 0 ? '+' : ''}{progress1RM.toFixed(1)} <span className="text-xs text-slate-500 font-normal">kg</span>
                </p>
              </div>
            </div>
          )}

          {exerciseLogs.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={exerciseLogs}>
                  <defs>
                    <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" hide />
                  <YAxis 
                    yAxisId="left"
                    domain={['auto', 'auto']} 
                    orientation="left" 
                    tick={{fontSize: 9, fill: '#10b981'}} 
                    axisLine={false}
                    width={30}
                  />
                  <YAxis 
                    yAxisId="right"
                    domain={['auto', 'auto']} 
                    orientation="right" 
                    tick={{fontSize: 9, fill: '#8b5cf6'}} 
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
                    itemStyle={{padding: 0}}
                    labelStyle={{color: '#94a3b8', marginBottom: '4px'}}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="oneRM" name="1RM Est. (kg)" stroke="#10b981" fill="url(#color1RM)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="volume" name="Tonelaje (kg)" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
              No hay datos para este ejercicio.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
