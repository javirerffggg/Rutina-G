import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } from 'recharts';
import { getLogs, saveLog } from '../services/storage';
import { getTodayDateString, calculateMovingAverage, calculateLinearRegression } from '../utils';
import { DailyLog } from '../types';
import { Scale, Info, Ruler, Camera, Copy, Check, TrendingDown, Pizza, AlertCircle } from 'lucide-react';

const Stats: React.FC = () => {
  const today = getTodayDateString();
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [todayLog, setTodayLog] = useState<DailyLog>({ date: today });
  const [copied, setCopied] = useState(false);

  // Load data
  useEffect(() => {
    const data = getLogs();
    setLogs(data);
    if (data[today]) {
      setTodayLog(data[today]);
    }
  }, [today]);

  const updateLog = (updates: Partial<DailyLog>) => {
    const updated = { ...todayLog, ...updates };
    setTodayLog(updated);
    saveLog(updated);
    setLogs(prev => ({ ...prev, [today]: updated }));
  };

  // Prepare Chart Data
  const sortedDates = Object.keys(logs).sort();
  // Filter only logs with weight for the chart calculation
  const weightLogs = sortedDates
    .map(date => logs[date])
    .filter(l => l.weight !== undefined && l.weight > 0);

  const rawWeights = weightLogs.map(l => l.weight as number);
  const movingAvgs = calculateMovingAverage(rawWeights, 7);
  
  // Linear Regression (Trend)
  const xValues = weightLogs.map((_, i) => i);
  const { slope, intercept } = calculateLinearRegression(xValues, rawWeights);

  const chartData = weightLogs.map((log, i) => ({
    date: new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    weight: log.weight,
    average: movingAvgs[i]?.toFixed(2),
    trend: (slope * i + intercept).toFixed(2),
    isRefeed: log.isRefeed
  })).slice(-30); // Show last 30 entries

  // Statistics
  const currentWeight = todayLog.weight || (weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 0);
  const currentAvg = movingAvgs.length > 0 ? movingAvgs[movingAvgs.length - 1] : 0;
  const prevAvg = movingAvgs.length > 1 ? movingAvgs[movingAvgs.length - 2] : currentAvg;
  const weeklyChange = currentAvg && prevAvg ? currentAvg - prevAvg : 0;

  // V-Taper Ratio
  const vTaper = (todayLog.waist && todayLog.chest) 
    ? (todayLog.waist / todayLog.chest).toFixed(2) 
    : '--';

  const exportForCoach = () => {
    const text = `
REPORTE SEMANAL - COACH AI
--------------------------
Fecha: ${today}
Peso Actual: ${currentWeight} kg
Promedio 7d: ${currentAvg?.toFixed(2)} kg
Tendencia: ${slope < 0 ? 'Descendente' : 'Estancada/Sube'} (${(slope*7).toFixed(2)} kg/sem)
Glucógeno: ${todayLog.isRefeed ? 'Día de Refeed' : 'Normal'}

ANTROPOMETRÍA
Cintura: ${todayLog.waist || '-'} cm
Hombros: ${todayLog.chest || '-'} cm
Ratio V-Taper: ${vTaper}

BIOFEEDBACK (Hoy)
Sueño: ${todayLog.sleep || '-'}/5
Energía: ${todayLog.energy || '-'}/5
Estrés: ${todayLog.stress || '-'}/5
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Composición</h1>
        <button 
          onClick={exportForCoach}
          className="bg-brand-600 hover:bg-brand-500 text-white p-2 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copiado' : 'Exportar Coach'}
        </button>
      </header>

      {/* Protocol Alert */}
      <div className="glass-card p-3 rounded-xl border-l-4 border-l-gold-500 flex items-start gap-3">
        <AlertCircle size={18} className="text-gold-500 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-xs font-bold text-gold-500 uppercase">Protocolo de Pesaje</h3>
          <p className="text-[10px] text-slate-400">
            Al despertar, después de ir al baño, sin ropa y antes de ingerir líquidos.
          </p>
        </div>
      </div>

      {/* Weight Input Section */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Peso Hoy</span>
            <div className="flex items-baseline gap-2">
              <input 
                type="number" 
                value={todayLog.weight || ''}
                onChange={(e) => updateLog({ weight: parseFloat(e.target.value) })}
                placeholder="00.0"
                className="bg-transparent text-4xl font-bold text-white w-32 focus:outline-none placeholder-slate-700"
              />
              <span className="text-sm text-slate-500">kg</span>
            </div>
          </div>
          <div className="text-right">
             <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Media 7d</span>
             <div className="text-2xl font-bold text-brand-400">
               {currentAvg ? currentAvg.toFixed(1) : '--'}
             </div>
             <div className={`text-xs font-mono flex items-center justify-end gap-1 ${weeklyChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
               {weeklyChange <= 0 ? <TrendingDown size={12} /> : '+'}
               {Math.abs(weeklyChange).toFixed(2)}
             </div>
          </div>
        </div>

        {/* Refeed Toggle */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
          <button 
            onClick={() => updateLog({ isRefeed: !todayLog.isRefeed })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              todayLog.isRefeed 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/20' 
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Pizza size={14} />
            {todayLog.isRefeed ? 'Día de Refeed (Carga)' : 'Marcar como Refeed'}
          </button>
          <p className="text-[10px] text-slate-500 leading-tight flex-1">
            Actívalo si hoy consumes carbohidratos altos. Explicará subidas de peso por agua.
          </p>
        </div>
      </div>

      {/* Advanced Chart */}
      <div className="w-full">
         <div className="flex justify-between items-end mb-2 px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tendencia Real</h3>
            <div className="flex gap-3 text-[9px] font-bold uppercase">
               <span className="flex items-center gap-1 text-slate-500"><div className="w-2 h-2 rounded-full bg-brand-500/50"></div>Peso</span>
               <span className="flex items-center gap-1 text-orange-400"><div className="w-2 h-0.5 bg-orange-400"></div>Media</span>
               <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-0.5 border-t border-dashed border-red-500"></div>Tendencia</span>
            </div>
         </div>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" hide />
                <YAxis 
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    orientation="right" 
                    tick={{fontSize: 9, fill: '#64748b'}} 
                    axisLine={false}
                    width={30}
                />
                <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
                    itemStyle={{padding: 0}}
                    labelStyle={{color: '#94a3b8', marginBottom: '4px'}}
                />
                <Area type="monotone" dataKey="weight" stroke="#0ea5e9" fill="url(#colorWeight)" strokeWidth={2} />
                <Line type="monotone" dataKey="average" stroke="#fb923c" dot={false} strokeWidth={2} />
                <Line type="linear" dataKey="trend" stroke="#ef4444" strokeDasharray="3 3" dot={false} strokeWidth={1} opacity={0.7} />
                
                {/* Refeed Dots */}
                {chartData.map((entry, index) => (
                    entry.isRefeed ? <ReferenceDot key={index} x={entry.date} y={entry.weight} r={4} fill="#f97316" stroke="none" /> : null
                ))}
                </ComposedChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Anthropometry Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
          <Ruler size={16} /> Antropometría
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3 rounded-xl">
             <label className="text-[10px] text-brand-400 uppercase font-bold block mb-1">Cintura (Ombligo)</label>
             <input 
               type="number" 
               placeholder="0" 
               className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
               value={todayLog.waist || ''}
               onChange={(e) => updateLog({ waist: parseFloat(e.target.value) })}
             />
             <span className="text-[9px] text-slate-500">Predictor de grasa visceral</span>
          </div>
          
          <div className="glass-card p-3 rounded-xl">
             <label className="text-[10px] text-brand-400 uppercase font-bold block mb-1">Hombros/Pecho</label>
             <input 
               type="number" 
               placeholder="0" 
               className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
               value={todayLog.chest || ''}
               onChange={(e) => updateLog({ chest: parseFloat(e.target.value) })}
             />
             <span className="text-[9px] text-slate-500">Monitor de masa magra</span>
          </div>

          <div className="glass-card p-3 rounded-xl">
             <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Brazo</label>
             <input 
               type="number" 
               placeholder="0" 
               className="w-full bg-transparent text-lg font-bold text-slate-300 focus:outline-none"
               value={todayLog.arm || ''}
               onChange={(e) => updateLog({ arm: parseFloat(e.target.value) })}
             />
          </div>

          <div className="glass-card p-3 rounded-xl">
             <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Muslo</label>
             <input 
               type="number" 
               placeholder="0" 
               className="w-full bg-transparent text-lg font-bold text-slate-300 focus:outline-none"
               value={todayLog.thigh || ''}
               onChange={(e) => updateLog({ thigh: parseFloat(e.target.value) })}
             />
          </div>
        </div>

        {/* V-Taper Calculation */}
        {todayLog.waist && todayLog.chest && (
          <div className="glass-panel p-3 rounded-xl border border-brand-500/30 flex justify-between items-center">
             <div>
               <p className="text-xs font-bold text-white uppercase">Ratio V-Taper</p>
               <p className="text-[10px] text-slate-400">Objetivo: menor es mejor (Cintura ÷ Hombro)</p>
             </div>
             <div className="text-xl font-bold text-brand-400">{vTaper}</div>
          </div>
        )}
      </div>

      {/* Progress Photos Placeholder */}
      <div className="space-y-3 pb-8">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
          <Camera size={16} /> Fotos de Progreso
        </h2>
        <div className="grid grid-cols-3 gap-2">
           {['Frente', 'Perfil', 'Espalda'].map((view) => (
             <div key={view} className="aspect-[3/4] bg-slate-800/50 rounded-lg border border-dashed border-slate-600 flex flex-col items-center justify-center gap-2 hover:bg-slate-700/50 transition-colors cursor-pointer relative group overflow-hidden">
                <Camera size={20} className="text-slate-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase">{view}</span>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
           ))}
        </div>
        <p className="text-[10px] text-slate-500 text-center italic">
          Usa la misma iluminación y hora del día.
        </p>
      </div>
    </div>
  );
};

export default Stats;