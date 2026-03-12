import React, { useState, useCallback, useRef, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { DailyLog, Gender } from '../../types';
import { Scale, Target, TrendingDown, TrendingUp, Minus, Activity, Ruler } from 'lucide-react';
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

export const CompositionTab: React.FC<CompositionTabProps> = ({ todayLog, weightLogs, updateLog, today }) => {
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [gender, setGender] = useState<Gender>(todayLog.gender || 'male');

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
    const height = todayLog.height;

    if (!weight || !waist || !neck || !height) return null;

    try {
      return calculateBodyComposition(weight, waist, neck, height, gender);
    } catch {
      return null;
    }
  }, [todayLog.weight, todayLog.waist, todayLog.neck, todayLog.height, gender]);

  // 7-day averages for body composition
  const last7Logs = weightLogs.slice(-7);
  const bodyFatValues = last7Logs
    .map(log => {
      if (!log.weight || !log.waist || !log.neck || !log.height) return null;
      try {
        const comp = calculateBodyComposition(log.weight, log.waist, log.neck, log.height, log.gender || gender);
        return comp.bodyFatPercentage;
      } catch {
        return null;
      }
    })
    .filter((v): v is number => v !== null);

  const bodyFatAvg7d = calculate7DayAverage(bodyFatValues);
  const bodyFatTrend = composition ? calculate7DayTrend(composition.bodyFatPercentage, bodyFatAvg7d) : undefined;

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
      if (log.weight && log.waist && log.neck && log.height) {
        try {
          const comp = calculateBodyComposition(log.weight, log.waist, log.neck, log.height, log.gender || gender);
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
        {data.weight !== null && (
          <p className="text-sm text-blue-400 font-semibold">Peso: {data.weight} kg</p>
        )}
        {data.bodyFat !== null && (
          <p className="text-sm text-rose-400 font-semibold">Grasa: {data.bodyFat.toFixed(1)}%</p>
        )}
      </div>
    );
  };

  // ====================
  // RENDER HELPERS
  // ====================
  const renderTrendIcon = (trend: number | undefined) => {
    if (trend === undefined) return <Minus size={16} className="text-zinc-500" />;
    if (trend < 0) return <TrendingDown size={16} className="text-emerald-400" />;
    if (trend > 0) return <TrendingUp size={16} className="text-rose-400" />;
    return <Minus size={16} className="text-zinc-500" />;
  };

  const renderChangeRateBadge = () => {
    if (!weeklyChangeRate || !changeRateStatus) return null;

    const statusConfig = {
      optimal:    { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
      aggressive: { bg: 'bg-rose-500/20',    border: 'border-rose-500/30',    text: 'text-rose-400', pulse: true },
      slow:       { bg: 'bg-amber-500/20',   border: 'border-amber-500/30',   text: 'text-amber-400' },
    };

    const config = statusConfig[changeRateStatus];
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.pulse ? 'animate-pulse' : ''}`}>
        <Activity size={14} className={config.text} />
        <span className={`text-xs font-bold ${config.text}`}>
          Ritmo: {weeklyChangeRate > 0 ? '+' : ''}{weeklyChangeRate}% peso/sem
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">

      {/* GENDER SELECTOR */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg">
            <Activity size={18} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-zinc-400 font-medium">Género para cálculo de grasa corporal:</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setGender('male');
                updateLog({ gender: 'male' });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                gender === 'male'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
              }`}
            >
              Masculino
            </button>
            <button
              onClick={() => {
                setGender('female');
                updateLog({ gender: 'female' });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                gender === 'female'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
              }`}
            >
              Femenino
            </button>
          </div>
        </div>
      </div>

      {/* BODY FAT CARD */}
      <div className="bg-gradient-to-br from-rose-500/20 to-orange-500/20 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 bg-rose-500/20 rounded-xl">
            <Target size={20} className="text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Grasa Corporal Estimada</h3>
            <p className="text-xs text-zinc-300 mt-0.5">Método US Navy (±3-4% precisión)</p>
          </div>
        </div>

        {composition ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-1">Actual</p>
                <p className="text-3xl font-bold text-white">{composition.bodyFatPercentage}%</p>
                <p className="text-sm text-rose-300 mt-0.5">{composition.fatMass} kg grasa</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-1">Media 7d</p>
                <p className="text-3xl font-bold text-white">{bodyFatAvg7d?.toFixed(1) || '--'}%</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-1">Tendencia</p>
                <div className="flex items-center gap-2">
                  {renderTrendIcon(bodyFatTrend)}
                  <p className={`text-2xl font-bold ${
                    bodyFatTrend === undefined ? 'text-zinc-500' :
                    bodyFatTrend < 0 ? 'text-emerald-400' : bodyFatTrend > 0 ? 'text-rose-400' : 'text-zinc-400'
                  }`}>
                    {bodyFatTrend !== undefined ? `${bodyFatTrend > 0 ? '+' : ''}${bodyFatTrend} pp` : '--'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-blue-400" />
                <p className="text-sm font-bold text-blue-300">Masa Magra (LBM): {composition.leanBodyMass} kg</p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                <Target size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-300 mb-1">Completa cuello y altura para estimar grasa corporal</p>
                <p className="text-xs text-amber-400/70">El método de la Marina requiere: cintura, cuello y altura para calcular el % de grasa</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WEIGHT CARD */}
      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 bg-blue-500/20 rounded-xl">
            <Scale size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Peso Corporal</h3>
            <p className="text-xs text-zinc-300 mt-0.5">Evolución y ritmo de cambio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <p className="text-xs text-zinc-400 font-medium mb-1">Actual</p>
            <p className="text-3xl font-bold text-white">{todayLog.weight?.toFixed(1) || '--'} kg</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium mb-1">Media 7d</p>
            <p className="text-3xl font-bold text-white">{weightAvg7d?.toFixed(1) || '--'} kg</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium mb-1">Tendencia 7d</p>
            <div className="flex items-center gap-2">
              {renderTrendIcon(weightTrend)}
              <p className={`text-2xl font-bold ${
                weightTrend === undefined ? 'text-zinc-500' :
                weightTrend < 0 ? 'text-emerald-400' : weightTrend > 0 ? 'text-rose-400' : 'text-zinc-400'
              }`}>
                {weightTrend !== undefined ? `${weightTrend > 0 ? '+' : ''}${weightTrend} kg` : '--'}
              </p>
            </div>
          </div>
        </div>

        {renderChangeRateBadge()}

        <div className="mt-4 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
          <p className="text-xs text-blue-300 leading-relaxed">
            <span className="font-semibold">ℹ️ Ritmo óptimo:</span> -0.5% a -1% por semana para pérdida sostenible.
            Ritmo agresivo: {'>'}{1.5}% puede causar pérdida muscular.
          </p>
        </div>
      </div>

      {/* DUAL-AXIS CHART */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-zinc-400" />
          Evolución (30 días)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#71717a', fontSize: 11 }}
              stroke="#3f3f46"
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fill: '#71717a', fontSize: 11 }}
              stroke="#3f3f46"
              label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', style: { fill: '#71717a', fontSize: 11 } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#71717a', fontSize: 11 }}
              stroke="#3f3f46"
              label={{ value: 'Grasa (%)', angle: 90, position: 'insideRight', style: { fill: '#71717a', fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              iconType="line"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="weight"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6, fill: '#3b82f6' }}
              name="Peso (kg)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bodyFat"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#f43f5e' }}
              activeDot={{ r: 6, fill: '#f43f5e' }}
              name="Grasa (%)"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ANTHROPOMETRY INPUTS */}
      <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl border border-violet-500/30 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 bg-violet-500/20 rounded-xl">
            <Ruler size={20} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Antropometría</h3>
            <p className="text-xs text-zinc-300 mt-0.5">Medidas corporales detalladas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Waist */}
          <div>
            <label className="text-xs font-semibold text-blue-300 mb-2 block flex items-center gap-2">
              <Ruler size={14} /> Cintura (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="90.0"
              defaultValue={todayLog.waist || ''}
              onChange={e => debouncedUpdate('waist', parseFloat(e.target.value))}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-semibold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
            <p className="text-xs text-zinc-500 mt-1.5">Medida a nivel del ombligo</p>
          </div>

          {/* Neck */}
          <div>
            <label className="text-xs font-semibold text-violet-300 mb-2 block flex items-center gap-2">
              <Activity size={14} /> Cuello (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="38.0"
              defaultValue={todayLog.neck || ''}
              onChange={e => debouncedUpdate('neck', parseFloat(e.target.value))}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-semibold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
            />
            <p className="text-xs text-zinc-500 mt-1.5">Bajo la nuez de Adán</p>
          </div>

          {/* Height */}
          <div>
            <label className="text-xs font-semibold text-purple-300 mb-2 block flex items-center gap-2">
              <Ruler size={14} /> Altura (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="175.0"
              defaultValue={todayLog.height || ''}
              onChange={e => debouncedUpdate('height', parseFloat(e.target.value))}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-semibold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="text-xs font-semibold text-cyan-300 mb-2 block flex items-center gap-2">
              <Scale size={14} /> Peso (kg)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="80.0"
              defaultValue={todayLog.weight || ''}
              onChange={e => debouncedUpdate('weight', parseFloat(e.target.value))}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white text-lg font-semibold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
