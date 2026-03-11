import { DailyLog, RoutineType } from './types';
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
  },
  // --- 💪 Fuerza Bruta (Nuevos) ---
  {
    id: 'club_120',
    title: 'El Club de los 120',
    description: '1RM estimado ≥120 kg en Press Banca',
    hint: 'Fuerza de élite en el pectoral.',
    icon: 'Dumbbell',
    tier: 'DIAMOND',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const bench = todayLog.exercises.find(e => e.exerciseId === 'push_bench_mach');
       if (!bench || bench.sets.length === 0) return false;
       return Math.max(...bench.sets.map(s => calculateOneRM(s.weight, s.reps))) >= 120;
    }
  },
  {
    id: 'club_60_ohp',
    title: 'Overhead Elite',
    description: '1RM estimado ≥60 kg en Press Militar',
    hint: 'Hombros de acero.',
    icon: 'ArrowUp',
    tier: 'GOLD',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const ohp = todayLog.exercises.find(e => e.exerciseId === 'push_shoulder_mach');
       if (!ohp || ohp.sets.length === 0) return false;
       return Math.max(...ohp.sets.map(s => calculateOneRM(s.weight, s.reps))) >= 60;
    }
  },
  {
    id: 'curl_monstruo',
    title: 'Bíceps de Acero',
    description: '1RM estimado ≥25 kg en Curl con barra',
    hint: 'Bíceps que imponen respeto.',
    icon: 'Zap',
    tier: 'SILVER',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const curl = todayLog.exercises.find(e => ['pull_curl_preach', 'upp_curl_pre'].includes(e.exerciseId));
       if (!curl || curl.sets.length === 0) return false;
       return Math.max(...curl.sets.map(s => calculateOneRM(s.weight, s.reps))) >= 25;
    }
  },
  {
    id: 'press_inclinado_90',
    title: 'Ángulo Perfecto',
    description: '1RM estimado ≥90 kg en Press Inclinado',
    hint: 'Enfoque superior masivo.',
    icon: 'TrendingUp',
    tier: 'GOLD',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const incline = todayLog.exercises.find(e => ['push_incline_mach', 'upp_inc_db'].includes(e.exerciseId));
       if (!incline || incline.sets.length === 0) return false;
       return Math.max(...incline.sets.map(s => calculateOneRM(s.weight, s.reps))) >= 90;
    }
  },
  {
    id: 'fondos_lastre_60',
    title: 'Gravitón Inverso',
    description: '60 kg de lastre en Fondos',
    hint: 'Vence a la gravedad con peso extra.',
    icon: 'Anchor',
    tier: 'ELITE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const dips = todayLog.exercises.find(e => ['push_dips', 'upp_dips'].includes(e.exerciseId));
       if (!dips || dips.sets.length === 0) return false;
       return Math.max(...dips.sets.map(s => s.weight)) >= 60;
    }
  },
  {
    id: 'dominadas_lastre_50',
    title: 'El Colgante',
    description: '50 kg de lastre en Dominadas',
    hint: 'Una espalda capaz de cargar con todo.',
    icon: 'Shield',
    tier: 'ELITE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const pullups = todayLog.exercises.find(e => e.exerciseId === 'pull_pullups');
       if (!pullups || pullups.sets.length === 0) return false;
       return Math.max(...pullups.sets.map(s => s.weight)) >= 50;
    }
  },
  {
    id: 'triceps_100',
    title: 'Tríceps de Titanio',
    description: '1RM ≥100 kg en cualquier ejercicio de tríceps',
    hint: 'Herraduras de caballo en tus brazos.',
    icon: 'Zap',
    tier: 'GOLD',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const triceps = todayLog.exercises.find(e => ['push_tri_seat', 'push_tri_rope', 'upp_tri_mach'].includes(e.exerciseId));
       if (!triceps || triceps.sets.length === 0) return false;
       return Math.max(...triceps.sets.map(s => calculateOneRM(s.weight, s.reps))) >= 100;
    }
  },
  {
    id: 'peso_igual_banca',
    title: 'Tu Propio Peso',
    description: '1RM en Press Banca ≥ tu peso corporal',
    hint: 'Eres tan fuerte como pesas.',
    icon: 'User',
    tier: 'SILVER',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises || !todayLog.weight) return false;
       const bench = todayLog.exercises.find(e => e.exerciseId === 'push_bench_mach');
       if (!bench || bench.sets.length === 0) return false;
       return Math.max(...bench.sets.map(s => calculateOneRM(s.weight, s.reps))) >= todayLog.weight;
    }
  },
  {
    id: 'doble_banca',
    title: 'El Doble',
    description: '1RM en Press Banca = 2× tu peso corporal',
    hint: 'Fuerza sobrehumana.',
    icon: 'Trophy',
    tier: 'ELITE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises || !todayLog.weight) return false;
       const bench = todayLog.exercises.find(e => e.exerciseId === 'push_bench_mach');
       if (!bench || bench.sets.length === 0) return false;
       return Math.max(...bench.sets.map(s => calculateOneRM(s.weight, s.reps))) >= (todayLog.weight * 2);
    }
  },
  {
    id: 'symmetry',
    title: 'Simetría Perfecta',
    description: 'PR similar (±5%) en Press Banca e Inclinado',
    hint: 'Desarrollo equilibrado del pectoral.',
    icon: 'Scale',
    tier: 'GOLD',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const bench = todayLog.exercises.find(e => e.exerciseId === 'push_bench_mach');
       const incline = todayLog.exercises.find(e => ['push_incline_mach', 'upp_inc_db'].includes(e.exerciseId));
       if (!bench || !incline || bench.sets.length === 0 || incline.sets.length === 0) return false;
       const benchPR = Math.max(...bench.sets.map(s => calculateOneRM(s.weight, s.reps)));
       const inclinePR = Math.max(...incline.sets.map(s => calculateOneRM(s.weight, s.reps)));
       return Math.abs(benchPR - inclinePR) / benchPR <= 0.05;
    }
  },
  {
    id: 'upper_pr_day',
    title: 'Día Histórico',
    description: 'Batir PR en 3 ejercicios distintos el mismo día',
    hint: 'Hoy es el día en que todo cambió.',
    icon: 'Star',
    tier: 'DIAMOND',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       let prCount = 0;
       todayLog.exercises.forEach(ex => {
         const currentPR = Math.max(...ex.sets.map(s => calculateOneRM(s.weight, s.reps)));
         let isNewPR = true;
         for (const date in logs) {
           if (date === today) continue;
           const prevLog = logs[date];
           if (prevLog.exercises) {
             const prevEx = prevLog.exercises.find(e => e.exerciseId === ex.exerciseId);
             if (prevEx) {
               const prevPR = Math.max(...prevEx.sets.map(s => calculateOneRM(s.weight, s.reps)));
               if (prevPR >= currentPR) {
                 isNewPR = false;
                 break;
               }
             }
           }
         }
         if (isNewPR) prCount++;
       });
       return prCount >= 3;
    }
  },
  {
    id: 'fuerza_bruta_total',
    title: 'La Santísima Trinidad',
    description: '1RM combinado Banca+Jalón+Hack ≥ 400 kg',
    hint: 'Dominio total de los tres grandes.',
    icon: 'Mountain',
    tier: 'ELITE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       const bench = todayLog.exercises.find(e => e.exerciseId === 'push_bench_mach');
       const lat = todayLog.exercises.find(e => ['pull_pullups', 'upp_lat_pull'].includes(e.exerciseId));
       const hack = todayLog.exercises.find(e => e.exerciseId === 'legs_hack');
       if (!bench || !lat || !hack) return false;
       const benchPR = Math.max(...bench.sets.map(s => calculateOneRM(s.weight, s.reps)));
       const latPR = Math.max(...lat.sets.map(s => calculateOneRM(s.weight, s.reps)));
       const hackPR = Math.max(...hack.sets.map(s => calculateOneRM(s.weight, s.reps)));
       return (benchPR + latPR + hackPR) >= 400;
    }
  },
  // --- 📅 Consistencia (Nuevos) ---
  {
    id: 'primer_entreno',
    title: 'Día Uno',
    description: 'Completar tu primer entrenamiento',
    hint: 'El viaje de mil millas comienza con un solo paso.',
    icon: 'Play',
    tier: 'BRONZE',
    condition: (logs) => Object.values(logs).filter(l => l.workoutCompleted).length >= 1
  },
  {
    id: '10_entrenos',
    title: 'Primer Escalón',
    description: 'Completar 10 entrenamientos en total',
    hint: 'Ya no eres un principiante.',
    icon: 'TrendingUp',
    tier: 'BRONZE',
    condition: (logs) => Object.values(logs).filter(l => l.workoutCompleted).length >= 10
  },
  {
    id: '25_entrenos',
    title: 'Cuarto de Año',
    description: 'Completar 25 entrenamientos en total',
    hint: 'La disciplina empieza a dar sus frutos.',
    icon: 'Award',
    tier: 'SILVER',
    condition: (logs) => Object.values(logs).filter(l => l.workoutCompleted).length >= 25
  },
  {
    id: '50_entrenos',
    title: 'Medio Centenar',
    description: 'Completar 50 entrenamientos en total',
    hint: 'Un hábito forjado en hierro.',
    icon: 'Shield',
    tier: 'SILVER',
    condition: (logs) => Object.values(logs).filter(l => l.workoutCompleted).length >= 50
  },
  {
    id: '100_entrenos',
    title: 'El Centenario',
    description: 'Completar 100 entrenamientos en total',
    hint: 'Eres parte de la élite de la constancia.',
    icon: 'Trophy',
    tier: 'GOLD',
    condition: (logs) => Object.values(logs).filter(l => l.workoutCompleted).length >= 100
  },
  {
    id: '200_entrenos',
    title: 'Maestro del Gym',
    description: 'Completar 200 entrenamientos en total',
    hint: 'El gimnasio es tu segundo hogar.',
    icon: 'Crown',
    tier: 'DIAMOND',
    condition: (logs) => Object.values(logs).filter(l => l.workoutCompleted).length >= 200
  },
  {
    id: 'lunes_guerrero',
    title: 'Lunes Guerrero',
    description: 'Entrenar todos los lunes de un mes',
    hint: 'Empieza la semana con fuerza.',
    icon: 'Flame',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const date = new Date(today);
       const month = date.getMonth();
       const year = date.getFullYear();
       const mondays = [];
       const d = new Date(year, month, 1);
       while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
       while (d.getMonth() === month) {
         mondays.push(new Date(d).toISOString().split('T')[0]);
         d.setDate(d.getDate() + 7);
       }
       return mondays.every(m => logs[m] && logs[m].workoutCompleted);
    }
  },
  {
    id: 'sin_excusas_lluvia',
    title: 'Sin Excusas',
    description: 'Entrenar 5 días seguidos incluyendo un fin de semana',
    hint: 'Ni el descanso te detiene.',
    icon: 'CloudRain',
    tier: 'SILVER',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       for (let i = 0; i <= dates.length - 5; i++) {
         const slice = dates.slice(i, i + 5);
         const hasWeekend = slice.some(d => [0, 6].includes(new Date(d).getDay()));
         const allCompleted = slice.every(d => logs[d].workoutCompleted);
         if (hasWeekend && allCompleted) return true;
       }
       return false;
    }
  },
  {
    id: 'mes_perfecto',
    title: 'Mes Perfecto',
    description: 'Completar todos los entrenos pautados en un mes natural',
    hint: 'Perfección en la planificación.',
    icon: 'CheckCircle',
    tier: 'GOLD',
    condition: (logs, today) => {
       const date = new Date(today);
       const month = date.getMonth();
       const year = date.getFullYear();
       const daysInMonth = new Date(year, month + 1, 0).getDate();
       for (let i = 1; i <= daysInMonth; i++) {
         const d = new Date(year, month, i);
         const dateStr = d.toISOString().split('T')[0];
         const dayOfWeek = d.getDay();
         const isRestDay = [4, 0].includes(dayOfWeek); // Jueves y Domingo son REST según ROUTINE_MAPPING
         if (!isRestDay && (!logs[dateStr] || !logs[dateStr].workoutCompleted)) return false;
       }
       return true;
    }
  },
  {
    id: 'ano_consistente',
    title: 'Año de Hierro',
    description: 'Completar 200+ entrenamientos en un año natural',
    hint: 'Un año dedicado a la mejora personal.',
    icon: 'Calendar',
    tier: 'ELITE',
    condition: (logs, today) => {
       const year = new Date(today).getFullYear();
       return Object.values(logs).filter(l => new Date(l.date).getFullYear() === year && l.workoutCompleted).length >= 200;
    }
  },
  // --- 🏋️ Volumen y Trabajo (Nuevos) ---
  {
    id: '5000_sesion',
    title: 'La Muralla',
    description: 'Mover 5.000 kg en una sesión',
    hint: 'Un muro de carga.',
    icon: 'Box',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       let vol = 0;
       todayLog.exercises.forEach(ex => ex.sets.forEach(s => vol += s.weight * s.reps));
       return vol >= 5000;
    }
  },
  {
    id: '20000_sesion',
    title: 'Locomotora',
    description: 'Mover 20.000 kg en una sesión',
    hint: 'Nada puede detenerte.',
    icon: 'Train',
    tier: 'GOLD',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       let vol = 0;
       todayLog.exercises.forEach(ex => ex.sets.forEach(s => vol += s.weight * s.reps));
       return vol >= 20000;
    }
  },
  {
    id: '100k_semana',
    title: 'La Semana del Caos',
    description: '100.000 kg en una semana',
    hint: 'Una semana de trabajo hercúleo.',
    icon: 'Zap',
    tier: 'DIAMOND',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       let vol = 0;
       for (let i = 0; i < Math.min(7, dates.length); i++) {
         const log = logs[dates[i]];
         if (log.exercises) log.exercises.forEach(ex => ex.sets.forEach(s => vol += s.weight * s.reps));
       }
       return vol >= 100000;
    }
  },
  {
    id: '500k_historico',
    title: 'Medio Millón',
    description: '500.000 kg de volumen histórico total',
    hint: 'Has movido una flota de camiones.',
    icon: 'Truck',
    tier: 'GOLD',
    condition: (logs) => {
       let vol = 0;
       Object.values(logs).forEach(log => {
         if (log.exercises) log.exercises.forEach(ex => ex.sets.forEach(s => vol += s.weight * s.reps));
       });
       return vol >= 500000;
    }
  },
  {
    id: '2m_historico',
    title: 'Dos Millones',
    description: '2.000.000 kg de volumen histórico total',
    hint: 'Leyenda del tonelaje.',
    icon: 'Infinity',
    tier: 'ELITE',
    condition: (logs) => {
       let vol = 0;
       Object.values(logs).forEach(log => {
         if (log.exercises) log.exercises.forEach(ex => ex.sets.forEach(s => vol += s.weight * s.reps));
       });
       return vol >= 2000000;
    }
  },
  {
    id: '50_series_dia',
    title: 'Máquina Sin Parar',
    description: '50 series en una sola sesión',
    hint: 'Resistencia infinita.',
    icon: 'Activity',
    tier: 'DIAMOND',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises) return false;
       let sets = 0;
       todayLog.exercises.forEach(ex => sets += ex.sets.length);
       return sets >= 50;
    }
  },
  {
    id: 'push_completo',
    title: 'Push Perfecto',
    description: 'Completar todos los ejercicios de Push en una sesión',
    hint: 'Dominio del empuje.',
    icon: 'ArrowUpCircle',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises || todayLog.workoutType !== RoutineType.PUSH) return false;
       return todayLog.exercises.every(ex => ex.completed);
    }
  },
  {
    id: 'pull_completo',
    title: 'Pull Perfecto',
    description: 'Completar todos los ejercicios de Pull en una sesión',
    hint: 'Dominio del tirón.',
    icon: 'ArrowDownCircle',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises || todayLog.workoutType !== RoutineType.PULL) return false;
       return todayLog.exercises.every(ex => ex.completed);
    }
  },
  {
    id: 'legs_completo',
    title: 'Legs Perfecto',
    description: 'Completar todos los ejercicios de Legs en una sesión',
    hint: 'Dominio de las piernas.',
    icon: 'Dumbbell',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const todayLog = logs[today];
       if (!todayLog || !todayLog.exercises || todayLog.workoutType !== RoutineType.LEGS) return false;
       return todayLog.exercises.every(ex => ex.completed);
    }
  },
  {
    id: 'full_split',
    title: 'Split Completo',
    description: 'Completar Push + Pull + Legs en la misma semana',
    hint: 'Equilibrio semanal total.',
    icon: 'LayoutGrid',
    tier: 'SILVER',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       const types = new Set();
       for (let i = 0; i < Math.min(7, dates.length); i++) {
         const log = logs[dates[i]];
         if (log.workoutCompleted) types.add(log.workoutType);
       }
       return types.has(RoutineType.PUSH) && types.has(RoutineType.PULL) && types.has(RoutineType.LEGS);
    }
  },
  // --- 🧬 Biofeedback y Composición (Nuevos) ---
  {
    id: 'primer_peso',
    title: 'Báscula Activada',
    description: 'Registrar tu peso corporal por primera vez',
    hint: 'Empieza a medir tu progreso.',
    icon: 'Scale',
    tier: 'BRONZE',
    condition: (logs) => Object.values(logs).some(l => l.weight)
  },
  {
    id: '30_dias_peso',
    title: 'Científico del Cuerpo',
    description: 'Registrar peso 30 días seguidos',
    hint: 'Datos precisos para resultados precisos.',
    icon: 'LineChart',
    tier: 'GOLD',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       let count = 0;
       for (let i = 0; i < Math.min(30, dates.length); i++) {
         if (logs[dates[i]].weight) count++;
       }
       return count >= 30;
    }
  },
  {
    id: 'estres_zen',
    title: 'Modo Zen',
    description: 'Registrar estrés 1/5 durante 5 días seguidos',
    hint: 'Mente tranquila, cuerpo fuerte.',
    icon: 'Wind',
    tier: 'SILVER',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       let count = 0;
       for (let i = 0; i < Math.min(5, dates.length); i++) {
         if (logs[dates[i]].stress === 1) count++;
       }
       return count >= 5;
    }
  },
  {
    id: 'biofeedback_completo',
    title: 'Autoconocimiento',
    description: 'Rellenar sueño + energía + estrés 7 días seguidos',
    hint: 'Escucha a tu cuerpo.',
    icon: 'Brain',
    tier: 'SILVER',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       let count = 0;
       for (let i = 0; i < Math.min(7, dates.length); i++) {
         const l = logs[dates[i]];
         if (l.sleep && l.energy && l.stress) count++;
       }
       return count >= 7;
    }
  },
  {
    id: 'cintura_meta',
    title: 'Cintura de Avispa',
    description: 'Registrar cintura ≤ 80 cm',
    hint: 'Definición máxima.',
    icon: 'Zap',
    tier: 'GOLD',
    condition: (logs, today) => {
       const todayLog = logs[today];
       return todayLog && todayLog.waist ? todayLog.waist <= 80 : false;
    }
  },
  {
    id: 'refeed_maestro',
    title: 'Maestro del Refeed',
    description: 'Marcar 4 días de Refeed a lo largo del historial',
    hint: 'Carga estratégica de energía.',
    icon: 'Milk',
    tier: 'SILVER',
    condition: (logs) => Object.values(logs).filter(l => l.isRefeed).length >= 4
  },
  {
    id: 'peso_stable',
    title: 'Homeostasis',
    description: 'Variación de peso ≤ 0.5 kg durante 7 días seguidos',
    hint: 'Estabilidad metabólica.',
    icon: 'Activity',
    tier: 'GOLD',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort().reverse();
       if (dates.length < 7) return false;
       const weights = [];
       for (let i = 0; i < 7; i++) {
         if (!logs[dates[i]].weight) return false;
         weights.push(logs[dates[i]].weight!);
       }
       const max = Math.max(...weights);
       const min = Math.min(...weights);
       return (max - min) <= 0.5;
    }
  },
  {
    id: 'composicion_total',
    title: 'Datos Completos',
    description: 'Registrar cintura + hombros + brazo + muslo el mismo día',
    hint: 'Mapeo corporal total.',
    icon: 'Maximize',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const l = logs[today];
       return !!(l && l.waist && l.chest && l.arm && l.thigh);
    }
  },
  // --- 🎭 Easter Eggs y Eventos (Nuevos) ---
  {
    id: 'entreno_navidad',
    title: 'Feliz Navidad, Bestia',
    description: 'Entrenar el 25 de diciembre',
    hint: 'Ni Santa Claus te quita las ganas.',
    icon: 'Gift',
    tier: 'ELITE',
    condition: (logs, today) => {
       const d = new Date(today);
       return d.getMonth() === 11 && d.getDate() === 25 && logs[today].workoutCompleted;
    }
  },
  {
    id: 'entreno_ano_nuevo',
    title: 'Año Nuevo, Hierro Nuevo',
    description: 'Entrenar el 1 de enero',
    hint: 'Empieza el año con el pie derecho (y el izquierdo en la prensa).',
    icon: 'Sparkles',
    tier: 'GOLD',
    condition: (logs, today) => {
       const d = new Date(today);
       return d.getMonth() === 0 && d.getDate() === 1 && logs[today].workoutCompleted;
    }
  },
  {
    id: 'entreno_noche_vieja',
    title: 'La Última Rep del Año',
    description: 'Entrenar el 31 de diciembre',
    hint: 'Termina el año por todo lo alto.',
    icon: 'GlassWater',
    tier: 'GOLD',
    condition: (logs, today) => {
       const d = new Date(today);
       return d.getMonth() === 11 && d.getDate() === 31 && logs[today].workoutCompleted;
    }
  },
  {
    id: 'lunes_manana',
    title: 'El Lunes Mítico',
    description: 'Empezar una racha un lunes a las 8AM',
    hint: 'Disciplina matutina extrema.',
    icon: 'Clock',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const d = new Date();
       return d.getDay() === 1 && d.getHours() === 8 && logs[today].workoutCompleted;
    }
  },
  {
    id: 'rir_0',
    title: 'Al Límite',
    description: 'Registrar RIR 0 en cualquier set (fallo muscular)',
    hint: 'No quedaba nada en el tanque.',
    icon: 'Flame',
    tier: 'SILVER',
    condition: (logs, today) => {
       const l = logs[today];
       if (!l || !l.exercises) return false;
       return l.exercises.some(ex => ex.sets.some(s => s.rir === 0));
    }
  },
  {
    id: 'rir_0_x3',
    title: 'Sin Piedad',
    description: 'Registrar RIR 0 en 3 sets distintos el mismo día',
    hint: 'Intensidad absoluta.',
    icon: 'Zap',
    tier: 'GOLD',
    condition: (logs, today) => {
       const l = logs[today];
       if (!l || !l.exercises) return false;
       let count = 0;
       l.exercises.forEach(ex => ex.sets.forEach(s => { if (s.rir === 0) count++; }));
       return count >= 3;
    }
  },
  {
    id: 'sesion_rapida',
    title: 'Relámpago',
    description: 'Completar una sesión en menos de 30 minutos',
    hint: 'Entra, entrena, sal.',
    icon: 'Zap',
    tier: 'SILVER',
    condition: (logs, today) => {
       const l = logs[today];
       return !!(l && l.workoutCompleted && l.duration && l.duration < 30);
    }
  },
  {
    id: 'sesion_larga',
    title: 'Monje del Hierro',
    description: 'Sesión de más de 90 minutos',
    hint: 'Dedicación total.',
    icon: 'Clock',
    tier: 'SILVER',
    condition: (logs, today) => {
       const l = logs[today];
       return !!(l && l.workoutCompleted && l.duration && l.duration > 90);
    }
  },
  {
    id: 'todo_verde',
    title: 'Perfección Absoluta',
    description: 'Completar todos los sets de todos los ejercicios en una sesión',
    hint: 'No dejaste nada pendiente.',
    icon: 'CheckCircle',
    tier: 'DIAMOND',
    condition: (logs, today) => {
       const l = logs[today];
       if (!l || !l.exercises || !l.workoutCompleted) return false;
       return l.exercises.every(ex => ex.completed && ex.sets.every(s => s.completed));
    }
  },
  {
    id: 'vuelta_tras_descanso',
    title: 'El Regreso',
    description: 'Entrenar después de 7+ días sin registrar ninguna sesión',
    hint: 'Nunca es tarde para volver.',
    icon: 'RotateCcw',
    tier: 'BRONZE',
    condition: (logs, today) => {
       const dates = Object.keys(logs).sort();
       const todayIdx = dates.indexOf(today);
       if (todayIdx <= 0) return false;
       const lastDate = new Date(dates[todayIdx - 1]);
       const diff = (new Date(today).getTime() - lastDate.getTime()) / 86400000;
       return diff >= 7 && logs[today].workoutCompleted;
    }
  }
];
