import React, { useState, useEffect } from 'react';
import { ROUTINE_MAPPING, EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS, EXERCISE_ALTERNATIVES, WARMUP_GUIDE } from '../constants';
import { RoutineType, Exercise, WorkoutLogEntry, WorkoutSet } from '../types';
import { getTodayDateString, getCurrentPhase, getGymSchedule } from '../utils';
import { saveLog, getLogs, getPreviousWorkoutLog } from '../services/storage';
import { Save, History, Plus, Minus, Check, Trophy, ArrowRightLeft, X, Dumbbell, Settings, Info, Bot, AlertTriangle, Clock, Flame, ChevronRight, Timer } from 'lucide-react';

const Workout: React.FC = () => {
  const today = getTodayDateString();
  const dayOfWeek = new Date().getDay();
  const phase = getCurrentPhase();
  const specialSchedule = getGymSchedule(today);
  
  const defaultRoutine = ROUTINE_MAPPING[dayOfWeek];
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineType>(defaultRoutine);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);
  
  // activeExercise controls which accordion is expanded
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  // controls the alternatives modal
  const [showAlternativeFor, setShowAlternativeFor] = useState<string | null>(null);
  // controls the warmup modal
  const [showWarmup, setShowWarmup] = useState(false);

  const TABS = [
    { id: RoutineType.PUSH, label: 'Empuje' },
    { id: RoutineType.PULL, label: 'Tirón' },
    { id: RoutineType.LEGS, label: 'Pierna' },
    { id: RoutineType.REST, label: 'Off' },
  ];

  useEffect(() => {
    let list: Exercise[] = [];
    if (selectedRoutine === RoutineType.PUSH) list = EXERCISES_PUSH;
    if (selectedRoutine === RoutineType.PULL) list = EXERCISES_PULL;
    if (selectedRoutine === RoutineType.LEGS) list = EXERCISES_LEGS;
    setExercises(list);
    
    const existingDayLog = getLogs()[today];
    if (existingDayLog?.exercises && existingDayLog.workoutType === selectedRoutine) {
      setLogs(existingDayLog.exercises);
    } else {
      setLogs(list.map(ex => ({ exerciseId: ex.id, sets: [], completed: false })));
    }
  }, [selectedRoutine, today]);

  const updateSet = (exerciseId: string, setIndex: number, field: keyof WorkoutSet, value: number) => {
    const newLogs = logs.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      const newSets = [...log.sets];
      if (!newSets[setIndex]) newSets[setIndex] = { weight: 0, reps: 0 };
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return { ...log, sets: newSets };
    });
    setLogs(newLogs);
  };

  const addSet = (exerciseId: string) => {
    const newLogs = logs.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      const lastSet = log.sets[log.sets.length - 1] || { weight: 0, reps: 0 };
      return { ...log, sets: [...log.sets, { ...lastSet }] };
    });
    setLogs(newLogs);
    // Automatically expand when adding a set
    setActiveExercise(exerciseId);
  };

  const removeSet = (exerciseId: string, index: number) => {
    const newLogs = logs.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      return { ...log, sets: log.sets.filter((_, i) => i !== index) };
    });
    setLogs(newLogs);
  };

  const toggleExerciseComplete = (exerciseId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion toggle
    const newLogs = logs.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      return { ...log, completed: !log.completed };
    });
    setLogs(newLogs);
    
    // If marking as complete, collapse the accordion
    const targetLog = newLogs.find(l => l.exerciseId === exerciseId);
    if (targetLog?.completed) {
      setActiveExercise(null);
    }
    
    // Auto-save on toggle
    saveWorkout(newLogs);
  };

  const saveWorkout = (currentLogs = logs) => {
    const currentLog = getLogs()[today] || { date: today };
    const updated = {
      ...currentLog,
      workoutCompleted: true,
      workoutType: selectedRoutine,
      exercises: currentLogs
    };
    saveLog(updated);
  };

  // Calculate Progress based on 'completed' flag
  const totalExercises = exercises.length;
  const completedExercises = logs.filter(l => l.completed).length;
  const progressPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  return (
    <div className="pb-10 min-h-screen">
      {/* Premium Header */}
      <div className="relative pt-8 px-5 pb-6 bg-gradient-to-b from-brand-900/20 to-transparent">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Entrenamiento</h1>
            <p className="text-brand-400 text-xs font-bold tracking-widest uppercase flex items-center gap-1">
              <Trophy size={12} className="text-gold-500" />
              {phase.trainingFocus}
            </p>
          </div>
          
          {/* Circular Progress */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#d97706"
                strokeWidth="3"
                strokeDasharray="100, 100"
                strokeDashoffset={100 - progressPercentage}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">{progressPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Custom Routine Tabs - Segmented Control */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-black/20 backdrop-blur-md rounded-xl border border-white/5 relative z-20">
           {TABS.map((tab) => {
              const isActive = selectedRoutine === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedRoutine(tab.id)}
                  className={`
                    relative py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center
                    ${isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
                      : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}
                  `}
                >
                  {tab.label}
                </button>
              )
           })}
        </div>
      </div>

      {/* Special Hours Alert */}
      {specialSchedule && (
        <div className={`mx-5 mb-4 p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-4 
          ${specialSchedule === 'Cerrado' 
            ? 'bg-red-900/20 border-red-500/30' 
            : 'bg-gold-500/10 border-gold-500/30'}`}
        >
          <div className={`p-2 rounded-full ${specialSchedule === 'Cerrado' ? 'bg-red-500/10 text-red-500' : 'bg-gold-500/10 text-gold-500'}`}>
             {specialSchedule === 'Cerrado' ? <AlertTriangle size={20} /> : <Clock size={20} />}
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wide ${specialSchedule === 'Cerrado' ? 'text-red-400' : 'text-gold-500'}`}>
              Horario Especial Hoy
            </p>
            <p className="text-white font-bold text-lg leading-none mt-1">
              {specialSchedule}
            </p>
          </div>
        </div>
      )}

      {/* Warmup Button */}
      {selectedRoutine !== RoutineType.REST && (
        <button 
          onClick={() => setShowWarmup(true)}
          className="mx-5 mb-6 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
             <div className="bg-orange-500 text-white p-2 rounded-lg shadow-lg shadow-orange-500/20 animate-pulse">
                <Flame size={20} fill="currentColor" />
             </div>
             <div className="text-left">
                <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">Antes de empezar</p>
                <p className="text-white font-bold text-sm">Calentamiento y Activación</p>
             </div>
          </div>
          <ChevronRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
        </button>
      )}

      {/* Exercises List */}
      <div className="px-5 space-y-4">
        {selectedRoutine === RoutineType.REST ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
               <Trophy size={24} className="text-slate-500" />
             </div>
             <p className="text-slate-400 text-sm font-bold">Día de Descanso</p>
             <p className="text-slate-600 text-xs mt-1">Recupera y crece.</p>
           </div>
        ) : (
          exercises.map((exercise, i) => {
            const log = logs.find(l => l.exerciseId === exercise.id) || { exerciseId: exercise.id, sets: [], completed: false };
            const prevBest = getPreviousWorkoutLog(exercise.id, today);
            const isCompleted = log.completed;
            const isExpanded = activeExercise === exercise.id;
            const alternatives = EXERCISE_ALTERNATIVES[exercise.id];

            return (
              <div 
                key={exercise.id} 
                onClick={() => setActiveExercise(isExpanded ? null : exercise.id)}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden relative
                  ${isCompleted
                    ? 'bg-emerald-900/10 border-emerald-500/30 opacity-60' 
                    : isExpanded 
                      ? 'bg-dark-card/80 border-brand-500/30 shadow-[0_0_20px_rgba(14,165,233,0.1)]' 
                      : 'bg-dark-card/40 border-white/5'}`}
              >
                <div className="p-4 flex flex-col gap-2 relative z-10">
                  <div className="flex justify-between items-start gap-4">
                     <div className="flex-1">
                       <h3 className={`font-bold text-sm leading-tight transition-colors ${isCompleted ? 'text-emerald-400 line-through' : isExpanded ? 'text-white' : 'text-slate-400'}`}>
                         {exercise.name}
                       </h3>
                     </div>
                     
                     <div className="flex items-center gap-3">
                       {/* Alternative Button */}
                       {alternatives && !isCompleted && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setShowAlternativeFor(exercise.id);
                           }}
                           className="text-slate-500 hover:text-brand-400 transition-colors p-1"
                         >
                           <ArrowRightLeft size={16} />
                         </button>
                       )}

                       {/* Selection Checkbox */}
                       <button 
                        onClick={(e) => toggleExerciseComplete(exercise.id, e)}
                        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                       >
                         {isCompleted && <Check size={14} className="text-white" strokeWidth={4} />}
                       </button>
                     </div>
                  </div>

                  {/* Metadata Tags */}
                  {!isCompleted && (
                    <div className="flex gap-2 text-[10px] font-mono tracking-tight mt-1">
                       <span className="text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded border border-white/5">
                         SETS: {exercise.targetSets}
                       </span>
                       <span className="text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded border border-white/5">
                         REPS: {exercise.targetReps}
                       </span>
                    </div>
                  )}

                  {/* History Pill */}
                  {prevBest && isExpanded && !isCompleted && (
                    <div className="mt-2 text-xs flex items-center gap-2 text-gold-500/80 bg-gold-500/10 px-3 py-1.5 rounded-lg border border-gold-500/20 w-fit">
                      <History size={12} />
                      <span>Best: {prevBest.weight}kg × {prevBest.reps}</span>
                    </div>
                  )}
                </div>

                {/* Interaction Area (Accordion) */}
                {isExpanded && !isCompleted && (
                  <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300 relative z-10">
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center mb-1 pl-6">
                        <span className="col-span-4">Peso (kg)</span>
                        <span className="col-span-4">Reps</span>
                        <span className="col-span-4">RIR</span>
                      </div>

                      {logs.find(l => l.exerciseId === exercise.id)?.sets.map((set, idx) => (
                        <div key={idx} className="relative group">
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeSet(exercise.id, idx); }}
                            className="absolute -left-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-red-500 transition-colors"
                          >
                            <Minus size={14} />
                          </button>

                          <div className="grid grid-cols-12 gap-2 pl-6">
                            <div className="col-span-4 bg-black/20 rounded-lg p-0.5 border border-white/5 focus-within:border-brand-500/50 transition-colors">
                              <input 
                                type="number" 
                                placeholder="0"
                                value={set.weight || ''}
                                onChange={(e) => updateSet(exercise.id, idx, 'weight', parseFloat(e.target.value))}
                                onBlur={() => saveWorkout()}
                                className="w-full bg-transparent text-center text-white font-mono font-bold text-sm py-2 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-4 bg-black/20 rounded-lg p-0.5 border border-white/5 focus-within:border-brand-500/50 transition-colors">
                              <input 
                                type="number" 
                                placeholder="0"
                                value={set.reps || ''}
                                onChange={(e) => updateSet(exercise.id, idx, 'reps', parseFloat(e.target.value))}
                                onBlur={() => saveWorkout()}
                                className="w-full bg-transparent text-center text-white font-mono font-bold text-sm py-2 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-4 bg-black/20 rounded-lg p-0.5 border border-white/5 focus-within:border-brand-500/50 transition-colors">
                              <input 
                                type="number" 
                                placeholder="-"
                                value={set.rir || ''}
                                onChange={(e) => updateSet(exercise.id, idx, 'rir', parseFloat(e.target.value))}
                                onBlur={() => saveWorkout()}
                                className="w-full bg-transparent text-center text-brand-300 font-mono font-bold text-sm py-2 focus:outline-none placeholder-slate-700"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); addSet(exercise.id); }}
                      className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-brand-500 hover:bg-brand-500/10 text-slate-400 hover:text-brand-400 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide"
                    >
                      <Plus size={14} /> Añadir Serie
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Warmup Modal */}
      {showWarmup && WARMUP_GUIDE[selectedRoutine] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
           <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowWarmup(false)}
          ></div>
          <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-md border border-orange-500/30 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
             {/* Header */}
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-500 text-white p-2 rounded-lg">
                   <Flame size={24} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-none">Activación</h2>
                  <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mt-1">{selectedRoutine}</p>
                </div>
                <button 
                  onClick={() => setShowWarmup(false)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                  <X size={20} />
                </button>
             </div>

             <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
               {WARMUP_GUIDE[selectedRoutine].map((step: any, index: number) => (
                 <div key={index} className="relative pl-4 border-l-2 border-slate-700">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-orange-500"></div>
                    <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
                    <ul className="space-y-2">
                      {step.tasks.map((task: string, i: number) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                           <div className="w-1 h-1 rounded-full bg-slate-500 mt-1.5 shrink-0"></div>
                           <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                 </div>
               ))}
             </div>

             <div className="mt-6 pt-4 border-t border-white/10 bg-orange-500/5 -mx-6 -mb-6 p-4">
                <div className="flex items-start gap-2">
                   <Timer size={16} className="text-orange-400 mt-0.5 shrink-0" />
                   <div>
                     <p className="text-[10px] text-orange-400 font-bold uppercase mb-0.5">Nota sobre el Tempo</p>
                     <p className="text-[10px] text-slate-400 leading-relaxed">
                       Ejemplo 3:1:1:0 significa: 3s bajada lenta, 1s pausa abajo, 1s subida explosiva, 0s pausa arriba.
                     </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Alternatives Modal */}
      {showAlternativeFor && EXERCISE_ALTERNATIVES[showAlternativeFor] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAlternativeFor(null)}
          ></div>
          <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-md border border-brand-500/20 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAlternativeFor(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-6 text-brand-400">
               <Bot size={20} />
               <span className="text-xs font-bold uppercase tracking-widest">Coach AI: Alternativas</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-6 pr-6 leading-tight">
              {exercises.find(e => e.id === showAlternativeFor)?.name}
            </h3>

            <div className="space-y-4">
              {/* Main Alt */}
              <div className="glass-card p-4 rounded-xl border-l-2 border-l-brand-500">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                    <Dumbbell size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-400 uppercase font-bold mb-0.5">Opción Peso Libre</p>
                    <p className="text-sm font-bold text-white">
                      {EXERCISE_ALTERNATIVES[showAlternativeFor].main}
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary Alt */}
              <div className="glass-card p-4 rounded-xl border-l-2 border-l-purple-500">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Settings size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-400 uppercase font-bold mb-0.5">Opción Máquina/Cable</p>
                    <p className="text-sm font-bold text-white">
                      {EXERCISE_ALTERNATIVES[showAlternativeFor].secondary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="glass-card p-4 rounded-xl bg-slate-800/50">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{EXERCISE_ALTERNATIVES[showAlternativeFor].note}"
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 text-center mt-6">
              Recuerda ajustar el peso para mantener el RIR objetivo.
            </p>
          </div>
        </div>
      )}
      
      {/* Floating Save FAB */}
      <div className="fixed bottom-24 right-5 z-40 animate-in zoom-in duration-300 pointer-events-none">
         <button 
             onClick={() => saveWorkout()}
             className="bg-brand-500 hover:bg-brand-400 text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)] flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto"
           >
             <Save size={24} />
           </button>
      </div>
    </div>
  );
};

export default Workout;