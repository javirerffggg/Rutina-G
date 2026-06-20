import React, { useState, useMemo } from 'react';
import { getLogs, getExerciseHistory } from '../services/storage';
import { DailyLog } from '../types';
import { Search, CalendarDays, Clock, Dumbbell, Award, Flame, ChevronDown, ChevronRight, Hash } from 'lucide-react';
import { EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS, EXERCISES_UPPER, EXERCISES_LOWER, EXERCISE_MUSCLE_MAP } from '../constants';
import { calculateOneRM } from '../utils';

const ALL_EXERCISES = [...EXERCISES_PUSH, ...EXERCISES_PULL, ...EXERCISES_LEGS, ...EXERCISES_UPPER, ...EXERCISES_LOWER];

const History: React.FC = () => {
  const [logs] = useState<Record<string, DailyLog>>(() => getLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Procesar logs en orden cronológico inverso y filtrar
  const historyData = useMemo(() => {
    let sortedLogs = (Object.values(logs) as DailyLog[])
      .filter(log => log.exercises && log.exercises.length > 0 && log.workoutCompleted)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      sortedLogs = sortedLogs.filter(log => {
        return log.exercises?.some(exLog => {
          const exercise = ALL_EXERCISES.find(e => e.id === exLog.exerciseId);
          if (!exercise) return false;
          const muscles = EXERCISE_MUSCLE_MAP[exercise.id] || [];
          return exercise.name.toLowerCase().includes(term) || 
                 muscles.some((m: string) => m.toLowerCase().includes(term));
        });
      });
    }

    // Calcular stats de cada sesión (tonelaje, PRs, etc.)
    return sortedLogs.map(log => {
      let tonnage = 0;
      let totalSets = 0;
      const prs: string[] = [];

      const enrichedExercises = log.exercises!.map(exLog => {
        const exercise = ALL_EXERCISES.find(e => e.id === exLog.exerciseId);
        
        // Tonelaje y series de este ejercicio
        const exTonnage = exLog.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
        const exSetsCount = exLog.sets.length;
        
        tonnage += exTonnage;
        totalSets += exSetsCount;

        // Calcular PRs de ese día
        if (exercise) {
          const cur1RM = Math.max(...exLog.sets.map(s => calculateOneRM(s.weight || 0, s.reps || 0)));
          const hist = getExerciseHistory(exLog.exerciseId, 50).filter(h => new Date(h.date) < new Date(log.date));
          const past1RM = hist.length > 0 ? Math.max(...hist.map((h:any) => Math.max(...h.log.sets.map((s:any) => calculateOneRM(s.weight, s.reps))))) : 0;
          
          if (cur1RM > past1RM && past1RM > 0) {
            prs.push(`${exercise.name}: Nuevo 1RM estimado de ${cur1RM}kg`);
          } else if (past1RM === 0 && cur1RM > 0) {
             // Es la primera vez que lo hace, podríamos considerarlo PR o base
             prs.push(`${exercise.name}: Récord base establecido (${cur1RM}kg)`);
          }
        }

        return { ...exLog, exercise, exTonnage, exSetsCount };
      });

      return {
        date: log.date,
        workoutType: log.workoutType,
        duration: log.duration,
        tonnage,
        totalSets,
        prs,
        enrichedExercises
      };
    });
  }, [logs, searchTerm]);

  return (
    <div className="p-4 sm:p-6 pb-32 max-w-3xl mx-auto space-y-6">
      
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
          <CalendarDays size={28} className="text-brand-400" /> Historial
        </h1>
        <p className="text-xs text-zinc-400 font-medium mt-1">Tu diario cronológico de entrenamiento</p>
      </header>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input 
          type="text" 
          placeholder="Buscar ejercicio o músculo..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-500/50 focus:bg-zinc-900 transition-all"
        />
      </div>

      {/* HISTORIAL LIST */}
      <div className="space-y-4">
        {historyData.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
            <Dumbbell size={32} className="mx-auto text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm font-bold">No hay entrenamientos registrados</p>
            {searchTerm && <p className="text-zinc-600 text-xs mt-1">Prueba con otra búsqueda</p>}
          </div>
        ) : (
          historyData.map(log => {
            const isExpanded = expandedLogId === log.date;
            const dateStr = new Date(log.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            
            return (
              <div key={log.date} className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden transition-all hover:border-zinc-700/50">
                {/* LOG SUMMARY ROW */}
                <div 
                  onClick={() => setExpandedLogId(isExpanded ? null : log.date)}
                  className="p-5 cursor-pointer select-none"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white capitalize">{dateStr}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">
                        {log.workoutType || 'Sesión Libre'}
                      </p>
                    </div>
                    {log.prs.length > 0 && (
                      <div className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-lg flex items-center gap-1.5 shrink-0">
                        <Award size={14} />
                        <span className="text-[10px] font-bold">{log.prs.length} PRs</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1"><Clock size={10}/> Duración</span>
                      <span className="text-xs font-bold text-zinc-300">{log.duration ? `${log.duration} min` : '--'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1"><Dumbbell size={10}/> Volumen</span>
                      <span className="text-xs font-bold text-brand-400">{log.tonnage.toLocaleString()} kg</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1"><Hash size={10}/> Series</span>
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                        {log.totalSets} <ChevronDown size={14} className={`text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* EXPANDED DETAILS */}
                {isExpanded && (
                  <div className="bg-black/20 p-5 border-t border-zinc-800/50 space-y-4">
                    {/* PRs List */}
                    {log.prs.length > 0 && (
                      <div className="bg-amber-950/20 border border-amber-500/10 rounded-2xl p-3">
                        <h4 className="text-[9px] text-amber-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
                          <Flame size={12} /> Récords del día
                        </h4>
                        <ul className="space-y-1">
                          {log.prs.map((pr, i) => (
                            <li key={i} className="text-xs text-amber-100/70 font-medium flex items-start gap-1.5">
                              <span className="text-amber-500 mt-0.5">•</span> {pr}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Exercises List */}
                    <div className="space-y-3">
                      <h4 className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Ejercicios Realizados</h4>
                      {log.enrichedExercises.map((ex, i) => (
                        <div key={i} className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-xs font-bold text-white truncate">{ex.exercise?.name || ex.exerciseId}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-0.5">
                              {ex.exSetsCount} series · {ex.exTonnage} kg
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                             <div className="flex flex-col gap-0.5 text-xs text-zinc-400 font-medium">
                               {ex.sets.map((set, setIdx) => (
                                 <span key={setIdx} className={set.completed ? 'text-zinc-300' : 'text-zinc-600'}>
                                   {set.weight}kg x {set.reps}
                                 </span>
                               ))}
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default History;
