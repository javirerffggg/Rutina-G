import React, { useState, useEffect } from 'react';
import { ROUTINE_MAPPING, EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS, EXERCISES_UPPER, EXERCISES_LOWER, EXERCISE_ALTERNATIVES, WARMUP_GUIDE, TECHNICAL_GUIDES } from '../constants';
import { RoutineType, Exercise, WorkoutLogEntry, WorkoutSet, PhaseType } from '../types';
import { 
  calculateOneRM, 
  getCurrentPhase, 
  getTodayDateString, 
  getGymSchedule,
  calculatePlates
} from '../utils';
import { saveLog, getLogs, getPreviousWorkoutLog, getExerciseHistory } from '../services/storage';
import { 
  Save, 
  History, 
  Plus, 
  Minus, 
  Check, 
  Trophy, 
  ArrowRightLeft, 
  X, 
  Dumbbell, 
  Settings, 
  Info, 
  Bot, 
  AlertTriangle, 
  Clock, 
  Flame, 
  ChevronRight, 
  Timer, 
  Flag, 
  Milk, 
  BookOpen, 
  GraduationCap, 
  CalendarDays,
  Award,
  Zap,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EXERCISE_MUSCLE_MAP } from '../constants';

// --- Helper Components ---

const PlateCalculator = ({ weight }: { weight: number }) => {
  const plates = calculatePlates(weight);
  if (plates.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Calculadora de Discos (por lado)</p>
      <div className="flex items-center gap-1.5">
        {/* Left side plates */}
        <div className="flex flex-row-reverse items-center gap-1">
          {plates.map((p, i) => (
            <div 
              key={`l-${i}`} 
              className={`rounded-sm flex items-center justify-center font-display font-black text-[8px] text-white/40
                ${p === 25 ? 'w-4 h-14 bg-red-600/40' : 
                  p === 20 ? 'w-4 h-12 bg-blue-600/40' : 
                  p === 15 ? 'w-4 h-11 bg-yellow-600/40' : 
                  p === 10 ? 'w-4 h-10 bg-green-600/40' : 
                  p === 5 ? 'w-3 h-8 bg-white/20' : 
                  'w-2 h-6 bg-white/10'}`}
            >
              {p}
            </div>
          ))}
        </div>
        
        {/* Barbell center */}
        <div className="w-24 h-2 bg-zinc-800 rounded-full relative">
          <div className="absolute inset-y-0 -left-1 w-1 bg-zinc-700 rounded-full"></div>
          <div className="absolute inset-y-0 -right-1 w-1 bg-zinc-700 rounded-full"></div>
        </div>

        {/* Right side plates */}
        <div className="flex items-center gap-1">
          {plates.map((p, i) => (
            <div 
              key={`r-${i}`} 
              className={`rounded-sm flex items-center justify-center font-display font-black text-[8px] text-white/40
                ${p === 25 ? 'w-4 h-14 bg-red-600/40' : 
                  p === 20 ? 'w-4 h-12 bg-blue-600/40' : 
                  p === 15 ? 'w-4 h-11 bg-yellow-600/40' : 
                  p === 10 ? 'w-4 h-10 bg-green-600/40' : 
                  p === 5 ? 'w-3 h-8 bg-white/20' : 
                  'w-2 h-6 bg-white/10'}`}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

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
        } as any);
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
      
      let newSet: WorkoutSet = { weight: 0, reps: 0 };
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
      const currentSet = newSets[setIndex];
      const wasCompleted = currentSet.completed;
      newSets[setIndex] = { ...currentSet, completed: !wasCompleted };
      
      // Auto-complete exercise if all sets are completed and there is at least one set
      const allCompleted = newSets.length > 0 && newSets.every(s => s.completed);
      
      // PRE-FILL NEXT SET (Idea 2)
      if (!wasCompleted && setIndex < newSets.length - 1) {
        const nextSet = newSets[setIndex + 1];
        if (!nextSet.weight) {
          newSets[setIndex + 1] = { ...nextSet, weight: currentSet.weight };
        }
      }

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
      
      // AUTO-ADVANCE TO NEXT EXERCISE (Idea 2)
      if (isGymMode) {
        const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
        if (currentIndex < exercises.length - 1) {
          const nextExercise = exercises[currentIndex + 1];
          setTimeout(() => setActiveExercise(nextExercise.id), 1000);
        }
      }
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

  const calculateSessionAnalysis = (currentLogs: WorkoutLogEntry[], routine: RoutineType) => {
    const tonnage = currentLogs.reduce((acc, ex) => {
      return acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0);
    }, 0);

    // Find last session of same type
    const allLogs = getLogs();
    const sameTypeLogs = Object.values(allLogs)
      .filter(l => l.workoutType === routine && l.date !== today)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    const lastSession = sameTypeLogs[0];
    let tonnageDiff = 0;
    if (lastSession && lastSession.exercises) {
      const lastTonnage = lastSession.exercises.reduce((acc, ex) => {
        return acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0);
      }, 0);
      tonnageDiff = lastTonnage > 0 ? ((tonnage - lastTonnage) / lastTonnage) * 100 : 0;
    }

    // Check for 1RM PRs
    const prs: string[] = [];
    currentLogs.forEach(ex => {
      const exercise = [...EXERCISES_PUSH, ...EXERCISES_PULL, ...EXERCISES_LEGS, ...EXERCISES_UPPER, ...EXERCISES_LOWER].find(e => e.id === ex.exerciseId);
      if (!exercise) return;

      const currentMax1RM = Math.max(...ex.sets.map(s => calculateOneRM(s.weight, s.reps)));
      
      // Get history for this exercise
      const history = getExerciseHistory(ex.exerciseId, 10);
      const pastMax1RM = history.length > 0 
        ? Math.max(...history.filter(h => h.date !== today).map(h => Math.max(...h.log.sets.map(s => calculateOneRM(s.weight, s.reps))))) 
        : 0;

      if (currentMax1RM > pastMax1RM && pastMax1RM > 0) {
        prs.push(`${exercise.name}: ${currentMax1RM}kg (Est. 1RM)`);
      }
    });

    return {
      tonnage,
      tonnageDiff,
      prs
    };
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
      const analysis = calculateSessionAnalysis(currentLogs, selectedRoutine);
      setAnalysisData(analysis);
      setShowAnalysis(true);
      
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
      {/* Session Analysis Modal */}
      <AnimatePresence>
        {showAnalysis && analysisData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full max-w-md p-8 rounded-[32px] space-y-8 overflow-hidden relative premium-bisel"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500" />
              
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 mb-2 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <Trophy size={40} />
                </div>
                <h2 className="text-3xl font-display font-bold text-white tracking-tight">¡Sesión Finalizada!</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Resumen de Rendimiento</p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="glass-card p-6 rounded-3xl bg-white/5 premium-bisel">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Volumen Total</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-bold text-white">{(analysisData.tonnage / 1000).toFixed(2)}</span>
                    <span className="text-xs text-zinc-500 font-bold uppercase">Tons</span>
                  </div>
                  {analysisData.tonnageDiff !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${analysisData.tonnageDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {analysisData.tonnageDiff > 0 ? <ArrowUpRight size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                      {Math.abs(analysisData.tonnageDiff).toFixed(1)}% vs anterior
                    </div>
                  )}
                </div>
                <div className="glass-card p-6 rounded-3xl bg-white/5 premium-bisel">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Ejercicios</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-bold text-white">{completedExercises}</span>
                    <span className="text-xs text-zinc-500 font-bold uppercase">/{totalExercises}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-bold mt-2 uppercase tracking-widest">
                    {progressPercentage}% completado
                  </div>
                </div>
              </div>

              {analysisData.prs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Award size={14} /> Nuevos Récords Estimados
                  </h3>
                  <div className="space-y-3">
                    {analysisData.prs.map((pr: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 premium-bisel">
                        <Zap size={18} className="text-emerald-400 shrink-0" />
                        <span className="text-sm font-bold text-emerald-100">{pr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowAnalysis(false)}
                className="w-full py-5 bg-white text-black font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-premium active:scale-[0.98]"
              >
                Cerrar Resumen
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Rest Timer Banner */}
      {restTimer !== null && (
        <div className="fixed top-0 left-0 right-0 glass-panel border-b border-brand-500/30 text-white px-6 py-4 flex items-center justify-between z-[110] shadow-2xl animate-in slide-in-from-top-full transition-premium">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-brand-500/20 text-brand-400 animate-pulse">
              <Timer size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Descanso</p>
              <p className="text-3xl font-display font-bold leading-none tracking-tighter">{formatTime(restTimer)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setRestTimer(prev => prev !== null ? prev + 30 : 30)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-premium">+30s</button>
            <button onClick={() => setRestTimer(null)} className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-premium"><X size={20} /></button>
          </div>
        </div>
      )}

      {/* Premium Header */}
      <div className="relative pt-12 px-6 pb-8 bg-gradient-to-b from-brand-900/10 to-transparent">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-1 tracking-tight">Entrenamiento</h1>
            <p className="text-brand-400 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
              <Trophy size={14} className="text-gold-500" />
              {phase.trainingFocus}
            </p>
          </div>
          
          {/* Circular Progress & Timer */}
          <div className="flex flex-col items-end gap-3">
            {sessionState === 'active' && (
              <button
                onClick={() => setIsGymMode(!isGymMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-premium ${isGymMode ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/30' : 'bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800'}`}
              >
                <Dumbbell size={16} />
                {isGymMode ? 'Modo Gym' : 'Modo Normal'}
              </button>
            )}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="3.5"
                  strokeDasharray="100, 100"
                  strokeDashoffset={100 - progressPercentage}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-display font-bold text-white">{progressPercentage}%</span>
              </div>
            </div>
            {sessionState === 'active' && (
              <div className="bg-black/60 px-4 py-1.5 rounded-full border border-white/5 flex items-center gap-2 shadow-2xl">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                <span className="text-sm font-display font-bold text-white tracking-tight">{formatTime(elapsedSeconds)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Custom Routine Tabs - Scrollable for 6 items */}
        <div className="overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
          <div className="flex gap-3 min-w-max">
             {TABS.map((tab) => {
                const isActive = selectedRoutine === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedRoutine(tab.id)}
                    className={`
                      relative py-2.5 px-5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-xl transition-premium flex items-center justify-center border
                      ${isActive 
                        ? 'bg-brand-600 border-brand-500 text-white shadow-xl shadow-brand-900/40' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}
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
      <div className="px-6 space-y-5">
        {selectedRoutine === RoutineType.REST ? (
           <div className="flex flex-col items-center justify-center py-24 opacity-40">
             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
               <Trophy size={32} className="text-zinc-600" />
             </div>
             <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Día de Descanso</p>
             <p className="text-zinc-600 text-xs mt-2 font-medium">Recupera y crece. Prohibido cardio intenso.</p>
           </div>
        ) : isGymMode ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {restTimer !== null ? (
              /* GIANT REST TIMER */
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="glass-panel border-brand-500/30 rounded-[32px] p-12 flex flex-col items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] premium-bisel aspect-square"
              >
                <p className="text-brand-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-6 animate-pulse">Descansando</p>
                
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.03)"
                      strokeWidth="2"
                    />
                    <motion.circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="text-brand-500"
                      initial={{ strokeDasharray: "283 283", strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: 283 - (283 * (restTimer / 60)) }} // Assuming 60s default for visual
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>
                  <div className="text-8xl font-display font-black text-white tabular-nums tracking-tighter z-10">
                    {formatTime(restTimer)}
                  </div>
                </div>

                <div className="flex gap-4 mt-12">
                  <button 
                    onClick={() => setRestTimer(prev => prev !== null ? prev + 30 : 30)} 
                    className="px-8 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-widest transition-premium active:scale-95"
                  >
                    +30s
                  </button>
                  <button 
                    onMouseDown={() => {
                      const timer = setTimeout(() => setRestTimer(null), 800);
                      (window as any)._skipTimer = timer;
                    }}
                    onMouseUp={() => clearTimeout((window as any)._skipTimer)}
                    onTouchStart={() => {
                      const timer = setTimeout(() => setRestTimer(null), 800);
                      (window as any)._skipTimer = timer;
                    }}
                    onTouchEnd={() => clearTimeout((window as any)._skipTimer)}
                    onClick={() => {}} // Handle skip on long press
                    className="px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-widest transition-premium active:scale-95 shadow-xl shadow-brand-900/40"
                  >
                    Saltar
                  </button>
                </div>

                {currentGymExercise && (
                  <div className="mt-10 text-center">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Siguiente Set</p>
                    <p className="text-zinc-300 font-display font-bold text-lg">
                      {currentGymExercise.name} · {prevGymSet ? `${prevGymSet.weight}kg` : 'Peso libre'}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : currentGymExercise && currentSet ? (
              <div className={`glass-panel rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] premium-bisel transition-all duration-500 border
                ${currentSet.rir === 0 ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)]' : 
                  (currentSet.rir === 1 || currentSet.rir === 2) ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)]' :
                  (currentSet.rir === 3 || currentSet.rir === 4) ? 'border-brand-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]' :
                  'border-brand-500/30'}`}>
                
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-brand-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                      Ejercicio Activo
                    </p>
                    <h2 className="text-3xl font-display font-bold text-white leading-tight tracking-tight">
                      {currentGymExercise.name}
                    </h2>
                  </div>
                  <div className="bg-brand-500/10 text-brand-400 px-4 py-2 rounded-xl font-display font-bold text-sm border border-brand-500/20">
                    Set {currentSetIndex + 1} / {currentGymLog?.sets.length || currentGymExercise.targetSets}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-5 mb-8">
                  <motion.div 
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.x) > 50) {
                        const diff = info.offset.x > 0 ? 1.25 : -1.25;
                        updateSet(currentGymExercise.id, currentSetIndex, 'weight', (currentSet.weight || 0) + diff);
                      }
                    }}
                    className="bg-black/60 rounded-2xl p-5 border border-white/5 focus-within:border-brand-500/50 transition-premium cursor-ew-resize"
                  >
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center mb-3">Peso (kg)</p>
                    <input 
                      type="number" 
                      placeholder={prevGymSet ? `${prevGymSet.weight}` : "0"}
                      value={currentSet.weight || ''}
                      onChange={(e) => updateSet(currentGymExercise.id, currentSetIndex, 'weight', parseFloat(e.target.value))}
                      onBlur={() => saveWorkout()}
                      className="w-full bg-transparent text-center font-display font-bold text-4xl text-white focus:outline-none tracking-tighter"
                    />
                  </motion.div>
                  <motion.div 
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.x) > 50) {
                        const diff = info.offset.x > 0 ? 1 : -1;
                        updateSet(currentGymExercise.id, currentSetIndex, 'reps', (currentSet.reps || 0) + diff);
                      }
                    }}
                    className="bg-black/60 rounded-2xl p-5 border border-white/5 focus-within:border-brand-500/50 transition-premium cursor-ew-resize"
                  >
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center mb-3">Reps</p>
                    <input 
                      type="number" 
                      placeholder={prevGymSet ? `${prevGymSet.reps}` : "0"}
                      value={currentSet.reps || ''}
                      onChange={(e) => updateSet(currentGymExercise.id, currentSetIndex, 'reps', parseFloat(e.target.value))}
                      onBlur={() => saveWorkout()}
                      className="w-full bg-transparent text-center font-display font-bold text-4xl text-white focus:outline-none tracking-tighter"
                    />
                  </motion.div>
                  <motion.div 
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.x) > 50) {
                        const diff = info.offset.x > 0 ? 1 : -1;
                        updateSet(currentGymExercise.id, currentSetIndex, 'rir', Math.max(0, (currentSet.rir || 0) + diff));
                      }
                    }}
                    className="bg-black/60 rounded-2xl p-5 border border-white/5 focus-within:border-brand-500/50 transition-premium cursor-ew-resize"
                  >
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center mb-3">RIR</p>
                    <input 
                      type="number" 
                      placeholder={prevGymSet?.rir != null ? `${prevGymSet.rir}` : "-"}
                      value={currentSet.rir || ''}
                      onChange={(e) => updateSet(currentGymExercise.id, currentSetIndex, 'rir', parseFloat(e.target.value))}
                      onBlur={() => saveWorkout()}
                      className="w-full bg-transparent text-center font-display font-bold text-4xl text-brand-400 focus:outline-none tracking-tighter"
                    />
                  </motion.div>
                </div>

                {prevGymSet && (
                  <p className="text-center text-zinc-500 font-display font-bold text-sm mb-6 tracking-tight">
                    Anterior: <span className="text-zinc-300">{prevGymSet.weight}kg × {prevGymSet.reps}</span> {prevGymSet.rir != null ? <span className="text-brand-500/60 ml-1">(RIR {prevGymSet.rir})</span> : ''}
                  </p>
                )}

                {/* Plate Calculator */}
                {currentSet.weight && currentSet.weight > 20 && (
                  <PlateCalculator weight={currentSet.weight} />
                )}

                <button
                  onClick={() => toggleSetComplete(currentGymExercise.id, currentSetIndex)}
                  className="w-full mt-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 rounded-2xl shadow-2xl shadow-emerald-900/40 flex items-center justify-center gap-4 transition-premium active:scale-[0.98] text-xl uppercase tracking-[0.2em]"
                >
                  <Check size={32} strokeWidth={3} />
                  Siguiente Serie
                </button>
              </div>
            ) : (
              <div className="glass-panel border-brand-500/30 rounded-[32px] p-10 text-center shadow-2xl premium-bisel">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                  <Trophy size={48} />
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">¡Todo completado!</h2>
                <p className="text-zinc-500 font-medium mb-10">Has terminado todos los ejercicios de hoy.</p>
                <button
                  onClick={() => setIsGymMode(false)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-5 rounded-2xl transition-premium uppercase tracking-widest"
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
                className={`rounded-[24px] border transition-premium overflow-hidden relative
                  ${isCompleted
                    ? 'bg-emerald-950/10 border-emerald-500/20 opacity-50' 
                    : isExpanded 
                      ? 'bg-zinc-900 border-brand-500/30 shadow-2xl' 
                      : 'bg-zinc-900/40 border-white/5'}`}
              >
                <div className="p-5 flex flex-col gap-3 relative z-10">
                  <div className="flex justify-between items-start gap-4">
                     <div className="flex-1">
                       <h3 className={`font-display font-bold text-lg leading-tight transition-premium ${isCompleted ? 'text-emerald-400 line-through' : isExpanded ? 'text-white' : 'text-zinc-400'}`}>
                         {exercise.name}
                       </h3>
                     </div>
                     
                     <div className="flex items-center gap-4">
                       {/* Technical Guide Button */}
                       {hasTechGuide && !isCompleted && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setShowTechFor(exercise.id);
                           }}
                           className="text-zinc-600 hover:text-brand-400 transition-premium p-1.5"
                         >
                           <BookOpen size={18} />
                         </button>
                       )}

                       {/* Alternative Button */}
                       {alternatives && !isCompleted && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setShowAlternativeFor(exercise.id);
                           }}
                           className="text-zinc-600 hover:text-brand-400 transition-premium p-1.5"
                         >
                           <ArrowRightLeft size={18} />
                         </button>
                       )}

                       {/* Selection Checkbox */}
                       <button 
                        onClick={(e) => toggleExerciseComplete(exercise.id, e)}
                        className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-premium ${
                          isCompleted 
                            ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                            : 'border-zinc-700 hover:border-zinc-500'
                        }`}
                       >
                         {isCompleted && <Check size={16} className="text-white" strokeWidth={4} />}
                       </button>
                     </div>
                  </div>

                  {/* Metadata Tags */}
                  {!isCompleted && (
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold tracking-widest mt-1">
                       <span className={`px-2 py-1 rounded-lg border uppercase ${showVolumeReduction ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-800/50 border-white/5 text-zinc-500'}`}>
                         SETS: {showVolumeReduction ? <span className="line-through opacity-40 mr-1">{exercise.targetSets}</span> : ''}
                         {displaySets} {showVolumeReduction && '(Déficit)'}
                       </span>
                       <span className="text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-lg border border-white/5 uppercase">
                         REPS: {exercise.targetReps}
                       </span>
                       {exercise.notes && (
                         <span className="text-brand-400/80 bg-brand-500/10 px-2 py-1 rounded-lg border border-brand-500/20 truncate max-w-full uppercase">
                           {exercise.notes}
                         </span>
                       )}
                    </div>
                  )}

                  {/* Previous Session */}
                  {prevLog && isExpanded && !isCompleted && (
                    <div className="mt-4 bg-black/40 rounded-2xl border border-white/5 p-4 premium-bisel">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2 text-gold-500">
                          <History size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Última Sesión</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowHistoryFor(exercise.id); }}
                          className="text-[10px] text-zinc-500 hover:text-brand-400 font-bold uppercase tracking-widest flex items-center gap-1.5 transition-premium"
                        >
                          <CalendarDays size={14} /> Historial
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {prevLog.sets.map((set, idx) => (
                          <span key={idx} className="text-xs font-display font-bold text-zinc-300 bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-white/5">
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
                    className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300 relative z-10"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] text-center mb-2">
                        <div className="w-8"></div>
                        <div className="grid grid-cols-12 gap-3 flex-1">
                          <span className="col-span-4">Peso (kg)</span>
                          <span className="col-span-4">Reps</span>
                          <span className="col-span-4">RIR</span>
                        </div>
                        <div className="w-10"></div>
                      </div>

                      {logs.find(l => l.exerciseId === exercise.id)?.sets.map((set, idx) => {
                        const prevSet = prevLog?.sets[idx] ?? null;

                        return (
                          <div key={idx} className="relative group mb-3">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeSet(exercise.id, idx); }}
                                className="w-8 flex justify-center text-zinc-700 hover:text-red-500 transition-premium"
                              >
                                <Minus size={18} />
                              </button>

                              <div className={`grid grid-cols-12 gap-3 flex-1 rounded-xl p-1 border transition-premium ${set.completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/40 border-white/5 focus-within:border-brand-500/50'}`}>
                                <div className="col-span-4">
                                  <input 
                                    type="number" 
                                    placeholder={prevSet ? `${prevSet.weight}` : "0"}
                                    value={set.weight || ''}
                                    onChange={(e) => updateSet(exercise.id, idx, 'weight', parseFloat(e.target.value))}
                                    onBlur={() => saveWorkout()}
                                    className={`w-full bg-transparent text-center font-display font-bold text-lg py-2 focus:outline-none tracking-tight ${set.completed ? 'text-emerald-400' : 'text-white'}`}
                                  />
                                </div>
                                <div className="col-span-4 border-l border-white/5">
                                  <input 
                                    type="number" 
                                    placeholder={prevSet ? `${prevSet.reps}` : "0"}
                                    value={set.reps || ''}
                                    onChange={(e) => updateSet(exercise.id, idx, 'reps', parseFloat(e.target.value))}
                                    onBlur={() => saveWorkout()}
                                    className={`w-full bg-transparent text-center font-display font-bold text-lg py-2 focus:outline-none tracking-tight ${set.completed ? 'text-emerald-400' : 'text-white'}`}
                                  />
                                </div>
                                <div className="col-span-4 border-l border-white/5">
                                  <input 
                                    type="number" 
                                    placeholder={prevSet?.rir != null ? `${prevSet.rir}` : "-"}
                                    value={set.rir || ''}
                                    onChange={(e) => updateSet(exercise.id, idx, 'rir', parseFloat(e.target.value))}
                                    onBlur={() => saveWorkout()}
                                    className={`w-full bg-transparent text-center font-display font-bold text-lg py-2 focus:outline-none placeholder-zinc-800 tracking-tight ${set.completed ? 'text-emerald-400/70' : 'text-brand-400'}`}
                                  />
                                </div>
                              </div>

                              <button
                                onClick={(e) => { e.stopPropagation(); toggleSetComplete(exercise.id, idx); }}
                                className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-premium ${
                                  set.completed 
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-brand-500 hover:text-brand-400'
                                }`}
                              >
                                <Check size={20} strokeWidth={set.completed ? 4 : 2} />
                              </button>
                            </div>

                            {/* Referencia sesión anterior */}
                            {prevSet && (
                              <p className="text-[10px] text-zinc-600 font-display font-bold text-right pr-12 mt-1 tracking-tight">
                                ant: <span className="text-zinc-500">{prevSet.weight}kg × {prevSet.reps}</span>{prevSet.rir != null ? <span className="text-brand-500/40 ml-1">· RIR {prevSet.rir}</span> : ''}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); addSet(exercise.id); }}
                      className="w-full mt-4 py-3.5 rounded-2xl border border-dashed border-zinc-800 hover:border-brand-500 hover:bg-brand-500/5 text-zinc-500 hover:text-brand-400 transition-premium flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                    >
                      <Plus size={16} /> Añadir Serie
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
        <div className="fixed bottom-24 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-40">
          {sessionState === 'idle' && (
            <button 
              onClick={startWorkout}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-5 rounded-2xl shadow-2xl shadow-brand-900/50 flex items-center justify-center gap-3 pointer-events-auto transition-premium active:scale-[0.98] uppercase tracking-[0.2em]"
            >
              <Timer size={24} /> Comenzar Entrenamiento
            </button>
          )}
          {sessionState === 'active' && (
            <button 
              onClick={() => setShowFinishConfirm(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-2xl shadow-2xl shadow-emerald-900/50 flex items-center justify-center gap-3 pointer-events-auto transition-premium active:scale-[0.98] uppercase tracking-[0.2em]"
            >
              <Check size={24} /> Finalizar Entrenamiento
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Workout;