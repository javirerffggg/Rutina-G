import { DailyLog, WorkoutLogEntry } from '../types';
import { ACHIEVEMENTS } from '../achievements';

const STORAGE_KEY      = 'fitness_pro_logs_v1';
const ACHIEVEMENTS_KEY = 'fitness_pro_achievements_v1';

export const getLogs = (): Record<string, DailyLog> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('getLogs: corrupted data, returning empty', e);
    return {};
  }
};

export const getUnlockedAchievements = (): Record<string, string> => {
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

export const saveLog = (log: DailyLog) => {
  // Single read — reuse 'updated' for both save and achievement check
  const current = getLogs();
  const updated = { ...current, [log.date]: log };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage-update'));

  const unlocked = getUnlockedAchievements();
  const newlyUnlocked: string[] = [];

  ACHIEVEMENTS.forEach(ach => {
    if (unlocked[ach.id]) return;
    try {
      if (ach.condition(updated, log.date)) {
        unlocked[ach.id] = new Date().toISOString();
        newlyUnlocked.push(ach.id);
      }
    } catch (e) {
      // Silently skip broken achievement conditions
      console.warn(`Achievement condition error [${ach.id}]:`, e);
    }
  });

  if (newlyUnlocked.length > 0) {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
    window.dispatchEvent(new CustomEvent('achievements-unlocked', { detail: newlyUnlocked }));
  }
};

export const getLogByDate = (date: string): DailyLog | undefined =>
  getLogs()[date];

export const getPreviousWorkoutLog = (exerciseId: string, beforeDate: string): WorkoutLogEntry | null => {
  const logs = getLogs();
  const sortedDates = Object.keys(logs).sort().reverse();
  for (const date of sortedDates) {
    if (date >= beforeDate) continue;
    const entry = logs[date];
    if (!entry?.exercises) continue;
    const exerciseLog = entry.exercises.find(e => e.exerciseId === exerciseId);
    if (exerciseLog && exerciseLog.sets.length > 0) return exerciseLog;
  }
  return null;
};

export const getExerciseHistory = (exerciseId: string, limit = 5): { date: string; log: WorkoutLogEntry }[] => {
  const logs = getLogs();
  const sortedDates = Object.keys(logs).sort().reverse();
  const history: { date: string; log: WorkoutLogEntry }[] = [];
  for (const date of sortedDates) {
    const entry = logs[date];
    if (!entry?.exercises) continue;
    const exerciseLog = entry.exercises.find(e => e.exerciseId === exerciseId);
    if (exerciseLog && exerciseLog.sets.length > 0) {
      history.push({ date, log: exerciseLog });
      if (history.length >= limit) break;
    }
  }
  return history;
};
