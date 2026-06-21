import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar, Cell,
  ReferenceLine,
  XAxis, YAxis,
  Tooltip, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { DailyLog, Gender } from '../../types';
import { Scale, Target, TrendingDown, TrendingUp, Minus, Activity, Ruler, User, Flame } from 'lucide-react';
import { getSettings } from '../../services/settings';
import {
  calculateBodyComposition,
  calculate7DayAverage,
  calculate7DayTrend,
  calculateWeeklyWeightChangeRate,
  classifyWeeklyChangeRate
} from '../../utils/bodyComposition';
import { EXERCISE_MUSCLE_MAP } from '../../constants';

// ── Radar axis groups: muscle key → display label ──────────────────────────
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

interface CompositionTabProps {
  todayLog: DailyLog;
  weightLogs: DailyLog[];
  updateLog: (updates: Partial<DailyLog>) => void;
  today: string;
  allLogs?: Record<string, DailyLog>;
}

export const CompositionTab: React.FC<CompositionTabProps> = ({ todayLog, weightLogs, updateLog, today, allLogs = {} }) => {
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const settings = useMemo(() => getSettings(), []);
  const gender = (todayLog.gender || (settings.profile.gender === 'F' ? 'female' : 'male')) as Gender;
  const height = todayLog.height || settings.profile.height;
  const [chartMetric, setChartMetric] = useState<'weight' | 'bodyFat'>('weight');
  const [showAvg7d, setShowAvg7d] = useState(true);

  const debouncedUpdate = useCallback((key: keyof DailyLog, value: number | boolean | Gender) => {
    clearTimeout(debounceRef.current[key as string]);
    debounceRef.current[key as string] = setTimeout(() => updateLog({ [key]: value }), 300);
  }, [updateLog]);

  // ====================
  // MUSCLE SETS (últimos 7 días) → radar data
  // ====================
  const { radarData, hasMuscleData, maxSets } = useMemo(() => {
    const setsData: Record<string, number> = {};
    const todayDate = new Date(today);

    Object.keys(allLogs).forEach(dateStr => {
      const diffDays = Math.round(
        Math.abs(todayDate.getTime() - new Date(dateStr).getTime()) / 86400000
      );
      if (diffDays <= 7 && allLogs[dateStr].exercises) {
        allLogs[dateStr].exercises!.forEach(ex => {
          const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
          const completedSets = ex.sets.filter(
            (s: any) => s.completed && ((s.reps || 0) > 0 || (s.weight || 0) > 0)
          );
          if (completedSets.length === 0) return;
          muscles.forEach((m: string) => {
            setsData[m] = (setsData[m] || 0) + completedSets.length;
          });
        });
      }
    });

    const radar = RADAR_MUSCLES.map(({ key, label }) => ({
      muscle: label,
      sets: setsData[key] || 0,
    }));

    const max = Math.max(...radar.map(d => d.sets), 1);
    const hasData = radar.some(d => d.sets > 0);

    return { radarData: radar, hasMuscleData: hasData, maxSets: max };
  }, [allLogs, today]);

  // ====================
  // BODY COMPOSITION
  // ====================
  const composition = useMemo(() => {
    const weight = todayLog.weight;
    const waist = todayLog.waist;
    const neck = todayLog.neck;
    if (!weight || !waist || !neck || !height) return null;
    try {
      return calculateBodyComposition(weight, waist, neck, height, gender);
    } catch {
      return null;
    }
  }, [todayLog.weight, todayLog.waist, todayLog.neck, height, gender]);

  const last7Logs = weightLogs.slice(-7);
  const bodyFatValues = last7Logs
    .map(log => {
      const logHeight = log.height || height;
      if (!log.weight || !log.waist || !log.neck || !logHeight) return null;
      try {
        return calculateBodyComposition(log.weight, log.waist, log.neck, logHeight, log.gender || gender).bodyFatPercentage;
      } catch { return null; }
    })
    .filter((v): v is number => v !== null);

  const bodyFatAvg7d = calculate7DayAverage(bodyFatValues);

  // ====================
  // WEIGHT METRICS
  // ====================
  const weightValues = last7Logs.map(l => l.weight).filter((w): w is number => w !== undefined);
  const weightAvg7d = calculate7DayAverage(weightValues);
  const weightTrend = todayLog.weight && weightAvg7d ? calculate7DayTrend(todayLog.weight, weightAvg7d) : undefined;

  const log7DaysAgo = weightLogs[Math.max(0, weightLogs.length - 7)];
  const weeklyChangeRate = (todayLog.weight && log7DaysAgo?.weight)
    ? calculateWeeklyWeightChangeRate(todayLog.weight, log7DaysAgo.weight)
    : undefined;
  const changeRateStatus = weeklyChangeRate !== undefined ? classifyWeeklyChangeRate(weeklyChangeRate) : undefined;

  // ====================
  // CHART DATA
  // ====================
  const { chartData, variationData, projectionData, heatmapData, consistencyPercentage } = useMemo(() => {
    const fullData = weightLogs.map((log, i) => {
      const date = new Date(log.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      const rawDate = log.date;
      const weight = log.weight || null;
      let bodyFat: number | null = null;
      let lbm: number | null = null;

      const logHeight = log.height || height;
      if (log.weight && log.waist && log.neck && logHeight) {
        try {
          const comp = calculateBodyComposition(log.weight, log.waist, log.neck, logHeight, log.gender || gender);
          bodyFat = comp.bodyFatPercentage;
          lbm = comp.leanBodyMass;
        } catch {}
      }

      const past7 = weightLogs.slice(Math.max(0, i - 6), i + 1).map(l => l.weight).filter((w): w is number => w !== undefined);
      const avg7d = past7.length > 0 ? calculate7DayAverage(past7) : null;
      const prevLog = i > 0 ? weightLogs[i - 1] : null;
      const delta = weight && prevLog?.weight ? Number((weight - prevLog.weight).toFixed(1)) : null;

      return { date, rawDate, weight, bodyFat, lbm, avg7d, delta };
    });

    const last30 = fullData.slice(-30);
    const variationData = fullData.slice(-21).filter(d => d.delta !== null);

    const heatmap: { date: string; hasLog: boolean }[] = [];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    let logCount = 0;
    for (let i = 55; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const hasLog = weightLogs.some(l => l.date.startsWith(iso) && l.weight);
      if (hasLog) logCount++;
      heatmap.push({ date: iso, hasLog });
    }
    const consistencyPercentage = Math.round((logCount / 56) * 100);

    const projection: any[] = [];
    const targetWeight = settings.profile.goalWeight;
    const currentWeight = fullData.length > 0 ? fullData[fullData.length - 1].weight : null;

    if (targetWeight && currentWeight && weeklyChangeRate) {
      const diffTotal = targetWeight - currentWeight;
      const weeklyAbsoluteChange = currentWeight * (weeklyChangeRate / 100);
      const dailyChange = weeklyAbsoluteChange / 7;

      if ((diffTotal < 0 && dailyChange < 0) || (diffTotal > 0 && dailyChange > 0)) {
        const daysToGoal = Math.abs(diffTotal / dailyChange);
        const daysToProject = Math.min(Math.ceil(daysToGoal), 90);
        const lastDateObj = new Date(fullData[fullData.length - 1].rawDate);

        projection.push(...last30);
        for (let i = 1; i <= daysToProject; i += 7) {
          const nextD = new Date(lastDateObj);
          nextD.setDate(nextD.getDate() + i);
          projection.push({
            date: nextD.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            projectedWeight: Number((currentWeight + dailyChange * i).toFixed(1)),
          });
        }
        if (daysToProject % 7 !== 0) {
          const finalD = new Date(lastDateObj);
          finalD.setDate(finalD.getDate() + daysToProject);
          projection.push({
            date: finalD.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            projectedWeight: targetWeight,
            isGoal: true,
          });
        }
      }
    }

    return {
      chartData: last30,
      variationData,
      projectionData: projection.length > last30.length ? projection : null,
      heatmapData: heatmap,
      consistencyPercentage,
    };
  }, [weightLogs, gender, height, settings.profile.goalWeight, weeklyChangeRate]);

  // ====================
  // TOOLTIPS
  // ====================
  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-zinc-400 font-medium mb-1">{data.date}</p>
        {data.weight != null && chartMetric === 'weight' && (
          <p className="text-sm text-blue-400 font-semibold">Peso: {data.weight} kg</p>
        )}
        {data.projectedWeight != null && chartMetric === 'weight' && (
          <p className="text-sm text-amber-400 font-semibold">Proyección: {data.projectedWeight} kg</p>
        )}
        {data.avg7d != null && showAvg7d && (
          <p className="text-sm text-violet-400 font-semibold">Media 7d: {data.avg7d} kg</p>
        )}
        {data.bodyFat != null && chartMetric === 'bodyFat' && (
          <p className="text-sm text-rose-400 font-semibold">Grasa: {data.bodyFat.toFixed(1)}%</p>
        )}
        {data.lbm != null && chartMetric === 'weight' && (
          <p className="text-sm text-emerald-400 font-semibold">LBM: {data.lbm} kg</p>
        )}
        {data.delta != null && (
          <p className={`text-sm font-semibold ${
            data.delta > 0 ? 'text-rose-400' : data.delta < 0 ? 'text-emerald-400' : 'text-zinc-400'
          }`}>
            Var: {data.delta > 0 ? '+' : ''}{data.delta} kg
          </p>
        )}
      </div>
    );
  };

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

  // ====================
  // RENDER HELPERS
  // ====================
  const renderTrendIcon = (trend: number | undefined) => {
    if (trend === undefined) return <Minus size={14} className="text-zinc-600" />;
    if (trend < 0) return <TrendingDown size={14} className="text-emerald-400" />;
    if (trend > 0) return <TrendingUp size={14} className="text-rose-400" />;
    return <Minus size={14} className="text-zinc-600" />;
  };

  const renderChangeRateBadge = () => {
    if (!weeklyChangeRate || !changeRateStatus) return null;
    const statusConfig = {
      optimal:    { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', pulse: false },
      aggressive: { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400',    pulse: true },
      slow:       { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   pulse: false },
    };
    const config = statusConfig[changeRateStatus];
    return (
      <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${config.bg} ${config.border} ${config.pulse ? 'animate-pulse' : ''}`}>
        <Activity size={14} className={config.text} />
        <span className={`text-xs font-bold ${config.text}`}>
          Ritmo: {weeklyChangeRate > 0 ? '+' : ''}{weeklyChangeRate}% peso/sem
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-8">

      {/* ── INPUTS ── */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg shrink-0">
            <Ruler size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Medidas de hoy</h3>
            <p className="text-[10px] sm:text-xs text-zinc-500">Peso + medidas para calcular composición</p>
          </div>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Peso (kg)</label>
            <input
              type="number" inputMode="decimal" step="0.1"
              defaultValue={todayLog.weight || ''}
              onChange={e => debouncedUpdate('weight', parseFloat(e.target.value))}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-2xl font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Cintura (cm)</label>
            <input
              type="number" inputMode="decimal" step="0.1"
              defaultValue={todayLog.waist || ''}
              onChange={e => debouncedUpdate('waist', parseFloat(e.target.value))}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Cuello (cm)</label>
            <input
              type="number" inputMode="decimal" step="0.1"
              defaultValue={todayLog.neck || ''}
              onChange={e => debouncedUpdate('neck', parseFloat(e.target.value))}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>
        </div>

        {(!height || !settings.profile.gender) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
            <User size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400 font-bold">
              Completa tu Perfil Físico (Altura y Sexo) en Ajustes para calcular el % de Grasa Corporal y Masa Magra.
            </p>
          </div>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <Scale size={12} /> Peso
          </span>
          <span className="text-2xl font-bold text-white tabular-nums">{todayLog.weight?.toFixed(1) ?? '--'}</span>
          <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            {renderTrendIcon(weightTrend)}
            {weightTrend !== undefined ? `${weightTrend > 0 ? '+' : ''}${Math.abs(weightTrend).toFixed(1)} kg` : ''}
          </span>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Media 7d</span>
          <span className="text-2xl font-bold text-white tabular-nums">{weightAvg7d?.toFixed(1) ?? '--'}</span>
          <span className="text-[10px] text-zinc-500 font-medium">kg</span>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <Target size={12} /> Grasa
          </span>
          <span className={`text-2xl font-bold tabular-nums ${composition ? 'text-white' : 'text-zinc-700'}`}>
            {composition ? composition.bodyFatPercentage : '--'}
          </span>
          <span className="text-[10px] text-zinc-500 font-medium">
            {composition ? '%' : 'Faltan datos'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {renderChangeRateBadge()}
        {composition && (
          <div className="mt-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 flex-1">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              <p className="text-xs font-bold text-zinc-300">
                Masa Magra (LBM): <span className="text-white">{composition.leanBodyMass} kg</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── RADAR CHART: CARGA MUSCULAR ── */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 p-5 rounded-2xl">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame size={16} className="text-amber-400" /> Carga Muscular
          </h3>
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
            <p className="text-zinc-500 text-xs font-bold">Sin entrenamientos registrados</p>
            <p className="text-zinc-600 text-[10px] mt-1">Completa una sesión para ver la carga muscular</p>
          </div>
        )}
      </div>

      {/* ── EVOLUCIÓN (30 días) ── */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
            <Activity size={16} className="text-zinc-500" />
            Evolución y Proyección
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAvg7d(!showAvg7d)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all border ${
                showAvg7d ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'border-zinc-700 text-zinc-500'
              }`}>
              Media 7d
            </button>
            <div className="flex bg-zinc-800/50 rounded-lg p-1 gap-1">
              <button
                onClick={() => setChartMetric('weight')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                  chartMetric === 'weight' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                Peso
              </button>
              <button
                onClick={() => setChartMetric('bodyFat')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                  chartMetric === 'bodyFat' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                Grasa
              </button>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={projectionData || chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" interval="preserveStartEnd" minTickGap={20} tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" tickMargin={10} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />

            {projectionData?.find((d: any) => d.isGoal) && (
              <ReferenceLine
                x={projectionData.find((d: any) => d.isGoal).date}
                stroke="#f59e0b" strokeDasharray="3 3"
                label={{ position: 'top', value: 'Meta', fill: '#f59e0b', fontSize: 10 }}
              />
            )}

            {chartMetric === 'weight' ? (
              <>
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 2 }} connectNulls />
                {projectionData && <Line type="monotone" dataKey="projectedWeight" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />}
                {showAvg7d && <Line type="monotone" dataKey="avg7d" stroke="#a78bfa" strokeWidth={2} strokeDasharray="4 2" dot={false} connectNulls opacity={0.8} />}
              </>
            ) : (
              <Line type="monotone" dataKey="bodyFat" stroke="#f43f5e" strokeWidth={3} dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#f43f5e', stroke: '#be123c', strokeWidth: 2 }} connectNulls />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── PESO VS LBM ── */}
      {chartData.some((d: any) => d.lbm) && (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Activity size={16} className="text-zinc-500" />
              Peso vs. Masa Magra (LBM)
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">El LBM debería mantenerse mientras el peso baja</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" minTickGap={20} tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" tickMargin={10} />
              <YAxis yAxisId="left" tick={{ fill: '#3b82f6', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#10b981', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="lbm" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── VARIACIÓN DIARIA ── */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
            <Activity size={16} className="text-zinc-500" />
            Variación Diaria (21 días)
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={variationData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" minTickGap={10} tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" tickMargin={10} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
            <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
              {variationData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.delta > 0 ? '#f43f5e' : entry.delta < 0 ? '#10b981' : '#52525b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── CONSISTENCIA HEATMAP ── */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-5">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Activity size={16} className="text-zinc-500" />
              Consistencia de Registro
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">Últimas 8 semanas</p>
          </div>
          <span className="text-2xl font-bold text-white">{consistencyPercentage}%</span>
        </div>
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="grid grid-rows-7 gap-1" style={{ gridAutoFlow: 'column' }}>
            {heatmapData.map((day, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm ${
                  day.hasLog ? 'bg-violet-500' : 'bg-zinc-800'
                }`}
                title={day.date}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
