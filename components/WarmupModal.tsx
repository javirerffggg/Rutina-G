import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Timer, Activity, Zap, PlaySquare } from 'lucide-react';
import { WARMUP_GUIDE } from '../constants';
import { WarmupStep, WorkoutSet, RoutineType } from '../types';

interface WarmupModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineId: string;
  firstExerciseMaxWeight: number; // 0 if none
  onComplete: (warmupSets: WorkoutSet[]) => void;
}

export const WarmupModal: React.FC<WarmupModalProps> = ({ isOpen, onClose, routineId, firstExerciseMaxWeight, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const guide = WARMUP_GUIDE[routineId as RoutineType] || [];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setIsTimerRunning(false);
      setTimerSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerSeconds]);

  if (!isOpen) return null;

  if (guide.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="glass-panel w-full max-w-md p-6 rounded-[32px] space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Sin calentamiento</h2>
            <p className="text-sm text-zinc-400 mb-6">No hay una guía específica para esta rutina.</p>
            <button onClick={() => { onComplete([]); onClose(); }} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold">Continuar</button>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = guide[currentStepIndex];
  const isLastStep = currentStepIndex === guide.length - 1;

  const startStepTimer = (duration: number) => {
    setTimerSeconds(duration);
    setIsTimerRunning(true);
  };

  const handleNext = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    if (isLastStep) {
      // Generate the warmup sets to inject
      const warmupSets: WorkoutSet[] = [];
      guide.filter(s => s.phase === 'aproximacion').forEach(s => {
        const weight = s.weightPercent ? Math.round((firstExerciseMaxWeight * s.weightPercent) / 2.5) * 2.5 : 0;
        for (let i=0; i<(s.sets||1); i++) {
          warmupSets.push({ weight, reps: s.reps || 10, setType: 'W', completed: false });
        }
      });
      onComplete(warmupSets);
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderIcon = (phase: string) => {
    switch (phase) {
      case 'temperatura': return <Activity className="text-orange-500" />;
      case 'movilidad': return <Timer className="text-blue-500" />;
      case 'activacion': return <Zap className="text-yellow-500" />;
      case 'aproximacion': return <PlaySquare className="text-brand-500" />;
      default: return <Activity className="text-white" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm pb-safe">
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} 
        className="glass-panel w-full max-w-md bg-zinc-900 border-white/10 rounded-[32px] overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-display font-black text-white">Calentamiento</h2>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Paso {currentStepIndex + 1} de {guide.length}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              {renderIcon(currentStep.phase)}
            </div>
            <div>
              <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">{currentStep.phase}</p>
              <h3 className="text-xl font-display font-bold text-white leading-tight">{currentStep.name}</h3>
            </div>
          </div>

          <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/5">
            {currentStep.notes && (
              <p className="text-sm text-zinc-400">{currentStep.notes}</p>
            )}
            
            {currentStep.reps && (
              <div className="flex justify-between items-center text-lg font-bold text-white">
                <span className="text-zinc-500">Repeticiones</span>
                <span>{currentStep.sets ? `${currentStep.sets}x` : ''}{currentStep.reps}</span>
              </div>
            )}
            
            {currentStep.duration && (
              <div className="flex flex-col items-center gap-3 mt-4">
                <div className="text-5xl font-display font-black text-brand-400 tabular-nums">
                  {formatTime(timerSeconds > 0 ? timerSeconds : currentStep.duration)}
                </div>
                {!isTimerRunning && timerSeconds === 0 ? (
                  <button onClick={() => startStepTimer(currentStep.duration!)} className="px-6 py-2 rounded-full bg-white/10 text-white font-bold text-sm">Iniciar Timer</button>
                ) : (
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="px-6 py-2 rounded-full bg-brand-500/20 text-brand-400 font-bold text-sm">
                    {isTimerRunning ? 'Pausar' : 'Reanudar'}
                  </button>
                )}
              </div>
            )}

            {currentStep.phase === 'aproximacion' && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center text-sm font-bold text-white">
                  <span className="text-zinc-500">Peso Objetivo</span>
                  <span className="text-emerald-400">
                    {currentStep.weightPercent ? `${Math.round((firstExerciseMaxWeight * currentStep.weightPercent) / 2.5) * 2.5} kg` : 'Máquina vacía'}
                  </span>
                </div>
                {currentStep.weightPercent && (
                  <p className="text-[10px] text-zinc-500 text-right">{currentStep.weightPercent * 100}% de {firstExerciseMaxWeight} kg</p>
                )}
                {currentStep.tempo && (
                  <div className="flex justify-between items-center text-sm font-bold text-white mt-2">
                    <span className="text-zinc-500">Tempo</span>
                    <span>{currentStep.tempo}</span>
                  </div>
                )}
                {currentStep.rest && (
                  <div className="flex justify-between items-center text-sm font-bold text-white mt-2">
                    <span className="text-zinc-500">Descanso post-serie</span>
                    <span>{currentStep.rest}s</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button onClick={handleNext} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all">
            {isLastStep ? <><Check size={18} strokeWidth={3}/> Finalizar Calentamiento</> : 'Siguiente Paso'}
          </button>
        </div>

      </motion.div>
    </div>
  );
};
