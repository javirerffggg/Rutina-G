export const XP_REWARDS = {
  // Entreno
  WORKOUT_COMPLETED: 50,          // Completar un entreno
  SET_COMPLETED: 2,               // Completar una serie
  PR_ACHIEVED: 100,               // Nuevo récord personal en cualquier ejercicio
  WORKOUT_STREAK_BONUS: 25,       // Bonus por racha (multiplicado por días de racha, máx ×7)
  // Consistencia
  WEEK_PERFECT: 150,              // Completar todos los entrenos planificados de la semana
  MONTH_PERFECT: 500,             // Completar todos los entrenos del mes
  // Biofeedback (Dashboard)
  BIOFEEDBACK_LOGGED: 5,          // Registrar energía/sueño/estrés del día
  WEIGHT_LOGGED: 5,               // Registrar peso corporal
  // Exploración
  NEW_EXERCISE_TRIED: 30,         // Primer registro de un ejercicio nuevo
  CATEGORY_COMPLETED: 75,         // Completar todos los ejercicios de una categoría muscular
} as const;

export const ACHIEVEMENT_XP = {
  BRONZE: 500,
  SILVER: 1500,
  GOLD: 5000,
  DIAMOND: 15000,
  ELITE: 50000
} as const;
