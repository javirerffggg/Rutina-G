import { Prestige, RankInfo } from '../types/progression';

const PRESTIGES: Prestige[] = ['Bronze', 'Silver', 'Gold', 'Black'];
const RANKS_PER_PRESTIGE = 78;
const MAX_GLOBAL_LEVEL = (PRESTIGES.length * RANKS_PER_PRESTIGE) - 1; // 311

const PRESTIGE_LABELS: Record<Prestige, string> = {
  Bronze: 'Bronce',
  Silver: 'Plata',
  Gold: 'Oro',
  Black: 'Negro'
};

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// Cache para evitar recálculos excesivos
const xpCache: Record<number, number> = {};
const xpToReachCache: Record<number, number> = {};

/**
 * Devuelve el XP necesario para subir desde un nivel al siguiente
 */
export function xpRequiredForLevel(globalLevel: number): number {
  if (globalLevel >= MAX_GLOBAL_LEVEL) return Infinity;
  if (xpCache[globalLevel]) return xpCache[globalLevel];
  
  const xp = Math.floor(100 * Math.pow(globalLevel + 1, 1.6));
  xpCache[globalLevel] = xp;
  return xp;
}

/**
 * XP total acumulado necesario para llegar a un nivel desde 0
 */
export function xpToReachLevel(globalLevel: number): number {
  if (globalLevel <= 0) return 0;
  if (xpToReachCache[globalLevel]) return xpToReachCache[globalLevel];
  
  let total = 0;
  for (let i = 0; i < globalLevel; i++) {
    total += xpRequiredForLevel(i);
  }
  
  xpToReachCache[globalLevel] = total;
  return total;
}

function padNumber(num: number): string {
  return num.toString().padStart(3, '0');
}

function toRoman(num: number): string {
  if (num <= 10) return ROMAN_NUMERALS[num - 1] || num.toString();
  return num.toString(); // Simplify for higher numbers if needed
}

export function getImagePath(prestige: Prestige, rankIndex: number, retina: boolean = false): string {
  const folder = retina ? 'Retina' : 'Default%20size';
  return `/ranks/${folder}/${prestige}/rank${padNumber(rankIndex)}.png`;
}

export function buildSrcSet(prestige: Prestige, rankIndex: number): string {
  const normal = getImagePath(prestige, rankIndex, false);
  const retina = getImagePath(prestige, rankIndex, true);
  return `${normal} 1x, ${retina} 2x`;
}

/**
 * Calcula toda la información de rango basada en el XP total del usuario
 */
export function getRankInfo(xpTotal: number): RankInfo {
  let globalLevel = 0;
  
  // Encontrar el nivel actual iterando (hasta el máximo)
  while (globalLevel < MAX_GLOBAL_LEVEL) {
    const requiredForNext = xpRequiredForLevel(globalLevel);
    const xpToReachNext = xpToReachLevel(globalLevel + 1);
    
    if (xpTotal < xpToReachNext) {
      break;
    }
    globalLevel++;
  }
  
  const prestigeIndex = Math.floor(globalLevel / RANKS_PER_PRESTIGE);
  const prestige = PRESTIGES[Math.min(prestigeIndex, PRESTIGES.length - 1)];
  const rankIndex = globalLevel % RANKS_PER_PRESTIGE;
  
  const xpBaseForCurrentLevel = xpToReachLevel(globalLevel);
  const xpCurrent = xpTotal - xpBaseForCurrentLevel;
  const xpRequired = xpRequiredForLevel(globalLevel);
  
  const progressPercent = globalLevel >= MAX_GLOBAL_LEVEL 
    ? 100 
    : Math.min(100, Math.max(0, (xpCurrent / xpRequired) * 100));

  // Label: e.g. "Bronce IV"
  // Calculamos el sub-nivel para display. Podemos dividir el rankIndex en tiers, 
  // o simplemente usar rankIndex + 1. Usaremos rankIndex + 1.
  const rankLabel = `${PRESTIGE_LABELS[prestige]} ${globalLevel >= MAX_GLOBAL_LEVEL ? 'MAX' : (rankIndex + 1)}`;
  
  return {
    prestige,
    rankIndex,
    globalLevel,
    xpCurrent,
    xpRequired,
    xpTotal,
    imageSrc: getImagePath(prestige, rankIndex, false),
    imageSrcSet: buildSrcSet(prestige, rankIndex),
    prestigeLabel: PRESTIGE_LABELS[prestige],
    rankLabel,
    progressPercent
  };
}

/**
 * Añade XP y calcula si ha habido subida de nivel
 */
export function addXP(currentXPTotal: number, xpGained: number): { newXPTotal: number; levelsGained: number; newRank: RankInfo } {
  const oldRank = getRankInfo(currentXPTotal);
  const newXPTotal = currentXPTotal + xpGained;
  const newRank = getRankInfo(newXPTotal);
  
  return {
    newXPTotal,
    levelsGained: newRank.globalLevel - oldRank.globalLevel,
    newRank
  };
}
