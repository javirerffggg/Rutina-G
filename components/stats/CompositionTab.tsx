import React, { useState, useCallback, useRef, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DailyLog, Gender } from '../../types';
import { Scale, Target, TrendingDown, TrendingUp, Minus, Activity, Ruler, User } from 'lucide-react';
import { getSettings } from '../../services/settings';
import {
  calculateBodyComposition,
  calculate7DayAverage,
  calculate7DayTrend,
  calculateWeeklyWeightChangeRate,
  classifyWeeklyChangeRate
} from '../../utils/bodyComposition';

interface CompositionTabProps {
  todayLog: DailyLog;
  weightLogs: DailyLog[];
  updateLog: (updates: Partial<DailyLog>) => void;
  today: string;
}

export const CompositionTab: React.FC<CompositionTabProps> = ({ todayLog, weightLogs, updateLog }) => {
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const settings = useMemo(() => getSettings(), []);
  const gender = (todayLog.gender || (settings.profile.gender === 'F' ? 'female' : 'male')) as Gender;
  const height = todayLog.height || settings.profile.height;
  const [chartMetric, setChartMetric] = useState<'weight' | 'bodyFat'>('weight');

  const debouncedUpdate = useCallback((key: keyof DailyLog, value: number | boolean | Gender) => {
    clearTimeout(debounceRef.current[key as string]);
    debounceRef.current[key as string] = setTimeout(() => updateLog({ [key]: value }), 300);
  }, [updateLog]);

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

  // 7-day averages for body composition
  const last7Logs = weightLogs.slice(-7);
  const bodyFatValues = last7Logs
    .map(log => {
      const logHeight = log.height || height;
      if (!log.weight || !log.waist || !log.neck || !logHeight) return null;
      try {
        const comp = calculateBodyComposition(log.weight, log.waist, log.neck, logHeight, log.gender || gender);
        return comp.bodyFatPercentage;
      } catch {
        return null;
      }
    })
    .filter((v): v is number => v !== null);

  const bodyFatAvg7d = calculate7DayAverage(bodyFatValues);

  // ====================
  // WEIGHT METRICS
  // ====================
  const weightValues = last7Logs.map(l => l.weight).filter((w): w is number => w !== undefined);
  const weightAvg7d = calculate7DayAverage(weightValues);
  const weightTrend = todayLog.weight && weightAvg7d ? calculate7DayTrend(todayLog.weight, weightAvg7d) : undefined;

  // Weekly change rate
  const log7DaysAgo = weightLogs[Math.max(0, weightLogs.length - 7)];
  const weeklyChangeRate = (todayLog.weight && log7DaysAgo?.weight)
    ? calculateWeeklyWeightChangeRate(todayLog.weight, log7DaysAgo.weight)
    : undefined;
  const changeRateStatus = weeklyChangeRate !== undefined ? classifyWeeklyChangeRate(weeklyChangeRate) : undefined;

  // ====================
  // CHART DATA (30 days)
  // ====================
  const chartData = useMemo(() => {
    return weightLogs.slice(-30).map(log => {
      const date = new Date(log.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      const weight = log.weight || null;

      let bodyFat: number | null = null;
      const logHeight = log.height || height;
      if (log.weight && log.waist && log.neck && logHeight) {
        try {
          const comp = calculateBodyComposition(log.weight, log.waist, log.neck, logHeight, log.gender || gender);
          bodyFat = comp.bodyFatPercentage;
        } catch {}
      }

      return { date, weight, bodyFat };
    });
  }, [weightLogs, gender]);

  // ====================
  // CUSTOM TOOLTIP
  // ====================
  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-zinc-400 font-medium mb-1">{data.date}</p>
        {data.weight !== null && chartMetric === 'weight' && (
          <p className="text-sm text-blue-400 font-semibold">Peso: {data.weight} kg</p>
        )}
        {data.bodyFat !== null && chartMetric === 'bodyFat' && (
          <p className="text-sm text-rose-400 font-semibold">Grasa: {data.bodyFat.toFixed(1)}%</p>
        )}
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
      aggressive: { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400', pulse: true },
      slow:       { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400', pulse: false },
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

      {/* ── SETUP CARD (INPUTS) ── */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg shrink-0">
            <Ruler size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Medidas de hoy</h3>
            <p className="text-[10px] sm:text-xs text-zinc-500">Peso + medidas para calcular composición</p>
          </div>
        </div>

        {/* Fila 1: Peso */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Peso (kg)</label>
            <input 
              type="number" 
              inputMode="decimal" 
              step="0.1"
              defaultValue={todayLog.weight || ''}
              onChange={e => debouncedUpdate('weight', parseFloat(e.target.value))}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-2xl font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all" 
            />
          </div>
        </div>

        {/* Fila 2: Cintura + Cuello */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Cintura (cm)</label>
            <input 
              type="number" 
              inputMode="decimal" 
              step="0.1"
              defaultValue={todayLog.waist || ''}
              onChange={e => debouncedUpdate('waist', parseFloat(e.target.value))}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all" 
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Cuello (cm)</label>
            <input 
              type="number" 
              inputMode="decimal" 
              step="0.1"
              defaultValue={todayLog.neck || ''}
              onChange={e => debouncedUpdate('neck', parseFloat(e.target.value))}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all" 
            />
          </div>
        </div>

        {/* Missing Profile Data Notice */}
        {(!height || !settings.profile.gender) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
             <User size={16} className="text-amber-400 shrink-0 mt-0.5" />
             <p className="text-xs text-amber-400 font-bold">
               Completa tu Perfil Físico (Altura y Sexo) en Ajustes para calcular el % de Grasa Corporal y Masa Magra.
             </p>
          </div>
        )}
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* KPI: Peso actual */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <Scale size={12}/> Peso
          </span>
          <span className="text-2xl font-bold text-white tabular-nums">{todayLog.weight?.toFixed(1) ?? '--'}</span>
          <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            {renderTrendIcon(weightTrend)} {weightTrend !== undefined ? `${weightTrend > 0 ? '+' : ''}${Math.abs(weightTrend).toFixed(1)} kg` : ''}
          </span>
        </div>

        {/* KPI: Media 7d */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Media 7d</span>
          <span className="text-2xl font-bold text-white tabular-nums">{weightAvg7d?.toFixed(1) ?? '--'}</span>
          <span className="text-[10px] text-zinc-500 font-medium">kg</span>
        </div>

        {/* KPI: % Grasa */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <Target size={12}/> Grasa
          </span>
          <span className={`text-2xl font-bold tabular-nums ${composition ? 'text-white' : 'text-zinc-700'}`}>
            {composition ? `${composition.bodyFatPercentage}` : '--'}
          </span>
          <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
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
              <p className="text-xs font-bold text-zinc-300">Masa Magra (LBM): <span className="text-white">{composition.leanBodyMass} kg</span></p>
            </div>
          </div>
        )}
      </div>

      {/* ── EVOLUCIÓN (30 días) ── */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
            <Activity size={16} className="text-zinc-500" />
            Evolución (30 días)
          </h3>
          <div className="flex bg-zinc-800/50 rounded-lg p-1 gap-1">
            <button 
              onClick={() => setChartMetric('weight')} 
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${chartMetric === 'weight' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              Peso
            </button>
            <button 
              onClick={() => setChartMetric('bodyFat')} 
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${chartMetric === 'bodyFat' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              Grasa
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              interval={6}
              tick={{ fill: '#71717a', fontSize: 10 }}
              stroke="#3f3f46"
              tickMargin={10}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 10 }}
              stroke="#3f3f46"
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartMetric === 'weight' ? (
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 2 }}
                connectNulls
              />
            ) : (
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#f43f5e', stroke: '#be123c', strokeWidth: 2 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
