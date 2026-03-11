import React, { useState, useRef } from 'react';
import { DailyLog } from '../../types';
import { Calendar, FileText, Sparkles, Download, ArrowRight, Trophy, Flame, Target, Share2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS, EXERCISES_UPPER, EXERCISES_LOWER } from '../../constants';

interface ReportsTabProps {
  logs: Record<string, DailyLog>;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ logs }) => {
  const [activeReport, setActiveReport] = useState<'monthly' | 'yearly' | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const sortedDates = Object.keys(logs).sort();
  const workoutLogs = sortedDates.map(date => logs[date]).filter(l => l.exercises && l.exercises.length > 0);

  // --- Monthly Report Logic ---
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthLogs = workoutLogs.filter(log => {
    const d = new Date(log.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const prevMonthLogs = workoutLogs.filter(log => {
    const d = new Date(log.date);
    let pMonth = currentMonth - 1;
    let pYear = currentYear;
    if (pMonth < 0) {
      pMonth = 11;
      pYear--;
    }
    return d.getMonth() === pMonth && d.getFullYear() === pYear;
  });

  const getVolume = (logsArr: DailyLog[]) => logsArr.reduce((acc, log) => {
    return acc + (log.exercises?.reduce((exAcc, ex) => {
      return exAcc + ex.sets.reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0);
    }, 0) || 0);
  }, 0);

  const getSets = (logsArr: DailyLog[]) => logsArr.reduce((acc, log) => {
    return acc + (log.exercises?.reduce((exAcc, ex) => exAcc + ex.sets.length, 0) || 0);
  }, 0);

  const currentMonthVol = getVolume(currentMonthLogs);
  const prevMonthVol = getVolume(prevMonthLogs);
  const volDiff = prevMonthVol > 0 ? ((currentMonthVol - prevMonthVol) / prevMonthVol) * 100 : 100;

  const currentMonthSets = getSets(currentMonthLogs);
  const prevMonthSets = getSets(prevMonthLogs);
  const setsDiff = prevMonthSets > 0 ? ((currentMonthSets - prevMonthSets) / prevMonthSets) * 100 : 100;

  // --- Yearly Report Logic ---
  const currentYearLogs = workoutLogs.filter(log => new Date(log.date).getFullYear() === currentYear);
  const yearlyVol = getVolume(currentYearLogs);
  const yearlyWorkouts = currentYearLogs.length;
  
  // Top Exercises
  const exerciseCounts: Record<string, number> = {};
  currentYearLogs.forEach(log => {
    log.exercises?.forEach(ex => {
      exerciseCounts[ex.exerciseId] = (exerciseCounts[ex.exerciseId] || 0) + ex.sets.length;
    });
  });

  const allExercises = [...EXERCISES_PUSH, ...EXERCISES_PULL, ...EXERCISES_LEGS, ...EXERCISES_UPPER, ...EXERCISES_LOWER];
  
  const topExercises = Object.entries(exerciseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, sets]) => {
      const ex = allExercises.find(e => e.id === id);
      return { name: ex ? ex.name : id, sets };
    });

  // Animal equivalents
  const getAnimalEquivalent = (kg: number) => {
    if (kg > 100000) return { name: 'Ballena Azul', weight: 100000, icon: '🐋' };
    if (kg > 5000) return { name: 'Elefante Africano', weight: 5000, icon: '🐘' };
    if (kg > 1000) return { name: 'Coche Compacto', weight: 1000, icon: '🚗' };
    if (kg > 500) return { name: 'Oso Pardo', weight: 500, icon: '🐻' };
    if (kg > 200) return { name: 'Gorila Espalda Plateada', weight: 200, icon: '🦍' };
    return { name: 'Tigre', weight: 100, icon: '🐅' };
  };

  const animal = getAnimalEquivalent(yearlyVol);
  const animalCount = (yearlyVol / animal.weight).toFixed(1);

  const handleShare = async () => {
    if (!reportRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0f172a', // slate-900
        scale: 2, 
        useCORS: true,
      });
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to create image blob');

      const file = new File([blob], 'fitness-wrapped.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Mi Año en Hierro',
          text: '¡Mira mi resumen anual de entrenamiento!',
          files: [file],
        });
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fitness-wrapped.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      alert('Hubo un error al generar la imagen.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {!activeReport ? (
        <>
          <div 
            onClick={() => setActiveReport('monthly')}
            className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-brand-500/20"></div>
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reporte Mensual</h3>
                  <p className="text-xs text-slate-400">Resumen de tu progreso este mes</p>
                </div>
              </div>
              <ArrowRight className="text-slate-500 group-hover:text-brand-400 transition-colors" />
            </div>
          </div>

          <div 
            onClick={() => setActiveReport('yearly')}
            className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-gold-500/20"></div>
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center text-gold-400">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Year in Review</h3>
                  <p className="text-xs text-slate-400">Tu año en el gimnasio al estilo Wrapped</p>
                </div>
              </div>
              <ArrowRight className="text-slate-500 group-hover:text-gold-400 transition-colors" />
            </div>
          </div>
        </>
      ) : activeReport === 'monthly' ? (
        <div className="space-y-6 animate-fade-in">
          <button 
            onClick={() => setActiveReport(null)}
            className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 hover:text-white transition-colors"
          >
            <ArrowRight size={14} className="rotate-180" /> Volver
          </button>
          
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <h2 className="text-2xl font-bold text-white mb-6 relative z-10">Resumen del Mes</h2>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><Flame size={16} className="text-orange-400"/> Volumen Total</span>
                  <span className={`text-xs font-bold ${volDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {volDiff > 0 ? '+' : ''}{volDiff.toFixed(1)}% vs mes anterior
                  </span>
                </div>
                <div className="text-3xl font-bold text-white">{(currentMonthVol / 1000).toFixed(1)} <span className="text-sm text-slate-500 font-normal">toneladas</span></div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><Target size={16} className="text-brand-400"/> Series Completadas</span>
                  <span className={`text-xs font-bold ${setsDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {setsDiff > 0 ? '+' : ''}{setsDiff.toFixed(1)}% vs mes anterior
                  </span>
                </div>
                <div className="text-3xl font-bold text-white">{currentMonthSets} <span className="text-sm text-slate-500 font-normal">series</span></div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><Calendar size={16} className="text-purple-400"/> Entrenamientos</span>
                </div>
                <div className="text-3xl font-bold text-white">{currentMonthLogs.length} <span className="text-sm text-slate-500 font-normal">sesiones</span></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <button 
            onClick={() => setActiveReport(null)}
            className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 hover:text-white transition-colors"
          >
            <ArrowRight size={14} className="rotate-180" /> Volver
          </button>

          <div 
            ref={reportRef}
            className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl border border-gold-500/20 relative overflow-hidden shadow-2xl shadow-gold-900/20"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
            
            <div className="relative z-10 text-center space-y-8">
              <div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-200 mb-2">
                  {currentYear} Wrapped
                </h2>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Tu año en hierro</p>
              </div>

              <div className="space-y-6">
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                  <p className="text-sm text-slate-400 mb-2">Has levantado un total de</p>
                  <p className="text-5xl font-black text-white mb-2">{(yearlyVol / 1000).toFixed(1)} <span className="text-2xl text-slate-500">ton</span></p>
                  <p className="text-xs text-gold-400 font-bold uppercase tracking-wider mt-4">Eso equivale a levantar...</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="text-4xl">{animal.icon}</span>
                    <span className="text-lg font-bold text-white">{animalCount}x {animal.name}s</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Días Entrenados</p>
                    <p className="text-3xl font-black text-white">{yearlyWorkouts}</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Disciplina</p>
                    <p className="text-3xl font-black text-white">{((yearlyWorkouts / 365) * 100).toFixed(0)}%</p>
                  </div>
                </div>

                {topExercises.length > 0 && (
                  <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-left">
                    <p className="text-xs text-brand-400 uppercase font-bold tracking-wider mb-4 text-center">Tus Ejercicios Favoritos</p>
                    <div className="space-y-3">
                      {topExercises.map((ex, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-gold-500 font-black text-lg">#{idx + 1}</span>
                            <span className="text-sm font-bold text-white truncate max-w-[180px]">{ex.name}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">{ex.sets} series</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={handleShare}
            disabled={isSharing}
            className="w-full bg-gradient-to-r from-gold-500 to-amber-500 text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            {isSharing ? 'Generando...' : 'Compartir Resumen'}
          </button>
        </div>
      )}
    </div>
  );
};
