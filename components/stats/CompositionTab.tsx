import React, { useState, useCallback, useRef } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } from 'recharts';
import { DailyLog } from '../../types';
import { Ruler, Camera, Copy, Check, TrendingDown, TrendingUp, Pizza, AlertCircle, ChevronDown, Moon, Zap, Brain } from 'lucide-react';
import { calculateMovingAverage, calculateLinearRegression } from '../../utils';

interface CompositionTabProps {
  todayLog: DailyLog;
  weightLogs: DailyLog[];
  updateLog: (updates: Partial<DailyLog>) => void;
  today: string;
}

const STAR_ACTIVE: Record<string, string> = {
  brand:   'bg-sky-500/20 text-sky-400 border border-sky-500/50',
  emerald: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50',
  red:     'bg-red-500/20 text-red-400 border border-red-500/50',
};
const STAR_INACTIVE = 'bg-slate-800 text-slate-600 border border-white/5';

const StarRating: React.FC<{ value: number; onChange: (v: number) => void; color: string }> = ({ value, onChange, color }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <button
        key={s}
        onClick={() => onChange(s)}
        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${s <= value ? (STAR_ACTIVE[color] ?? STAR_ACTIVE.brand) : STAR_INACTIVE}`}
      >
        {s}
      </button>
    ))}
  </div>
);

export const CompositionTab: React.FC<CompositionTabProps> = ({ todayLog, weightLogs, updateLog, today }) => {
  const [copied, setCopied] = useState(false);
  const [showBiofeedback, setShowBiofeedback] = useState(false);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const debouncedUpdate = useCallback((key: keyof DailyLog, value: number | boolean) => {
    clearTimeout(debounceRef.current[key as string]);
    debounceRef.current[key as string] = setTimeout(() => updateLog({ [key]: value }), 300);
  }, [updateLog]);

  const rawWeights = weightLogs.map(l => l.weight as number);
  const movingAvgs = calculateMovingAverage(rawWeights, 7);
  const xValues = weightLogs.map((_, i) => i);
  const { slope, intercept } = calculateLinearRegression(xValues, rawWeights);

  const chartData = weightLogs.map((log, i) => ({
    index: i,
    date: new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    weight: log.weight,
    average: parseFloat((movingAvgs[i] ?? 0).toFixed(2)),
    trend: parseFloat((slope * i + intercept).toFixed(2)),
    isRefeed: log.isRefeed,
  })).slice(-30);

  const currentWeight = todayLog.weight || (weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 0);
  const currentAvg  = movingAvgs.length > 0 ? movingAvgs[movingAvgs.length - 1] : 0;
  const prevAvg     = movingAvgs.length > 1 ? movingAvgs[movingAvgs.length - 2] : currentAvg;
  const weeklyChange  = currentAvg && prevAvg ? currentAvg - prevAvg : 0;
  const weeklyTrend   = slope * 7;
  const projection30d = slope * 30;

  const vTaper = (todayLog.waist && todayLog.chest)
    ? (todayLog.waist / todayLog.chest).toFixed(2)
    : '--';

  const prevLog = [...weightLogs].reverse().find(l => l.date < today) ?? null;
  const getDelta = (current?: number, prev?: number) => (current && prev ? current - prev : null);

  const waistDelta = getDelta(todayLog.waist, prevLog?.waist);
  const chestDelta = getDelta(todayLog.chest, prevLog?.chest);
  const armDelta   = getDelta(todayLog.arm,   prevLog?.arm);
  const thighDelta = getDelta(todayLog.thigh, prevLog?.thigh);

  const exportForCoach = () => {
    const text = [
      'REPORTE SEMANAL - COACH AI', '--------------------------',
      `Fecha: ${today}`, `Peso Actual: ${currentWeight} kg`,
      `Promedio 7d: ${currentAvg?.toFixed(2)} kg`,
      `Tendencia: ${slope < 0 ? 'Descendente' : 'Estancada/Sube'} (${weeklyTrend.toFixed(2)} kg/sem)`,
      `Glucogeno: ${todayLog.isRefeed ? 'Dia de Refeed' : 'Normal'}`, '',
      'ANTROPOMETRIA', `Cintura: ${todayLog.waist || '-'} cm`,
      `Hombros: ${todayLog.chest || '-'} cm`, `Ratio V-Taper: ${vTaper}`, '',
      'BIOFEEDBACK (Hoy)', `Sueno: ${todayLog.sleep || '-'}/5`,
      `Energia: ${todayLog.energy || '-'}/5`, `Estres: ${todayLog.stress || '-'}/5`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePhoto = (view: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos[view]) URL.revokeObjectURL(photos[view]);
    setPhotos(prev => ({ ...prev, [view]: URL.createObjectURL(file) }));
  };

  return (
    <div className="space-y-5 pb-8">

      {/* BLOQUE 1: REGISTRO */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Registro de Hoy</span>
          <button onClick={exportForCoach} className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Exportar Coach'}
          </button>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Peso</span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                defaultValue={todayLog.weight || ''}
                onChange={e => debouncedUpdate('weight', parseFloat(e.target.value))}
                placeholder="00.0"
                className="bg-transparent text-5xl font-bold text-white w-36 focus:outline-none placeholder-slate-800"
              />
              <span className="text-sm text-slate-500 mb-1">kg</span>
            </div>
          </div>
          <div className="text-right pb-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Media 7d</span>
            <div className="text-3xl font-bold text-brand-400">{currentAvg ? currentAvg.toFixed(1) : '--'}</div>
            <div className={`text-xs font-mono flex items-center justify-end gap-1 mt-0.5 ${weeklyChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {weeklyChange <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {weeklyChange > 0 ? '+' : ''}{Math.abs(weeklyChange).toFixed(2)} kg
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-white/5">
          <button
            onClick={() => updateLog({ isRefeed: !todayLog.isRefeed })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              todayLog.isRefeed ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/20' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Pizza size={14} />
            {todayLog.isRefeed ? 'Dia de Refeed' : 'Marcar como Refeed'}
          </button>
          <p className="text-[10px] text-slate-500 leading-tight flex-1">Carbohidratos altos hoy, subida de peso por glucogeno.</p>
        </div>

        <div className="border-t border-white/5 pt-3">
          <button onClick={() => setShowBiofeedback(!showBiofeedback)} className="w-full flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2"><Brain size={12} /> Biofeedback del dia</span>
            <ChevronDown size={14} className={`transition-transform ${showBiofeedback ? 'rotate-180' : ''}`} />
          </button>
          {showBiofeedback && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-400"><Moon size={13} /> Sueno</span>
                <StarRating value={todayLog.sleep || 0} onChange={v => updateLog({ sleep: v })} color="brand" />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-400"><Zap size={13} /> Energia</span>
                <StarRating value={todayLog.energy || 0} onChange={v => updateLog({ energy: v })} color="emerald" />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-400"><Brain size={13} /> Estres</span>
                <StarRating value={todayLog.stress || 0} onChange={v => updateLog({ stress: v })} color="red" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 bg-slate-800/40 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="text-slate-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-500">Pesate al despertar, tras ir al bano, sin ropa y antes de beber.</p>
        </div>
      </div>

      {/* BLOQUE 2: TENDENCIA */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tendencia Real</h3>
          <div className="flex gap-3 text-[9px] font-bold uppercase">
            <span className="flex items-center gap-1 text-slate-500"><div className="w-2 h-2 rounded-full bg-brand-500/50" />Peso</span>
            <span className="flex items-center gap-1 text-orange-400"><div className="w-2 h-0.5 bg-orange-400" />Media</span>
            <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-0.5 border-t border-dashed border-red-500" />Tendencia</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Ritmo semanal</p>
            <p className={`text-lg font-bold mt-0.5 ${weeklyTrend < 0 ? 'text-emerald-400' : weeklyTrend > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {weeklyTrend > 0 ? '+' : ''}{weeklyTrend.toFixed(2)} kg
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-[10px] text-slate-500 uppercase font-bold">En 30 dias</p>
            <p className={`text-lg font-bold mt-0.5 ${projection30d < 0 ? 'text-emerald-400' : projection30d > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {projection30d > 0 ? '+' : ''}{projection30d.toFixed(1)} kg
            </p>
          </div>
        </div>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="index" hide />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} width={30} />
              <Tooltip
                labelFormatter={(_, payload) => payload[0]?.payload?.date || ''}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ padding: 0 }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="weight" name="Peso (kg)" stroke="#0ea5e9" fill="url(#colorWeight)" strokeWidth={2} />
              <Line type="monotone" dataKey="average" name="Media 7d" stroke="#fb923c" dot={false} strokeWidth={2} />
              <Line type="linear" dataKey="trend" name="Tendencia" stroke="#ef4444" strokeDasharray="3 3" dot={false} strokeWidth={1} opacity={0.7} />
              {chartData.map(entry =>
                entry.isRefeed
                  ? <ReferenceDot key={entry.index} x={entry.index} y={entry.weight as number} r={4} fill="#f97316" stroke="none" />
                  : null
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BLOQUE 3: ANTROPOMETRIA */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
          <Ruler size={16} /> Antropometria
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: 'waist' as const, label: 'Cintura', note: 'Grasa visceral', delta: waistDelta, goodDir: -1 },
            { key: 'chest' as const, label: 'Hombros', note: 'Masa magra',     delta: chestDelta, goodDir:  1 },
            { key: 'arm'   as const, label: 'Brazo',   note: '',               delta: armDelta,   goodDir:  1 },
            { key: 'thigh' as const, label: 'Muslo',   note: '',               delta: thighDelta, goodDir:  1 },
          ]).map(({ key, label, note, delta, goodDir }) => (
            <div key={key} className="glass-card p-3 rounded-xl">
              <label className="text-[10px] text-brand-400 uppercase font-bold block mb-1">{label}</label>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  placeholder="0"
                  className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
                  defaultValue={todayLog[key] || ''}
                  onChange={e => debouncedUpdate(key, parseFloat(e.target.value))}
                />
                <span className="text-xs text-slate-500">cm</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                {note && <span className="text-[9px] text-slate-500">{note}</span>}
                {delta !== null && (
                  <span className={`text-[9px] font-bold font-mono ml-auto ${(delta * goodDir) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {todayLog.waist && todayLog.chest && (
          <div className="glass-panel p-3 rounded-xl border border-brand-500/30 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-white uppercase">Ratio V-Taper</p>
              <p className="text-[10px] text-slate-400">Cintura / Hombro, menor es mejor</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-400">{vTaper}</div>
              <div className={`text-[9px] font-bold ${parseFloat(vTaper) < 0.75 ? 'text-emerald-400' : parseFloat(vTaper) < 0.85 ? 'text-amber-400' : 'text-red-400'}`}>
                {parseFloat(vTaper) < 0.75 ? 'Optimo' : parseFloat(vTaper) < 0.85 ? 'Aceptable' : 'Mejorable'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BLOQUE 4: FOTOS */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
          <Camera size={16} /> Fotos de Progreso
        </h2>
        <p className="text-[10px] text-amber-500/80 px-1">Las fotos son temporales y se pierden al recargar la pagina.</p>
        <div className="grid grid-cols-3 gap-2">
          {['Frente', 'Perfil', 'Espalda'].map(view => (
            <div key={view} className="aspect-square bg-slate-800/50 rounded-xl border border-dashed border-slate-600 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-700/50 transition-colors cursor-pointer relative overflow-hidden">
              {photos[view] ? (
                <img src={photos[view]} alt={view} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <Camera size={18} className="text-slate-500" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{view}</span>
                </>
              )}
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handlePhoto(view, e)} />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 text-center italic">Misma iluminacion y hora del dia para comparar correctamente.</p>
      </div>
    </div>
  );
};
