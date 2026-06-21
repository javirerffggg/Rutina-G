import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertTriangle, Activity, BarChart2, Calendar } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot, BarChart, Bar, Cell } from 'recharts';
import { DailyLog, WorkoutLogEntry } from '../types';

type Period = '1M' | '3M' | '6M' | 'ALL';
type Metric = 'volume' | 'tonnageWeekly' | 'sets' | 'intensity';

export default function VolumeEvolutionScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const logs: Record<string, DailyLog> = state?.logs || {};

  const [period, setPeriod] = useState<Period>('3M');
  const [metric, setMetric] = useState<Metric>('volume');

  const sortedDates = useMemo(() => Object.keys(logs).sort(), [logs]);
  const workoutLogs = useMemo(
    () => sortedDates.map(d => logs[d]).filter(l => l.exercises && l.exercises.length > 0),
    [sortedDates, logs]
  );

  // Filtro por período
  const filteredLogs = useMemo(() => {
    if (period === 'ALL') return workoutLogs;
    const now = new Date();
    const months = period === '1M' ? 1 : period === '3M' ? 3 : 6;
    const limitDate = new Date(now.setMonth(now.getMonth() - months));
    return workoutLogs.filter(l => new Date(l.date) >= limitDate);
  }, [workoutLogs, period]);

  // Cálculos agrupados por semana
  const weeklyData = useMemo(() => {
    const weeks: Record<string, { date: Date, volume: number, sets: number, weightRepSum: number, repSum: number }> = {};
    
    // Usar logs totales para tener tendencia precisa y MA7 en los límites
    workoutLogs.forEach(log => {
      const d = new Date(log.date);
      // Ajustar al lunes de esa semana
      const day = d.getDay() || 7; 
      d.setDate(d.getDate() - day + 1);
      const weekStr = d.toISOString().split('T')[0];

      let vol = 0;
      let sets = 0;
      let weightRepSum = 0;
      let repSum = 0;

      log.exercises?.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.weight && s.reps) {
            vol += s.weight * s.reps;
            weightRepSum += s.weight * s.reps;
            repSum += s.reps;
          }
          sets++;
        });
      });

      if (!weeks[weekStr]) {
        weeks[weekStr] = { date: d, volume: vol, sets, weightRepSum, repSum };
      } else {
        weeks[weekStr].volume += vol;
        weeks[weekStr].sets += sets;
        weeks[weekStr].weightRepSum += weightRepSum;
        weeks[weekStr].repSum += repSum;
      }
    });

    return Object.entries(weeks).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).map(([k, v]) => ({
      dateStr: k,
      ...v
    }));
  }, [workoutLogs]);

  // Main Chart Data
  const { chartData, maxPoint } = useMemo(() => {
    let data: any[] = [];
    let maxValue = -1;
    let maxObj = null;

    if (metric === 'tonnageWeekly') {
      // Filtrar a posteriori por el periodo seleccionado
      const filteredWeeks = period === 'ALL' ? weeklyData : weeklyData.filter(w => {
        const now = new Date();
        const months = period === '1M' ? 1 : period === '3M' ? 3 : 6;
        const limitDate = new Date(now.setMonth(now.getMonth() - months));
        return w.date >= limitDate;
      });

      data = filteredWeeks.map((w, i) => {
        const val = w.volume;
        if (val > maxValue) { maxValue = val; maxObj = { ...w, value: val }; }
        
        // MA4 semanas para la vista semanal
        const ma = i >= 3 ? filteredWeeks.slice(i-3, i+1).reduce((s, d) => s + d.volume, 0) / 4 : null;
        
        return {
           date: w.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
           value: val,
           ma
        };
      });
    } else {
      data = filteredLogs.map((log, i) => {
        let val = 0;
        log.exercises?.forEach(ex => {
          ex.sets.forEach(s => {
            if (metric === 'volume') val += (s.weight || 0) * (s.reps || 0);
            else if (metric === 'sets') val++;
          });
        });

        if (metric === 'intensity') {
           let wRep = 0, rSum = 0;
           log.exercises?.forEach(ex => ex.sets.forEach(s => { wRep += (s.weight||0)*(s.reps||0); rSum += (s.reps||0); }));
           val = rSum > 0 ? wRep / rSum : 0;
           val = Math.round(val * 10) / 10;
        }

        if (val > maxValue) { maxValue = val; maxObj = { date: log.date, value: val }; }

        const ma = i >= 6 ? filteredLogs.slice(i-6, i+1).reduce((s, d) => {
           let dVal = 0;
           d.exercises?.forEach(ex => ex.sets.forEach(s => {
              if (metric === 'volume') dVal += (s.weight || 0) * (s.reps || 0);
              else if (metric === 'sets') dVal++;
           }));
           if (metric === 'intensity') {
              let wR = 0, rS = 0;
              d.exercises?.forEach(ex => ex.sets.forEach(s => { wR += (s.weight||0)*(s.reps||0); rS += (s.reps||0); }));
              dVal = rS > 0 ? wR / rS : 0;
           }
           return s + dVal;
        }, 0) / 7 : null;

        return {
           date: new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
           rawDate: log.date,
           value: val,
           ma: ma ? Math.round(ma * 10) / 10 : null
        };
      });
      
      // Update maxObj date to string
      if (maxObj) maxObj.date = new Date(maxObj.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }

    return { chartData: data, maxPoint: maxObj };
  }, [filteredLogs, weeklyData, metric, period]);

  // KPIs
  const kpis = useMemo(() => {
     let totalVol = 0;
     let maxSession = 0;
     filteredLogs.forEach(l => {
        let v = l.exercises?.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight||0)*(s.reps||0), 0), 0) || 0;
        totalVol += v;
        if (v > maxSession) maxSession = v;
     });

     let maxWeek = 0;
     weeklyData.forEach(w => { if (w.volume > maxWeek) maxWeek = w.volume; });

     // Tendencia Semanal
     let trend = 0;
     if (weeklyData.length >= 8) {
        const last4 = weeklyData.slice(-4).reduce((s, w) => s + w.volume, 0) / 4;
        const prev4 = weeklyData.slice(-8, -4).reduce((s, w) => s + w.volume, 0) / 4;
        trend = prev4 > 0 ? ((last4 - prev4) / prev4) * 100 : 0;
     }

     return { totalVol, maxSession, maxWeek, trend };
  }, [filteredLogs, weeklyData]);

  // Overreaching
  const overreachingWeeks = useMemo(() => {
     if (weeklyData.length < 4) return [];
     const vols = weeklyData.map(w => w.volume);
     const mean = vols.reduce((s, v) => s + v, 0) / vols.length;
     const std = Math.sqrt(vols.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vols.length);
     const threshold = mean + std;

     // Solo alertar de las últimas 12 semanas para no hacer ruido con el histórico antiguo
     return weeklyData.slice(-12).filter(w => w.volume > threshold);
  }, [weeklyData]);

  // Stacked Bar Chart Data (Routine Type Breakdown)
  const stackedData = useMemo(() => {
     const periods: Record<string, Record<string, number>> = {};
     
     filteredLogs.forEach(log => {
        // Agrupar por semana o mes según periodo
        const d = new Date(log.date);
        let key = '';
        if (period === '1M' || period === '3M') {
           // Agrupar por semana
           const day = d.getDay() || 7; 
           d.setDate(d.getDate() - day + 1);
           key = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        } else {
           // Agrupar por mes
           key = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        }

        if (!periods[key]) periods[key] = { Push: 0, Pull: 0, Legs: 0, Upper: 0, Lower: 0, FullBody: 0, Otro: 0 };
        
        let type = log.routineType || 'Otro';
        let vol = log.exercises?.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight||0)*(s.reps||0), 0), 0) || 0;
        
        if (periods[key][type] !== undefined) {
           periods[key][type] += vol;
        } else {
           periods[key]['Otro'] += vol;
        }
     });

     return Object.entries(periods).map(([date, vals]) => ({ date, ...vals }));
  }, [filteredLogs, period]);

  const COLORS = {
     Push: '#0ea5e9', // sky-500
     Pull: '#8b5cf6', // violet-500
     Legs: '#f59e0b', // amber-500
     Upper: '#ec4899', // pink-500
     Lower: '#10b981', // emerald-500
     FullBody: '#f43f5e', // rose-500
     Otro: '#64748b' // slate-500
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-zinc-400 font-medium mb-1">{label}</p>
          <p className="text-sm font-bold text-white mb-1">
             Valor: {metric === 'sets' ? payload[0].value : `${(payload[0].value/1000).toFixed(1)}t`}
          </p>
          {payload[1]?.value && (
            <p className="text-xs font-medium text-brand-400">
               Media {metric === 'tonnageWeekly' ? '4w' : '7d'}: {metric === 'sets' ? payload[1].value : `${(payload[1].value/1000).toFixed(1)}t`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const StackedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-zinc-400 font-medium mb-2">{label}</p>
          {payload.map((entry: any, i: number) => {
             if (entry.value === 0) return null;
             return (
               <div key={i} className="flex justify-between items-center text-xs gap-4 mb-1">
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                     <span className="text-zinc-300">{entry.name}</span>
                  </div>
                  <span className="text-white font-bold">{(entry.value/1000).toFixed(1)}t</span>
               </div>
             );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 pt-12 px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-white/5">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-display font-bold text-white tracking-tight">Evolución</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Análisis de Volumen</p>
            </div>
          </div>
          
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
            {(['1M', '3M', '6M', 'ALL'] as Period[]).map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${period === p ? 'bg-brand-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                {p === 'ALL' ? 'Todo' : p}
              </button>
            ))}
          </div>
        </div>
        
        {/* Metric Selector */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
           <button onClick={() => setMetric('volume')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap border ${metric === 'volume' ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' : 'bg-zinc-900/50 text-zinc-500 border-white/5'}`}>Sesión</button>
           <button onClick={() => setMetric('tonnageWeekly')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap border ${metric === 'tonnageWeekly' ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' : 'bg-zinc-900/50 text-zinc-500 border-white/5'}`}>Semana</button>
           <button onClick={() => setMetric('sets')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap border ${metric === 'sets' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-900/50 text-zinc-500 border-white/5'}`}>Series</button>
           <button onClick={() => setMetric('intensity')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap border ${metric === 'intensity' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-zinc-900/50 text-zinc-500 border-white/5'}`}>Intensidad</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* OVERREACHING WARNING */}
        {overreachingWeeks.length > 0 && period !== '1M' && (
           <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-4">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <div>
                 <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Volumen Excesivo</h4>
                 <p className="text-sm text-red-200/80 leading-relaxed">
                   Detectadas {overreachingWeeks.length} semanas con volumen por encima de +1σ tu media histórica. Vigila la recuperación.
                 </p>
              </div>
           </div>
        )}

        {/* MAIN CHART */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5">
           <div className="h-64 w-full relative">
              {chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                       <defs>
                         <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={metric === 'sets' ? '#10b981' : metric === 'intensity' ? '#8b5cf6' : '#d97706'} stopOpacity={0.4}/>
                           <stop offset="95%" stopColor={metric === 'sets' ? '#10b981' : metric === 'intensity' ? '#8b5cf6' : '#d97706'} stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                       <XAxis dataKey="date" tick={{fontSize: 9, fill: '#71717a'}} axisLine={false} tickLine={false} tickMargin={10} minTickGap={20} />
                       <YAxis 
                          tick={{fontSize: 9, fill: '#71717a'}} 
                          axisLine={false} 
                          tickLine={false} 
                          domain={['auto', 'auto']}
                          tickFormatter={(v) => metric === 'sets' || metric === 'intensity' ? v : `${(v/1000).toFixed(0)}t`}
                       />
                       <Tooltip content={<CustomTooltip />} />
                       
                       <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={metric === 'sets' ? '#10b981' : metric === 'intensity' ? '#8b5cf6' : '#d97706'} 
                          fill="url(#colorMain)" 
                          strokeWidth={2} 
                       />
                       
                       <Line 
                          type="monotone" 
                          dataKey="ma" 
                          stroke="#38bdf8" 
                          strokeWidth={2} 
                          dot={false} 
                          strokeDasharray="4 4" 
                       />

                       {maxPoint && (
                          <ReferenceDot 
                             x={maxPoint.date} 
                             y={maxPoint.value} 
                             r={6} 
                             fill="#fbbf24" 
                             stroke="#b45309" 
                             strokeWidth={2} 
                          />
                       )}
                    </ComposedChart>
                 </ResponsiveContainer>
              ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-zinc-500">
                    No hay datos en este período
                 </div>
              )}
           </div>
           
           <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                 <div className="w-3 h-3 rounded-sm bg-brand-500/50 border border-brand-500" /> Valor Real
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                 <div className="w-3 h-0.5 bg-sky-400 border border-sky-400 border-dashed" /> Media Móvil ({metric === 'tonnageWeekly' ? '4w' : '7d'})
              </div>
           </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Volumen Total</span>
              <span className="text-xl font-black text-white">{(kpis.totalVol/1000).toFixed(1)} <span className="text-xs font-medium text-zinc-500">ton</span></span>
           </div>
           <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-16 h-16 blur-2xl rounded-full ${kpis.trend > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} -mr-8 -mt-8`} />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Tendencia Semanal</span>
              <span className={`text-xl font-black flex items-center gap-1 ${kpis.trend > 0 ? 'text-emerald-400' : kpis.trend < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                 {kpis.trend > 0 ? '+' : ''}{kpis.trend.toFixed(1)}%
                 <TrendingUp size={16} className={kpis.trend < 0 ? 'rotate-180' : ''} />
              </span>
           </div>
           <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Sesión más alta</span>
              <span className="text-xl font-black text-white">{(kpis.maxSession/1000).toFixed(1)} <span className="text-xs font-medium text-zinc-500">ton</span></span>
           </div>
           <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Semana más alta</span>
              <span className="text-xl font-black text-white">{(kpis.maxWeek/1000).toFixed(1)} <span className="text-xs font-medium text-zinc-500">ton</span></span>
           </div>
        </div>

        {/* STACKED BAR CHART: DESGLOSE TIPO RUTINA */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5">
           <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
             <Activity size={16} /> Desglose por Tipo
           </h3>
           <div className="h-64 w-full">
              {stackedData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stackedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                       <XAxis dataKey="date" tick={{fontSize: 9, fill: '#71717a'}} axisLine={false} tickLine={false} tickMargin={10} />
                       <YAxis 
                          tick={{fontSize: 9, fill: '#71717a'}} 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={(v) => `${(v/1000).toFixed(0)}t`}
                       />
                       <Tooltip content={<StackedTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                       <Bar dataKey="Push" stackId="a" fill={COLORS.Push} />
                       <Bar dataKey="Pull" stackId="a" fill={COLORS.Pull} />
                       <Bar dataKey="Legs" stackId="a" fill={COLORS.Legs} />
                       <Bar dataKey="Upper" stackId="a" fill={COLORS.Upper} />
                       <Bar dataKey="Lower" stackId="a" fill={COLORS.Lower} />
                       <Bar dataKey="FullBody" stackId="a" fill={COLORS.FullBody} />
                       <Bar dataKey="Otro" stackId="a" fill={COLORS.Otro} radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              ) : (
                 <div className="flex h-full items-center justify-center text-sm font-medium text-zinc-500">
                    No hay suficientes datos clasificados
                 </div>
              )}
           </div>
           
           <div className="flex flex-wrap justify-center gap-3 mt-6 border-t border-white/5 pt-4">
              {Object.entries(COLORS).map(([key, color]) => (
                 <div key={key} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {key}
                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
