import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLogs, getAvailableExercises } from '../services/storage';
import { Dumbbell, Clock, Flame, Award, ChevronLeft, CalendarDays, Activity } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { EXERCISE_MUSCLE_MAP } from '../constants';

import { getRadarData } from '../utils/radar';

const WorkoutStatsScreen: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();

  const customRoutines = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('customRoutines') || '[]'); } catch { return []; }
  }, []);

  const logs = getLogs();
  const log = date ? logs[date] : null;
  
  const allExercises = useMemo(() => getAvailableExercises(logs, customRoutines), [logs, customRoutines]);

  const stats = useMemo(() => {
    if (!log || !log.exercises) return null;

    let totalVolume = 0;
    let totalSets = 0;
    log.exercises.forEach(exLog => {
      const completedSets = exLog.sets.filter(s => s.completed && ((s.weight || 0) > 0 || (s.reps || 0) > 0));
      if (completedSets.length === 0) return;
      const exVolume = completedSets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0);
      totalVolume += exVolume;
      totalSets += completedSets.length;
    });

    const { radarData, maxSets, hasMuscleData } = getRadarData([log], Infinity);

    return {
      totalVolume,
      totalSets,
      radarData,
      maxSets,
      hasMuscleData
    };
  }, [log]);

  if (!log) {
    return (
      <div className="p-6 pb-32 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Dumbbell size={48} className="text-zinc-700 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Entrenamiento no encontrado</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-zinc-800 text-white rounded-xl font-bold">Volver</button>
      </div>
    );
  }

  const dateStr = new Date(log.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-4 sm:p-6 pb-32 max-w-xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2 capitalize">
            {dateStr}
          </h1>
          <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mt-1">{log.workoutType || 'Sesión Libre'}</p>
        </div>
      </header>

      {stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Dumbbell size={10} /> Volumen</span>
              <span className="text-2xl font-bold text-brand-400">{stats.totalVolume.toLocaleString()}<span className="text-xs text-zinc-500 ml-1">kg</span></span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Activity size={10} /> Series</span>
              <span className="text-2xl font-bold text-emerald-400">{stats.totalSets}</span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center sm:col-span-1 col-span-2">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Clock size={10} /> Duración</span>
              <span className="text-2xl font-bold text-purple-400">{log.duration || '--'}<span className="text-xs text-zinc-500 ml-1">min</span></span>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 p-5 rounded-2xl">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame size={16} className="text-amber-400" /> Carga Muscular de la Sesión
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                Series por grupo
              </p>
            </div>

            {stats.hasMuscleData ? (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={stats.radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="muscle"
                    tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, stats.maxSets]}
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
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const { muscle, sets } = payload[0].payload;
                    return (
                      <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
                        <p className="text-xs font-bold text-white">{muscle}</p>
                        <p className="text-xs text-amber-400">{sets} series</p>
                      </div>
                    );
                  }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Flame size={28} className="text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-xs font-bold">Sin datos musculares</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutStatsScreen;
