import { EXERCISE_MUSCLE_MAP, EXERCISES_PUSH, EXERCISES_PULL, EXERCISES_LEGS, EXERCISES_UPPER, EXERCISES_LOWER } from "../constants";
import { DailyLog } from "../types";

export function computeAIStats(logsObj: Record<string, DailyLog>) {
  const sortedDates = Object.keys(logsObj).sort();
  const workoutLogs = sortedDates.map(d => logsObj[d]).filter(l => l.exercises && l.exercises.length > 0);

  // 1. Recuento de series y volumen por grupo muscular
  const muscleSets: Record<string, number> = {};
  const muscleVolume: Record<string, number> = {};
  
  workoutLogs.forEach(log => {
    log.exercises?.forEach(ex => {
      const muscles = EXERCISE_MUSCLE_MAP[ex.exerciseId] || [];
      const exVol = ex.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
      muscles.forEach(m => {
        muscleSets[m] = (muscleSets[m] || 0) + ex.sets.length;
        muscleVolume[m] = (muscleVolume[m] || 0) + exVol;
      });
    });
  });

  // 2. Lista de ejercicios mas frecuentes (Top 10)
  const allExercises = [...EXERCISES_PUSH, ...EXERCISES_PULL, ...EXERCISES_LEGS, ...EXERCISES_UPPER, ...EXERCISES_LOWER];
  const counts: Record<string, number> = {};
  workoutLogs.forEach(log => {
    log.exercises?.forEach(ex => {
      counts[ex.exerciseId] = (counts[ex.exerciseId] || 0) + ex.sets.length;
    });
  });
  
  const topExercises = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, sets]) => ({
      name: allExercises.find(e => e.id === id)?.name ?? id,
      totalSets: sets
    }));

  // 3. Informe Mensual (Ultimos 30 dias vs 30 dias anteriores)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthLogs = workoutLogs.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const prevMonthLogs = workoutLogs.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
  });

  const getVolume = (arr: DailyLog[]) => arr.reduce((acc, log) =>
    acc + (log.exercises?.reduce((ea, ex) =>
      ea + ex.sets.reduce((sa, s) => sa + s.weight * s.reps, 0), 0) || 0), 0);

  const getSets = (arr: DailyLog[]) => arr.reduce((acc, log) =>
    acc + (log.exercises?.reduce((ea, ex) => ea + ex.sets.length, 0) || 0), 0);

  const monthlyReport = {
    currentMonth: {
      volumeKg: getVolume(currentMonthLogs),
      totalSets: getSets(currentMonthLogs),
      workouts: currentMonthLogs.length
    },
    previousMonth: {
      volumeKg: getVolume(prevMonthLogs),
      totalSets: getSets(prevMonthLogs),
      workouts: prevMonthLogs.length
    }
  };

  return {
    muscleSets,
    muscleVolume,
    topExercises,
    monthlyReport
  };
}
