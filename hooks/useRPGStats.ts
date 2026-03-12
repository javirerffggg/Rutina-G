/**
 * 🎯 RPG LEVELING SYSTEM - REACT HOOK
 * Motor de Experiencia Elite - Hook de orquestación y memoización
 * 
 * Este hook encapsula toda la lógica de cálculo RPG y asegura que
 * solo se recalcule cuando las dependencias realmente cambien.
 */

import { useMemo } from 'react';
import { DailyLog } from '../types';
import { AchievementTier, ACHIEVEMENTS } from '../achievements';
import { RPGStats } from '../types/rpg';
import { calculateUserRPGStats } from '../utils/rpgEngine';
import { getUnlockedAchievements } from '../services/storage';

/**
 * Calcula la racha actual de días consecutivos con entreno completado
 * 
 * @param logs - Historial completo de entrenamientos
 * @returns Cantidad de días consecutivos (desde hoy hacia atrás)
 */
function calculateCurrentStreak(logs: Record<string, DailyLog>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  // Iterar hacia atrás desde hoy
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const log = logs[dateStr];
    
    // Si no hay log o no está completado, romper la racha
    if (!log || !log.workoutCompleted) break;
    
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
    
    // Límite de seguridad: no buscar más de 365 días atrás
    if (streak > 365) break;
  }
  
  return streak;
}

/**
 * Hook principal para calcular las estadísticas RPG del usuario
 * 
 * Este hook es altamente optimizado con useMemo para evitar recálculos
 * innecesarios del motor matemático costoso.
 * 
 * @param logs - Historial completo de entrenamientos
 * @returns Estadísticas RPG completas y actualizadas
 */
export function useRPGStats(logs: Record<string, DailyLog>): RPGStats {
  // Memoizar el cálculo de la racha actual
  const currentStreak = useMemo(() => {
    return calculateCurrentStreak(logs);
  }, [logs]);
  
  // Memoizar la obtención de logros desbloqueados
  const unlockedAchievementTiers = useMemo(() => {
    const unlockedIds = getUnlockedAchievements();
    const tiers: AchievementTier[] = [];
    
    for (const achievementId of unlockedIds) {
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (achievement) {
        tiers.push(achievement.tier);
      }
    }
    
    return tiers;
  }, [logs]); // Recalcular si los logs cambian (podrían desbloquearse nuevos logros)
  
  // Memoizar el cálculo completo de estadísticas RPG
  const rpgStats = useMemo(() => {
    return calculateUserRPGStats(
      logs,
      currentStreak,
      unlockedAchievementTiers
    );
  }, [logs, currentStreak, unlockedAchievementTiers]);
  
  return rpgStats;
}
