import React, { useMemo } from 'react';
import { getLogs } from '../../services/storage';
import { getSettings } from '../../services/settings';
import { getTodayDateString, getCurrentPhase } from '../../utils';
import { EXERCISE_MUSCLE_MAP } from '../../constants';
import { calculate7DayAverage } from '../../utils/bodyComposition';
import { Scale, Flame, TrendingUp, TrendingDown, Minus, Dumbbell, CalendarDays } from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const RADAR_MUSCLES = [
  { key: 'chest',      label: 'Pecho' },
  { key: 'back',       label: 'Espalda' },
  { key: 'shoulders',  label: 'Hombros' },
  { key: 'biceps',     label: 'Bíceps' },
  { key: 'triceps',    label: 'Tríceps' },
  { key: 'core',       label: 'Core' },
  { key: 'quads',      label: 'Cuádriceps' },
  { key: 'hamstrings', label: 'Isquios' },
];

export const DesktopDashboard: React.FC = () => {
  const today = getTodayDateString();
  const settings = useMemo(() => getSettings(), []);
  const allLogs = useMemo(() => getLogs(), []);
  const phase = useMemo(
    () => getCurrentPhase(today, allLogs, settings.autoDeload ? settings.deloadFrequency : 0),
    [today, allLogs, settings]
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const weightLogs = useMemo(() =>
    Object.values(allLogs)
      .filter(l => l.weight)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [allLogs]
  );

  const last7Weights = weightLogs.slice(-7).map(l => l.weight as number);
  const weightAvg7d = calculate7DayAverage(last7Weights);
  const todayWeight = allLogs[today]?.weight;
  const weightDelta = todayWeight && weightAvg7d ? +(todayWeight - weightAvg7d).toFixed(1) : undefined;

  // Weekly volume (sets)
  const weeklySetTotal = useMemo(() => {
    const todayDate = new Date(today);
    let total = 0;
    Object.keys(allLogs).forEach(d => {
      const diff = Math.round(Math.abs(todayDate.getTime() - new Date(d).getTime()) / 86400000);
      if (diff <= 7 && allLogs[d].exercises) {
        allLogs[d].exercises!.forEach(ex => {
          total += ex.sets.filter((s: any) => s.completed).length;
        });
      }
    });
    return total;
  }, [allLogs, today]);

  // Streak
  const streak = useMemo(() => {
    let count = 0;
    const d = new Date(today);
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (allLogs[key]?.workoutCompleted) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }, [allLogs, today]);

  // ── Radar data ───────────────────────────────────────────────────────────
  const { radarData, maxSets, hasMuscleData } = useMemo(() => {
    const setsData: Record<string, number> = {};
    const todayDate = new Date(today);
    Object.keys(allLogs).forEach(d => {
      const diff = Math.round(Math.abs(todayDate.getTime() - new Date(d).getTime()) / 86400000);
      if (diff <= 7 && allLogs[d].exercises) {
        allLogs[d].exercises!.forEach((ex: any) => {
          const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
          const done = ex.sets.filter((s: any) => s.completed && ((s.reps || 0) > 0 || (s.weight || 0) > 0));
          if (!done.length) return;
          muscles.forEach((m: string) => { setsData[m] = (setsData[m] || 0) + done.length; });
        });
      }
    });
    const radar = RADAR_MUSCLES.map(({ key, label }) => ({ muscle: label, sets: setsData[key] || 0 }));
    return { radarData: radar, maxSets: Math.max(...radar.map(d => d.sets), 1), hasMuscleData: radar.some(d => d.sets > 0) };
  }, [allLogs, today]);

  // ── Weight chart (30d) ───────────────────────────────────────────────────
  const weightChartData = useMemo(() =>
    weightLogs.slice(-30).map(l => ({
      date: new Date(l.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      weight: l.weight,
    })),
    [weightLogs]
  );

  // ── Recent sessions ──────────────────────────────────────────────────────
  const recentSessions = useMemo(() =>
    Object.values(allLogs)
      .filter(l => l.workoutCompleted)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6),
    [allLogs]
  );

  const TrendIcon = weightDelta === undefined
    ? () => <Minus size={14} className="text-zinc-500" />
    : weightDelta < 0
      ? () => <TrendingDown size={14} className="text-emerald-400" />
      : () => <TrendingUp size={14} className="text-rose-400" />;

  return (
    <div className="h-full">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* 3-col layout */}
      <div className="grid grid-cols-[260px_1fr_280px] gap-6 items-start">

        {/* ── COL 1: KPIs ── */}
        <div className="space-y-4">
          {/* Peso */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-brand-400">
              <Scale size={15} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Peso hoy</span>
            </div>
            <p className="text-4xl font-bold text-white tabular-nums">
              {todayWeight?.toFixed(1) ?? '--'}
              <span className="text-base text-zinc-500 ml-1">kg</span>
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
              <TrendIcon />
              <span>Media 7d: <strong>{weightAvg7d?.toFixed(1) ?? '--'} kg</strong></span>
            </div>
          </div>

          {/* Volumen semana */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-amber-400">
              <Dumbbell size={15} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Series esta semana</span>
            </div>
            <p className="text-4xl font-bold text-white tabular-nums">{weeklySetTotal}</p>
            <p className="text-xs text-zinc-500 mt-2">sets completados (7 días)</p>
          </div>

          {/* Racha */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-rose-400">
              <Flame size={15} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Racha</span>
            </div>
            <p className="text-4xl font-bold text-white tabular-nums">{streak}</p>
            <p className="text-xs text-zinc-500 mt-2">días consecutivos</p>
          </div>

          {/* Fase */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-violet-400">
              <CalendarDays size={15} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Fase actual</span>
            </div>
            <p className="text-lg font-bold text-white">{phase.name}</p>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{phase.trainingFocus?.split('.')[0]}</p>
          </div>
        </div>

        {/* ── COL 2: Charts ── */}
        <div className="space-y-6">
          {/* Peso 30d */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-zinc-300 mb-4">Evolución del peso (30 días)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" minTickGap={20} tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 }}
                  labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Radar carga muscular */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-zinc-300 mb-1">Carga muscular — últimos 7 días</h3>
            {hasMuscleData ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="muscle" tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, maxSets]} tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickCount={4} />
                  <Radar dataKey="sets" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.18} strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#fbbf24', stroke: '#92400e', strokeWidth: 1 }}
                  />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 }}
                    formatter={(v: number, _: string, entry: any) => [v + ' series', entry.payload.muscle]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                <Flame size={28} className="mb-2" />
                <p className="text-sm">Sin entrenamientos esta semana</p>
              </div>
            )}
          </div>
        </div>

        {/* ── COL 3: Recent activity ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Últimas sesiones</h3>
          {recentSessions.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <Dumbbell size={24} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Sin sesiones registradas</p>
            </div>
          ) : (
            recentSessions.map(session => {
              const exCount = session.exercises?.length ?? 0;
              const setCount = session.exercises?.reduce((a: number, ex: any) =>
                a + ex.sets.filter((s: any) => s.completed).length, 0) ?? 0;
              return (
                <div key={session.date} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-white">
                    {new Date(session.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{exCount} ejercicios · {setCount} sets</p>
                  {session.energy && (
                    <div className="mt-2 flex gap-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                      <span>⚡ Energía {session.energy}/5</span>
                      {session.sleep && <span>🌙 Sueño {session.sleep}/5</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
