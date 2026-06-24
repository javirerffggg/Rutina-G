import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell,
  ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { getLogs, saveLog } from '../../services/storage';
import { getSettings } from '../../services/settings';
import { getTodayDateString, calculateOneRM, getWeeklyMuscleVolume } from '../../utils';
import { DailyLog } from '../../types';
import {
  EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS,
  EXERCISES_UPPER, EXERCISES_LOWER,
  EXERCISE_MUSCLE_MAP, MUSCLE_VOLUME_RECOMMENDATIONS, MEV_MAV,
} from '../../constants';
import {
  calculateBodyComposition,
  calculate7DayAverage,
  calculate7DayTrend,
  calculateWeeklyWeightChangeRate,
  classifyWeeklyChangeRate,
} from '../../utils/bodyComposition';
import {
  Activity, Scale, Target, Dumbbell, Flame,
  TrendingDown, TrendingUp, Minus, Trophy, Clock,
} from 'lucide-react';
import { BodyHeatmap } from '../../components/BodyHeatmap';

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', core: 'Core',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Pantorrillas',
};

import { getRadarData } from '../../utils/radar';

const CHART_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];

const tooltipStyle = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 };
const labelStyle   = { color: '#a1a1aa', fontSize: 11 };
const cardCls = 'bg-zinc-900 border border-zinc-800 rounded-2xl p-5';

// ──────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">{children}</p>
);

const KpiCard: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: string }> = ({
  label, value, sub, accent = 'text-brand-400'
}) => (
  <div className={cardCls}>
    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${accent}`}>{label}</p>
    <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
    {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
  </div>
);

// ──────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────
export const DesktopStats: React.FC = () => {
  const today = useMemo(() => getTodayDateString(), []);
  const settings = useMemo(() => getSettings(), []);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [todayLog, setTodayLog] = useState<DailyLog>({ date: today });
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  useEffect(() => {
    const load = () => {
      const data = getLogs();
      setLogs(data);
      setTodayLog(data[today] ?? { date: today });
    };
    load();
    window.addEventListener('storage-update', load);
    return () => window.removeEventListener('storage-update', load);
  }, [today]);

  // ── Exercises list ──────────────────────────────────────
  const allExercises = useMemo(
    () => [...EXERCISES_PUSH, ...EXERCISES_PULL, ...EXERCISES_LEGS, ...EXERCISES_UPPER, ...EXERCISES_LOWER],
    []
  );
  useEffect(() => {
    if (!selectedExercise && allExercises.length > 0)
      setSelectedExercise(allExercises[0].id);
  }, [allExercises, selectedExercise]);

  // ── Sorted logs ─────────────────────────────────────────
  const sortedDates = useMemo(() => Object.keys(logs).sort(), [logs]);
  const weightLogs  = useMemo(
    () => sortedDates.map(d => logs[d]).filter(l => (l.weight ?? 0) > 0),
    [sortedDates, logs]
  );
  const workoutLogs = useMemo(
    () => sortedDates.map(d => logs[d]).filter(l => l.exercises?.length),
    [sortedDates, logs]
  );

  // ── Global KPIs ─────────────────────────────────────────
  const totalVolumeTon = useMemo(() =>
    workoutLogs.reduce((acc, l) =>
      acc + (l.exercises?.reduce((ea, ex) =>
        ea + ex.sets.filter((s: any) => s.completed && (s.weight||0) > 0)
          .reduce((sa: number, s: any) => sa + (s.weight||0)*(s.reps||0), 0), 0) || 0), 0) / 1000,
    [workoutLogs]
  );
  const totalSets = useMemo(() =>
    workoutLogs.reduce((acc, l) =>
      acc + (l.exercises?.reduce((ea, ex) => ea + ex.sets.length, 0) || 0), 0),
    [workoutLogs]
  );
  const avgDuration = useMemo(() => {
    const w = workoutLogs.filter(l => (l.duration ?? 0) > 0);
    return w.length ? Math.round(w.reduce((a, l) => a + l.duration!, 0) / w.length) : 0;
  }, [workoutLogs]);
  const currentStreak = useMemo(() => {
    let temp = 0; let lastStr = '';
    const todayStr  = new Date().toISOString().split('T')[0];
    const yestStr   = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    sortedDates.forEach(d => {
      if (!logs[d]?.exercises?.length) return;
      if (!lastStr) { temp = 1; }
      else {
        const diff = Math.round((new Date(d).getTime() - new Date(lastStr).getTime()) / 86400000);
        temp = diff === 1 ? temp + 1 : 1;
      }
      lastStr = d;
    });
    return (lastStr === todayStr || lastStr === yestStr) ? temp : 0;
  }, [sortedDates, logs]);

  // ── Weight metrics ──────────────────────────────────────
  const gender = (todayLog.gender || (settings.profile?.gender === 'F' ? 'female' : 'male')) as any;
  const height = todayLog.height || settings.profile?.height;
  const last7Weights  = weightLogs.slice(-7).map(l => l.weight as number);
  const weightAvg7d   = calculate7DayAverage(last7Weights);
  const weightTrend   = todayLog.weight && weightAvg7d ? calculate7DayTrend(todayLog.weight, weightAvg7d) : undefined;
  const log7ago       = weightLogs[Math.max(0, weightLogs.length - 7)];
  const weeklyChange  = todayLog.weight && log7ago?.weight
    ? calculateWeeklyWeightChangeRate(todayLog.weight, log7ago.weight) : undefined;
  const changeStatus  = weeklyChange !== undefined ? classifyWeeklyChangeRate(weeklyChange) : undefined;

  const composition = useMemo(() => {
    const { weight, waist, neck } = todayLog;
    if (!weight || !waist || !neck || !height) return null;
    try { return calculateBodyComposition(weight, waist, neck, height, gender); } catch { return null; }
  }, [todayLog, height, gender]);

  // ── Weight chart 90d ────────────────────────────────────
  const weightChart = useMemo(() =>
    weightLogs.slice(-90).map((l, i, arr) => {
      const past7 = arr.slice(Math.max(0, i - 6), i + 1).map(x => x.weight as number);
      let bodyFat: number | null = null, lbm: number | null = null;
      const lh = l.height || height;
      if (l.weight && l.waist && l.neck && lh) {
        try { const c = calculateBodyComposition(l.weight, l.waist, l.neck, lh, l.gender || gender); bodyFat = c.bodyFatPercentage; lbm = c.leanBodyMass; } catch {}
      }
      return {
        date:   new Date(l.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        weight: l.weight,
        avg7d:  calculate7DayAverage(past7),
        bodyFat,
        lbm,
        delta:  i > 0 && arr[i-1].weight ? +((l.weight! - arr[i-1].weight!).toFixed(1)) : null,
      };
    }),
    [weightLogs, gender, height]
  );

  // ── Consistency heatmap ─────────────────────────────────
  const { heatmapData, consistencyPct } = useMemo(() => {
    const base = new Date(); base.setHours(0,0,0,0);
    let cnt = 0;
    const data = Array.from({ length: 56 }, (_, i) => {
      const d = new Date(base); d.setDate(base.getDate() - (55 - i));
      const iso = d.toISOString().split('T')[0];
      const hasLog     = !!(logs[iso]?.weight);
      const hasWorkout = !!(logs[iso]?.workoutCompleted);
      if (hasLog) cnt++;
      return { date: iso, hasLog, hasWorkout };
    });
    return { heatmapData: data, consistencyPct: Math.round((cnt / 56) * 100) };
  }, [logs]);

  // ── Exercise progression ────────────────────────────────
  const exerciseLogs = useMemo(() =>
    sortedDates.flatMap(date => {
      const entry = logs[date];
      if (!entry?.exercises) return [];
      const exLog = entry.exercises.find((e: any) => e.exerciseId === selectedExercise);
      if (!exLog) return [];
      const done = exLog.sets.filter((s: any) => s.completed && ((s.weight||0) > 0 || (s.reps||0) > 0));
      if (!done.length) return [];
      const max1RM = Math.max(...done.map((s: any) => calculateOneRM(s.weight||0, s.reps||0)));
      return [{
        date:      new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        oneRM:     max1RM,
        volume:    done.reduce((a: number, s: any) => a + (s.weight||0)*(s.reps||0), 0),
        maxWeight: Math.max(...done.map((s: any) => s.weight||0)),
        rir:       done.filter((s: any) => s.rir != null).length
          ? done.reduce((a: number, s: any) => a + (s.rir??0), 0) / done.filter((s: any) => s.rir != null).length
          : null,
      }];
    }),
    [sortedDates, logs, selectedExercise]
  );
  const maxPR    = exerciseLogs.length ? Math.max(...exerciseLogs.map(l => l.maxWeight)) : 0;
  const max1RM   = exerciseLogs.length ? Math.max(...exerciseLogs.map(l => l.oneRM))     : 0;
  const delta1RM = exerciseLogs.length > 1 ? exerciseLogs.at(-1)!.oneRM - exerciseLogs[0].oneRM : 0;

  // ── Muscle sets / weekly ────────────────────────────────
  const { muscleSets, muscleVolume } = useMemo(() => {
    const sets: Record<string,number> = {}, vol: Record<string,number> = {};
    workoutLogs.forEach(l => l.exercises?.forEach((ex: any) => {
      const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
      const exVol = ex.sets.reduce((a: number, s: any) => a + (s.weight||0)*(s.reps||0), 0);
      muscles.forEach((m: string) => { sets[m]=(sets[m]||0)+ex.sets.length; vol[m]=(vol[m]||0)+exVol; });
    }));
    return { muscleSets: sets, muscleVolume: vol };
  }, [workoutLogs]);
  const weeklyMuscle = useMemo(() => getWeeklyMuscleVolume(logs, EXERCISE_MUSCLE_MAP), [logs]);

  // ── Radar data ──────────────────────────────────────────
  const { radarData, maxSets, hasMuscleData } = useMemo(() => {
    return getRadarData(Object.values(logs), 7);
  }, [logs]);

  // ── 4-week muscle trend ─────────────────────────────────
  const trendData = useMemo(() => {
    const base = new Date(); base.setHours(0,0,0,0);
    const getWeek = (d: Date) => Math.floor(Math.abs(base.getTime()-d.getTime())/(86400000*7));
    const weekly: Record<number, Record<string,number>> = {0:{},1:{},2:{},3:{}};
    Object.keys(logs).forEach(dateStr => {
      const w = getWeek(new Date(dateStr));
      if (w >= 0 && w <= 3) {
        logs[dateStr].exercises?.forEach((ex: any) => {
          const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
          const done = ex.sets.filter((s: any) => s.completed && ((s.reps||0)>0)).length;
          if (!done) return;
          muscles.forEach((m: string) => { weekly[w][m]=(weekly[w][m]||0)+done; });
        });
      }
    });
    return [3,2,1,0].map(w => ({ name: w===0?'Esta sem':`Hace ${w} sem`, ...weekly[w] }));
  }, [logs]);

  // ── Trend icon ──────────────────────────────────────────
  const TrendIcon = weightTrend === undefined ? () => <Minus size={13} className="text-zinc-600" />
    : weightTrend < 0 ? () => <TrendingDown size={13} className="text-emerald-400" />
    : () => <TrendingUp size={13} className="text-rose-400" />;

  const changeStatusCls: Record<string,string> = {
    optimal:    'text-emerald-400',
    aggressive: 'text-rose-400',
    slow:       'text-amber-400',
  };

  // ── Volume evolution (30d) ──────────────────────────────
  const volumeChart = useMemo(() =>
    workoutLogs.slice(-30).map(l => ({
      date:   new Date(l.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      volume: l.exercises?.reduce((acc: number, ex: any) =>
        acc + ex.sets.reduce((sa: number, s: any) => sa + (s.weight||0)*(s.reps||0), 0), 0) || 0,
    })),
    [workoutLogs]
  );

  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Estadísticas</h1>

      {/* ═══ ROW 1: KPIs globales ═══ */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Volumen total" value={<>{totalVolumeTon.toFixed(1)}<span className="text-sm text-zinc-500 ml-1">ton</span></>} sub={`${totalSets} series totales`} accent="text-brand-400" />
        <KpiCard label="Entrenamientos" value={workoutLogs.length} sub={`${avgDuration} min prom.`} accent="text-violet-400" />
        <KpiCard label="Racha actual" value={<>{currentStreak}<span className="text-sm text-zinc-500 ml-1">d</span></>} accent="text-rose-400" />
        <KpiCard
          label="Peso hoy"
          value={<>{todayLog.weight?.toFixed(1) ?? '--'}<span className="text-sm text-zinc-500 ml-1">kg</span></>}
          sub={<span className="flex items-center gap-1"><TrendIcon />Media 7d: {weightAvg7d?.toFixed(1) ?? '--'} kg</span>}
          accent="text-blue-400"
        />
        <KpiCard
          label="Grasa corporal"
          value={<>{composition ? composition.bodyFatPercentage : '--'}<span className="text-sm text-zinc-500 ml-1">%</span></>}
          sub={composition ? `LBM: ${composition.leanBodyMass} kg` : 'Faltan medidas'}
          accent="text-amber-400"
        />
      </div>

      {/* ═══ ROW 2: Peso 90d + Heatmap ═══ */}
      <div className="grid grid-cols-[1fr_320px] gap-4">

        {/* Evolución peso + grasa */}
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-300">Evolución del peso — 90 días</h3>
            {changeStatus && (
              <span className={`text-xs font-bold ${changeStatusCls[changeStatus]}`}>
                {weeklyChange! > 0 ? '+' : ''}{weeklyChange}% / sem
                {changeStatus === 'optimal' ? ' ✔ ritmo óptimo' : changeStatus === 'aggressive' ? ' ⚠ muy rápido' : ' ⤵ lento'}
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" minTickGap={20} tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} domain={['auto','auto']} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} dot={false} connectNulls name="Peso (kg)" />
              <Line type="monotone" dataKey="avg7d"  stroke="#a78bfa" strokeWidth={2}   dot={false} connectNulls strokeDasharray="4 2" name="Media 7d" />
              {weightChart.some((d: any) => d.bodyFat) && (
                <Line type="monotone" dataKey="bodyFat" stroke="#f43f5e" strokeWidth={2} dot={false} connectNulls strokeDasharray="2 3" name="Grasa %" yAxisId={0} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap consistencia */}
        <div className={cardCls}>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-300">Consistencia</h3>
              <p className="text-xs text-zinc-500">8 semanas</p>
            </div>
            <span className="text-3xl font-bold text-white tabular-nums">{consistencyPct}%</span>
          </div>
          <div className="grid grid-rows-7 gap-1" style={{ gridAutoFlow: 'column' }}>
            {heatmapData.map((day, i) => (
              <div key={i} title={day.date}
                className={`w-4 h-4 rounded-sm ${
                  day.hasWorkout ? 'bg-brand-500' : day.hasLog ? 'bg-violet-500/60' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-3 mt-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-brand-500" /> Entreno</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-violet-500/60" /> Solo peso</span>
          </div>
        </div>
      </div>

      {/* ═══ ROW 3: Progresión ejercicio + Fatiga muscular MEV/MAV ═══ */}
      <div className="grid grid-cols-2 gap-4">

        {/* Progresión por ejercicio */}
        <div className={cardCls + ' space-y-4'}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300">Progresión por ejercicio</h3>
          </div>
          <select
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value)}
            className="w-full bg-zinc-800 text-white text-sm font-bold px-3 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-brand-500"
          >
            {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>

          {exerciseLogs.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-800/60 rounded-xl p-3">
                  <div className="flex items-center gap-1 text-amber-400 mb-1"><Trophy size={12} /><span className="text-[10px] font-bold uppercase tracking-widest">PR</span></div>
                  <p className="text-xl font-bold text-white tabular-nums">{maxPR} <span className="text-xs text-zinc-500">kg</span></p>
                </div>
                <div className="bg-zinc-800/60 rounded-xl p-3">
                  <div className="flex items-center gap-1 text-emerald-400 mb-1"><Target size={12} /><span className="text-[10px] font-bold uppercase tracking-widest">1RM Est.</span></div>
                  <p className="text-xl font-bold text-white tabular-nums">{max1RM} <span className="text-xs text-zinc-500">kg</span></p>
                </div>
                <div className="bg-zinc-800/60 rounded-xl p-3">
                  <div className="flex items-center gap-1 text-brand-400 mb-1"><TrendingUp size={12} /><span className="text-[10px] font-bold uppercase tracking-widest">Δ 1RM</span></div>
                  <p className="text-xl font-bold text-white tabular-nums">{delta1RM > 0 ? '+' : ''}{delta1RM.toFixed(1)} <span className="text-xs text-zinc-500">kg</span></p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={exerciseLogs} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1RM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 9 }} stroke="#3f3f46" minTickGap={15} />
                  <YAxis yAxisId="l" orientation="left"  tick={{ fill: '#10b981', fontSize: 9 }} axisLine={false} domain={['auto','auto']} width={30} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fill: '#8b5cf6', fontSize: 9 }} axisLine={false} tickFormatter={(v: number) => v>=1000?`${(v/1000).toFixed(1)}t`:String(v)} width={36} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
                  <Area  yAxisId="l" type="monotone" dataKey="oneRM"  stroke="#10b981" fill="url(#g1RM)" strokeWidth={2} name="1RM Est. (kg)" />
                  <Line  yAxisId="r" type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2} dot={false}  name="Tonelaje (kg)" />
                </ComposedChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">Sin datos para este ejercicio</div>
          )}
        </div>

        {/* Fatiga muscular MEV/MAV semanal */}
        <div className={cardCls}>
          <h3 className="text-sm font-bold text-zinc-300 mb-4">Fatiga semanal — MEV/MAV</h3>
          <div className="space-y-3">
            {Object.entries(MUSCLE_VOLUME_RECOMMENDATIONS).map(([muscle, range]) => {
              const sets     = weeklyMuscle[muscle] || 0;
              const isLow    = sets < range.min;
              const isHigh   = sets > range.max;
              const colorCls = isLow ? 'text-amber-400' : isHigh ? 'text-red-400' : 'text-emerald-400';
              const barCls   = isLow ? 'bg-amber-400'   : isHigh ? 'bg-red-400'   : 'bg-emerald-400';
              const pct      = Math.min(100, (sets / range.max) * 100);
              return (
                <div key={muscle}>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span className="text-zinc-300">{MUSCLE_LABELS[muscle] || muscle}</span>
                    <span className={colorCls}>{sets} / {range.min}-{range.max}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barCls}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ ROW 4: Variación diaria + Radar + LBM ═══ */}
      <div className="grid grid-cols-3 gap-4">

        {/* Variación diaria 21d */}
        <div className={cardCls}>
          <h3 className="text-sm font-bold text-zinc-300 mb-4">Variación diaria — 21 días</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weightChart.slice(-21).filter(d => d.delta !== null)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 9 }} stroke="#3f3f46" minTickGap={10} />
              <YAxis tick={{ fill: '#71717a', fontSize: 9 }} stroke="#3f3f46" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Bar dataKey="delta" name="Δ kg" radius={[4,4,0,0]}>
                {weightChart.slice(-21).filter(d => d.delta !== null).map((e, i) => (
                  <Cell key={i} fill={e.delta! > 0 ? '#f43f5e' : e.delta! < 0 ? '#10b981' : '#52525b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar carga muscular 7d */}
        <div className={cardCls}>
          <h3 className="text-sm font-bold text-zinc-300 mb-1">Carga muscular — 7 días</h3>
          {hasMuscleData ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="muscle" tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, maxSets]} tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickCount={4} />
                <Radar dataKey="sets" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.18} strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#fbbf24', stroke: '#92400e', strokeWidth: 1 }}
                />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(v: number, _: string, entry: any) => [v + ' series', entry.payload.muscle]}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-600">
              <Flame size={24} className="mb-2" />
              <p className="text-sm">Sin entrenos esta semana</p>
            </div>
          )}
        </div>

        {/* Peso vs LBM */}
        <div className={cardCls}>
          <h3 className="text-sm font-bold text-zinc-300 mb-1">Peso vs. Masa Magra (LBM)</h3>
          <p className="text-xs text-zinc-600 mb-3">El LBM debe mantenerse mientras baja el peso</p>
          {weightChart.some(d => d.lbm) ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightChart.slice(-60)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" minTickGap={20} tick={{ fill: '#71717a', fontSize: 9 }} stroke="#3f3f46" />
                <YAxis yAxisId="l" tick={{ fill: '#3b82f6', fontSize: 9 }} axisLine={false} tickLine={false} domain={['auto','auto']} />
                <YAxis yAxisId="r" orientation="right" tick={{ fill: '#10b981', fontSize: 9 }} axisLine={false} tickLine={false} domain={['auto','auto']} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
                <Line yAxisId="l" type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls name="Peso (kg)" />
                <Line yAxisId="r" type="monotone" dataKey="lbm"    stroke="#10b981" strokeWidth={2} dot={false} connectNulls name="LBM (kg)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-600">
              <Scale size={24} className="mb-2" />
              <p className="text-sm text-center">Registra cintura y cuello<br/>para calcular el LBM</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ROW 5: Full-width — Tendencia muscular 4 semanas ═══ */}
      <div className={cardCls}>
        <h3 className="text-sm font-bold text-zinc-300 mb-4">Tendencia muscular — 4 semanas</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} stroke="#3f3f46" />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, key: string) => [v + ' series', MUSCLE_LABELS[key] || key]}
            />
            {Object.keys(MUSCLE_LABELS).slice(0, 8).map((m, i) => (
              <Line key={m} type="monotone" dataKey={m} stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2} dot={{ r: 4, fill: CHART_COLORS[i], strokeWidth: 0 }}
                activeDot={{ r: 6 }} connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {Object.entries(MUSCLE_LABELS).slice(0, 8).map(([m, label], i) => (
            <span key={m} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ ROW 6: Volumen evolución + Heatmap corporal ═══ */}
      <div className="grid grid-cols-[1fr_auto] gap-4">
        <div className={cardCls}>
          <h3 className="text-sm font-bold text-zinc-300 mb-4">Volumen por sesión — 30 días</h3>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={volumeChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" minTickGap={15} tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto','auto']} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Area type="monotone" dataKey="volume" stroke="#0ea5e9" fill="url(#gVol)" strokeWidth={2} name="Volumen (kg)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className={cardCls + ' min-w-[260px]'}>
          <h3 className="text-sm font-bold text-zinc-300 mb-4">Heatmap corporal histórico</h3>
          <div className="scale-90 origin-top">
            <BodyHeatmap muscleVolume={muscleVolume} muscleSets={muscleSets} />
          </div>
        </div>
      </div>

    </div>
  );
};
