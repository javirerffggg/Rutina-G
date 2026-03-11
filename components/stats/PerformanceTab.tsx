import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { DailyLog } from '../../types';
import { Dumbbell, Trophy, TrendingUp, Flame, Activity, Clock, Calendar as CalendarIcon, Target } from 'lucide-react';
import { EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS, EXERCISES_UPPER, EXERCISES_LOWER, EXERCISE_MUSCLE_MAP, MUSCLE_VOLUME_RECOMMENDATIONS } from '../../constants';
import { calculateOneRM, getWeeklyMuscleVolume } from '../../utils';
import { BodyHeatmap } from '../BodyHeatmap';

interface PerformanceTabProps {
  logs: Record<string, DailyLog>;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ logs = {} }) => {
  const allExercises = useMemo(
    () => [...EXERCISES_PUSH, ...EXERCISES_PULL, ...EXERCISES_LEGS, ...EXERCISES_UPPER, ...EXERCISES_LOWER],
    []
  );
  const [selectedExercise, setSelectedExercise] = useState<string>(allExercises[0].id);
  const [muscleChartMode, setMuscleChartMode] = useState<'historical' | 'weekly'>('historical');

  const sortedDates = useMemo(() => Object.keys(logs).sort(), [logs]);
  const workoutLogs = useMemo(
    () => sortedDates.map(d => logs[d]).filter(l => l.exercises && l.exercises.length > 0),
    [sortedDates, logs]
  );

  const totalVolume = useMemo(() => workoutLogs.reduce((acc, log) =>
    acc + (log.exercises?.reduce((ea, ex) =>
      ea + ex.sets.reduce((sa, s) => sa + s.weight * s.reps, 0), 0) || 0), 0), [workoutLogs]);

  const totalSets = useMemo(() => workoutLogs.reduce((acc, log) =>
    acc + (log.exercises?.reduce((ea, ex) => ea + ex.sets.length, 0) || 0), 0), [workoutLogs]);

  const avgDuration = useMemo(() => {
    const withDur = workoutLogs.filter(l => l.duration && l.duration > 0);
    return withDur.length > 0
      ? Math.round(withDur.reduce((acc, l) => acc + l.duration!, 0) / withDur.length)
      : 0;
  }, [workoutLogs]);

  // Streak using ISO string date comparison to avoid timezone issues
  const { currentStreak } = useMemo(() => {
    let temp = 0, max = 0, lastDateStr = '';
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    sortedDates.forEach(dateStr => {
      if (!logs[dateStr]?.exercises?.length) return;
      if (!lastDateStr) {
        temp = 1;
      } else {
        const diff = Math.round(
          (new Date(dateStr).getTime() - new Date(lastDateStr).getTime()) / 86400000
        );
        temp = diff === 1 ? temp + 1 : 1;
      }
      if (temp > max) max = temp;
      lastDateStr = dateStr;
    });

    const cur = (lastDateStr === todayStr || lastDateStr === yesterdayStr) ? temp : 0;
    return { currentStreak: cur, maxStreak: max };
  }, [sortedDates, logs]);

  const { muscleSets, muscleVolume } = useMemo(() => {
    const sets: Record<string, number> = {};
    const vol: Record<string, number>  = {};
    workoutLogs.forEach(log => {
      log.exercises?.forEach(ex => {
        const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
        const exVol = ex.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
        muscles.forEach(m => {
          sets[m] = (sets[m] || 0) + ex.sets.length;
          vol[m]  = (vol[m]  || 0) + exVol;
        });
      });
    });
    return { muscleSets: sets, muscleVolume: vol };
  }, [workoutLogs]);

  const muscleChartData = useMemo(
    () => Object.entries(muscleSets).map(([name, sets]) => ({ name, sets })).sort((a, b) => b.sets - a.sets),
    [muscleSets]
  );

  const weeklyMuscleVolume = useMemo(() => getWeeklyMuscleVolume(logs, EXERCISE_MUSCLE_MAP), [logs]);
  const weeklyChartData = useMemo(
    () => Object.entries(weeklyMuscleVolume).map(([name, sets]) => ({ name, sets })).sort((a, b) => b.sets - a.sets),
    [weeklyMuscleVolume]
  );

  const exerciseLogs = useMemo(() => sortedDates.map(date => {
    const entry = logs[date];
    if (!entry?.exercises) return null;
    const exLog = entry.exercises.find(e => e.exerciseId === selectedExercise);
    if (!exLog || exLog.sets.length === 0) return null;
    const max1RM    = Math.max(...exLog.sets.map(s => calculateOneRM(s.weight, s.reps)));
    const volume    = exLog.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
    const maxWeight = Math.max(...exLog.sets.map(s => s.weight));
    const rirSets   = exLog.sets.filter(s => s.rir != null);
    const avgRIR    = rirSets.length > 0 ? rirSets.reduce((acc, s) => acc + s.rir!, 0) / rirSets.length : null;
    return {
      date: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      oneRM: max1RM, volume, maxWeight, rir: avgRIR,
    };
  }).filter(Boolean) as { date: string; oneRM: number; volume: number; maxWeight: number; rir: number | null }[],
  [sortedDates, logs, selectedExercise]);

  const maxExercise1RM   = exerciseLogs.length > 0 ? Math.max(...exerciseLogs.map(l => l.oneRM))     : 0;
  const maxExercisePR    = exerciseLogs.length > 0 ? Math.max(...exerciseLogs.map(l => l.maxWeight)) : 0;
  const maxSessionVolume = exerciseLogs.length > 0 ? Math.max(...exerciseLogs.map(l => l.volume))    : 0;
  const progress1RM      = exerciseLogs.length > 1 ? exerciseLogs[exerciseLogs.length - 1].oneRM - exerciseLogs[0].oneRM : 0;

  const volumeChartData = useMemo(() => workoutLogs.map(log => ({
    date: new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    volume: log.exercises?.reduce((acc, ex) => acc + ex.sets.reduce((sa, s) => sa + s.weight * s.reps, 0), 0) || 0,
  })).slice(-30), [workoutLogs]);

  // Calendar using ISO string comparison
  const calendarDays = useMemo(() => Array.from({ length: 28 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const dateStr = d.toISOString().split('T')[0];
    return { dateStr, hasWorkout: !!(logs[dateStr]?.exercises?.length) };
  }), [logs]);

  const activeChartData = muscleChartMode === 'historical' ? muscleChartData : weeklyChartData;

  return (
    <div className="space-y-8 pb-8">
      {/* General Stats */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
          <Activity size={16} /> Vision Global
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
            <span className="text-2xl font-bold text-white">{workoutLogs.length}</span>
          </div>
          <div className="glass-card p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider mb-1">Racha Actual</span>
            <span className="text-2xl font-bold text-white">{currentStreak} <span className="text-xs text-slate-500 ml-1">dias</span></span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase">Duracion Promedio</p>
              <p className="text-[10px] text-slate-400">Tiempo por sesion</p>
            </div>
          </div>
          <div className="text-xl font-bold text-white">{avgDuration} <span className="text-xs text-slate-500">min</span></div>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CalendarIcon size={14} /> Consistencia (Ultimos 28 dias)
          </h3>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-md ${day.hasWorkout ? 'bg-brand-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'bg-slate-800/50 border border-white/5'}`}
                title={day.dateStr}
              />
            ))}
          </div>
        </div>

        {volumeChartData.length > 0 && (
          <div className="glass-panel p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Evolucion del Volumen</h3>
            <div style={{ width: '100%', height: 192 }}>
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
                  <YAxis domain={['auto', 'auto']} orientation="right" tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} width={40} />
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}} itemStyle={{padding: 0}} labelStyle={{color: '#94a3b8', marginBottom: '4px'}} />
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
          <Flame size={16} /> Analisis Muscular
        </h2>
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white">Heatmap Historico</h3>
            <p className="text-[10px] text-slate-400 mt-1">Distribucion de volumen total</p>
          </div>
          <BodyHeatmap muscleVolume={muscleVolume} muscleSets={muscleSets} />
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Fatiga Semanal (Series)</h3>
          <div className="space-y-3">
            {Object.entries(MUSCLE_VOLUME_RECOMMENDATIONS).map(([muscle, range]) => {
              const sets = weeklyMuscleVolume[muscle] || 0;
              const isLow  = sets < range.min;
              const isHigh = sets > range.max;
              const colorClass = isLow ? 'text-amber-400' : isHigh ? 'text-red-400' : 'text-emerald-400';
              const bgClass    = isLow ? 'bg-amber-400'   : isHigh ? 'bg-red-400'   : 'bg-emerald-400';
              const progress = Math.min(100, (sets / range.max) * 100);
              return (
                <div key={muscle} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-300">{muscle}</span>
                    <span className={colorClass}>{sets} / {range.min}-{range.max}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${bgClass}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {muscleChartData.length > 0 && (
          <div className="glass-panel p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Series por Grupo Muscular</h3>
              <div className="flex bg-slate-900/50 p-0.5 rounded-lg border border-white/5">
                {(['historical', 'weekly'] as const).map(mode => (
                  <button key={mode} onClick={() => setMuscleChartMode(mode)}
                    className={`px-2 py-1 text-[8px] font-bold uppercase rounded-md transition-all ${
                      muscleChartMode === mode ? 'bg-brand-500 text-white' : 'text-slate-500'
                    }`}
                  >
                    {mode === 'historical' ? 'Historico' : 'Semanal'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ width: '100%', height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeChartData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} width={60} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}} />
                  <Bar dataKey="sets" name="Series" radius={[0, 4, 4, 0]}>
                    {activeChartData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx < 3 ? '#fb923c' : '#0ea5e9'} />
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
            onChange={e => setSelectedExercise(e.target.value)}
            className="w-full bg-slate-800 text-white text-sm font-bold p-3 rounded-xl border border-white/10 mb-4 focus:outline-none focus:border-brand-500"
          >
            {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>

          {exerciseLogs.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                  <Trophy size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Record (PR)</span>
                </div>
                <p className="text-xl font-bold text-white">{maxExercisePR} <span className="text-xs text-slate-500 font-normal">kg</span></p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                  <Target size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">1RM Est.</span>
                </div>
                <p className="text-xl font-bold text-white">{maxExercise1RM} <span className="text-xs text-slate-500 font-normal">kg</span></p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-purple-400 mb-1">
                  <Activity size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Vol. Max Sesion</span>
                </div>
                <p className="text-xl font-bold text-white">{maxSessionVolume} <span className="text-xs text-slate-500 font-normal">kg</span></p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-brand-400 mb-1">
                  <TrendingUp size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Evolucion 1RM</span>
                </div>
                <p className="text-xl font-bold text-white">{progress1RM > 0 ? '+' : ''}{progress1RM.toFixed(1)} <span className="text-xs text-slate-500 font-normal">kg</span></p>
              </div>
            </div>
          )}

          {exerciseLogs.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 192 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={exerciseLogs}>
                    <defs>
                      <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#64748b'}} interval="preserveStartEnd" minTickGap={20} />
                    <YAxis yAxisId="left"  domain={['auto', 'auto']} orientation="left"  tick={{fontSize: 9, fill: '#10b981'}} axisLine={false} width={30} />
                    <YAxis yAxisId="right" domain={['auto', 'auto']} orientation="right" tick={{fontSize: 9, fill: '#8b5cf6'}} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}t` : v} axisLine={false} width={40} />
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}} itemStyle={{padding: 0}} labelStyle={{color: '#94a3b8', marginBottom: '4px'}} />
                    <Area yAxisId="left"  type="monotone" dataKey="oneRM"  name="1RM Est. (kg)"  stroke="#10b981" fill="url(#color1RM)" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="volume" name="Tonelaje (kg)" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Evolucion del RIR</h3>
                <div style={{ width: '100%', height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={exerciseLogs.filter(l => l.rir !== null)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#64748b'}} interval="preserveStartEnd" minTickGap={20} />
                      <YAxis domain={[0, 10]} orientation="right" tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} width={30} />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}} itemStyle={{padding: 0}} labelStyle={{color: '#94a3b8', marginBottom: '4px'}} />
                      <Bar dataKey="rir" name="RIR Promedio" radius={[4, 4, 0, 0]}>
                        {exerciseLogs.filter(l => l.rir !== null).map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.rir! > 2 ? '#10b981' : entry.rir! > 0 ? '#fb923c' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-center italic">
                  Un RIR creciente con la misma carga indica una mejor recuperacion y adaptacion.
                </p>
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No hay datos para este ejercicio.</div>
          )}
        </div>
      </section>
    </div>
  );
};
