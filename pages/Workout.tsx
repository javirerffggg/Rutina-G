import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ROUTINE_MAPPING, EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS,
  EXERCISES_UPPER, EXERCISES_LOWER, EXERCISE_ALTERNATIVES, WARMUP_GUIDE, TECHNICAL_GUIDES,
  EXERCISE_MUSCLE_MAP
} from '../constants';
import {
  calculateOneRM, getCurrentPhase, getTodayDateString,
  getGymSchedule, calculatePlates
} from '../utils';
import { RoutineType, Exercise, WorkoutLogEntry, WorkoutSet, CustomRoutine, ExerciseDBEntry } from '../types';
import { saveLog, getLogs, getPreviousWorkoutLog, getExerciseHistory } from '../services/storage';
import {
  Save, History, Plus, Minus, Check, Trophy, ArrowRightLeft, X,
  Dumbbell, Settings, Info, Bot, AlertTriangle, Clock, Flame, Activity,
  ChevronRight, Timer, Flag, Milk, BookOpen, GraduationCap,
  CalendarDays, Award, Zap, TrendingUp, ArrowUpRight, ArrowLeft,
  ChevronDown, ArrowUp, ArrowDown, Replace, PlaySquare, Image as ImageIcon,
  MoreVertical, Search, PlayCircle, CalendarClock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dispatchLiveActivity } from '../hooks/useLiveActivity';
import { calculateCurrentStreak } from '../hooks/useRPGStats';
import { CustomRoutineBuilder } from '../components/CustomRoutineBuilder';
import { ExerciseDetailSheet } from '../components/ExerciseDetailSheet';
import { MUSCLE_NAMES_ES, EQUIPMENT_ES } from '../data/translations.es';
import { useProgression } from '../hooks/useProgression';
import { getSettings } from '../services/settings';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { WarmupModal } from '../components/WarmupModal';

const COMPOUND_EXERCISES = new Set([
  'squat','deadlift','bench_press','overhead_press','barbell_row',
  'romanian_deadlift','leg_press','hack_squat','front_squat',
  'incline_bench','weighted_dip','weighted_pullup','pullup','dip'
]);
const ISOLATION_EXERCISES = new Set([
  'curl','tricep','lateral_raise','fly','calf_raise',
  'leg_extension','leg_curl','face_pull','rear_delt'
]);
const getRestSeconds = (id: string) => 120;

const ROUTINE_META: Record<RoutineType, any> = {
  [RoutineType.PUSH]: { label: 'Push', emoji: '💪', muscles: 'Pecho · Hombros · Tríceps', accent: 'from-orange-600/30 via-rose-600/20 to-transparent', border: 'border-orange-500/40', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.25)]', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  [RoutineType.PULL]: { label: 'Pull', emoji: '🏋️', muscles: 'Espalda · Bíceps · Trapecios', accent: 'from-sky-600/30 via-blue-600/20 to-transparent', border: 'border-sky-500/40', glow: 'shadow-[0_0_30px_rgba(14,165,233,0.25)]', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  [RoutineType.LEGS]: { label: 'Legs', emoji: '🦵', muscles: 'Cuádriceps · Gemelos · Core', accent: 'from-emerald-600/30 via-green-600/20 to-transparent', border: 'border-emerald-500/40', glow: 'shadow-[0_0_30px_rgba(10,185,129,0.25)]', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  [RoutineType.UPPER]: { label: 'Upper', emoji: '⬆️', muscles: 'Pecho · Espalda · Brazos', accent: 'from-violet-600/30 via-purple-600/20 to-transparent', border: 'border-violet-500/40', glow: 'shadow-[0_0_30px_rgba(139,92,246,0.25)]', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  [RoutineType.LOWER]: { label: 'Lower', emoji: '⬇️', muscles: 'Glúteos · Isquios · Gemelos', accent: 'from-pink-600/30 via-rose-600/20 to-transparent', border: 'border-pink-500/40', glow: 'shadow-[0_0_30px_rgba(236,72,153,0.25)]', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  [RoutineType.REST]: { label: 'Descanso', emoji: '😴', muscles: 'Recuperación activa', accent: 'from-zinc-700/20 to-transparent', border: 'border-zinc-700/40', glow: '', badge: 'bg-zinc-700/30 text-zinc-400 border-zinc-700/40' },
};

const ROUTINE_EXERCISES: Partial<Record<RoutineType, Exercise[]>> = {
  [RoutineType.PUSH]: EXERCISES_PUSH, [RoutineType.PULL]: EXERCISES_PULL, [RoutineType.LEGS]: EXERCISES_LEGS, [RoutineType.UPPER]: EXERCISES_UPPER, [RoutineType.LOWER]: EXERCISES_LOWER,
};

const PlateCalculator = ({ weight, barWeight = 20 }: { weight: number; barWeight?: number }) => {
  const totalWeight = weight - barWeight;
  const plates = calculatePlates(totalWeight);
  if (plates.length === 0) return null;
  return (
    <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Discos por lado</p>
      <div className="flex items-center gap-1.5">
        <div className="flex flex-row-reverse items-center gap-1">
          {plates.map((p, i) => (<div key={`l-${i}`} className={`rounded-sm flex items-center justify-center font-display font-black text-[8px] text-white/40 ${p===25?'w-4 h-14 bg-red-600/40':p===20?'w-4 h-12 bg-blue-600/40':p===15?'w-4 h-11 bg-yellow-600/40':p===10?'w-4 h-10 bg-green-600/40':p===5?'w-3 h-8 bg-white/20':'w-2 h-6 bg-white/10'}`}>{p}</div>))}
        </div>
        <div className="w-24 h-2 bg-zinc-800 rounded-full relative"><div className="absolute inset-y-0 -left-1 w-1 bg-zinc-700 rounded-full" /><div className="absolute inset-y-0 -right-1 w-1 bg-zinc-700 rounded-full" /></div>
        <div className="flex items-center gap-1">
          {plates.map((p, i) => (<div key={`r-${i}`} className={`rounded-sm flex items-center justify-center font-display font-black text-[8px] text-white/40 ${p===25?'w-4 h-14 bg-red-600/40':p===20?'w-4 h-12 bg-blue-600/40':p===15?'w-4 h-11 bg-yellow-600/40':p===10?'w-4 h-10 bg-green-600/40':p===5?'w-3 h-8 bg-white/20':'w-2 h-6 bg-white/10'}`}>{p}</div>))}
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

  const [customRoutines, setCustomRoutines] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('customRoutines') || '[]'); } catch(e) { return []; }
  });
  const [showBuilder, setShowBuilder] = useState(false);
  const [searchCustom, setSearchCustom] = useState('');
  const [customMenuOpen, setCustomMenuOpen] = useState<string | null>(null);

  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);
  const [allLogs, setAllLogs] = useState<Record<string, any>>({});
  
  const [activeExercise, setActiveExercise] = useState<string | null>(null);

  const [showAlternativeFor, setShowAlternativeFor] = useState<string | null>(null);
  const [showTechFor, setShowTechFor] = useState<string | null>(null);
  const [techExerciseDb, setTechExerciseDb] = useState<ExerciseDBEntry | null>(null);

  const { addXP: addProgressionXP } = useProgression();

  useEffect(() => {
    if (!showTechFor) {
      setTechExerciseDb(null);
      return;
    }
    import('../data/exercises.json')
      .then(m => {
        const entry = (m.default as ExerciseDBEntry[]).find(e => e.id === showTechFor);
        if (entry) setTechExerciseDb(entry);
      })
      .catch(console.error);
  }, [showTechFor]);
  const [showWarmupModal, setShowWarmupModal] = useState(false);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const settings = React.useMemo(() => getSettings(), []);

  const [sessionState, setSessionState] = useState<'idle'|'active'|'finished'>(() => {
    const stored = localStorage.getItem(`workoutSessionState_${today}`);
    if (stored === 'active' || stored === 'finished') return stored as any;
    const existing = getLogs()[today];
    if (existing?.workoutCompleted) return 'finished';
    return 'idle';
  });
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showEdgeGlow, setShowEdgeGlow] = useState(false);
  const restDurationRef = useRef<number>(90);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [startTime, setStartTime] = useState<number | null>(() => {
    const s = localStorage.getItem(`workoutStartTime_${today}`);
    return s ? parseInt(s, 10) : null;
  });

  const isDeficitPhase = phase.type === 'cut' || phase.type === 'deficit';

  useEffect(() => {
    let iv: ReturnType<typeof setInterval>;
    if (sessionState === 'active' && startTime) {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      iv = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);
        dispatchLiveActivity({ elapsedSeconds: elapsed });
      }, 1000);
    }
    return () => clearInterval(iv);
  }, [sessionState, startTime]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('force-hide-nav', { detail: selectedRoutine !== null }));
    return () => {
      window.dispatchEvent(new CustomEvent('force-hide-nav', { detail: false }));
    };
  }, [selectedRoutine]);

  useEffect(() => {
    let iv: ReturnType<typeof setInterval>;
    if (restTimer !== null && restTimer > 0) {
      iv = setInterval(() => {
        setRestTimer(prev => {
          const next = prev !== null && prev > 0 ? prev - 1 : 0;
          dispatchLiveActivity({ restTimer: next === 0 ? null : next });
          return next === 0 ? null : next;
        });
      }, 1000);
    } else if (restTimer === 0) {
      dispatchLiveActivity({ restTimer: null });
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (e) { console.error(e); }

      setShowEdgeGlow(true);
      setTimeout(() => setShowEdgeGlow(false), 2500);

      const timeout = setTimeout(() => { setRestTimer(null); }, 10000);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(iv);
  }, [restTimer]);

  useEffect(() => {
    const onSW = (e: MessageEvent) => {
      if (e.data?.type === 'REST_TIMER_TICK') {
        const r: number | null = e.data.remaining;
        setRestTimer(r);
        dispatchLiveActivity({ restTimer: r });
      }
    };
    navigator.serviceWorker?.addEventListener('message', onSW);
    return () => navigator.serviceWorker?.removeEventListener('message', onSW);
  }, []);

  const startRestTimer = (exerciseId: string, exerciseName: string) => {
    const secs = getRestSeconds(exerciseId);
    restDurationRef.current = secs;
    setRestTimer(secs);
    dispatchLiveActivity({ restTimer: secs, restTotal: secs });
    navigator.serviceWorker?.controller?.postMessage({ type: 'START_REST_TIMER', seconds: secs, exerciseName });
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  const startWorkout = async () => {
    if (sessionState !== 'idle') return;
    setSessionState('active');
    localStorage.setItem(`workoutSessionState_${today}`, 'active');
    dispatchLiveActivity({ active: true, sessionState: 'active', elapsedSeconds: 0, setsCompleted: 0, setsTotal: 0 });
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (selectedRoutine === null) return;
    let list: Exercise[] = [];
    if (selectedRoutine.startsWith('CUSTOM_')) {
      const cr = customRoutines.find(r => r.id === selectedRoutine);
      if (cr) list = cr.exercises;
    } else {
      list = ROUTINE_EXERCISES[selectedRoutine as RoutineType] || [];
    }
    setExercises(list);
    const saved = getLogs();
    setAllLogs(saved);
    const existing = saved[today];
    let initialLogs: WorkoutLogEntry[];
    if (existing?.exercises && existing.workoutType === selectedRoutine) {
      initialLogs = existing.exercises;
    } else {
      initialLogs = list.map(ex => {
        const prev = getPreviousWorkoutLog(ex.id, today);
        const targetCount = parseInt(ex.targetSets.split('-')[0]) || 0;
        const setCount = Math.max(targetCount, prev?.sets.length || 0);
        
        const preloaded = [];
        for (let i = 0; i < setCount; i++) {
          if (prev?.sets[i]) {
            preloaded.push({ ...prev.sets[i], completed: false, setType: prev.sets[i].setType || 'N' });
          } else if (prev?.sets.length > 0) {
            preloaded.push({ ...prev.sets[prev.sets.length - 1], completed: false, setType: 'N' });
          } else {
            preloaded.push({ weight: 0, reps: 0, completed: false, setType: 'N' });
          }
        }
        return { exerciseId: ex.id, sets: preloaded, completed: false };
      });
    }
    setLogs(initialLogs);
  }, [selectedRoutine, today]);

  const firstExerciseMaxWeight = React.useMemo(() => {
    if (exercises.length === 0) return 0;
    const firstExId = exercises[0].id;
    const history = getExerciseHistory(firstExId, 5);
    if (history.length === 0) return 0;
    return Math.max(...history.map((h:any) => Math.max(...h.log.sets.map((s:any) => s.weight))));
  }, [exercises]);

  const warmupCompleted = !!(allLogs[today]?.warmupCompleted);

  const handleWarmupComplete = (warmupSets: WorkoutSet[]) => {
    const existing = allLogs[today] || { date: today };
    const u = { ...existing, warmupCompleted: true };
    saveLog(u);
    setAllLogs(prev => ({...prev, [today]: u}));
    addProgressionXP(10, 'WARMUP_COMPLETED');
    
    if (exercises.length > 0 && warmupSets.length > 0) {
      const firstExId = exercises[0].id;
      setLogs(prev => prev.map(log => {
        if (log.exerciseId === firstExId) {
          return { ...log, sets: [...warmupSets, ...log.sets] };
        }
        return log;
      }));
      saveWorkoutWithLogs(logs.map(log => log.exerciseId === firstExId ? { ...log, sets: [...warmupSets, ...log.sets] } : log), false);
    }
  };

  useEffect(() => {
    if (selectedRoutine === null || logs.length === 0) return;
    if (activeExercise === null) {
      const firstUncompleted = logs.find(l => !l.completed)?.exerciseId;
      if (firstUncompleted) setActiveExercise(firstUncompleted);
    }
  }, [logs, selectedRoutine, activeExercise]);

  useEffect(() => {
    if (sessionState !== 'active' || selectedRoutine === null) return;
    const sc = logs.reduce((a,l) => a + l.sets.filter(s=>s.completed).length, 0);
    const st = logs.reduce((a,l) => a + l.sets.length, 0);
    const curEx = exercises.find(e => !logs.find(l=>l.exerciseId===e.id)?.completed);
    dispatchLiveActivity({ setsCompleted: sc, setsTotal: st, exerciseName: curEx?.name ?? '' });
  }, [logs, sessionState, exercises, selectedRoutine]);

  const updateSet = (exerciseId: string, idx: number, field: keyof WorkoutSet, value: number) => {
    setLogs(prev => prev.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      const sets = [...log.sets];
      if (!sets[idx]) sets[idx] = { weight: 0, reps: 0, setType: 'N' };
      const oldValue = sets[idx][field] as number | undefined;
      sets[idx] = { ...sets[idx], [field]: value };
      for (let i = idx + 1; i < sets.length; i++) {
        if (sets[i].completed) break;
        const cur = sets[i][field] as number | undefined;
        const isEmpty = cur === undefined || cur === 0 || cur === null;
        const matchesPrevious = cur === oldValue;
        if (isEmpty || matchesPrevious) sets[i] = { ...sets[i], [field]: value };
        else break;
      }
      return { ...log, sets };
    }));
  };

  const addSet = (exerciseId: string) => {
    setLogs(prev => prev.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      let ns: WorkoutSet = { weight: 0, reps: 0, setType: 'N' };
      if (log.sets.length > 0) ns = { ...log.sets[log.sets.length-1], completed: false };
      else { const p = getPreviousWorkoutLog(exerciseId, today); if (p?.sets.length>0) ns = { weight: p.sets[0].weight, reps: p.sets[0].reps, completed: false, setType: 'N' }; }
      return { ...log, sets: [...log.sets, ns] };
    }));
    setActiveExercise(exerciseId);
  };

  const removeSet = (exerciseId: string, idx: number) => {
    setLogs(prev => prev.map(log => log.exerciseId !== exerciseId ? log : { ...log, sets: log.sets.filter((_,i)=>i!==idx) }));
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    if (sessionState === 'idle') startWorkout();
    if (!startTime) {
      const now = Date.now();
      setStartTime(now);
      localStorage.setItem(`workoutStartTime_${today}`, now.toString());
    }
    const prevGymLog = getPreviousWorkoutLog(exerciseId, today);
    const newLogs = logs.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      const sets = [...log.sets];
      const was = sets[setIndex].completed;
      let w = sets[setIndex].weight;
      let r = sets[setIndex].reps;
      if (!was) {
        if (!w && prevGymLog?.sets[setIndex]?.weight) w = prevGymLog.sets[setIndex].weight;
        if (!r && prevGymLog?.sets[setIndex]?.reps) r = prevGymLog.sets[setIndex].reps;
      }
      sets[setIndex] = { ...sets[setIndex], weight: w, reps: r, completed: !was };
      if (!was && setIndex < sets.length-1 && !sets[setIndex+1].weight) {
        sets[setIndex+1] = { ...sets[setIndex+1], weight: sets[setIndex].weight };
      }
      return { ...log, sets, completed: sets.length>0 && sets.every(s=>s.completed) };
    });
    setLogs(newLogs);
    saveWorkoutWithLogs(newLogs, false);
    const justCompleted = newLogs.find(l=>l.exerciseId===exerciseId)?.sets[setIndex].completed;
    if (justCompleted) { 
      const ex = exercises.find(e=>e.id===exerciseId); 
      startRestTimer(exerciseId, ex?.name ?? exerciseId); 
      addProgressionXP(2, 'SET_COMPLETED');
      
      // PR Check
      const setWeight = newLogs.find(l=>l.exerciseId===exerciseId)?.sets[setIndex].weight ?? 0;
      if (setWeight > 0) {
        const history = getExerciseHistory(exerciseId, 50);
        let maxPastWeight = 0;
        history.forEach((h: any) => {
          if (h.log.date !== today) {
            h.log.sets.forEach((s: any) => {
              if (s.completed && s.weight > maxPastWeight) maxPastWeight = s.weight;
            });
          }
        });
        if (setWeight > maxPastWeight && maxPastWeight > 0) {
          addProgressionXP(100, 'PR_ACHIEVED');
        }
      }
    }
    
    const tl = newLogs.find(l=>l.exerciseId===exerciseId);
    if (tl?.completed) {
      const ci = exercises.findIndex(e=>e.id===exerciseId);
      if (ci < exercises.length-1) setActiveExercise(exercises[ci+1].id);
      else setActiveExercise(null);
    }
  };

  const toggleExerciseComplete = (exerciseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nl = logs.map(l => l.exerciseId !== exerciseId ? l : { ...l, completed: !l.completed });
    setLogs(nl);
    saveWorkoutWithLogs(nl);
    const nowComplete = nl.find(l=>l.exerciseId===exerciseId)?.completed;
    if (nowComplete) {
      const nextUncomp = nl.find(l=>!l.completed)?.exerciseId;
      setActiveExercise(nextUncomp || null);
    } else {
      setActiveExercise(exerciseId);
    }
  };

  const cycleSetType = (exerciseId: string, setIndex: number) => {
    setLogs(prev => prev.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      const sets = [...log.sets];
      if (!sets[setIndex]) return log;
      const currentType = sets[setIndex].setType || 'N';
      const typeOrder: Array<'N' | 'W' | 'D' | 'F'> = ['N', 'W', 'D', 'F'];
      const currentIndex = typeOrder.indexOf(currentType);
      sets[setIndex] = { ...sets[setIndex], setType: typeOrder[(currentIndex + 1) % typeOrder.length] };
      return { ...log, sets };
    }));
    saveWorkout();
  };

  const substituteExercise = (originalId: string, alternativeName: string) => {
    const allExercises = [...EXERCISES_PUSH, ...EXERCISES_PULL, ...EXERCISES_LEGS, ...EXERCISES_UPPER, ...EXERCISES_LOWER];
    const alternativeExercise = allExercises.find(e => e.name === alternativeName);
    if (!alternativeExercise) return;
    setExercises(prev => prev.map(ex => ex.id === originalId ? alternativeExercise : ex));
    setLogs(prev => prev.map(log => {
      if (log.exerciseId !== originalId) return log;
      const prevLog = getPreviousWorkoutLog(alternativeExercise.id, today);
      const preloaded = prevLog?.sets.length > 0
        ? prevLog.sets.map((s: any) => ({ weight: s.weight, reps: s.reps, rir: s.rir, completed: false, setType: s.setType || 'N' }))
        : [{ weight: 0, reps: 0, completed: false, setType: 'N' as const }];
      return { exerciseId: alternativeExercise.id, sets: preloaded, completed: false, setupNotes: log.setupNotes };
    }));
    saveWorkout();
    setShowAlternativeFor(null);
  };

  const calculateSessionAnalysis = (currentLogs: WorkoutLogEntry[], routine: string) => {
    const tonnage = currentLogs.reduce((a,ex) => a + ex.sets.reduce((s,set) => s + set.weight*set.reps, 0), 0);
    const sameType = Object.values(allLogs).filter((l:any) => l.workoutType === routine && l.date !== today).sort((a:any,b:any) => b.date.localeCompare(a.date));
    const last = sameType[0] as any;
    let diff = 0;
    if (last?.exercises) { const lt = last.exercises.reduce((a:number,ex:any) => a + ex.sets.reduce((s:number,set:any) => s+set.weight*set.reps, 0), 0); diff = lt>0 ? ((tonnage-lt)/lt)*100 : 0; }
    const allEx = [...EXERCISES_PUSH,...EXERCISES_PULL,...EXERCISES_LEGS,...EXERCISES_UPPER,...EXERCISES_LOWER];
    const prs: string[] = [];
    currentLogs.forEach(ex => {
      const exercise = allEx.find(e=>e.id===ex.exerciseId); if (!exercise) return;
      const cur1RM = Math.max(...ex.sets.map(s=>calculateOneRM(s.weight,s.reps)));
      const hist = getExerciseHistory(ex.exerciseId, 10);
      const past1RM = hist.length>0 ? Math.max(...hist.filter((h:any)=>h.date!==today).map((h:any)=>Math.max(...h.log.sets.map((s:any)=>calculateOneRM(s.weight,s.reps))))) : 0;
      if (cur1RM>past1RM && past1RM>0) prs.push(`${exercise.name}: ${cur1RM}kg est. 1RM`);
    });
    return { tonnage, tonnageDiff: diff, prs };
  };

  const saveWorkoutWithLogs = (currentLogs = logs, finish = false) => {
    if (selectedRoutine === null) return;
    const existing = allLogs[today] || { date: today };
    let duration = existing.duration;
    if (startTime && finish) { const mins = Math.round((Date.now()-startTime)/60000); duration = mins>0&&mins<=180?mins:(duration||180); }
    const updated = { ...existing, workoutCompleted: finish?true:existing.workoutCompleted, workoutType: selectedRoutine, exercises: currentLogs, ...(duration?{duration}:{}) };
    saveLog(updated);
    setAllLogs(prev => ({ ...prev, [today]: updated }));
    if (finish) {
      setAnalysisData(calculateSessionAnalysis(currentLogs, selectedRoutine));
      setShowAnalysis(true);
      setSessionState('finished');
      localStorage.setItem(`workoutSessionState_${today}`, 'finished');
      setRestTimer(null);
      dispatchLiveActivity({ sessionState: 'finished', restTimer: null, elapsedSeconds });
      navigator.serviceWorker?.controller?.postMessage({ type: 'CANCEL_REST_TIMER' });
      
      const streak = calculateCurrentStreak(allLogs);
      const streakMultiplier = Math.min(1 + (streak * 0.1), 2.0); // max 2x multiplier
      const baseXP = 50;
      const finalXP = Math.round(baseXP * streakMultiplier);
      addProgressionXP(finalXP, 'WORKOUT_COMPLETED');
    }
  };

  const saveWorkout = (finish = false) => saveWorkoutWithLogs(logs, finish);

  const totalExercises = exercises.length;
  const completedExercises = logs.filter(l=>l.completed).length;
  const progressPercentage = totalExercises>0 ? Math.round((completedExercises/totalExercises)*100) : 0;
  const setsCompletedCount = logs.reduce((a,l) => a + l.sets.filter(s=>s.completed).length, 0);
  const setsTotalCount = logs.reduce((a,l) => a + l.sets.length, 0);

  if (selectedRoutine === null) {
    const ORDERED: RoutineType[] = [RoutineType.PUSH, RoutineType.PULL, RoutineType.LEGS, RoutineType.UPPER, RoutineType.LOWER, RoutineType.REST];
    const allLogsList = Object.values(getLogs()).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentHistory = allLogsList.filter((l: any) => l.workoutCompleted && l.exercises?.length).slice(0, 3);
    const activeSession = localStorage.getItem(`workoutSessionState_${today}`) === 'active';
    const defaultMeta = ROUTINE_META[defaultRoutine as RoutineType];

    const getRoutineStats = (routineId: string) => {
      const routineLogs = allLogsList.filter((l: any) => l.workoutType === routineId && l.workoutCompleted && l.date !== today);
      if (routineLogs.length === 0) return null;
      const last = routineLogs[0];
      const daysAgo = Math.floor((new Date(today).getTime() - new Date(last.date).getTime()) / 86400000);
      const volume = last.exercises?.reduce((sum: number, ex: any) => sum + ex.sets.reduce((s: number, set: any) => s + ((set.weight || 0) * (set.reps || 0)), 0), 0) || 0;
      const avgDuration = Math.round(routineLogs.reduce((sum: number, l: any) => sum + (l.duration || 0), 0) / routineLogs.length);
      return { daysAgo, volume, avgDuration };
    };

    const getCustomMuscles = (routine: any) => {
      const musclesCount: Record<string, number> = {};
      routine.exercises.forEach((ex: any) => {
        const m = EXERCISE_MUSCLE_MAP[ex.id] || [];
        m.forEach((muscle: string) => { musclesCount[muscle] = (musclesCount[muscle] || 0) + 1; });
      });
      return Object.entries(musclesCount).sort((a,b) => b[1] - a[1]).slice(0,2).map(e => e[0]).join(' · ') || 'Varios';
    };

    const filteredCustomRoutines = customRoutines.filter(r => searchCustom === '' || r.name.toLowerCase().includes(searchCustom.toLowerCase()));

    const deleteCustomRoutine = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = customRoutines.filter(r => r.id !== id);
      setCustomRoutines(updated);
      localStorage.setItem('customRoutines', JSON.stringify(updated));
      setCustomMenuOpen(null);
    };

    return (
      <div className="min-h-screen pb-32">
        <div className="pt-12 px-6 pb-6">
          <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-1">Entrenamiento</h1>
          <p className="text-brand-400 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
            <Trophy size={14} /> {phase.trainingFocus}
          </p>
        </div>

        {recentHistory.length > 0 && (
          <div className="px-4 mb-6">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 px-2">Historial Reciente</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-2 -mx-4 px-4">
              {recentHistory.map((log: any, i: number) => {
                const dateStr = new Date(log.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
                const volume = log.exercises?.reduce((sum: number, ex: any) => sum + ex.sets.reduce((s: number, set: any) => s + ((set.weight || 0) * (set.reps || 0)), 0), 0) || 0;
                return (
                  <div key={i} className="snap-center shrink-0 w-40 bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-2xl">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest capitalize mb-1">{dateStr}</p>
                    <h4 className="text-xs font-bold text-white truncate">{log.workoutType}</h4>
                    <p className="text-[10px] font-bold text-brand-400 mt-2">{volume.toLocaleString()} kg</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-4 mb-8 space-y-3">
          {activeSession && (
            <motion.button onClick={() => setSelectedRoutine(localStorage.getItem(`workoutSessionState_${today}`) || defaultRoutine)} whileTap={{ scale: 0.98 }}
              className="w-full relative overflow-hidden rounded-3xl border border-brand-500/50 bg-brand-900/20 text-left p-5 transition-all shadow-lg shadow-brand-900/20">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-transparent pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Sesión Activa</span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">Continuar Entreno</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  <PlayCircle size={20} />
                </div>
              </div>
            </motion.button>
          )}

          {!activeSession && defaultRoutine !== RoutineType.REST && defaultMeta && !settings.hideDefaultRoutines && (
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Hoy Toca</h2>
                   <h3 className="text-2xl font-display font-bold text-white">{defaultMeta.label}</h3>
                 </div>
                 <span className="text-3xl opacity-80">{defaultMeta.emoji}</span>
               </div>
               <button onClick={() => setSelectedRoutine(defaultRoutine)} className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors">
                 Comenzar Sesión
               </button>
            </div>
          )}
        </div>

        {!settings.hideDefaultRoutines && (
          <div className="px-4 grid grid-cols-3 gap-2">
            {ORDERED.map(routine => {
              const meta = ROUTINE_META[routine];
              const isToday = defaultRoutine === routine;
              const exList = ROUTINE_EXERCISES[routine] || [];
              const savedLog = Object.values(getLogs()).find((l:any) => l.workoutType === routine && l.date === today);
              const doneToday = !!(savedLog as any)?.workoutCompleted;
              const stats = getRoutineStats(routine);

              return (
                <motion.button key={routine} onClick={() => setSelectedRoutine(routine)} whileTap={{ scale: 0.97 }}
                  className={`w-full relative overflow-hidden rounded-[24px] border text-left transition-all duration-300 active:scale-[0.97] bg-zinc-900/70 backdrop-blur-sm ${isToday ? `${meta.border} ${meta.glow}` : 'border-white/6'}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent} pointer-events-none`} />
                  
                  {isToday && <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${meta.accent} from-50%`} />}
                  {isToday && <div className="absolute top-3 right-3 z-10"><span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border ${meta.badge}`}>HOY</span></div>}
                  {doneToday && <div className="absolute top-3 left-3 z-10 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]"><Check size={11} strokeWidth={3} className="text-white" /></div>}
                  
                  <div className="relative z-10 p-3 pt-4">
                    <span className="text-2xl mb-2 block">{meta.emoji}</span>
                    <h2 className={`text-base font-display font-black leading-none tracking-tight mb-1 ${isToday ? 'text-white' : 'text-zinc-300'} truncate`}>{meta.label}</h2>
                    <p className="text-[9px] font-bold text-zinc-500 leading-snug mb-2 line-clamp-2">{meta.muscles}</p>
                    
                    {stats ? (
                      <div className="space-y-1 mb-2">
                        <div className="text-[8px] font-bold text-zinc-400 flex items-center gap-1">
                          <Clock size={8} className="text-zinc-500" /> ~{stats.avgDuration || 50}m
                        </div>
                        <div className="text-[8px] font-bold text-zinc-500 line-clamp-1">
                          hace {stats.daysAgo}d
                        </div>
                      </div>
                    ) : (
                      exList.length > 0 && <div className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 mb-2 rounded-lg border ${meta.badge}`}><Dumbbell size={8} /> {exList.length} ej.</div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <div className="px-4 mt-8 mb-4">
           <div className="flex justify-between items-end mb-4">
             <h2 className="text-xl font-display font-bold text-white tracking-tight">Mis Rutinas</h2>
             {customRoutines.length > 0 && (
               <button onClick={() => setShowBuilder(true)} className="text-[10px] text-brand-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-brand-500/10 hover:bg-brand-500/20 px-3 py-1.5 rounded-full transition-all">
                 <Plus size={12}/> Crear
               </button>
             )}
           </div>

           {customRoutines.length > 0 && (
             <div className="relative mb-4">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
               <input 
                 type="text" 
                 placeholder="Buscar mis rutinas..." 
                 value={searchCustom}
                 onChange={e => setSearchCustom(e.target.value)}
                 className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-500/50 transition-all"
               />
             </div>
           )}
        </div>
        
        {customRoutines.length === 0 ? (
          <div className="px-4">
            <div className="p-8 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 text-zinc-500">
                <Dumbbell size={28} />
              </div>
              <p className="text-sm font-bold text-white mb-1">Crea tu primera rutina</p>
              <p className="text-xs text-zinc-500 mb-6 max-w-xs">Diseña un entrenamiento a tu medida usando nuestra base de datos completa de ejercicios.</p>
              <button onClick={() => setShowBuilder(true)} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95">
                <Plus size={16} /> Crear Rutina
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-8 space-y-6">
             {settings.routineFolders ? (
               Object.entries(
                 filteredCustomRoutines.reduce((acc, r) => {
                   const f = r.folder || 'Sin Categoría';
                   if (!acc[f]) acc[f] = [];
                   acc[f].push(r);
                   return acc;
                 }, {} as Record<string, CustomRoutine[]>)
               ).map(([folderName, routines]) => (
                 <div key={folderName} className="space-y-3">
                   <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">{folderName}</h3>
                   <div className="grid grid-cols-3 gap-2">
                     {(routines as CustomRoutine[]).map(routine => {
                        const doneToday = !!Object.values(getLogs()).find((l:any) => l.workoutType === routine.id && l.date === today && l.workoutCompleted);
                        const muscles = getCustomMuscles(routine);
                        const isMenuOpen = customMenuOpen === routine.id;

                        return (
                          <div key={routine.id} className="relative">
                            <motion.button onClick={() => setSelectedRoutine(routine.id)} whileTap={{ scale: 0.97 }}
                              className={`w-full relative overflow-hidden rounded-[24px] border border-white/6 text-left transition-all duration-300 active:scale-[0.97] bg-zinc-900/70 backdrop-blur-sm`}>
                              <div className={`absolute inset-0 bg-gradient-to-br from-brand-600/10 to-transparent pointer-events-none`} />
                              {doneToday && <div className="absolute top-3 left-3 z-10 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]"><Check size={11} strokeWidth={3} className="text-white" /></div>}
                              <div className="relative z-10 p-3 pt-4">
                                <span className="text-2xl mb-2 block">{routine.emoji}</span>
                                <h2 className={`text-base font-display font-black leading-none tracking-tight mb-1 text-zinc-200 truncate`}>{routine.name}</h2>
                                {routine.description ? (
                                  <p className="text-[9px] font-bold text-brand-500/70 leading-snug mb-2 line-clamp-2">{routine.description}</p>
                                ) : (
                                  <p className="text-[9px] font-bold text-zinc-500 leading-snug mb-2 line-clamp-2">{muscles}</p>
                                )}
                                <div className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-lg border bg-zinc-800 text-zinc-400 border-white/10`}>
                                  <Dumbbell size={8} /> {routine.exercises.length} ej.
                                </div>
                              </div>
                            </motion.button>
                            
                            <button 
                              onClick={(e) => { e.stopPropagation(); setCustomMenuOpen(isMenuOpen ? null : routine.id); }}
                              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute top-12 right-2 z-30 w-36 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 origin-top-right">
                                <div className="flex flex-col">
                                  <button onClick={(e) => { e.stopPropagation(); setCustomMenuOpen(null); }} className="px-4 py-2.5 text-left text-xs font-bold text-white hover:bg-zinc-700 transition-colors border-b border-zinc-700/50">
                                    Editar Rutina
                                  </button>
                                  <button onClick={(e) => deleteCustomRoutine(routine.id, e)} className="px-4 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-zinc-700 transition-colors">
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                     })}
                   </div>
                 </div>
               ))
             ) : (
               <div className="grid grid-cols-3 gap-2">
                 {filteredCustomRoutines.map(routine => {
                    const doneToday = !!Object.values(getLogs()).find((l:any) => l.workoutType === routine.id && l.date === today && l.workoutCompleted);
                    const muscles = getCustomMuscles(routine);
                    const isMenuOpen = customMenuOpen === routine.id;

                    return (
                      <div key={routine.id} className="relative">
                        <motion.button onClick={() => setSelectedRoutine(routine.id)} whileTap={{ scale: 0.97 }}
                          className={`w-full relative overflow-hidden rounded-[24px] border border-white/6 text-left transition-all duration-300 active:scale-[0.97] bg-zinc-900/70 backdrop-blur-sm`}>
                          <div className={`absolute inset-0 bg-gradient-to-br from-brand-600/10 to-transparent pointer-events-none`} />
                          {doneToday && <div className="absolute top-3 left-3 z-10 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]"><Check size={11} strokeWidth={3} className="text-white" /></div>}
                          <div className="relative z-10 p-3 pt-4">
                            <span className="text-2xl mb-2 block">{routine.emoji}</span>
                            <h2 className={`text-base font-display font-black leading-none tracking-tight mb-1 text-zinc-200 truncate`}>{routine.name}</h2>
                            {routine.description ? (
                              <p className="text-[9px] font-bold text-brand-500/70 leading-snug mb-2 line-clamp-2">{routine.description}</p>
                            ) : (
                              <p className="text-[9px] font-bold text-zinc-500 leading-snug mb-2 line-clamp-2">{muscles}</p>
                            )}
                            <div className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-lg border bg-zinc-800 text-zinc-400 border-white/10`}>
                              <Dumbbell size={8} /> {routine.exercises.length} ej.
                            </div>
                          </div>
                        </motion.button>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCustomMenuOpen(isMenuOpen ? null : routine.id); }}
                          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute top-12 right-2 z-30 w-36 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 origin-top-right">
                            <div className="flex flex-col">
                              <button onClick={(e) => { e.stopPropagation(); setCustomMenuOpen(null); }} className="px-4 py-2.5 text-left text-xs font-bold text-white hover:bg-zinc-700 transition-colors border-b border-zinc-700/50">
                                Editar Rutina
                              </button>
                              <button onClick={(e) => deleteCustomRoutine(routine.id, e)} className="px-4 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-zinc-700 transition-colors">
                                Eliminar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                 })}
               </div>
             )}
          </div>
        )}

        {showBuilder && (
          <CustomRoutineBuilder 
            onClose={() => setShowBuilder(false)} 
            onSave={(newRoutine) => {
              const updated = [...customRoutines, newRoutine];
              setCustomRoutines(updated);
              localStorage.setItem('customRoutines', JSON.stringify(updated));
              setShowBuilder(false);
            }} 
          />
        )}
      </div>
    );
  }

  const isCustomRoutine = selectedRoutine.startsWith('CUSTOM_');
  const customRoutineDef = isCustomRoutine ? customRoutines.find(r => r.id === selectedRoutine) : null;
  const meta = isCustomRoutine ? { label: customRoutineDef?.name, emoji: customRoutineDef?.emoji } : ROUTINE_META[selectedRoutine as RoutineType];

  return (
    <div className="pb-32 min-h-screen">
      {/* ── EDGE GLOW OVERLAY ── */}
      <AnimatePresence>
        {showEdgeGlow && (
          <motion.div
            className="fixed inset-0 z-[200] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Glow top */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-28"
              style={{
                background: 'linear-gradient(to bottom, rgba(34,211,238,0.6) 0%, transparent 100%)',
                filter: 'blur(8px)',
                transformOrigin: 'top',
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            {/* Glow bottom */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-28"
              style={{
                background: 'linear-gradient(to top, rgba(34,211,238,0.6) 0%, transparent 100%)',
                filter: 'blur(8px)',
                transformOrigin: 'bottom',
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            {/* Glow left */}
            <motion.div
              className="absolute top-0 bottom-0 left-0 w-16"
              style={{
                background: 'linear-gradient(to right, rgba(34,211,238,0.5) 0%, transparent 100%)',
                filter: 'blur(6px)',
                transformOrigin: 'left',
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1.3, 1], opacity: [0, 1, 0.7] }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            />
            {/* Glow right */}
            <motion.div
              className="absolute top-0 bottom-0 right-0 w-16"
              style={{
                background: 'linear-gradient(to left, rgba(34,211,238,0.5) 0%, transparent 100%)',
                filter: 'blur(6px)',
                transformOrigin: 'right',
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1.3, 1], opacity: [0, 1, 0.7] }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            />
            {/* Corners — detalles de esquina */}
            {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
              <motion.div
                key={i}
                className={`absolute ${pos} w-20 h-20`}
                style={{
                  background: 'radial-gradient(circle at corner, rgba(34,211,238,0.8) 0%, transparent 70%)',
                  filter: 'blur(4px)',
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.6], scale: [0, 1.5, 1] }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.6, ease: 'backOut', delay: 0.1 + i * 0.03 }}
              />
            ))}
            {/* Pulso de fade-out suave */}
            <motion.div
              className="absolute inset-0"
              style={{
                boxShadow: 'inset 0 0 60px 20px rgba(34,211,238,0.25)',
              }}
              animate={{ opacity: [1, 0.6, 1, 0.4, 0] }}
              transition={{ duration: 2.0, delay: 0.4, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAnalysis && analysisData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}} className="glass-panel w-full max-w-md p-8 rounded-[32px] space-y-8 overflow-hidden relative premium-bisel">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 mb-2"><Trophy size={40} /></div>
                <h2 className="text-3xl font-display font-bold text-white tracking-tight">¡Sesión Finalizada!</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Resumen de Rendimiento</p>
                <div className="flex justify-center items-center gap-2 pt-2">
                  <Timer size={18} className="text-zinc-400" />
                  <span className="text-2xl font-display font-bold text-white">{formatTime(elapsedSeconds)}</span>
                </div>
              </div>
              <button onClick={() => setShowAnalysis(false)} className="w-full py-5 bg-white text-black font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98]">Cerrar Resumen</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WarmupModal
        isOpen={showWarmupModal}
        onClose={() => setShowWarmupModal(false)}
        routineId={selectedRoutine || ''}
        firstExerciseMaxWeight={firstExerciseMaxWeight}
        onComplete={handleWarmupComplete}
      />

      <div className={`relative bg-black/80 backdrop-blur-xl border-b border-white/5 pt-12 px-4 pb-4 transition-all duration-300`}>
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <button onClick={() => setSelectedRoutine(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-2 text-sm font-bold">
              <ArrowLeft size={16} /> Rutinas
            </button>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl leading-none">{meta.emoji}</span>
              <h1 className="text-2xl font-display font-bold text-white tracking-tight truncate">{meta.label}</h1>
            </div>
            <button onClick={() => setShowWarmupModal(true)} className={`mt-2 px-3 py-1.5 w-fit rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-1.5 ${warmupCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-brand-500/10 text-brand-400 border-brand-500/30 hover:bg-brand-500/20'}`}>
              <Activity size={14}/> {warmupCompleted ? 'Calentamiento Completado' : 'Guía de Calentamiento'}
            </button>
          </div>
          
          {sessionState === 'active' ? (
            <div className="shrink-0 flex items-center gap-4 bg-zinc-900/60 p-2 rounded-2xl border border-white/10">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tiempo</span>
                <span className="text-sm font-display font-bold text-brand-400 tabular-nums">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Series</span>
                <span className="text-sm font-display font-bold text-white tabular-nums">{setsCompletedCount}/{setsTotalCount}</span>
              </div>
            </div>
          ) : (
             <div className="shrink-0 bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400">{progressPercentage}%</span>
             </div>
          )}
        </div>
      </div>

      {/* EXERCISES AUTO-ACCORDION */}
      <div className="px-2 mt-4 space-y-3">
        {selectedRoutine === RoutineType.REST ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-40">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6"><Trophy size={32} className="text-zinc-600"/></div>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Día de Descanso</p>
          </div>
        ) : (
          exercises.map((exercise, exerciseIndex) => {
            const log = logs.find(l=>l.exerciseId===exercise.id) || { exerciseId: exercise.id, sets: [], completed: false };
            const isCompleted = log.completed;
            const isActive = activeExercise === exercise.id;
            
            const prevLog = getPreviousWorkoutLog(exercise.id, today);
            const currentSetIndex = isActive ? log.sets.findIndex(s=>!s.completed) : -1;
            const currentSet = currentSetIndex !== -1 ? log.sets[currentSetIndex] : null;

            // COMPLETED ROW
            if (isCompleted && !isActive) {
               return (
                  <div key={exercise.id} onClick={() => setActiveExercise(exercise.id)} className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 active:scale-[0.98] transition-all">
                     <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0"><Check size={16} className="text-emerald-500" strokeWidth={3}/></div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-400 line-through truncate">{exercise.name}</p>
                     </div>
                     <span className="text-[10px] text-emerald-500/50 font-bold uppercase tracking-widest">{log.sets.length} sets</span>
                  </div>
               );
            }

            // FOLDED UPCOMING ROW
            if (!isActive) {
               return (
                 <div key={exercise.id} onClick={() => setActiveExercise(exercise.id)} className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-brand-500/30 active:scale-[0.98] transition-all">
                    <div className="flex-1 min-w-0">
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Próximo</p>
                       <p className="text-base font-bold text-zinc-200 truncate">{exercise.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                       <p className="text-xs font-bold text-brand-400">{exercise.targetSets} Sets</p>
                       <p className="text-[10px] text-zinc-500 mt-0.5">{exercise.targetReps} reps</p>
                    </div>
                 </div>
               );
            }

            // FULLY EXPANDED CURRENT EXERCISE ROW
            return (
              <div key={exercise.id} className="glass-panel rounded-3xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-brand-500/30 premium-bisel transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-amber-500" />
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-4">
                    <p className="text-brand-400 font-bold text-[9px] uppercase tracking-[0.2em] mb-1 flex items-center gap-1"><PlaySquare size={10} fill="currentColor"/> Ejercicio Actual</p>
                    <h2 className="text-xl font-display font-bold text-white leading-tight tracking-tight">{exercise.name}</h2>
                    <button onClick={() => setShowTechFor(exercise.id)} className="text-brand-400 flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold mt-1.5 bg-brand-500/10 hover:bg-brand-500/20 px-2 py-1 rounded-md w-fit transition-all"><ImageIcon size={10}/> Ver Técnica</button>
                  </div>
                  <button onClick={e=>toggleExerciseComplete(exercise.id,e)} className="w-8 h-8 rounded-full border-2 border-zinc-700 hover:border-zinc-500 flex items-center justify-center shrink-0">
                     <Check size={14} className="text-zinc-500" />
                  </button>
                </div>

                <div className="space-y-2">
                  {log.sets.map((set, idx) => {
                     const isCurrentSet = idx === currentSetIndex;
                     const ps = prevLog?.sets[idx] ?? null;
                     const setType = set.setType || 'N';
                     
                     if (set.completed) {
                       return (
                         <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 mb-1.5">
                           <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-emerald-500/50 w-3">{idx+1}</span>
                             <span className="text-xs font-bold text-emerald-400 line-through">{set.weight}kg × {set.reps}{set.rir != null ? ` @ RPE ${10 - set.rir}` : ''}</span>
                           </div>
                           <button onClick={() => toggleSetComplete(exercise.id, idx)} className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest px-2 py-1 rounded bg-black/20 hover:text-white">Deshacer</button>
                         </div>
                       );
                     }

                     if (!isCurrentSet) {
                       return (
                         <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 opacity-60 mb-1.5">
                           <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-zinc-600 w-3">{idx+1}</span>
                             <span className="text-xs font-bold text-zinc-500">{ps ? `Objetivo: ${ps.weight}kg × ${ps.reps}` : 'Próxima serie'}</span>
                           </div>
                           <button onClick={() => removeSet(exercise.id, idx)} className="text-[9px] text-zinc-600 hover:text-red-400 uppercase font-bold tracking-widest px-2 py-1">Quitar</button>
                         </div>
                       );
                     }

                     return (
                       <div key={idx} className={`p-3 rounded-2xl border transition-all mb-1.5 bg-black/40 border-brand-500/50 shadow-lg`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-brand-400">Set {idx+1}</span>
                            <div className="flex gap-2">
                               <button onClick={() => cycleSetType(exercise.id, idx)} className={`w-8 h-5 rounded border text-[8px] font-bold flex items-center justify-center ${
                                  setType === 'W' ? 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50' :
                                  setType === 'N' ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' :
                                  setType === 'D' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                  'bg-red-500/20 text-red-400 border-red-500/30'
                               }`}>{setType}</button>
                               <button onClick={() => removeSet(exercise.id, idx)} className="text-[9px] text-zinc-500 uppercase tracking-widest hover:text-red-400">Quitar</button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            {/* PESO */}
                            <div className="bg-zinc-900/80 rounded-xl p-2 border border-white/5 relative">
                               <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest text-center mb-0.5">Peso (kg)</p>
                               <input type="number" inputMode="decimal" placeholder={ps?`${ps.weight}`:'0'} value={set.weight||''} onChange={e=>updateSet(exercise.id,idx,'weight',parseFloat(e.target.value))} onBlur={()=>saveWorkout()}
                                 className="w-full bg-transparent text-center font-display font-bold text-2xl focus:outline-none text-white"/>
                               {ps && <p className="text-[8px] text-center text-zinc-600 mt-0.5">ant: {ps.weight}</p>}
                            </div>
                            {/* REPS */}
                            <div className="bg-zinc-900/80 rounded-xl p-2 border border-white/5 relative">
                               <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest text-center mb-0.5">Reps</p>
                               <input type="number" inputMode="decimal" placeholder={ps?`${ps.reps}`:'0'} value={set.reps||''} onChange={e=>updateSet(exercise.id,idx,'reps',parseFloat(e.target.value))} onBlur={()=>saveWorkout()}
                                 className="w-full bg-transparent text-center font-display font-bold text-2xl focus:outline-none text-white"/>
                               {ps && <p className="text-[8px] text-center text-zinc-600 mt-0.5">ant: {ps.reps}</p>}
                            </div>
                          </div>

                          {/* RPE BUTTONS */}
                          <div className="mb-3">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-1 text-center">Esfuerzo (RPE)</p>
                            <div className="flex justify-between gap-1 overflow-x-auto no-scrollbar pb-1">
                               {[7.5, 8, 8.5, 9, 9.5, 10].map(rpe => {
                                  const rir = 10 - rpe;
                                  const isSelected = set.rir === rir;
                                  let colorClass = 'bg-zinc-800 text-zinc-400 border-white/5';
                                  if (isSelected) {
                                     if (rpe === 10) colorClass = 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
                                     else if (rpe >= 9) colorClass = 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
                                     else if (rpe >= 8) colorClass = 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
                                     else colorClass = 'bg-brand-500/20 text-brand-400 border-brand-500/50 shadow-[0_0_10px_rgba(217,119,6,0.3)]';
                                  }
                                  return (
                                     <button key={rpe} onClick={() => { updateSet(exercise.id, idx, 'rir', rir); saveWorkout(); }}
                                        className={`shrink-0 min-w-[2.75rem] py-1.5 rounded-lg border font-display font-bold text-xs transition-all active:scale-95 ${colorClass}`}>
                                        {rpe}
                                     </button>
                                  );
                               })}
                            </div>
                          </div>
                          
                          <button onClick={() => toggleSetComplete(exercise.id, idx)} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-900/40">
                            <Check size={16} strokeWidth={3}/> Completar
                          </button>
                       </div>
                     );
                  })}
                </div>
                
                <button onClick={() => addSet(exercise.id)} className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-zinc-800 text-zinc-500 hover:text-brand-400 transition-all flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                  <Plus size={12}/> Añadir Serie
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      {selectedRoutine !== RoutineType.REST && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-40 pb-safe pointer-events-none flex flex-col gap-3">
          
          <AnimatePresence>
            {restTimer !== null && (
              <motion.div className="pointer-events-auto" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
                <div className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-300 ${restTimer === 0 ? 'bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.7)] animate-pulse' : 'bg-zinc-900 border border-brand-500/30 shadow-[0_0_20px_rgba(217,119,6,0.15)]'}`}>
                   <div className="flex items-center gap-3">
                     <Timer size={24} className={restTimer === 0 ? 'text-white' : 'text-brand-400 animate-pulse'} />
                     <div>
                       <p className={`text-[10px] font-bold uppercase tracking-widest ${restTimer === 0 ? 'text-white/80' : 'text-brand-400'}`}>Descanso</p>
                       <p className="text-2xl font-display font-black text-white tabular-nums leading-none mt-0.5">{restTimer === 0 ? '¡TIEMPO!' : formatTime(restTimer)}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <button onClick={() => { setRestTimer(p=>(p??0)+30); navigator.serviceWorker?.controller?.postMessage({type:'ADD_REST_SECONDS',seconds:30}); }} className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center ${restTimer === 0 ? 'bg-white/20 text-white' : 'bg-black/40 text-white'}`}>+30</button>
                     <button onClick={() => { setRestTimer(null); dispatchLiveActivity({restTimer:null}); navigator.serviceWorker?.controller?.postMessage({type:'CANCEL_REST_TIMER'}); }} className={`px-4 h-10 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 ${restTimer === 0 ? 'bg-white text-red-600 shadow-white/20' : 'bg-brand-500 text-white shadow-brand-500/20'}`}>{restTimer === 0 ? 'Seguir' : 'Saltar'}</button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pointer-events-auto">
            {sessionState === 'idle' ? (
            <div className="flex gap-2">
              <button onClick={() => setShowWarmupModal(true)} className={`flex-1 py-5 rounded-[24px] ${warmupCompleted ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' : 'bg-brand-600/20 text-brand-500 border border-brand-500/30'} font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex flex-col justify-center items-center gap-1`}>
                <Activity size={18}/> {warmupCompleted ? 'OK' : 'Calentar'}
              </button>
              <button onClick={startWorkout} className="flex-[3] py-5 rounded-[24px] bg-brand-600 hover:bg-brand-500 text-white font-bold uppercase tracking-[0.2em] text-sm shadow-[0_10px_40px_rgba(217,119,6,0.4)] active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                 <PlaySquare size={18}/> Iniciar Sesión
              </button>
            </div>
          ) : sessionState === 'active' ? (
            <div className="flex gap-3">
               <button onClick={()=>setShowFinishConfirm(true)} className="flex-1 py-5 rounded-[24px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-[0.2em] text-sm shadow-[0_10px_40px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                 <Check size={18}/> Finalizar
               </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Finalizar Entrenamiento</h2>
            <p className="text-sm text-zinc-400 mb-6">¿Guardar y ver resumen?</p>
            <div className="flex gap-3">
              <button onClick={()=>setShowFinishConfirm(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm">Cancelar</button>
              <button onClick={()=>{setShowFinishConfirm(false);saveWorkoutWithLogs(logs,true);}} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm">Finalizar</button>
            </div>
          </div>
        </div>
      )}

      {/* TECH MODAL / EXERCISE DETAIL SHEET */}
      {showTechFor && techExerciseDb && (
        <ExerciseDetailSheet
          entry={techExerciseDb}
          exerciseLog={logs.find(l => l.exerciseId === showTechFor)}
          onClose={() => setShowTechFor(null)}
        />
      )}
    </div>
  );
};

export default Workout;
