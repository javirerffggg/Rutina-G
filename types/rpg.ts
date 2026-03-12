/**
 * 🎮 RPG LEVELING SYSTEM - TYPE DEFINITIONS
 * Motor de Experiencia Elite - Definiciones de tipos estrictos
 * 
 * Este archivo define la estructura de datos completa del sistema RPG.
 * Ningún componente debe adivinar la forma de los datos.
 */

import { LucideIcon } from 'lucide-react';

/**
 * Tier o Liga del usuario según su nivel actual
 * Cada liga tiene su propia identidad visual y psicológica
 */
export type RPGTierName =
  | 'rust_sweat'      // Nv 1-24
  | 'forged_steel'    // Nv 25-49
  | 'spartan_bronze'  // Nv 50-99
  | 'gladiator_silver' // Nv 100-149
  | 'olympic_gold'    // Nv 150-199
  | 'titan_platinum'  // Nv 200-299
  | 'demigod_diamond' // Nv 300-399
  | 'legend_aura'     // Nv 400-499
  | 'olympus_god';    // Nv 500 (CAP)

/**
 * Definición completa de una Liga/Tier del sistema RPG
 * Incluye todos los datos visuales y semánticos necesarios
 */
export interface RPGTier {
  name: RPGTierName;
  displayName: string;
  feeling: string;
  minLevel: number;
  maxLevel: number;
  gradientClass: string;       // Tailwind gradient para la barra
  borderColorClass: string;    // Tailwind border color
  iconName: string;            // Nombre del icono de lucide-react
  glowClass?: string;          // Shadow/glow effect opcional
}

/**
 * Estado completo de las estadísticas RPG del usuario
 * Calculado de forma derivada desde logs, rachas y logros
 */
export interface RPGStats {
  level: number;                      // Nivel actual (1-500)
  currentTier: RPGTier;               // Liga/Tier actual
  totalExp: number;                   // EXP total acumulada histórica
  expInCurrentLevel: number;          // EXP ganada dentro del nivel actual
  expForCurrentLevel: number;         // EXP requerida para el nivel actual (suelo)
  expForNextLevel: number;            // EXP requerida para el siguiente nivel (techo)
  progressPercentage: number;         // Progreso en el nivel actual (0-100)
  streakMultiplier: number;           // Multiplicador por racha (1.0 - 1.5)
  bonusExpFromPRs: number;            // EXP bonus obtenida por PRs y fallos
  bonusExpFromAchievements: number;   // EXP bonus obtenida por logros
  isMaxLevel: boolean;                // Si alcanzó el nivel 500
}

/**
 * Datos mínimos para calcular las estadísticas RPG
 * El hook useRPGStats procesará esta información
 */
export interface RPGCalculationInput {
  totalVolume: number;          // Tonelaje total histórico en kg
  currentStreak: number;        // Días de racha actual
  prCount: number;              // Cantidad de PRs históricos
  achievementExpBonus: number;  // EXP total de logros desbloqueados
}
