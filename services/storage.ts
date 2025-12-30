import { DailyLog } from '../types';

const STORAGE_KEY = 'fitness_pro_logs_v1';

export const getLogs = (): Record<string, DailyLog> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Error reading logs", e);
    return {};
  }
};

export const saveLog = (log: DailyLog) => {
  const current = getLogs();
  const updated = { ...current, [log.date]: log };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  // Dispatch event for reactive updates across components if needed
  window.dispatchEvent(new Event('storage-update'));
};

export const getLogByDate = (date: string): DailyLog | undefined => {
  const logs = getLogs();
  return logs[date];
};

export const getPreviousWorkoutLog = (exerciseId: string, beforeDate: string): { weight: number, reps: number } | null => {
  const logs = getLogs();
  const sortedDates = Object.keys(logs).sort().reverse();
  
  for (const date of sortedDates) {
    if (date >= beforeDate) continue;
    
    const entry = logs[date];
    if (entry.exercises) {
      const exerciseLog = entry.exercises.find(e => e.exerciseId === exerciseId);
      if (exerciseLog && exerciseLog.sets.length > 0) {
        // Return best set (max weight, then max reps)
        const bestSet = [...exerciseLog.sets].sort((a, b) => (b.weight * b.reps) - (a.weight * a.reps))[0];
        return bestSet;
      }
    }
  }
  return null;
};