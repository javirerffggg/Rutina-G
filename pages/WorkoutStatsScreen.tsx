import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLogs, getAvailableExercises } from '../services/storage';
import { Dumbbell, Clock, Flame, ChevronLeft, Activity, Target, Zap, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Legend
} from 'recharts';
import { getRadarData } from '../utils/radar';
import { calculateOneRM } from '../utils';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
const REP_RANGE_COLORS: Record<string, string> = {
  Fuerza: '#ef4444', // Red
  Hipertrofia: '#10b981', // Green
  Resistencia: '#3b82f6' // Blue
};

const tooltipStyle = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 };
const labelStyle   = { color: '#a1a1aa', fontSize: 11 };
const cardCls = 'bg-zinc-900/50 border border-zinc-800/50 p-5 rounded-2xl';

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
    let totalReps = 0;
    let failureSets = 0;
    
    let sumRIR = 0;
    let countRIR = 0;

    const repRanges = { Fuerza: 0, Hipertrofia: 0, Resistencia: 0 };
    const exVolumes: Record<string, number> = {};

    log.exercises.forEach(exLog => {
      const completedSets = exLog.sets.filter(s => s.completed && ((s.weight || 0) > 0 || (s.reps || 0) > 0));
      if (completedSets.length === 0) return;

      let exVol = 0;
      completedSets.forEach(s => {
        const reps = s.reps || 0;
        const weight = s.weight || 0;
        exVol += (weight * reps);
        totalReps += reps;
        if (s.setType === 'F') failureSets++;

        if (reps > 0 && reps <= 5) repRanges.Fuerza += 1;
        else if (reps >= 6 && reps <= 12) repRanges.Hipertrofia += 1;
        else if (reps > 12) repRanges.Resistencia += 1;

        if (s.rir !== undefined) {
          sumRIR += s.rir;
          countRIR++;
        }
      });
      totalVolume += exVol;
      totalSets += completedSets.length;
      exVolumes[exLog.exerciseId] = exVol;
    });

    const { radarData, maxSets, hasMuscleData } = getRadarData([log], Infinity);

    // TUT Estimado
    const tutSeconds = (totalReps * 3.5) + (failureSets * 5);
    const tutMinutes = tutSeconds / 60;
    const durationMinutes = log.duration || Math.round(tutMinutes * 3.5); 
    const density = durationMinutes > 0 ? Math.round((tutMinutes / durationMinutes) * 100) : 0;
    const idleMinutes = Math.max(0, durationMinutes - tutMinutes);

    const pieData = Object.entries(repRanges)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));

    const workoutType = log.workoutType;
    const sortedDates = Object.keys(logs).sort();
    const historyDates = sortedDates.filter(d => d <= log.date && logs[d].workoutCompleted);
    
    const historyData: any[] = [];
    historyDates.forEach(d => {
      const hLog = logs[d];
      if (hLog.workoutType === workoutType && hLog.exercises) {
        let hVol = 0;
        let hSumRIR = 0;
        let hCountRIR = 0;
        hLog.exercises.forEach(ex => {
          ex.sets.filter((s: any) => s.completed).forEach((s: any) => {
            hVol += (s.weight || 0) * (s.reps || 0);
            if (s.rir !== undefined) { hSumRIR += s.rir; hCountRIR++; }
          });
        });
        historyData.push({
          date: new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
          tonelaje: hVol / 1000,
          rpe: hCountRIR > 0 ? 10 - (hSumRIR / hCountRIR) : null
        });
      }
    });

    const anchorIds = Object.entries(exVolumes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    const baseTime = new Date(log.date).getTime();
    const anchorHistory = historyDates
      .filter(d => (baseTime - new Date(d).getTime()) <= 90 * 86400000)
      .map(d => {
        const hLog = logs[d];
        if (!hLog.exercises) return null;
        const entry: any = { date: new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) };
        let hasData = false;
        anchorIds.forEach(aId => {
          const ex = hLog.exercises!.find(e => e.exerciseId === aId);
          if (ex) {
            const max1RM = Math.max(...ex.sets.filter((s: any) => s.completed).map((s: any) => calculateOneRM(s.weight||0, s.reps||0)), 0);
            if (max1RM > 0) {
              entry[aId] = max1RM;
              hasData = true;
            }
          }
        });
        return hasData ? entry : null;
      }).filter(Boolean);

    const anchorInfo = anchorIds.map(id => ({
      id,
      name: allExercises.find(e => e.id === id)?.name || id
    }));

    return {
      totalVolume, totalSets, radarData, maxSets, hasMuscleData,
      avgRPE: countRIR > 0 ? 10 - (sumRIR / countRIR) : null,
      tutMinutes, durationMinutes, density, idleMinutes,
      pieData, historyData, anchorHistory, anchorInfo
    };
  }, [log, logs, allExercises]);

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
          {/* 1. KPIs Principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Dumbbell size={10} /> Tonelaje</span>
              <span className="text-xl font-bold text-brand-400">{(stats.totalVolume / 1000).toFixed(1)}<span className="text-xs text-zinc-500 ml-1">t</span></span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Target size={10} /> RPE Prom.</span>
              <span className="text-xl font-bold text-amber-400">{stats.avgRPE ? stats.avgRPE.toFixed(1) : '--'}</span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Clock size={10} /> Densidad</span>
              <span className="text-xl font-bold text-emerald-400">{stats.density}%</span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Activity size={10} /> Series</span>
              <span className="text-xl font-bold text-purple-400">{stats.totalSets}</span>
            </div>
          </div>

          {/* 2. Spider Chart */}
          <div className={cardCls}>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame size={16} className="text-amber-400" /> Equilibrio Muscular
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                Series por grupo
              </p>
            </div>
            {stats.hasMuscleData ? (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={stats.radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="muscle" tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, stats.maxSets]} tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickCount={4} />
                  <Radar name="Series" dataKey="sets" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.18} strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#fbbf24', stroke: '#92400e', strokeWidth: 1 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _: string, entry: any) => [v + ' series', entry.payload.muscle]} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Flame size={28} className="text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-xs font-bold">Sin datos musculares</p>
              </div>
            )}
          </div>

          {/* 3. Tonelaje Histórico */}
          {stats.historyData.length > 1 && (
            <div className={cardCls}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart2 size={16} className="text-brand-400" /> Tendencia de Fuerza
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                    Tonelaje ({log.workoutType})
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" minTickGap={20} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
                  <Line type="monotone" dataKey="tonelaje" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Tonelaje (t)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 4. RPE Histórico */}
          {stats.historyData.length > 1 && stats.historyData.some(d => d.rpe !== null) && (
            <div className={cardCls}>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap size={16} className="text-amber-400" /> Nivel de Fatiga
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                  RPE Promedio Histórico
                </p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats.historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" minTickGap={20} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} domain={[0, 10]} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
                  <Bar dataKey="rpe" name="RPE" radius={[4, 4, 0, 0]}>
                    {stats.historyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.rpe >= 9 ? '#ef4444' : entry.rpe >= 7.5 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 5. Ejercicios Ancla */}
          {stats.anchorHistory.length > 1 && stats.anchorInfo.length > 0 && (
            <div className={cardCls}>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target size={16} className="text-emerald-400" /> Progreso Real (1RM Est.)
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                  Top 3 Ejercicios de la sesión
                </p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.anchorHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" minTickGap={20} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  {stats.anchorInfo.map((info, index) => (
                    <Line key={info.id} type="monotone" dataKey={info.id} name={info.name} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 6. Rep distribution y Densidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={cardCls}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Dumbbell size={16} className="text-purple-400" /> Distribución de Reps
              </h3>
              {stats.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={REP_RANGE_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-32 text-zinc-500 text-xs">Sin series completadas</div>
              )}
            </div>

            <div className={cardCls}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Clock size={16} className="text-blue-400" /> TUT vs Descanso
              </h3>
              <div className="flex flex-col h-full justify-center">
                <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                  <span className="text-emerald-400">Trabajo: {stats.tutMinutes.toFixed(1)}m</span>
                  <span className="text-zinc-500">Descanso: {stats.idleMinutes.toFixed(1)}m</span>
                </div>
                <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-400 h-full" style={{ width: `${stats.density}%` }} />
                  <div className="bg-zinc-700 h-full" style={{ width: `${100 - stats.density}%` }} />
                </div>
                <p className="text-center text-[10px] text-zinc-500 mt-3 font-medium">
                  {stats.density}% de densidad en {stats.durationMinutes.toFixed(0)} min totales.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutStatsScreen;
