import { DailyLog } from './types';
import { calculateOneRM, getGymSchedule } from './utils';

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'ELITE';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  hint: string;
  icon: string;
  tier: AchievementTier;
  condition: (logs: Record<string, DailyLog>, todayStr: string) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // --- Categoría A: Fuerza Bruta ---
  {
    id: 'club_100',
    title: 'El Club de los 100',
    description: 'Alcanzar un 1RM estimado de 100 kg en Press de Banca.',
    hint: 'Empuja con la fuerza de un centenar.',
    icon: 'Dumbbell',
    tier: 'GOLD',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const benchLog = todayLog.exercises.find(e => e.exerciseId === 'push_bench_mach');
       if (!benchLog || benchLog.sets.length === 0) return false;
       const max1RM = Math.max(...benchLog.sets.map(s => calculateOneRM(s.weight, s.reps)));
       return max1RM >= 100;
    }
  },
  {
    id: 'espalda_plata',
    title: 'Espalda de Plata',
    description: 'Alcanzar un 1RM estimado de 140 kg en Remo o Jalón.',
    hint: 'Tira como un gorila.',
    icon: 'Shield',
    tier: 'GOLD',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const backLog = todayLog.exercises.find(e => ['pull_row_div', 'pull_row_low', 'upp_lat_pull', 'upp_low_row'].includes(e.exerciseId));
       if (!backLog || backLog.sets.length === 0) return false;
       const max1RM = Math.max(...backLog.sets.map(s => calculateOneRM(s.weight, s.reps)));
       return max1RM >= 140;
    }
  },
  {
    id: 'fuerza_terrestre',
    title: 'Fuerza Terrestre',
    description: 'Alcanzar un 1RM estimado de 180+ kg en PMR o Hack.',
    hint: 'Mueve la tierra bajo tus pies.',
    icon: 'Mountain',
    tier: 'DIAMOND',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const legLog = todayLog.exercises.find(e => ['legs_hack', 'low_rdl'].includes(e.exerciseId));
       if (!legLog || legLog.sets.length === 0) return false;
       const max1RM = Math.max(...legLog.sets.map(s => calculateOneRM(s.weight, s.reps)));
       return max1RM >= 180;
    }
  },
  {
    id: 'maestro_lastre',
    title: 'Maestro del Lastre',
    description: 'Registrar +40 kg de lastre en Fondos o Dominadas.',
    hint: 'La gravedad es solo una sugerencia.',
    icon: 'Anchor',
    tier: 'GOLD',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const bwLog = todayLog.exercises.find(e => ['push_dips', 'upp_dips', 'pull_pullups'].includes(e.exerciseId));
       if (!bwLog || bwLog.sets.length === 0) return false;
       const maxWeight = Math.max(...bwLog.sets.map(s => s.weight));
       return maxWeight >= 40;
    }
  },
  {
    id: 'leyenda_fuerza',
    title: 'Leyenda de la Fuerza',
    description: 'Levantar 2 veces tu peso corporal en tren inferior.',
    hint: 'El hierro pesa el doble cuando es tuyo. Supera tu propia masa en el tren inferior.',
    icon: 'Crown',
    tier: 'DIAMOND',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises || !todayLog.weight) return false;
       const legLog = todayLog.exercises.find(e => ['legs_hack', 'low_rdl', 'legs_press'].includes(e.exerciseId));
       if (!legLog || legLog.sets.length === 0) return false;
       const maxWeight = Math.max(...legLog.sets.map(s => s.weight));
       return maxWeight >= (todayLog.weight * 2);
    }
  },
  // --- Categoría B: Disciplina y Constancia ---
  {
    id: 'semana_perfecta',
    title: 'Semana Perfecta',
    description: 'Completar los 6 días de entrenamiento del split.',
    hint: 'La constancia es la clave.',
    icon: 'CalendarCheck',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       let count = 0;
       for (let i = 0; i < Math.min(7, dates.length); i++) {
         if (logs[dates[i]].workoutCompleted) count++;
       }
       return count >= 6;
    }
  },
  {
    id: 'racha_titanio',
    title: 'Racha de Titanio',
    description: 'Entrenar 21 días cumpliendo todos los días pautados.',
    hint: 'Forja un hábito inquebrantable.',
    icon: 'Flame',
    tier: 'SILVER',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       let count = 0;
       for (let i = 0; i < Math.min(21, dates.length); i++) {
         if (logs[dates[i]].workoutCompleted) count++;
       }
       return count >= 18;
    }
  },
  {
    id: 'madrugador',
    title: 'Madrugador',
    description: 'Completar un entrenamiento antes de las 7:00 AM.',
    hint: 'Al que madruga, el hierro le ayuda.',
    icon: 'Sunrise',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.workoutCompleted) return false;
       const hour = new Date().getHours();
       return hour < 7;
    }
  },
  {
    id: 'noctambulo',
    title: 'Noctámbulo',
    description: 'Completar un entrenamiento después de las 22:00 PM.',
    hint: 'La noche es oscura y alberga ganancias.',
    icon: 'Moon',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.workoutCompleted) return false;
       const hour = new Date().getHours();
       return hour >= 22;
    }
  },
  // --- Categoría C: Capacidad de Trabajo ---
  {
    id: 'maquina_carga',
    title: 'Máquina de Carga',
    description: 'Mover más de 10,000 kg de tonelaje en una sesión.',
    hint: 'Conviértete en una grúa humana.',
    icon: 'Truck',
    tier: 'SILVER',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       let totalVolume = 0;
       todayLog.exercises.forEach(ex => {
         ex.sets.forEach(s => {
           totalVolume += s.weight * s.reps;
         });
       });
       return totalVolume >= 10000;
    }
  },
  {
    id: 'volumen_elite',
    title: 'Volumen de Élite',
    description: 'Acumular 50,000 kg levantados en una sola semana.',
    hint: 'Mueve una montaña en 7 días.',
    icon: 'Layers',
    tier: 'GOLD',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       let totalVolume = 0;
       for (let i = 0; i < Math.min(7, dates.length); i++) {
         const log = logs[dates[i]];
         if (log.exercises) {
           log.exercises.forEach(ex => {
             ex.sets.forEach(s => {
               totalVolume += s.weight * s.reps;
             });
           });
         }
       }
       return totalVolume >= 50000;
    }
  },
  {
    id: 'el_millon',
    title: 'El Millón',
    description: 'Alcanzar 1,000,000 kg de volumen histórico acumulado.',
    hint: 'Un millón de razones para no rendirse.',
    icon: 'Infinity',
    tier: 'ELITE',
    condition: (logs, today) => {
       let totalVolume = 0;
       Object.values(logs).forEach(log => {
         if (log.exercises) {
           log.exercises.forEach(ex => {
             ex.sets.forEach(s => {
               totalVolume += s.weight * s.reps;
             });
           });
         }
       });
       return totalVolume >= 1000000;
    }
  },
  // --- Categoría D: Composición y Biofeedback ---
  {
    id: 'metabolismo_calculado',
    title: 'Metabolismo Calculado',
    description: 'Registrar el peso corporal durante 14 días consecutivos.',
    hint: 'La ciencia requiere datos.',
    icon: 'LineChart',
    tier: 'SILVER',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       let count = 0;
       for (let i = 0; i < Math.min(14, dates.length); i++) {
         if (logs[dates[i]].weight) count++;
       }
       return count >= 14;
    }
  },
  {
    id: 'vtaper_perfecto',
    title: 'V-Taper Perfecto',
    description: 'Lograr un ratio V-Taper inferior a 0.70.',
    hint: 'Esculpe la forma de V.',
    icon: 'Triangle',
    tier: 'GOLD',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.waist || !todayLog.chest) return false;
       return (todayLog.waist / todayLog.chest) < 0.70;
    }
  },
  {
    id: 'recuperacion_optima',
    title: 'Recuperación Óptima',
    description: 'Registrar un 5/5 en Sueño y Energía durante 3 días seguidos.',
    hint: 'Duerme como un bebé, entrena como una bestia.',
    icon: 'BatteryCharging',
    tier: 'SILVER',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       let count = 0;
       for (let i = 0; i < Math.min(3, dates.length); i++) {
         const log = logs[dates[i]];
         if (log.sleep === 5 && log.energy === 5) count++;
       }
       return count >= 3;
    }
  },
  // --- Categoría E: Eventos Especiales ---
  {
    id: 'psicopata_hierro',
    title: 'Psicópata del Hierro',
    description: 'Registrar un entrenamiento en un día festivo marcado como "Cerrado".',
    hint: 'Las excusas están cerradas hoy.',
    icon: 'Skull',
    tier: 'ELITE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.workoutCompleted) return false;
       return getGymSchedule(today) === 'Cerrado';
    }
  },
  {
    id: 'resurreccion',
    title: 'Resurrección',
    description: 'Superar tu récord de 1RM al día siguiente de un Refeed.',
    hint: 'Aprovecha el glucógeno.',
    icon: 'Zap',
    tier: 'DIAMOND',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.workoutCompleted) return false;
       
       const yesterday = new Date(new Date(today).getTime() - 86400000).toISOString().split('T')[0];
       const yesterdayLog = logs[yesterday];
       if (!yesterdayLog || !yesterdayLog.isRefeed) return false;

       return true;
    }
  },
  {
    id: 'dia_bestia',
    title: 'El Día de la Bestia',
    description: 'Añadir más de 6 series efectivas a un solo ejercicio.',
    hint: 'El volumen extremo requiere medidas extremas.',
    icon: 'FlameKindling',
    tier: 'DIAMOND',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       return todayLog.exercises.some(e => e.sets.length > 6);
    }
  }
];
