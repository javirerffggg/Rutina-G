import { PHASES } from './constants';
import { PhaseType, PlanPhase } from './types';

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getCurrentPhase = (dateStr: string = getTodayDateString()): PlanPhase => {
  const current = PHASES.find(p => dateStr >= p.startDate && dateStr <= p.endDate);
  if (current) return current;
  return {
    name: PhaseType.UNKNOWN,
    startDate: '',
    endDate: '',
    description: "No hay fase activa definida para esta fecha.",
    nutritionGoal: "Mantenimiento",
    cardio: "Opcional",
    trainingFocus: "General"
  };
};

export const calculateOneRM = (weight: number, reps: number): number => {
  if (reps === 0) return 0;
  if (reps === 1) return weight;
  // Brzycki Formula
  return Math.round(weight * (36 / (37 - reps)));
};