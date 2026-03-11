import React, { useState, useEffect } from 'react';
import { ROUTINE_MAPPING, EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS, EXERCISES_UPPER, EXERCISES_LOWER, EXERCISE_ALTERNATIVES, WARMUP_GUIDE, TECHNICAL_GUIDES } from '../constants';
import { RoutineType, Exercise, WorkoutLogEntry, WorkoutSet, PhaseType } from '../types';
import { getTodayDateString, getCurrentPhase, getGymSchedule } from '../utils';
import { saveLog, getLogs, getPreviousWorkoutLog, getExerciseHistory } from '../services/storage';
import { Save, History, Plus, Minus, Check, Trophy, ArrowRightLeft, X, Dumbbell, Settings, Info, Bot, AlertTriangle, Clock, Flame, ChevronRight, Timer, Flag, Milk, BookOpen, GraduationCap, CalendarDays } from 'lucide-react';

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
  // controls the technical guide modal
  const [showTechFor, setShowTechFor] = useState<string | null>(null);
  // controls the warmup modal
  const [showWarmup, setShowWarmup] = useState(false);
  // controls the history modal
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);
  // controls the finish confirmation modal
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  // controls the gym mode
  const [isGymMode, setIsGymMode] = useState(false);

  // Session State
  const [sessionState, setSessionState] = useState<'idle' | 'active' | 'finished'>(() => {
    const stored = localStorage.getItem(`workoutSessionState_${today}`);
    if (stored === 'active' || stored === 'finished') return stored as 'active' | 'finished';
    const existingDayLog = getLogs()[today];
    if (existingDayLog?.workoutCompleted) return 'finished';
    return 'idle';
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);

  // Workout timer
  const [startTime, setStartTime] = useState<number | null>(() => {
    const stored = localStorage.getItem(`workoutStartTime_${today}`);
    return stored ? parseInt(stored, 10) : null;
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionState === 'active' && startTime) {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState, startTime]);

  const startRestTimer = (seconds: number) => {
    setRestTimer(seconds);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        title: '¡Tiempo de descanso terminado!',
        options: {
          body: 'Prepárate para la siguiente serie.',
          icon: '/vite.svg',
          vibrate: [200, 100, 200]
        },
        delay: seconds * 1000
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (restTimer === 0) {
      setRestTimer(null);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      // Fallback for when app is in foreground and SW didn't fire or we want immediate feedback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('¡Tiempo de descanso terminado!', {
          body: 'Prepárate para la siguiente serie.',
          icon: '/vite.svg',
          vibrate: [200, 100, 200]
        });
      }
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startWorkout = async () => {
    if (sessionState !== 'idle') return;
    const now = Date.now();
    setStartTime(now);
    setSessionState('active');
    localStorage.setItem(`workoutStartTime_${today}`, now.toString());
    localStorage.setItem(`workoutSessionState_${today}`, 'active');

    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      await Notification.requestPermission();
    }
  };

  const handleInteraction = () => {
    if (sessionState === 'idle') {
      startWorkout();
    }
  };

  const TABS = [
    { id: RoutineType.PUSH, label: 'Push' },
    { id: RoutineType.PULL, label: 'Pull' },
    { id: RoutineType.LEGS, label: 'Legs' },
    { id: RoutineType.UPPER, label: 'Upper' },
    { id: RoutineType.LOWER, label: 'Lower' },
    { id: RoutineType.REST, label: 'Rest' },
  ];

  // Logic to determine volume adjustment based on phase
  const isDeficitPhase = phase.name.includes('Fase 1') || phase.name.includes('Fase 4');
  const showSupplementAlert = selectedRoutine === RoutineType.LEGS || selectedRoutine === RoutineType.LOWER || selectedRoutine === RoutineType.UPPER;

  useEffect(() => {
    let list: Exercise[] = [];
    if (selectedRoutine === RoutineType.PUSH) list = EXERCISES_PUSH;
    if (selectedRoutine === RoutineType.PULL) list = EXERCISES_PULL;
    if (selectedRoutine === RoutineType.LEGS) list = EXERCISES_LEGS;
    if (selectedRoutine === RoutineType.UPPER) list = EXERCISES_UPPER;
    if (selectedRoutine === RoutineType.LOWER) list = EXERCISES_LOWER;
    setExercises(list);
    
    const existingDayLog = getLogs()[today];
    if (existingDayLog?.exercises && existingDayLog.workoutType === selectedRoutine) {
      setLogs(existingDayLog.exercises);
    } else {
      setLogs(list.map(ex => {
        const prevLog = getPreviousWorkoutLog(ex.id, today);
        const preloadedSets = prevLog && prevLog.sets.length > 0
          ? prevLog.sets.map(s => ({ weight: s.weight, reps: s.reps, rir: s.rir, completed: false }))
          : [];
        return { exerciseId: ex.id, sets: preloadedSets, completed: false };
      }));
    }
  }, [selectedRoutine, today]);

  const updateSet = (exerciseId: string, setIndex: number, field: keyof WorkoutSet, value: number) => {
    handleInteraction();
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
    handleInteraction();
    const newLogs = logs.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      
      let newSet = { weight: 0, reps: 0 };
      if (log.sets.length > 0) {
        newSet = { ...log.sets[log.sets.length - 1], completed: false };
      } else {
        const prevLog = getPreviousWorkoutLog(exerciseId, today);
        if (prevLog && prevLog.sets.length > 0) {
          newSet = { weight: prevLog.sets[0].weight, reps: prevLog.sets[0].reps, completed: false };
        }
      }
      
      return { ...log, sets: [...log.sets, newSet] };
    });
    setLogs(newLogs);
    // Automatically expand when adding a set
    setActiveExercise(exerciseId);
  };

  const removeSet = (exerciseId: string, index: number) => {
    handleInteraction();
    const newLogs = logs.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      return { ...log, sets: log.sets.filter((_, i) => i !== index) };
    });
    setLogs(newLogs);
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    handleInteraction();
    const newLogs = logs.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      const newSets = [...log.sets];
      newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };
      
      // Auto-complete exercise if all sets are completed and there is at least one set
      const allCompleted = newSets.length > 0 && newSets.every(s => s.completed);
      
      return { ...log, sets: newSets, completed: allCompleted };
    });
    setLogs(newLogs);
    saveWorkout(newLogs, false);
    
    const isCompleted = newLogs.find(l => l.exerciseId === exerciseId)?.sets[setIndex].completed;
    if (isCompleted) {
      startRestTimer(90);
    }
    
    // Auto-collapse if exercise became completed
    const targetLog = newLogs.find(l => l.exerciseId === exerciseId);
    if (targetLog?.completed) {
      setTimeout(() => setActiveExercise(null), 500);
    }
  };

  const toggleExerciseComplete = (exerciseId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion toggle
    handleInteraction();
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

  const saveWorkout = (currentLogs = logs, finish = false) => {
    const currentLog = getLogs()[today] || { date: today };
    
    let duration = currentLog.duration;
    if (startTime && finish) {
      const elapsedMinutes = Math.round((Date.now() - startTime) / 60000);
      if (elapsedMinutes > 0 && elapsedMinutes <= 180) {
        duration = elapsedMinutes;
      } else if (elapsedMinutes > 180 && !duration) {
        duration = 180; // Cap at 3 hours if they forgot to close it
      }
    }

    const updated = {
      ...currentLog,
      workoutCompleted: finish ? true : currentLog.workoutCompleted,
      workoutType: selectedRoutine,
      exercises: currentLogs,
      ...(duration ? { duration } : {})
    };
    saveLog(updated);

    if (finish) {
      setSessionState('finished');
      localStorage.setItem(`workoutSessionState_${today}`, 'finished');
      setRestTimer(null);
    }
  };

  const undoFinishWorkout = () => {
    const currentLog = getLogs()[today];
    if (currentLog) {
      const updated = {
        ...currentLog,
        workoutCompleted: false
      };
      saveLog(updated);
    }
    setSessionState('active');
    localStorage.setItem(`workoutSessionState_${today}`, 'active');
  };

  // Calculate Progress based on 'completed' flag
  const totalExercises = exercises.length;
  const completedExercises = logs.filter(l => l.completed).length;
  const progressPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  // Gym Mode Logic
  const currentGymExercise = activeExercise 
    ? exercises.find(e => e.id === activeExercise) 
    : exercises.find(e => {
        const log = logs.find(l => l.exerciseId === e.id);
        return !log?.completed;
      });

  const currentGymLog = currentGymExercise ? logs.find(l => l.exerciseId === currentGymExercise.id) : null;
  const currentSetIndex = currentGymLog ? currentGymLog.sets.findIndex(s => !s.completed) : -1;
  const currentSet = currentSetIndex !== -1 && currentGymLog ? currentGymLog.sets[currentSetIndex] : null;
  const prevGymLog = currentGymExercise ? getPreviousWorkoutLog(currentGymExercise.id, today) : null;
  const prevGymSet = prevGymLog && currentSetIndex !== -1 ? prevGymLog.sets[currentSetIndex] : null;

  return (
    <div className="pb-10 min-h-screen">
      {/* Rest Timer Banner */}
      {restTimer !== null && (
        <div className="fixed top-0 left-0 right-0 bg-brand-600 text-white px-4 py-3 flex items-center justify-between z-50 shadow-lg shadow-brand-900/50 animate-in slide-in-from-top-full">
          <div className="flex items-center gap-3">
            <Timer size={20} className="animate-pulse" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Descanso</p>
              <p className="text-xl font-mono font-bold leading-none">{formatTime(restTimer)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRestTimer(prev => prev !== null ? prev + 30 : 30)} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">+30s</button>
            <button onClick={() => setRestTimer(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"><X size={16} /></button>
          </div>
        </div>
      )}

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
          
          {/* Circular Progress & Timer */}
          <div className="flex flex-col items-end gap-2">
            {sessionState === 'active' && (
              <button
                onClick={() => setIsGymMode(!isGymMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isGymMode ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
              >
                <Dumbbell size={14} />
                {isGymMode ? 'Modo Gym' : 'Modo Normal'}
              </button>
            )}
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
            {sessionState === 'active' && (
              <div className="bg-black/40 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-mono font-bold text-white">{formatTime(elapsedSeconds)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Custom Routine Tabs - Scrollable for 6 items */}
        <div className="overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
          <div className="flex gap-2 min-w-max">
             {TABS.map((tab) => {
                const isActive = selectedRoutine === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedRoutine(tab.id)}
                    className={`
                      relative py-2 px-4 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center border
                      ${isActive 
                        ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/50' 
                        : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'}
                    `}
                  >
                    {tab.label}
                  </button>
                )
             })}
          </div>
        </div>
      </div>

      {/* Top Banners Row */}
      {!isGymMode && (
        <div className="px-5 mb-6 flex gap-3 overflow-x-auto no-scrollbar snap-x pb-2">
          {/* Special Hours Alert */}
          {specialSchedule && (
            <div className={`shrink-0 w-[85vw] max-w-[320px] snap-center p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-4 
              ${specialSchedule === 'Cerrado' 
                ? 'bg-red-900/20 border-red-500/30' 
                : 'bg-gold-500/10 border-gold-500/30'}`}
            >
              <div className={`p-2 rounded-full shrink-0 ${specialSchedule === 'Cerrado' ? 'bg-red-500/10 text-red-500' : 'bg-gold-500/10 text-gold-500'}`}>
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

          {/* Entrenamiento Finalizado */}
          {sessionState === 'finished' && selectedRoutine !== RoutineType.REST && (
            <div className="shrink-0 w-[85vw] max-w-[320px] snap-center bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-center gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400 shrink-0">
                  <Trophy size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-400">Entrenamiento Finalizado</p>
                  <p className="text-[10px] text-slate-400">Buen trabajo hoy. Tus datos han sido guardados.</p>
                </div>
              </div>
              <button 
                onClick={undoFinishWorkout}
                className="w-full text-xs font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-900/30 px-3 py-2 rounded-lg transition-colors"
              >
                Deshacer Finalización
              </button>
            </div>
          )}

          {/* Peri-Workout Supplement Alert */}
          {selectedRoutine !== RoutineType.REST && showSupplementAlert && (
             <div className="shrink-0 w-[85vw] max-w-[320px] snap-center p-3 rounded-xl bg-blue-900/20 border border-blue-500/30 flex items-center gap-3">
                 <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 shrink-0">
                   <Milk size={18} />
                 </div>
                 <div>
                   <p className="text-[10px] text-blue-400 font-bold uppercase">Intra-Entreno Obligatorio</p>
                   <p className="text-xs text-slate-300">
                     Ciclodextrina (25-50g) + Sal Marina requeridos hoy.
                   </p>
                 </div>
             </div>
          )}

          {/* Warmup Button */}
          {selectedRoutine !== RoutineType.REST && (
            <button 
              onClick={() => setShowWarmup(true)}
              className="shrink-0 w-[85vw] max-w-[320px] snap-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between group active:scale-95 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                 <div className="bg-orange-500 text-white p-2 rounded-lg shadow-lg shadow-orange-500/20 animate-pulse shrink-0">
                    <Flame size={20} fill="currentColor" />
                 </div>
                 <div>
                    <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">Antes de empezar</p>
                    <p className="text-white font-bold text-sm">Calentamiento y Activación</p>
                 </div>
              </div>
              <ChevronRight size={20} className="text-slate-500 group-hover:text-white transition-colors shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* Exercises List or Gym Mode */}
      <div className="px-5 space-y-4">
        {selectedRoutine === RoutineType.REST ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
               <Trophy size={24} className="text-slate-500" />
             </div>
             <p className="text-slate-400 text-sm font-bold">Día de Descanso</p>
             <p className="text-slate-600 text-xs mt-1">Recupera y crece. Prohibido cardio intenso.</p>
           </div>
        ) : isGymMode ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {currentGymExercise && currentSet ? (
              <div className="bg-slate-900/80 backdrop-blur-md border border-brand-500/30 rounded-3xl p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-brand-400 font-bold text-xs uppercase tracking-widest mb-1">
                      Ejercicio Activo
                    </p>
                    <h2 className="text-2xl font-bold text-white leading-tight">
                      {currentGymExercise.name}
                    </h2>
                  </div>
                  <div className="bg-brand-500/20 text-brand-400 px-3 py-1 rounded-lg font-mono font-bold text-sm">
                    Set {currentSetIndex + 1} / {currentGymLog?.sets.length || currentGymExercise.targetSets}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-black/40 rounded-2xl p-4 border border-white/5 focus-within:border-brand-500/50 transition-colors">
                    <p className="text-slate-400 text-xs font-bold uppercase text-center mb-2">Peso (kg)</p>
                    <input 
                      type="number" 
                      placeholder={prevGymSet ? `${prevGymSet.weight}` : "0"}
                      value={currentSet.weight || ''}
                      onChange={(e) => updateSet(currentGymExercise.id, currentSetIndex, 'weight', parseFloat(e.target.value))}
                      onBlur={() => saveWorkout()}
                      className="w-full bg-transparent text-center font-mono font-bold text-3xl text-white focus:outline-none"
                    />
                  </div>
                  <div className="bg-black/40 rounded-2xl p-4 border border-white/5 focus-within:border-brand-500/50 transition-colors">
                    <p className="text-slate-400 text-xs font-bold uppercase text-center mb-2">Reps</p>
                    <input 
                      type="number" 
                      placeholder={prevGymSet ? `${prevGymSet.reps}` : "0"}
                      value={currentSet.reps || ''}
                      onChange={(e) => updateSet(currentGymExercise.id, currentSetIndex, 'reps', parseFloat(e.target.value))}
                      onBlur={() => saveWorkout()}
                      className="w-full bg-transparent text-center font-mono font-bold text-3xl text-white focus:outline-none"
                    />
                  </div>
                  <div className="bg-black/40 rounded-2xl p-4 border border-white/5 focus-within:border-brand-500/50 transition-colors">
                    <p className="text-slate-400 text-xs font-bold uppercase text-center mb-2">RIR</p>
                    <input 
                      type="number" 
                      placeholder={prevGymSet?.rir != null ? `${prevGymSet.rir}` : "-"}
                      value={currentSet.rir || ''}
                      onChange={(e) => updateSet(currentGymExercise.id, currentSetIndex, 'rir', parseFloat(e.target.value))}
                      onBlur={() => saveWorkout()}
                      className="w-full bg-transparent text-center font-mono font-bold text-3xl text-brand-300 focus:outline-none"
                    />
                  </div>
                </div>

                {prevGymSet && (
                  <p className="text-center text-slate-500 font-mono text-sm mb-8">
                    Anterior: {prevGymSet.weight}kg × {prevGymSet.reps} {prevGymSet.rir != null ? `(RIR ${prevGymSet.rir})` : ''}
                  </p>
                )}

                <button
                  onClick={() => toggleSetComplete(currentGymExercise.id, currentSetIndex)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 rounded-2xl shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-3 transition-all active:scale-95 text-xl"
                >
                  <Check size={28} strokeWidth={3} />
                  Set Completado
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/80 backdrop-blur-md border border-brand-500/30 rounded-3xl p-8 text-center shadow-2xl">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
                  <Trophy size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¡Todo completado!</h2>
                <p className="text-slate-400 mb-8">Has terminado todos los ejercicios de hoy.</p>
                <button
                  onClick={() => setIsGymMode(false)}
                  className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl transition-colors"
                >
                  Volver a vista normal
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {exercises.map((exercise, i) => {
            const log = logs.find(l => l.exerciseId === exercise.id) || { exerciseId: exercise.id, sets: [], completed: false };
            const prevLog = getPreviousWorkoutLog(exercise.id, today);
            const isCompleted = log.completed;
            const isExpanded = activeExercise === exercise.id;
            const alternatives = EXERCISE_ALTERNATIVES[exercise.id];
            const hasTechGuide = !!TECHNICAL_GUIDES[exercise.id];

            // Logic for Set Volume Display
            let displaySets = exercise.targetSets;
            let showVolumeReduction = false;
            
            if (isDeficitPhase && (exercise.targetSets === '3-4' || exercise.targetSets === '4')) {
               displaySets = "3";
               showVolumeReduction = true;
            }

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
                       {/* Technical Guide Button */}
                       {hasTechGuide && !isCompleted && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setShowTechFor(exercise.id);
                           }}
                           className="text-slate-500 hover:text-brand-400 transition-colors p-1"
                         >
                           <BookOpen size={16} />
                         </button>
                       )}

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
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono tracking-tight mt-1">
                       <span className={`px-1.5 py-0.5 rounded border ${showVolumeReduction ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-slate-800/50 border-white/5 text-slate-500'}`}>
                         SETS: {showVolumeReduction ? <span className="line-through opacity-50 mr-1">{exercise.targetSets}</span> : ''}
                         {displaySets} {showVolumeReduction && '(Déficit)'}
                       </span>
                       <span className="text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded border border-white/5">
                         REPS: {exercise.targetReps}
                       </span>
                       {exercise.notes && (
                         <span className="text-brand-400/80 bg-brand-900/20 px-1.5 py-0.5 rounded border border-brand-500/20 truncate max-w-full">
                           {exercise.notes}
                         </span>
                       )}
                    </div>
                  )}

                  {/* Previous Session */}
                  {prevLog && isExpanded && !isCompleted && (
                    <div className="mt-3 bg-slate-800/50 rounded-xl border border-white/5 p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-gold-500">
                          <History size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Última Sesión</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowHistoryFor(exercise.id); }}
                          className="text-[10px] text-slate-400 hover:text-brand-400 font-bold uppercase flex items-center gap-1 transition-colors"
                        >
                          <CalendarDays size={12} /> Ver Historial
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {prevLog.sets.map((set, idx) => (
                          <span key={idx} className="text-xs font-mono text-slate-300 bg-black/20 px-2 py-1 rounded border border-white/5">
                            {set.weight}kg × {set.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Interaction Area (Accordion) */}
                {isExpanded && !isCompleted && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300 relative z-10"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center mb-2">
                        <div className="w-6"></div>
                        <div className="grid grid-cols-12 gap-2 flex-1">
                          <span className="col-span-4">Peso (kg)</span>
                          <span className="col-span-4">Reps</span>
                          <span className="col-span-4">RIR</span>
                        </div>
                        <div className="w-8"></div>
                      </div>

                      {logs.find(l => l.exerciseId === exercise.id)?.sets.map((set, idx) => {
                        const prevSet = prevLog?.sets[idx] ?? null;

                        return (
                          <div key={idx} className="relative group mb-2">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeSet(exercise.id, idx); }}
                                className="w-6 flex justify-center text-slate-600 hover:text-red-500 transition-colors"
                              >
                                <Minus size={14} />
                              </button>

                              <div className={`grid grid-cols-12 gap-2 flex-1 rounded-lg p-0.5 border transition-colors ${set.completed ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-black/20 border-white/5 focus-within:border-brand-500/50'}`}>
                                <div className="col-span-4">
                                  <input 
                                    type="number" 
                                    placeholder={prevSet ? `${prevSet.weight}` : "0"}
                                    value={set.weight || ''}
                                    onChange={(e) => updateSet(exercise.id, idx, 'weight', parseFloat(e.target.value))}
                                    onBlur={() => saveWorkout()}
                                    className={`w-full bg-transparent text-center font-mono font-bold text-sm py-2 focus:outline-none ${set.completed ? 'text-emerald-400' : 'text-white'}`}
                                  />
                                </div>
                                <div className="col-span-4 border-l border-white/5">
                                  <input 
                                    type="number" 
                                    placeholder={prevSet ? `${prevSet.reps}` : "0"}
                                    value={set.reps || ''}
                                    onChange={(e) => updateSet(exercise.id, idx, 'reps', parseFloat(e.target.value))}
                                    onBlur={() => saveWorkout()}
                                    className={`w-full bg-transparent text-center font-mono font-bold text-sm py-2 focus:outline-none ${set.completed ? 'text-emerald-400' : 'text-white'}`}
                                  />
                                </div>
                                <div className="col-span-4 border-l border-white/5">
                                  <input 
                                    type="number" 
                                    placeholder={prevSet?.rir != null ? `${prevSet.rir}` : "-"}
                                    value={set.rir || ''}
                                    onChange={(e) => updateSet(exercise.id, idx, 'rir', parseFloat(e.target.value))}
                                    onBlur={() => saveWorkout()}
                                    className={`w-full bg-transparent text-center font-mono font-bold text-sm py-2 focus:outline-none placeholder-slate-700 ${set.completed ? 'text-emerald-400/70' : 'text-brand-300'}`}
                                  />
                                </div>
                              </div>

                              <button
                                onClick={(e) => { e.stopPropagation(); toggleSetComplete(exercise.id, idx); }}
                                className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                                  set.completed 
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-brand-500 hover:text-brand-400'
                                }`}
                              >
                                <Check size={16} strokeWidth={set.completed ? 4 : 2} />
                              </button>
                            </div>

                            {/* Referencia sesión anterior */}
                            {prevSet && (
                              <p className="text-[9px] text-slate-600 font-mono text-right pr-10 mt-0.5">
                                ant: {prevSet.weight}kg × {prevSet.reps}{prevSet.rir != null ? ` · RIR ${prevSet.rir}` : ''}
                              </p>
                            )}
                          </div>
                        );
                      })}
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
          })}
          </>
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

             <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
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

             <div className="mt-6 pt-4 border-t border-white/10 bg-orange-500/5 -mx-6 -mb-6 p-4 space-y-3">
                <div className="flex items-start gap-2">
                   <Flag size={16} className="text-orange-400 mt-0.5 shrink-0" />
                   <div>
                     <p className="text-[10px] text-orange-400 font-bold uppercase mb-0.5">Parámetros Clave</p>
                     <p className="text-[10px] text-slate-300 leading-relaxed">
                       • Objetivo: Preparar tejidos, sensación RIR 10 (fácil). <br/>
                       • Transición: Descansa 90-120s antes de la 1ª serie efectiva.
                     </p>
                   </div>
                </div>
                
                <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                   <Timer size={16} className="text-slate-500 mt-0.5 shrink-0" />
                   <div>
                     <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Nota sobre el Tempo</p>
                     <p className="text-[10px] text-slate-500 leading-relaxed">
                       Ej: 3:1:1:0 (3s bajada : 1s pausa : 1s subida : 0s arriba).
                     </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Technical Guide Modal */}
      {showTechFor && TECHNICAL_GUIDES[showTechFor] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTechFor(null)}
          ></div>
          <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-md border border-brand-500/20 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowTechFor(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-6 text-brand-400">
               <GraduationCap size={20} />
               <span className="text-xs font-bold uppercase tracking-widest">Biblia de Ejecución</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-6 pr-6 leading-tight">
              {exercises.find(e => e.id === showTechFor)?.name}
            </h3>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="glass-card p-4 rounded-xl border-l-2 border-l-brand-500 bg-slate-800/50">
                 <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                   {TECHNICAL_GUIDES[showTechFor]}
                 </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 text-center mt-6 italic">
              "La técnica es el lenguaje con el que hablas a tus músculos."
            </p>
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
      
      {/* History Modal */}
      {showHistoryFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowHistoryFor(null)}
          ></div>
          <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-md border border-brand-500/20 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowHistoryFor(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-6 text-brand-400">
               <CalendarDays size={20} />
               <span className="text-xs font-bold uppercase tracking-widest">Historial</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-6 pr-6 leading-tight">
              {exercises.find(e => e.id === showHistoryFor)?.name}
            </h3>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {getExerciseHistory(showHistoryFor).map((entry, idx) => (
                <div key={idx} className="glass-card p-4 rounded-xl border-l-2 border-l-brand-500 bg-slate-800/50">
                  <p className="text-xs font-bold text-brand-400 mb-2">
                    {new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entry.log.sets.map((set, setIdx) => (
                      <span key={setIdx} className="text-xs font-mono text-slate-300 bg-black/20 px-2 py-1 rounded border border-white/5">
                        {set.weight}kg × {set.reps}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {getExerciseHistory(showHistoryFor).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No hay historial para este ejercicio.</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Finish Confirmation Modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
           <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowFinishConfirm(false)}
          ></div>
          <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
                   <Check size={24} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-none">Finalizar Entrenamiento</h2>
                  <p className="text-xs text-slate-400 mt-1">Duración: {formatTime(elapsedSeconds)}</p>
                </div>
             </div>
             
             <p className="text-sm text-slate-300 mb-6">
               ¿Estás seguro de que quieres finalizar el entrenamiento de hoy?
             </p>

             <div className="flex gap-3">
               <button 
                 onClick={() => setShowFinishConfirm(false)}
                 className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-colors"
               >
                 Cancelar
               </button>
               <button 
                 onClick={() => {
                   setShowFinishConfirm(false);
                   saveWorkout(logs, true);
                 }}
                 className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/50"
               >
                 Finalizar
               </button>
             </div>
          </div>
        </div>
      )}
      
      {/* Session Controls (Floating) */}
      {selectedRoutine !== RoutineType.REST && !isGymMode && (
        <div className="fixed bottom-20 left-0 right-0 p-5 bg-gradient-to-t from-dark-bg via-dark-bg to-transparent pointer-events-none z-40">
          {sessionState === 'idle' && (
            <button 
              onClick={startWorkout}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-900/50 flex items-center justify-center gap-2 pointer-events-auto transition-all active:scale-95"
            >
              <Timer size={20} /> Comenzar Entrenamiento
            </button>
          )}
          {sessionState === 'active' && (
            <button 
              onClick={() => setShowFinishConfirm(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 pointer-events-auto transition-all active:scale-95"
            >
              <Check size={20} /> Finalizar Entrenamiento
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Workout;