import React, { useState, useRef, useMemo } from 'react';
import { DailyLog } from '../../types';
import { Calendar, Sparkles, ArrowRight, Flame, Target, Share2, Loader2, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS, EXERCISES_UPPER, EXERCISES_LOWER } from '../../constants';

interface ReportsTabProps {
  logs: Record<string, DailyLog>;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ logs = {} }) => {
  const [activeReport, setActiveReport] = useState<'monthly' | 'yearly' | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const allExercises = useMemo(
    () => [...EXERCISES_PUSH, ...EXERCISES_PULL, ...EXERCISES_LEGS, ...EXERCISES_UPPER, ...EXERCISES_LOWER],
    []
  );

  const sortedDates = useMemo(() => Object.keys(logs).sort(), [logs]);
  const workoutLogs = useMemo(
    () => sortedDates.map(d => logs[d]).filter(l => l.exercises && l.exercises.length > 0),
    [sortedDates, logs]
  );

  const currentMonth = new Date().getMonth();
  const currentYear  = new Date().getFullYear();

  const getVolume = (arr: DailyLog[]) => arr.reduce((acc, log) =>
    acc + (log.exercises?.reduce((ea, ex) =>
      ea + ex.sets.reduce((sa, s) => sa + s.weight * s.reps, 0), 0) || 0), 0);

  const getSets = (arr: DailyLog[]) => arr.reduce((acc, log) =>
    acc + (log.exercises?.reduce((ea, ex) => ea + ex.sets.length, 0) || 0), 0);

  const currentMonthLogs = useMemo(() => workoutLogs.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [workoutLogs, currentMonth, currentYear]);

  const prevMonthLogs = useMemo(() => workoutLogs.filter(l => {
    const d = new Date(l.date);
    const pm = currentMonth === 0 ? 11 : currentMonth - 1;
    const py = currentMonth === 0 ? currentYear - 1 : currentYear;
    return d.getMonth() === pm && d.getFullYear() === py;
  }), [workoutLogs, currentMonth, currentYear]);

  const currentMonthVol  = getVolume(currentMonthLogs);
  const prevMonthVol     = getVolume(prevMonthLogs);
  const currentMonthSets = getSets(currentMonthLogs);
  const prevMonthSets    = getSets(prevMonthLogs);
  const volDiff  = prevMonthVol  > 0 ? ((currentMonthVol  - prevMonthVol)  / prevMonthVol)  * 100 : 100;
  const setsDiff = prevMonthSets > 0 ? ((currentMonthSets - prevMonthSets) / prevMonthSets) * 100 : 100;

  const currentYearLogs = useMemo(
    () => workoutLogs.filter(l => new Date(l.date).getFullYear() === currentYear),
    [workoutLogs, currentYear]
  );
  const yearlyVol      = getVolume(currentYearLogs);
  const yearlyWorkouts = currentYearLogs.length;

  // Days elapsed in current year, not hardcoded 365
  const daysInYear = useMemo(() => {
    const start = new Date(currentYear, 0, 1).getTime();
    return Math.max(1, Math.ceil((Date.now() - start) / 86400000));
  }, [currentYear]);

  const topExercises = useMemo(() => {
    const counts: Record<string, number> = {};
    currentYearLogs.forEach(log => {
      log.exercises?.forEach(ex => {
        counts[ex.exerciseId] = (counts[ex.exerciseId] || 0) + ex.sets.length;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, sets]) => ({ name: allExercises.find(e => e.id === id)?.name ?? id, sets }));
  }, [currentYearLogs, allExercises]);

  const getAnimalEquivalent = (kg: number) => {
    if (kg > 100000) return { name: 'Ballena Azul',           weight: 100000, icon: '🐋' };
    if (kg > 5000)   return { name: 'Elefante Africano',      weight: 5000,   icon: '🐘' };
    if (kg > 1000)   return { name: 'Coche Compacto',         weight: 1000,   icon: '🚗' };
    if (kg > 500)    return { name: 'Oso Pardo',              weight: 500,    icon: '🐻' };
    if (kg > 200)    return { name: 'Gorila Espalda Plateada', weight: 200,   icon: '🦍' };
    return             { name: 'Tigre',                       weight: 100,    icon: '🐅' };
  };
  const animal      = getAnimalEquivalent(yearlyVol);
  const animalCount = (yearlyVol / animal.weight).toFixed(1);

  const exportToCSV = () => {
    if (!sortedDates.length) return;
    const headers = ['Fecha', 'Ejercicio', 'Serie', 'Peso (kg)', 'Reps', 'RIR'];
    const rows: (string | number)[][] = [];
    sortedDates.forEach(date => {
      logs[date].exercises?.forEach(ex => {
        const exercise = allExercises.find(e => e.id === ex.exerciseId);
        ex.sets.forEach((set, idx) => {
          rows.push([date, exercise?.name ?? ex.exerciseId, idx + 1, set.weight, set.reps, set.rir ?? '']);
        });
      });
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!sortedDates.length) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Historial de Entrenamientos', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
    const tableData: (string | number)[][] = [];
    sortedDates.slice().reverse().forEach(date => {
      logs[date].exercises?.forEach(ex => {
        const exercise = allExercises.find(e => e.id === ex.exerciseId);
        ex.sets.forEach((set, idx) => {
          tableData.push([date, exercise?.name ?? ex.exerciseId, idx + 1, `${set.weight} kg`, set.reps, set.rir ?? '-']);
        });
      });
    });
    autoTable(doc, {
      startY: 40,
      head: [['Fecha', 'Ejercicio', 'Set', 'Peso', 'Reps', 'RIR']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });
    doc.save(`workout_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleShare = async () => {
    if (!reportRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0f172a', scale: 2, useCORS: true });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('No se pudo generar la imagen');
      const file = new File([blob], 'fitness-wrapped.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Mi Ano en Hierro', text: 'Mira mi resumen anual de entrenamiento!', files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'fitness-wrapped.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {!activeReport ? (
        <>
          <div onClick={() => setActiveReport('monthly')} className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-500/20 transition-all" />
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400"><Calendar size={24} /></div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reporte Mensual</h3>
                  <p className="text-xs text-slate-400">Resumen de tu progreso este mes</p>
                </div>
              </div>
              <ArrowRight className="text-slate-500 group-hover:text-brand-400 transition-colors" />
            </div>
          </div>

          <div onClick={() => setActiveReport('yearly')} className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-slate-800/80 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all" />
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400"><Sparkles size={24} /></div>
                <div>
                  <h3 className="text-lg font-bold text-white">Year in Review</h3>
                  <p className="text-xs text-slate-400">Tu ano en el gimnasio al estilo Wrapped</p>
                </div>
              </div>
              <ArrowRight className="text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Exportar Datos</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={exportToCSV} className="glass-panel p-4 rounded-xl flex items-center gap-3 hover:bg-slate-800/80 transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><FileSpreadsheet size={20} /></div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">CSV</p>
                  <p className="text-[10px] text-slate-500">Excel / Sheets</p>
                </div>
              </button>
              <button onClick={exportToPDF} className="glass-panel p-4 rounded-xl flex items-center gap-3 hover:bg-slate-800/80 transition-all">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400"><FileIcon size={20} /></div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">PDF</p>
                  <p className="text-[10px] text-slate-500">Imprimible</p>
                </div>
              </button>
            </div>
          </div>
        </>
      ) : activeReport === 'monthly' ? (
        <div className="space-y-6">
          <button onClick={() => setActiveReport(null)} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 hover:text-white transition-colors">
            <ArrowRight size={14} className="rotate-180" /> Volver
          </button>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <h2 className="text-2xl font-bold text-white mb-6 relative z-10">Resumen del Mes</h2>
            <div className="space-y-4 relative z-10">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><Flame size={16} className="text-orange-400" /> Volumen Total</span>
                  <span className={`text-xs font-bold ${volDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{volDiff > 0 ? '+' : ''}{volDiff.toFixed(1)}% vs mes anterior</span>
                </div>
                <div className="text-3xl font-bold text-white">{(currentMonthVol / 1000).toFixed(1)} <span className="text-sm text-slate-500 font-normal">toneladas</span></div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><Target size={16} className="text-brand-400" /> Series Completadas</span>
                  <span className={`text-xs font-bold ${setsDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{setsDiff > 0 ? '+' : ''}{setsDiff.toFixed(1)}% vs mes anterior</span>
                </div>
                <div className="text-3xl font-bold text-white">{currentMonthSets} <span className="text-sm text-slate-500 font-normal">series</span></div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><Calendar size={16} className="text-purple-400" /> Entrenamientos</span>
                </div>
                <div className="text-3xl font-bold text-white">{currentMonthLogs.length} <span className="text-sm text-slate-500 font-normal">sesiones</span></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setActiveReport(null)} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 hover:text-white transition-colors">
            <ArrowRight size={14} className="rotate-180" /> Volver
          </button>
          <div ref={reportRef} className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl border border-amber-500/20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -ml-20 -mb-20" />
            <div className="relative z-10 text-center space-y-8">
              <div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 mb-2">{currentYear} Wrapped</h2>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Tu ano en hierro</p>
              </div>
              <div className="space-y-6">
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                  <p className="text-sm text-slate-400 mb-2">Has levantado un total de</p>
                  <p className="text-5xl font-black text-white mb-2">{(yearlyVol / 1000).toFixed(1)} <span className="text-2xl text-slate-500">ton</span></p>
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mt-4">Eso equivale a levantar...</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="text-4xl">{animal.icon}</span>
                    <span className="text-lg font-bold text-white">{animalCount}x {animal.name}s</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Dias Entrenados</p>
                    <p className="text-3xl font-black text-white">{yearlyWorkouts}</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Disciplina</p>
                    <p className="text-3xl font-black text-white">{((yearlyWorkouts / daysInYear) * 100).toFixed(0)}%</p>
                    <p className="text-[9px] text-slate-500 mt-1">{daysInYear} dias transcurridos</p>
                  </div>
                </div>
                {topExercises.length > 0 && (
                  <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-left">
                    <p className="text-xs text-brand-400 uppercase font-bold tracking-wider mb-4 text-center">Tus Ejercicios Favoritos</p>
                    <div className="space-y-3">
                      {topExercises.map((ex, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-amber-500 font-black text-lg">#{idx + 1}</span>
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
          <button onClick={handleShare} disabled={isSharing}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            {isSharing ? 'Generando...' : 'Compartir Resumen'}
          </button>
        </div>
      )}
    </div>
  );
};
