import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPhase, getTodayDateString } from '../utils';
import { getLogs, saveLog } from '../services/storage';
import { DailyLog } from '../types';
import { Activity, Battery, Moon, Scale, Utensils, CheckCircle2, Circle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const today = getTodayDateString();
  const phase = getCurrentPhase();
  const [log, setLog] = useState<DailyLog>({ date: today });
  const [weightInput, setWeightInput] = useState('');

  useEffect(() => {
    const saved = getLogs()[today];
    if (saved) {
      setLog(saved);
      if (saved.weight) setWeightInput(saved.weight.toString());
    }
  }, [today]);

  const handleWeightSave = () => {
    if (!weightInput) return;
    const updated = { ...log, weight: parseFloat(weightInput) };
    setLog(updated);
    saveLog(updated);
  };

  const updateBiofeedback = (field: 'sleep' | 'energy' | 'stress', value: number) => {
    const updated = { ...log, [field]: value };
    setLog(updated);
    saveLog(updated);
  };

  const renderRating = (field: 'sleep' | 'energy' | 'stress', icon: React.ReactNode, colorClass: string) => (
    <div className="glass-card p-3 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-300">
          {icon}
          <span className="capitalize text-xs font-bold uppercase tracking-wider">{field === 'sleep' ? 'Sueño' : field === 'energy' ? 'Energía' : 'Estrés'}</span>
        </div>
        <span className={`text-sm font-bold ${log[field] ? colorClass : 'text-slate-600'}`}>{log[field] || '-'} / 5</span>
      </div>
      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            onClick={() => updateBiofeedback(field, val)}
            className={`h-8 flex-1 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
              log[field] === val 
                ? 'bg-white text-dark-bg shadow-lg scale-105' 
                : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700'
            }`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-5 space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-3xl font-bold text-white">Resumen Diario</h1>
        </div>
        <div 
          onClick={() => navigate('/')}
          className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] text-slate-300 cursor-pointer"
        >
          {phase.name.split(' ')[0]}
        </div>
      </header>

      {/* Main Action Card */}
      <div 
        onClick={() => navigate('/workout')}
        className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-500 cursor-pointer group
          ${log.workoutCompleted 
            ? 'bg-gradient-to-br from-emerald-900/40 to-slate-900 border-emerald-500/30' 
            : 'bg-gradient-to-br from-brand-600 to-brand-800 border-brand-400/50 shadow-lg shadow-brand-900/40'}`}
      >
        <div className="flex justify-between items-start z-10 relative">
          <div>
             <h3 className={`text-xl font-bold mb-1 ${log.workoutCompleted ? 'text-emerald-400' : 'text-white'}`}>
               {log.workoutCompleted ? 'Entreno Completado' : 'Entreno de Hoy'}
             </h3>
             <p className={`text-xs ${log.workoutCompleted ? 'text-emerald-200/60' : 'text-brand-100'}`}>
               {log.workoutCompleted ? '¡Buen trabajo! Descansa.' : 'Toca registrar tu sesión.'}
             </p>
          </div>
          <div className={`p-2 rounded-full ${log.workoutCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/20 text-white'}`}>
            {log.workoutCompleted ? <CheckCircle2 size={24} /> : <Activity size={24} />}
          </div>
        </div>
        
        {/* Progress bar decoration */}
        {!log.workoutCompleted && (
           <div className="mt-4 w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
             <div className="h-full bg-white/40 w-1/3 rounded-full"></div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Weight Input - Premium */}
        <section className="glass-card p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3 text-brand-400">
            <Scale size={18} />
            <span className="text-xs font-bold uppercase">Peso (kg)</span>
          </div>
          <div className="flex items-baseline gap-1">
             <input 
              type="number" 
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onBlur={handleWeightSave}
              placeholder="00.0" 
              className="w-full bg-transparent text-3xl font-bold text-white placeholder-slate-700 focus:outline-none"
            />
          </div>
        </section>

        {/* Nutrition Info */}
        <section className="glass-card p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-orange-400">
            <Utensils size={18} />
            <span className="text-xs font-bold uppercase">Nutrición</span>
          </div>
          <p className="text-xs text-slate-300 leading-tight">
            {phase.nutritionGoal.split('.')[0]}
          </p>
        </section>
      </div>

      {/* Biofeedback */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">Biofeedback</h2>
        {renderRating('energy', <Battery size={16} />, 'text-yellow-400')}
        {renderRating('sleep', <Moon size={16} />, 'text-purple-400')}
        {renderRating('stress', <Activity size={16} />, 'text-red-400')}
      </section>
    </div>
  );
};

export default Dashboard;