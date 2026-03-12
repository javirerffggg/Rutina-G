/**
 * 🛡️ RPG LEVELING SYSTEM - TIER DEFINITIONS
 * Motor de Experiencia Elite - Definición de las 9 Ligas
 * 
 * Cada liga representa un salto de prestigio visual y psicológico.
 * Los colores, iconos y efectos están calibrados para maximizar
 * la sensación de progresión épica.
 */

import { RPGTier, RPGTierName } from '../types/rpg';

/**
 * Diccionario inmutable de las 9 Ligas del sistema RPG
 * Ordenadas cronológicamente por rango de nivel
 */
export const RPG_TIERS: Record<RPGTierName, RPGTier> = {
  rust_sweat: {
    name: 'rust_sweat',
    displayName: 'Óxido y Sudor',
    feeling: 'Áspero, industrial, inicial',
    minLevel: 1,
    maxLevel: 24,
    gradientClass: 'from-zinc-600 to-zinc-400',
    borderColorClass: 'border-zinc-500/50',
    iconName: 'Dumbbell',
  },

  forged_steel: {
    name: 'forged_steel',
    displayName: 'Acero Forjado',
    feeling: 'Pulido, sólido, confiable',
    minLevel: 25,
    maxLevel: 49,
    gradientClass: 'from-slate-400 to-slate-200',
    borderColorClass: 'border-slate-300/60',
    iconName: 'Hammer',
  },

  spartan_bronze: {
    name: 'spartan_bronze',
    displayName: 'Bronce Espartano',
    feeling: 'Guerrero, antiguo, rudo',
    minLevel: 50,
    maxLevel: 99,
    gradientClass: 'from-orange-700 to-amber-600',
    borderColorClass: 'border-amber-600/50',
    iconName: 'Shield',
  },

  gladiator_silver: {
    name: 'gladiator_silver',
    displayName: 'Plata de Gladiador',
    feeling: 'Brillante, afilado, combativo',
    minLevel: 100,
    maxLevel: 149,
    gradientClass: 'from-gray-300 to-slate-100',
    borderColorClass: 'border-gray-200/50',
    iconName: 'Swords',
  },

  olympic_gold: {
    name: 'olympic_gold',
    displayName: 'Oro Olímpico',
    feeling: 'Triunfal, prestigioso, luminoso',
    minLevel: 150,
    maxLevel: 199,
    gradientClass: 'from-yellow-500 to-yellow-300',
    borderColorClass: 'border-yellow-400/60',
    iconName: 'Medal',
  },

  titan_platinum: {
    name: 'titan_platinum',
    displayName: 'Platino de Titán',
    feeling: 'Frío, majestuoso, inquebrantable',
    minLevel: 200,
    maxLevel: 299,
    gradientClass: 'from-cyan-500 to-blue-400',
    borderColorClass: 'border-cyan-400/60',
    iconName: 'Mountain',
  },

  demigod_diamond: {
    name: 'demigod_diamond',
    displayName: 'Diamante Semidiós',
    feeling: 'Etéreo, valioso, raro',
    minLevel: 300,
    maxLevel: 399,
    gradientClass: 'from-violet-500 to-fuchsia-400',
    borderColorClass: 'border-fuchsia-400/60',
    iconName: 'Gem',
  },

  legend_aura: {
    name: 'legend_aura',
    displayName: 'Aura de Leyenda',
    feeling: 'Ardiente, mítico, inestable',
    minLevel: 400,
    maxLevel: 499,
    gradientClass: 'from-rose-500 via-orange-500 to-amber-400',
    borderColorClass: 'border-rose-500/60',
    iconName: 'Flame',
    glowClass: 'shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse',
  },

  olympus_god: {
    name: 'olympus_god',
    displayName: 'Dios del Olimpo',
    feeling: 'Galáctico, final, omnipotente',
    minLevel: 500,
    maxLevel: 500,
    gradientClass: 'from-indigo-500 via-purple-500 to-emerald-400',
    borderColorClass: 'border-emerald-400/70',
    iconName: 'Crown',
    glowClass: 'shadow-[0_0_30px_rgba(16,185,129,0.6)] animate-pulse',
  },
};

/**
 * Array ordenado de tiers para búsquedas secuenciales
 */
export const RPG_TIERS_ARRAY: RPGTier[] = Object.values(RPG_TIERS);

/**
 * Obtiene el tier correspondiente a un nivel específico
 * @param level - Nivel del usuario (1-500)
 * @returns El tier correspondiente
 */
export function getTierForLevel(level: number): RPGTier {
  // Nivel 500 es caso especial (cap)
  if (level >= 500) return RPG_TIERS.olympus_god;

  // Búsqueda secuencial en array ordenado
  for (const tier of RPG_TIERS_ARRAY) {
    if (level >= tier.minLevel && level <= tier.maxLevel) {
      return tier;
    }
  }

  // Fallback: nivel fuera de rango, retornar primer tier
  return RPG_TIERS.rust_sweat;
}
