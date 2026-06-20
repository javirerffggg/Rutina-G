export type Prestige = 'Bronze' | 'Silver' | 'Gold' | 'Black';

export interface RankInfo {
  prestige: Prestige;
  rankIndex: number;       // 0–77, el número del archivo rank000–rank077
  globalLevel: number;     // 0–311
  xpCurrent: number;       // XP acumulado en el nivel actual
  xpRequired: number;      // XP total para subir al siguiente nivel
  xpTotal: number;         // XP total acumulado histórico
  imageSrc: string;        // ruta al PNG Default size
  imageSrcSet: string;     // srcSet con Default + Retina para <img>
  prestigeLabel: string;   // nombre display en español
  rankLabel: string;       // ej: "Bronce IV", "Plata XII"
  progressPercent: number; // 0–100 para la barra de progreso
}
