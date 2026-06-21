import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Trophy, CalendarDays, Activity, BarChart2, Zap, Moon } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { DailyLog } from '../types';

export default function ConsistencyScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const logs: Record<string, DailyLog> = state?.logs || {};

  const sortedDates = useMemo(() => Object.keys(logs).sort(), [logs]);
  const workoutLogs = useMemo(
    () => sortedDates.map(d => logs[d]).filter(l => l.exercises && l.exercises.length > 0),
    [sortedDates, logs]
  );

  // 1. Grid de 12 semanas (84 días)
  const { gridDays, avgVolume } = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let totalVol = 0;
    let workoutCount = 0;

    for (let i = 83; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const log = logs[dateStr];
      
      let volume = 0;
      let sets = 0;
      let type = 'Desconocido';

      if (log?.exercises?.length) {
        log.exercises.forEach(ex => {
          const doneSets = ex.sets.filter(s => s.completed && ((s.weight || 0) > 0 || (s.reps || 0) > 0));
          sets += doneSets.length;
          volume += doneSets.reduce((sa, s) => sa + (s.weight || 0) * (s.reps || 0), 0);
        });
        type = log.routineType || 'Entrenamiento';
        if (sets > 0) { totalVol += volume; workoutCount++; }
      } else if (log?.workoutCompleted) {
        // Marcado completado pero sin volumen
        type = 'Sin volumen';
        sets = 1;
      }

      days.push({
        date: d,
        dateStr,
        hasWorkout: sets > 0 || log?.workoutCompleted,
        volume,
        sets,
        type
      });
    }

    const avg = workoutCount > 0 ? totalVol / workoutCount : 0;

    return { gridDays: days, avgVolume: avg };
  }, [logs]);

  // 2. Stats
  const stats = useMemo(() => {
    let currentStreak = 0, maxStreak = 0, lastDateStr = '';
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    sortedDates.forEach(dateStr => {
      if (!logs[dateStr]?.exercises?.length) return;
      if (!lastDateStr) {
        currentStreak = 1;
      } else {
        const diff = Math.round((new Date(dateStr).getTime() - new Date(lastDateStr).getTime()) / 86400000);
        currentStreak = diff === 1 ? currentStreak + 1 : 1;
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      lastDateStr = dateStr;
    });

    const activeStreak = (lastDateStr === todayStr || lastDateStr === yesterdayStr) ? currentStreak : 0;

    // Consistency % (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentLogs = workoutLogs.filter(l => new Date(l.date) >= ninetyDaysAgo);
    const consistencyPct = Math.round((recentLogs.length / 90) * 100);

    // Días semana media (de los que hay registro)
    const firstLogDate = workoutLogs.length > 0 ? new Date(workoutLogs[0].date) : new Date();
    const weeksTotal = Math.max(1, Math.ceil((new Date().getTime() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
    const avgDaysWeek = (workoutLogs.length / weeksTotal).toFixed(1);

    // Día favorito
    const dayCount = workoutLogs.reduce((acc, l) => {
      const day = new Date(l.date).toLocaleDateString('es-ES', { weekday: 'long' });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // Descanso medio
    let totalRestDays = 0;
    let restPeriods = 0;
    for (let i = 1; i < workoutLogs.length; i++) {
      const diff = Math.round((new Date(workoutLogs[i].date).getTime() - new Date(workoutLogs[i-1].date).getTime()) / 86400000);
      if (diff > 1) {
        totalRestDays += (diff - 1);
        restPeriods++;
      }
    }
    const avgRest = restPeriods > 0 ? (totalRestDays / restPeriods).toFixed(1) : '0';

    return { activeStreak, maxStreak, consistencyPct, avgDaysWeek, favDay, avgRest };
  }, [sortedDates, logs, workoutLogs]);

  // 3. Distribución Semanal
  const weekDist = useMemo(() => {
    const counts = { 'lunes': 0, 'martes': 0, 'miércoles': 0, 'jueves': 0, 'viernes': 0, 'sábado': 0, 'domingo': 0 };
    workoutLogs.forEach(l => {
      const day = new Date(l.date).toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      if (day in counts) {
         counts[day as keyof typeof counts]++;
      }
    });

    const labels = { 'lunes': 'L', 'martes': 'M', 'miércoles': 'X', 'jueves': 'J', 'viernes': 'V', 'sábado': 'S', 'domingo': 'D' };
    return Object.entries(counts).map(([day, val]) => ({
      name: labels[day as keyof typeof labels],
      full: day.charAt(0).toUpperCase() + day.slice(1),
      count: val
    }));
  }, [workoutLogs]);

  // Tooltip helper for Grid
  const [hoveredDay, setHoveredDay] = useState<any>(null);

  const getColorClass = (vol: number, hasWk: boolean) => {
     if (!hasWk) return 'bg-zinc-800/50 border border-white/5'; // Sin entreno
     if (vol === 0) return 'bg-brand-900 border border-brand-800/50'; // Completado sin logs de volumen
     if (vol < avgVolume * 0.8) return 'bg-brand-600 shadow-[0_0_8px_rgba(217,119,6,0.2)]'; // Bajo
     if (vol > avgVolume * 1.2) return 'bg-brand-300 shadow-[0_0_12px_rgba(217,119,6,0.6)]'; // Alto
     return 'bg-brand-500 shadow-[0_0_10px_rgba(217,119,6,0.4)]'; // Normal
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-zinc-400 font-medium">{payload[0].payload.full}</p>
          <p className="text-sm font-bold text-white">{payload[0].value} entrenamientos</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 pt-12 px-4 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-white/5">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">Consistencia</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Patrones de Entrenamiento</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        
        {/* SECCIÓN 1: GRID GITHUB-STYLE */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5 relative">
           <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <CalendarDays size={16} /> Últimos 3 Meses
           </h3>
           
           <div className="overflow-x-auto no-scrollbar pb-2 relative">
              <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
                 {gridDays.map((day, i) => (
                    <div 
                      key={i}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => setHoveredDay(hoveredDay?.dateStr === day.dateStr ? null : day)}
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm sm:rounded-md transition-colors cursor-pointer ${getColorClass(day.volume, day.hasWorkout)}`}
                    />
                 ))}
              </div>
           </div>

           <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              <span>Menos</span>
              <div className="w-3 h-3 rounded-sm bg-zinc-800 border border-white/5" />
              <div className="w-3 h-3 rounded-sm bg-brand-900" />
              <div className="w-3 h-3 rounded-sm bg-brand-600" />
              <div className="w-3 h-3 rounded-sm bg-brand-500" />
              <div className="w-3 h-3 rounded-sm bg-brand-300" />
              <span>Más</span>
           </div>

           {hoveredDay && hoveredDay.hasWorkout && (
              <div className="absolute top-4 right-4 bg-zinc-800/90 backdrop-blur-md border border-zinc-700 rounded-xl p-3 shadow-2xl z-10 w-48 animate-in fade-in zoom-in-95 duration-200">
                 <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-1">{hoveredDay.date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                 <p className="text-sm font-bold text-white leading-tight mb-2">{hoveredDay.type}</p>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Volumen</span>
                    <span className="text-white font-mono">{hoveredDay.volume} kg</span>
                 </div>
                 <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-zinc-400">Series</span>
                    <span className="text-white font-mono">{hoveredDay.sets}</span>
                 </div>
              </div>
           )}
        </div>

        {/* SECCIÓN 2: STATS DE RACHA Y PATRONES */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Flame size={20} className="text-amber-500 mb-2" />
              <span className="text-2xl font-black text-white">{stats.activeStreak}</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Racha Actual</span>
           </div>
           <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Trophy size={20} className="text-brand-400 mb-2" />
              <span className="text-2xl font-black text-white">{stats.maxStreak}</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Racha Máxima</span>
           </div>
           <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Activity size={20} className="text-emerald-400 mb-2" />
              <span className="text-2xl font-black text-white">{stats.consistencyPct}%</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Consistencia 90d</span>
           </div>
           <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Zap size={20} className="text-yellow-400 mb-2" />
              <span className="text-2xl font-black text-white capitalize">{stats.favDay}</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Día Favorito</span>
           </div>
           <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <CalendarDays size={20} className="text-sky-400 mb-2" />
              <span className="text-2xl font-black text-white">{stats.avgDaysWeek}</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Media Semanal</span>
           </div>
           <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Moon size={20} className="text-indigo-400 mb-2" />
              <span className="text-2xl font-black text-white">{stats.avgRest} d</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Descanso Medio</span>
           </div>
        </div>

        {/* SECCIÓN 3: DISTRIBUCIÓN SEMANAL */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5">
           <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
             <BarChart2 size={16} /> Distribución Semanal
           </h3>
           <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={weekDist} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} tickMargin={10} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                       {weekDist.map((entry, idx) => {
                          const isFav = entry.full.toLowerCase() === stats.favDay.toLowerCase();
                          return <Cell key={`cell-${idx}`} fill={isFav ? '#d97706' : '#3f3f46'} />;
                       })}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
           <p className="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-4">
              Distribución histórica de tus entrenamientos
           </p>
        </div>

      </div>
    </div>
  );
}
