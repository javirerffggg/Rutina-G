import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Info, BarChart2, CalendarRange, Flame, AlertTriangle } from 'lucide-react';
import { BodyHeatmap, MUSCLE_LABELS } from '../components/BodyHeatmap';
import { MEV_MAV, EXERCISE_MUSCLE_MAP } from '../constants';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid } from 'recharts';

export default function MuscleLoadScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'summary' | 'group' | 'history'>('summary');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('chest');

  const muscleVolume = state?.muscleVolume || {};
  const muscleSets = state?.muscleSets || {};
  const allLogs = state?.allLogs || {};

  // Sort muscles for summary tab
  const muscleList = Object.entries(MUSCLE_LABELS)
    .map(([key, label]) => ({ key, label, sets: muscleSets[key] || 0, vol: muscleVolume[key] || 0 }))
    .sort((a, b) => b.sets - a.sets);

  // Group Details
  const groupDetails = useMemo(() => {
    if (activeTab !== 'group') return null;
    const details = { exercises: new Set<string>(), setsByDate: [] as any[], lastWorkout: null as Date | null };
    const dateLogs = Object.keys(allLogs).sort().reverse();
    for (const d of dateLogs) {
      const log = allLogs[d];
      let dailySets = 0;
      let dailyVol = 0;
      log.exercises?.forEach((ex: any) => {
        const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
        if (muscles.includes(selectedMuscle)) {
          details.exercises.add(ex.exerciseId);
          dailySets += ex.sets.length;
          dailyVol += ex.sets.reduce((sum: number, s: any) => sum + (s.weight || 0) * (s.reps || 0), 0);
        }
      });
      if (dailySets > 0) {
        details.setsByDate.push({ date: d, sets: dailySets, vol: dailyVol });
        if (!details.lastWorkout) details.lastWorkout = new Date(d);
      }
    }
    return details;
  }, [allLogs, selectedMuscle, activeTab]);

  // History Chart Data (last 4 weeks)
  const historyData = useMemo(() => {
    if (activeTab !== 'history') return [];
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const getWeek = (d: Date) => {
      const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      return Math.floor(diff / 7);
    };

    const weeklyData: Record<number, Record<string, number>> = { 0: {}, 1: {}, 2: {}, 3: {} };
    
    Object.keys(allLogs).forEach(dateStr => {
      const d = new Date(dateStr);
      const w = getWeek(d);
      if (w >= 0 && w <= 3) {
        allLogs[dateStr].exercises?.forEach((ex: any) => {
           const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
           const setsCount = ex.sets.length;
           muscles.forEach((m: string) => {
             weeklyData[w][m] = (weeklyData[w][m] || 0) + setsCount;
           });
        });
      }
    });

    return [3, 2, 1, 0].map(w => {
       const weekName = w === 0 ? 'Esta Sem' : `Hace ${w} sem`;
       return { name: weekName, ...weeklyData[w] };
    });
  }, [allLogs, activeTab]);

  // Neglected muscles check
  const neglectedMuscles = useMemo(() => {
     if (activeTab !== 'history' || historyData.length < 2) return [];
     const neglected: string[] = [];
     Object.keys(MEV_MAV).forEach(m => {
        const mev = MEV_MAV[m][0];
        const w1 = historyData[1] && historyData[1][m] !== undefined ? historyData[1][m] : 0;
        const w2 = historyData[2] && historyData[2][m] !== undefined ? historyData[2][m] : 0;
        if (w1 < mev && w2 < mev && mev > 0) neglected.push(MUSCLE_LABELS[m] || m);
     });
     return neglected;
  }, [historyData, activeTab]);


  const getRecoveryStatus = (lastWorkout: Date | null) => {
    if (!lastWorkout) return { label: 'Completamente Recuperado', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    const diffHours = (new Date().getTime() - lastWorkout.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return { label: 'Músculo Dañado (Evitar)', color: 'text-red-400', bg: 'bg-red-500/10' };
    if (diffHours < 48) return { label: 'Recuperando (Sub-óptimo)', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { label: 'Recuperado (Listo)', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-zinc-400 font-medium mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
             p.value > 0 && <p key={i} className="text-xs font-bold" style={{ color: p.color }}>{MUSCLE_LABELS[p.dataKey] || p.dataKey}: {p.value} series</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <div className="min-h-screen pb-32">
      {/* HEADER FIJO */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 pt-12 px-4 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-white/5">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">Carga Muscular</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Análisis de Volumen</p>
          </div>
        </div>
        
        {/* TABS */}
        <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar snap-x">
          <button onClick={() => setActiveTab('summary')} className={`snap-start shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border ${activeTab === 'summary' ? 'bg-brand-500 text-white border-brand-400 shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
            <Activity size={16}/> Resumen
          </button>
          <button onClick={() => setActiveTab('group')} className={`snap-start shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border ${activeTab === 'group' ? 'bg-brand-500 text-white border-brand-400 shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
            <Info size={16}/> Por Grupo
          </button>
          <button onClick={() => setActiveTab('history')} className={`snap-start shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border ${activeTab === 'history' ? 'bg-brand-500 text-white border-brand-400 shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
            <BarChart2 size={16}/> Historial
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'summary' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5 mb-6">
              <BodyHeatmap muscleVolume={muscleVolume} muscleSets={muscleSets} />
            </div>

            <div className="space-y-3">
               <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2">Desglose Semanal vs MEV/MAV</h2>
               {muscleList.map(({ key, label, sets, vol }) => {
                 const [mev, mav] = MEV_MAV[key] || [10, 20];
                 const isZero = sets === 0;
                 const isUnder = sets < mev && sets > 0;
                 const isOver = sets > mav;
                 const isOptimal = sets >= mev && sets <= mav;
                 
                 const progressPct = Math.min((sets / (mav || 1)) * 100, 100);
                 const barColor = isOver ? 'bg-red-500' : isOptimal ? 'bg-emerald-500' : 'bg-brand-400';

                 return (
                   <div key={key} onClick={() => { setSelectedMuscle(key); setActiveTab('group'); }} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 active:scale-[0.98] transition-transform cursor-pointer">
                     <div className="flex justify-between items-center mb-3">
                       <div>
                         <h3 className={`text-sm font-bold ${isZero ? 'text-zinc-500' : 'text-white'}`}>{label}</h3>
                         <p className="text-[10px] font-bold text-zinc-500">{vol.toLocaleString()} kg total</p>
                       </div>
                       <div className="text-right">
                         <p className={`text-xl font-display font-black leading-none ${isZero ? 'text-zinc-600' : isOver ? 'text-red-400' : 'text-white'}`}>{sets}</p>
                         <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Series</p>
                       </div>
                     </div>
                     <div className="relative h-1.5 bg-black/40 rounded-full overflow-hidden">
                       <div className={`absolute top-0 left-0 h-full ${barColor} rounded-full transition-all`} style={{ width: `${progressPct}%` }} />
                       {mev > 0 && <div className="absolute top-0 bottom-0 w-px bg-zinc-600 z-10" style={{ left: `${(mev/mav)*100}%` }} />}
                     </div>
                     <div className="flex justify-between mt-1.5">
                       <span className="text-[8px] font-bold text-zinc-600">0</span>
                       <span className="text-[8px] font-bold text-zinc-600">MEV: {mev}</span>
                       <span className="text-[8px] font-bold text-zinc-600">MAV: {mav}</span>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {activeTab === 'group' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
             <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 overflow-x-auto snap-x flex gap-2 no-scrollbar">
                {Object.entries(MUSCLE_LABELS).map(([k, label]) => (
                   <button key={k} onClick={() => setSelectedMuscle(k)} className={`snap-center shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedMuscle === k ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                      {label}
                   </button>
                ))}
             </div>

             {groupDetails && (
               <>
                 {/* Recovery Status */}
                 <div className={`border rounded-2xl p-4 flex items-start gap-3 ${getRecoveryStatus(groupDetails.lastWorkout).bg} border-white/5`}>
                    <Activity size={20} className={getRecoveryStatus(groupDetails.lastWorkout).color} />
                    <div>
                       <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-1">Estado de Recuperación</h3>
                       <p className={`text-sm font-bold ${getRecoveryStatus(groupDetails.lastWorkout).color}`}>{getRecoveryStatus(groupDetails.lastWorkout).label}</p>
                       {groupDetails.lastWorkout && <p className="text-[10px] text-zinc-500 font-medium mt-1">Último estímulo: {groupDetails.lastWorkout.toLocaleDateString()}</p>}
                    </div>
                 </div>

                 {/* Exercises this week */}
                 <div>
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 pl-2">Desglose de Sesiones</h3>
                    {groupDetails.setsByDate.length > 0 ? groupDetails.setsByDate.map((d, i) => (
                      <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 mb-2 flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <CalendarRange size={16} className="text-zinc-500" />
                            <span className="text-sm font-bold text-white capitalize">{new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                         </div>
                         <div className="text-right">
                            <span className="text-brand-400 font-bold text-sm">{d.sets} series</span>
                            <p className="text-[10px] text-zinc-500">{d.vol} kg vol.</p>
                         </div>
                      </div>
                    )) : (
                      <div className="text-center py-10 bg-zinc-900/30 rounded-2xl border border-dashed border-white/10">
                         <p className="text-zinc-500 text-sm font-bold">No hay sesiones registradas.</p>
                      </div>
                    )}
                 </div>
               </>
             )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            
            {neglectedMuscles.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3 items-start">
                 <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                 <div>
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Volumen Insuficiente</h3>
                    <p className="text-sm text-amber-400/80 leading-relaxed">
                       Los siguientes músculos han estado por debajo del MEV durante las últimas 2 semanas: 
                       <span className="font-bold text-amber-500"> {neglectedMuscles.join(', ')}</span>.
                    </p>
                 </div>
              </div>
            )}

            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BarChart2 size={14}/> Tendencia de Series (4 Semanas)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" tickMargin={10} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    {Object.keys(MUSCLE_LABELS).slice(0, 8).map((m, idx) => (
                      <Line key={m} type="monotone" dataKey={m} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: COLORS[idx % COLORS.length], strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                 {Object.keys(MUSCLE_LABELS).slice(0, 8).map((m, idx) => (
                    <span key={m} className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                       {MUSCLE_LABELS[m]}
                    </span>
                 ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
