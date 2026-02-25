import { DailyLog, WorkoutLogEntry } from '../types';

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

export const getPreviousWorkoutLog = (exerciseId: string, beforeDate: string): WorkoutLogEntry | null => {
  const logs = getLogs();
  const sortedDates = Object.keys(logs).sort().reverse();
  
  for (const date of sortedDates) {
    if (date >= beforeDate) continue;
    
    const entry = logs[date];
    if (entry.exercises) {
      const exerciseLog = entry.exercises.find(e => e.exerciseId === exerciseId);
      if (exerciseLog && exerciseLog.sets.length > 0) {
        return exerciseLog;
      }
    }
  }
  return null;
};

export const getExerciseHistory = (exerciseId: string, limit: number = 5): { date: string, log: WorkoutLogEntry }[] => {
  const logs = getLogs();
  const sortedDates = Object.keys(logs).sort().reverse();
  const history: { date: string, log: WorkoutLogEntry }[] = [];
  
  for (const date of sortedDates) {
    const entry = logs[date];
    if (entry.exercises) {
      const exerciseLog = entry.exercises.find(e => e.exerciseId === exerciseId);
      if (exerciseLog && exerciseLog.sets.length > 0) {
        history.push({ date, log: exerciseLog });
        if (history.length >= limit) break;
      }
    }
  }
  return history;
};