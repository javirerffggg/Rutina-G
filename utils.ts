import { PHASES, SPECIAL_GYM_HOURS } from './constants';
import { PhaseType, PlanPhase } from './types';

export const getTodayDateString = (): string =>
  new Date().toISOString().split('T')[0];

export const getCurrentPhase = (dateStr: string = getTodayDateString()): PlanPhase => {
  const current = PHASES.find(p => dateStr >= p.startDate && dateStr <= p.endDate);
  if (current) return current;
  // Fallback: return the last phase if we're past all phases, or the first if before all
  if (PHASES.length > 0) {
    if (dateStr > PHASES[PHASES.length - 1].endDate) return PHASES[PHASES.length - 1];
    if (dateStr < PHASES[0].startDate) return PHASES[0];
  }
  return {
    name: PhaseType.UNKNOWN,
    startDate: '',
    endDate: '',
    description: 'No hay fase activa definida para esta fecha.',
    nutritionGoal: 'Mantenimiento',
    cardio: 'Opcional',
    trainingFocus: 'General',
  };
};

export const calculateOneRM = (weight: number, reps: number): number => {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  if (reps >= 37) return Math.round(weight * 0.5); // Brzycki breaks down above 36 reps
  return Math.round(weight * (36 / (37 - reps)));
};

export const getEstimated1RM = calculateOneRM;

export const getWeeklyMuscleVolume = (
  logs: Record<string, any>,
  muscleMap: Record<string, string[]>
) => {
  // Use ISO date strings for comparison — avoids timezone shifts
  const todayStr = getTodayDateString();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const volume: Record<string, number> = {};

  Object.keys(logs).forEach(date => {
    if (date < sevenDaysAgoStr || date > todayStr) return;
    const log = logs[date];
    if (!log.exercises) return;
    log.exercises.forEach((ex: any) => {
      const muscles = muscleMap[ex.exerciseId] || [];
      const completedSets = ex.sets.filter((s: any) => s.completed !== false).length;
      muscles.forEach(m => {
        volume[m] = (volume[m] || 0) + completedSets;
      });
    });
  });

  return volume;
};

export const getGymSchedule = (dateStr: string = getTodayDateString()): string | null => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const key = `${parts[1]}-${parts[2]}`;
  return SPECIAL_GYM_HOURS[key] || null;
};

export const calculateMovingAverage = (data: number[], windowSize = 7): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start  = Math.max(0, i - windowSize + 1);
    const subset = data.slice(start, i + 1);
    result.push(subset.reduce((a, b) => a + b, 0) / subset.length);
  }
  return result;
};

export const calculateLinearRegression = (xValues: number[], yValues: number[]) => {
  const n = xValues.length;
  if (n < 2) return { slope: 0, intercept: n === 1 ? yValues[0] : 0 };
  const sumX  = xValues.reduce((a, b) => a + b, 0);
  const sumY  = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
  const sumXX = xValues.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

export const calculatePlates = (totalWeight: number, barWeight = 20): number[] => {
  const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
  // Round to nearest 0.01 to avoid float precision drift (e.g. 0.2500000001)
  let weightOnSide = Math.round(((totalWeight - barWeight) / 2) * 100) / 100;
  if (weightOnSide <= 0) return [];
  const result: number[] = [];
  for (const plate of PLATES) {
    while (weightOnSide >= plate - 0.001) {
      result.push(plate);
      weightOnSide = Math.round((weightOnSide - plate) * 100) / 100;
    }
  }
  return result;
};
