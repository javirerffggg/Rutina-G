import React, { useMemo, useState } from 'react';
import { getLogs } from '../../services/storage';
import { getSettings } from '../../services/settings';
import { getTodayDateString } from '../../utils';
import { EXERCISE_MUSCLE_MAP } from '../../constants';
import { calculate7DayAverage } from '../../utils/bodyComposition';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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

export const DesktopStats: React.FC = () => {
  const today = getTodayDateString();
  const allLogs = useMemo(() => getLogs(), []);

  const weightLogs = useMemo(() =>
    Object.values(allLogs)
      .filter(l => l.weight)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [allLogs]
  );

  // Weight chart 90d
  const weightChart = useMemo(() =>
    weightLogs.slice(-90).map((l, i, arr) => {
      const past7 = arr.slice(Math.max(0, i - 6), i + 1).map(x => x.weight as number);
      return {
        date: new Date(l.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        weight: l.weight,
        avg7d: calculate7DayAverage(past7),
        delta: i > 0 && arr[i - 1].weight ? +((l.weight! - arr[i - 1].weight!).toFixed(1)) : null,
      };
    }),
    [weightLogs]
  );

  // Radar
  const { radarData, maxSets, hasMuscleData } = useMemo(() => {
    const setsData: Record<string, number> = {};
    const todayDate = new Date(today);
    Object.keys(allLogs).forEach(d => {
      const diff = Math.round(Math.abs(todayDate.getTime() - new Date(d).getTime()) / 86400000);
      if (diff <= 7 && allLogs[d].exercises) {
        allLogs[d].exercises!.forEach((ex: any) => {
          const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
          const done = ex.sets.filter((s: any) => s.completed && ((s.reps || 0) > 0));
          if (!done.length) return;
          muscles.forEach((m: string) => { setsData[m] = (setsData[m] || 0) + done.length; });
        });
      }
    });
    const radar = RADAR_MUSCLES.map(({ key, label }) => ({ muscle: label, sets: setsData[key] || 0 }));
    return { radarData: radar, maxSets: Math.max(...radar.map(d => d.sets), 1), hasMuscleData: radar.some(d => d.sets > 0) };
  }, [allLogs, today]);

  // Consistency heatmap 8 weeks
  const heatmapData = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return Array.from({ length: 56 }, (_, i) => {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - (55 - i));
      const iso = d.toISOString().split('T')[0];
      return { date: iso, hasLog: !!allLogs[iso]?.weight, hasWorkout: !!allLogs[iso]?.workoutCompleted };
    });
  }, [allLogs]);

  const consistencyPct = Math.round((heatmapData.filter(d => d.hasLog).length / 56) * 100);

  const tooltipStyle = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 };
  const labelStyle = { color: '#a1a1aa', fontSize: 11 };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Estadísticas</h1>

      {/* Top row: 2 charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Peso 90d */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-4">Peso — 90 días</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" minTickGap={25} tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="avg7d" stroke="#a78bfa" strokeWidth={2} strokeDasharray="4 2" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Variación diaria */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-4">Variación diaria — 30 días</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weightChart.slice(-30).filter(d => d.delta !== null)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" minTickGap={15} tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                {weightChart.slice(-30).filter(d => d.delta !== null).map((entry, i) => (
                  <Cell key={i} fill={entry.delta! > 0 ? '#f43f5e' : entry.delta! < 0 ? '#10b981' : '#52525b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: Radar + Heatmap */}
      <div className="grid grid-cols-2 gap-6">
        {/* Radar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-1">Carga muscular — 7 días</h3>
          {hasMuscleData ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="muscle" tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, maxSets]} tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickCount={4} />
                <Radar dataKey="sets" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.18} strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _: string, entry: any) => [v + ' series', entry.payload.muscle]} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">Sin datos esta semana</div>
          )}
        </div>

        {/* Heatmap consistencia */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-sm font-bold text-zinc-300">Consistencia — 8 semanas</h3>
            <span className="text-2xl font-bold text-white">{consistencyPct}%</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-rows-7 gap-1" style={{ gridAutoFlow: 'column' }}>
              {heatmapData.map((day, i) => (
                <div
                  key={i}
                  title={day.date}
                  className={`w-4 h-4 rounded-sm ${
                    day.hasWorkout ? 'bg-brand-500' : day.hasLog ? 'bg-violet-500/60' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-brand-500" /> Entreno</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-violet-500/60" /> Solo peso</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-zinc-800" /> Sin registro</span>
          </div>
        </div>
      </div>
    </div>
  );
};
