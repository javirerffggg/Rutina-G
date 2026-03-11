import { PHASES, SPECIAL_GYM_HOURS } from './constants';
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

export const getEstimated1RM = (weight: number, reps: number): number => {
  return calculateOneRM(weight, reps);
};

export const getWeeklyMuscleVolume = (logs: Record<string, any>, muscleMap: Record<string, string[]>) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 7);
  
  const volume: Record<string, number> = {};
  
  Object.keys(logs).forEach(date => {
    const logDate = new Date(date);
    if (logDate >= startOfWeek && logDate <= today) {
      const log = logs[date];
      if (log.exercises) {
        log.exercises.forEach((ex: any) => {
          const muscles = muscleMap[ex.exerciseId] || [];
          const completedSets = ex.sets.filter((s: any) => s.completed).length;
          muscles.forEach(m => {
            volume[m] = (volume[m] || 0) + completedSets;
          });
        });
      }
    }
  });
  
  return volume;
};

export const getGymSchedule = (dateStr: string = getTodayDateString()): string | null => {
  // Extract MM-DD from YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const key = `${parts[1]}-${parts[2]}`;
  
  return SPECIAL_GYM_HOURS[key] || null;
};

// --- Math Helpers for Weight Analysis ---

export const calculateMovingAverage = (data: number[], windowSize: number = 7): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const subset = data.slice(start, i + 1);
    const sum = subset.reduce((a, b) => a + b, 0);
    result.push(sum / subset.length);
  }
  return result;
};

export const calculateLinearRegression = (xValues: number[], yValues: number[]) => {
  const n = xValues.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.map((x, i) => x * yValues[i]).reduce((a, b) => a + b, 0);
  const sumXX = xValues.map(x => x * x).reduce((a, b) => a + b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

export const calculatePlates = (totalWeight: number, barWeight: number = 20): number[] => {
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
  let weightOnSide = (totalWeight - barWeight) / 2;
  const result: number[] = [];

  if (weightOnSide <= 0) return [];

  for (const plate of plates) {
    while (weightOnSide >= plate) {
      result.push(plate);
      weightOnSide -= plate;
    }
  }

  return result;
};