/**
 * ⚙️ RPG LEVELING SYSTEM - CORE ENGINE
 * Motor de Experiencia Elite - Lógica matemática y algorítmica pura
 * 
 * Este archivo contiene la lógica de cálculo completamente agnóstica de React y UI.
 * Todas las funciones son puras, sin efectos secundarios, y altamente testeables.
 */

import { DailyLog } from '../types';
import { AchievementTier } from '../achievements';
import { RPGStats, RPGCalculationInput } from '../types/rpg';
import { getTierForLevel } from '../constants/rpgTiers';

/**
 * Valores de EXP otorgados por cada tier de logro
 */
const ACHIEVEMENT_EXP_VALUES: Record<AchievementTier, number> = {
  BRONZE: 500,
  SILVER: 1500,
  GOLD: 5000,
  DIAMOND: 15000,
  ELITE: 50000,
};

/**
 * Constantes del sistema de experiencia
 */
const EXP_PER_TONNE = 10;              // 1 tonelada = 10 EXP
const STREAK_MULTIPLIER_PER_DAY = 0.02; // +2% por día de racha
const MAX_STREAK_MULTIPLIER = 0.5;      // Cap de +50% (25 días)
const PR_BONUS_EXP = 25;                // +25 EXP por PR o fallo muscular

/**
 * Curva de nivel exponencial
 * Fórmula: Total_EXP_Required = floor(100 * (L - 1)^1.85)
 * 
 * @param level - Nivel objetivo (1-500)
 * @returns EXP total acumulada requerida para alcanzar ese nivel
 */
export function getExpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > 500) return getExpRequiredForLevel(500);
  
  return Math.floor(100 * Math.pow(level - 1, 1.85));
}

/**
 * Calcula el nivel actual basado en la EXP total acumulada
 * Usa búsqueda binaria optimizada para O(log n) en lugar de O(n)
 * 
 * @param totalExp - EXP total acumulada
 * @returns Nivel actual del usuario (1-500)
 */
export function getLevelFromExp(totalExp: number): number {
  if (totalExp <= 0) return 1;
  
  // Caso especial: si supera el nivel 500, está en el cap
  if (totalExp >= getExpRequiredForLevel(500)) return 500;
  
  // Búsqueda binaria para encontrar el nivel
  let left = 1;
  let right = 500;
  let level = 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const expForMid = getExpRequiredForLevel(mid);
    const expForNext = getExpRequiredForLevel(mid + 1);
    
    if (totalExp >= expForMid && totalExp < expForNext) {
      level = mid;
      break;
    } else if (totalExp >= expForNext) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return level;
}

/**
 * Calcula el multiplicador por racha de días consecutivos
 * +2% por día, con cap de +50% a los 25 días
 * 
 * @param currentStreak - Días de racha actual
 * @returns Multiplicador (1.0 - 1.5)
 */
export function getStreakMultiplier(currentStreak: number): number {
  if (currentStreak <= 0) return 1.0;
  
  const bonus = currentStreak * STREAK_MULTIPLIER_PER_DAY;
  const cappedBonus = Math.min(bonus, MAX_STREAK_MULTIPLIER);
  
  return 1.0 + cappedBonus;
}

/**
 * Calcula la EXP bonus total obtenida por logros desbloqueados
 * 
 * @param unlockedAchievements - Array de tiers de logros desbloqueados
 * @returns EXP total de bonificación
 */
export function calculateAchievementBonus(
  unlockedAchievements: AchievementTier[]
): number {
  return unlockedAchievements.reduce((total, tier) => {
    return total + (ACHIEVEMENT_EXP_VALUES[tier] ?? 0);
  }, 0);
}

/**
 * Escanea todos los logs históricos y cuenta PRs y sets con RIR 0
 * 
 * @param logs - Registro completo de entrenamientos
 * @returns Cantidad de sets que califican para bonus (+25 EXP c/u)
 */
export function countPRsAndFailures(logs: Record<string, DailyLog>): number {
  let count = 0;
  const prsByExercise: Record<string, number> = {};
  
  // Ordenar logs por fecha para detectar PRs correctamente
  const sortedDates = Object.keys(logs).sort();
  
  for (const date of sortedDates) {
    const log = logs[date];
    if (!log.exercises) continue;
    
    for (const exercise of log.exercises) {
      const { exerciseId, sets } = exercise;
      
      for (const set of sets) {
        // Bonus por fallo muscular (RIR 0)
        if (set.rir === 0) {
          count++;
        }
        
        // Bonus por PR (nuevo récord histórico de peso)
        const previousPR = prsByExercise[exerciseId] ?? 0;
        if (set.weight > previousPR) {
          count++;
          prsByExercise[exerciseId] = set.weight;
        }
      }
    }
  }
  
  return count;
}

/**
 * Calcula el tonelaje total histórico movido (en kg)
 * 
 * @param logs - Registro completo de entrenamientos
 * @returns Tonelaje total en kg
 */
export function calculateTotalVolume(logs: Record<string, DailyLog>): number {
  let totalVolume = 0;
  
  for (const log of Object.values(logs)) {
    if (!log.exercises) continue;
    
    for (const exercise of log.exercises) {
      for (const set of exercise.sets) {
        totalVolume += (set.weight ?? 0) * (set.reps ?? 0);
      }
    }
  }
  
  return totalVolume;
}

/**
 * 🎮 FUNCIÓN PRINCIPAL DEL MOTOR
 * Calcula todas las estadísticas RPG del usuario de forma derivada
 * 
 * Esta función es el corazón del sistema. Toma los datos crudos del historial
 * y calcula el estado completo del RPG sin necesidad de persistencia.
 * 
 * @param logs - Historial completo de entrenamientos
 * @param currentStreak - Días de racha actual
 * @param unlockedAchievements - Tiers de logros desbloqueados
 * @returns Objeto completo con todas las estadísticas RPG
 */
export function calculateUserRPGStats(
  logs: Record<string, DailyLog>,
  currentStreak: number,
  unlockedAchievements: AchievementTier[]
): RPGStats {
  // 1. Calcular tonelaje total histórico
  const totalVolume = calculateTotalVolume(logs);
  const totalTonnes = totalVolume / 1000; // kg -> toneladas
  
  // 2. EXP base por tonelaje
  const baseExp = Math.floor(totalTonnes * EXP_PER_TONNE);
  
  // 3. Multiplicador por racha (solo afecta a tonelaje, no a logros)
  const streakMultiplier = getStreakMultiplier(currentStreak);
  const expFromTonnage = Math.floor(baseExp * streakMultiplier);
  
  // 4. Bonus por PRs y fallos musculares
  const prCount = countPRsAndFailures(logs);
  const bonusExpFromPRs = prCount * PR_BONUS_EXP;
  
  // 5. Bonus por logros desbloqueados
  const bonusExpFromAchievements = calculateAchievementBonus(unlockedAchievements);
  
  // 6. EXP TOTAL acumulada
  const totalExp = expFromTonnage + bonusExpFromPRs + bonusExpFromAchievements;
  
  // 7. Determinar nivel actual
  const level = getLevelFromExp(totalExp);
  const isMaxLevel = level >= 500;
  
  // 8. Calcular progreso dentro del nivel actual
  const expForCurrentLevel = getExpRequiredForLevel(level);
  const expForNextLevel = isMaxLevel ? expForCurrentLevel : getExpRequiredForLevel(level + 1);
  const expInCurrentLevel = totalExp - expForCurrentLevel;
  const expNeededForNextLevel = expForNextLevel - expForCurrentLevel;
  
  // Calcular porcentaje de progreso (evitar división por cero)
  const progressPercentage = expNeededForNextLevel > 0
    ? Math.min(100, (expInCurrentLevel / expNeededForNextLevel) * 100)
    : 100;
  
  // 9. Obtener tier/liga actual
  const currentTier = getTierForLevel(level);
  
  // 10. Retornar objeto completo de estadísticas
  return {
    level,
    currentTier,
    totalExp,
    expInCurrentLevel,
    expForCurrentLevel,
    expForNextLevel,
    progressPercentage,
    streakMultiplier,
    bonusExpFromPRs,
    bonusExpFromAchievements,
    isMaxLevel,
  };
}
