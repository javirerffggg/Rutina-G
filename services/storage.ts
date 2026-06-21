import { DailyLog, WorkoutLogEntry } from '../types';
import { ACHIEVEMENTS } from '../achievements';
import { ACHIEVEMENT_XP } from '../constants/xpRewards';
import { dispatchGlobalXP } from '../hooks/useProgression';
import {
  EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS,
  EXERCISES_UPPER, EXERCISES_LOWER
} from '../constants';
import { RoutineType } from '../types';

const STORAGE_KEY      = 'fitness_pro_logs_v1';
const ACHIEVEMENTS_KEY = 'fitness_pro_achievements_v1';
const WEEKLY_PLAN_KEY  = 'weeklyPlan';

export const getWeeklyPlan = (): Record<number, RoutineType> | null => {
  try {
    const data = localStorage.getItem(WEEKLY_PLAN_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveWeeklyPlan = (plan: Record<number, RoutineType>) => {
  localStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(plan));
};

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
        
        // Grant XP for achievement unlock
        const xpAmount = ACHIEVEMENT_XP[ach.tier] || 0;
        if (xpAmount > 0) {
          dispatchGlobalXP(xpAmount, `LOGRO_DESBLOQUEADO_${ach.id}`);
        }
      }
    } catch (e) {
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

export const deleteLog = (date: string): void => {
  const logs = getLogs();
  if (logs[date]) {
    delete logs[date];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new Event('storage-update'));
  }
};

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

// ---------------------------------------------------------------------------
// Clear ALL app data (logs + achievements + session state)
// ---------------------------------------------------------------------------
export const clearAllData = (): void => {
  // Remove primary stores
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACHIEVEMENTS_KEY);
  // Remove any per-day session state keys created by Workout.tsx
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('workoutSessionState_') || k.startsWith('workoutStartTime_') || k === 'gymMode')) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  window.dispatchEvent(new Event('storage-update'));
};

// ---------------------------------------------------------------------------
// Import from Hevy CSV export
//
// Hevy CSV columns (official export format, as of 2024):
//   Title, Start time, End time, Description, Exercise Name,
//   Set Order, Weight (kg), Reps, Distance, Seconds, Notes, Workout Notes, RPE
//
// We map Hevy exercise names to our internal exercise IDs by building a
// reverse lookup from our exercise lists.
// ---------------------------------------------------------------------------

export const ALL_EXERCISES = [
  ...EXERCISES_PUSH, ...EXERCISES_PULL, ...EXERCISES_LEGS,
  ...EXERCISES_UPPER, ...EXERCISES_LOWER,
];

/** Normalise a string for fuzzy matching: lowercase, remove accents & punctuation */
const normalise = (s: string) =>
  s.toLowerCase()
   .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-z0-9 ]/g, ' ')
   .replace(/\s+/g, ' ')
   .trim();

/** Try to find our internal exercise id that best matches a Hevy exercise name */
const matchExerciseId = (hevyName: string): string | null => {
  const target = normalise(hevyName);
  // 1. Exact normalised match
  for (const ex of ALL_EXERCISES) {
    if (normalise(ex.name) === target) return ex.id;
  }
  // 2. One contains the other
  for (const ex of ALL_EXERCISES) {
    const norm = normalise(ex.name);
    if (norm.includes(target) || target.includes(norm)) return ex.id;
  }
  // 3. Word-overlap score >= 0.5
  const targetWords = new Set(target.split(' ').filter(w => w.length > 2));
  let bestId: string | null = null;
  let bestScore = 0;
  for (const ex of ALL_EXERCISES) {
    const words = normalise(ex.name).split(' ').filter(w => w.length > 2);
    const matches = words.filter(w => targetWords.has(w)).length;
    const score = matches / Math.max(words.length, targetWords.size);
    if (score > bestScore) { bestScore = score; bestId = ex.id; }
  }
  return bestScore >= 0.5 ? bestId : null;
};

/**
 * Guess RoutineType from workout title.
 * Handles both English and Spanish Hevy export titles.
 */
const guessRoutineType = (title: string): RoutineType | undefined => {
  const t = normalise(title);
  // English & Spanish push/pull/legs/upper/lower
  if (t.includes('push') || t.includes('empuje'))              return RoutineType.PUSH;
  if (t.includes('pull') || t.includes('tirón') || t.includes('tiron') || t.includes('jale')) return RoutineType.PULL;
  if (t.includes('upper') || t.includes('superior'))           return RoutineType.UPPER;
  if (t.includes('lower') || t.includes('inferior'))           return RoutineType.LOWER;
  if (t.includes('leg') || t.includes('pierna') || t.includes('legs')) return RoutineType.LEGS;
  return undefined;
};

export interface HevyImportResult {
  imported: number;    // sessions successfully imported / merged
  skipped:  number;   // sets skipped (exercise not matched)
  warnings: string[]; // human-readable warnings
}

/**
 * Parse a Hevy CSV string to find all exercise names.
 * Returns an array of objects mapping Hevy exercise names to their suggested internal ID.
 */
export const analyzeHevyCSV = (csvText: string): Array<{ hevyName: string, suggestedId: string | null }> => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const iExercise = headers.findIndex(h => h.includes('exercise'));
  if (iExercise === -1) return [];

  const uniqueNames = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length > iExercise && row[iExercise]) {
      uniqueNames.add(row[iExercise]);
    }
  }

  const allExercises: Array<{ hevyName: string, suggestedId: string | null }> = [];
  uniqueNames.forEach(name => {
    allExercises.push({ hevyName: name, suggestedId: matchExerciseId(name) });
  });
  return allExercises;
};

/**
 * Parse a Hevy CSV string and merge the data into localStorage.
 * Existing days are merged (not overwritten) so local data is preserved.
 * @param userMapping Optional dictionary mapping Hevy names to internal IDs
 */
export const importFromHevyCSV = (csvText: string, userMapping?: Record<string, string>): HevyImportResult => {
  const result: HevyImportResult = { imported: 0, skipped: 0, warnings: [] };

  // ---- Parse CSV (handles quoted fields with commas) ----
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) {
    result.warnings.push('El archivo está vacío o no tiene filas de datos.');
    return result;
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));

  // Column index helpers
  const col = (name: string) => headers.indexOf(name);
  const iTitle       = col('title');
  const iStartTime   = headers.findIndex(h => h.startsWith('start'));
  const iExercise    = headers.findIndex(h => h.includes('exercise'));
  const iSetOrder    = headers.findIndex(h => h.includes('set_order') || h.includes('set_o'));
  const iWeight      = headers.findIndex(h => h.includes('weight'));
  const iReps        = headers.findIndex(h => h === 'reps');
  const iRPE         = headers.findIndex(h => h.includes('rpe'));

  if (iExercise === -1 || iWeight === -1 || iReps === -1) {
    result.warnings.push('No se encontraron columnas de ejercicio/peso/reps. ¿Es un CSV de Hevy?');
    return result;
  }

  // ---- Group rows by date ----
  const byDate = new Map<string, { title: string; rows: string[][] }>();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 3) continue;

    // Parse date from start time (ISO or "YYYY-MM-DD HH:MM:SS" or "DD/MM/YYYY ..."
    // Also handles Spanish locale: "19 jun 2026, 16:09"
    let dateStr = '';
    const rawTime = iStartTime !== -1 ? row[iStartTime] : '';
    const isoMatch = rawTime.match(/^(\d{4}-\d{2}-\d{2})/);
    const dmyMatch = rawTime.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    // Spanish locale: "19 jun 2026, 16:09" → parse manually
    const esMonths: Record<string, string> = {
      ene:'01', feb:'02', mar:'03', abr:'04', may:'05', jun:'06',
      jul:'07', ago:'08', sep:'09', oct:'10', nov:'11', dic:'12'
    };
    const esMatch = rawTime.match(/^(\d{1,2})\s+([a-záéíóú]+)\s+(\d{4})/i);
    if (isoMatch)      dateStr = isoMatch[1];
    else if (dmyMatch) dateStr = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    else if (esMatch) {
      const day = esMatch[1].padStart(2, '0');
      const month = esMonths[esMatch[2].toLowerCase().slice(0, 3)] ?? '01';
      const year = esMatch[3];
      dateStr = `${year}-${month}-${day}`;
    } else {
      dateStr = new Date().toISOString().slice(0, 10);
    }

    const title = iTitle !== -1 ? row[iTitle] : '';
    if (!byDate.has(dateStr)) byDate.set(dateStr, { title, rows: [] });
    byDate.get(dateStr)!.rows.push(row);
  }

  const existing = getLogs();

  // ---- Build DailyLog per date ----
  byDate.forEach(({ title, rows }, date) => {
    // Group sets by exercise name
    const exerciseSets = new Map<string, { weight: number; reps: number; rir?: number }[]>();
    rows.forEach(row => {
      const exName = iExercise !== -1 ? row[iExercise] : '';
      const weight = parseFloat(row[iWeight] ?? '0') || 0;
      const reps   = parseInt(row[iReps]    ?? '0', 10) || 0;
      const rpe    = iRPE !== -1 ? parseFloat(row[iRPE] ?? '') : NaN;
      // Convert RPE to RIR (RIR = 10 - RPE)
      const rir    = !isNaN(rpe) && rpe > 0 ? Math.round(10 - rpe) : undefined;
      if (!exerciseSets.has(exName)) exerciseSets.set(exName, []);
      exerciseSets.get(exName)!.push({ weight, reps, ...(rir !== undefined ? { rir } : {}) });
    });

    const exerciseLogs: WorkoutLogEntry[] = [];
    let daySkipped = 0;

    exerciseSets.forEach((sets, hevyName) => {
      const id = userMapping?.[hevyName] || matchExerciseId(hevyName);
      if (!id) {
        result.skipped += sets.length;
        daySkipped++;
        result.warnings.push(`No mapeado: "${hevyName}" (${sets.length} series omitidas)`);
        return;
      }
      exerciseLogs.push({
        exerciseId: id,
        sets: sets.map(s => ({ ...s, completed: true })),
        completed: true,
      });
    });

    const routineType = guessRoutineType(title);
    const mergedLog: DailyLog = {
      ...(existing[date] ?? {}),
      date,
      workoutCompleted: true,
      ...(routineType ? { workoutType: routineType } : {}),
      exercises: exerciseLogs,
    };

    saveLog(mergedLog);
    result.imported++;
    if (daySkipped > 0) result.warnings.push(`${date}: ${daySkipped} ejercicio(s) sin mapear.`);
  });

  return result;
};
