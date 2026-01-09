import { Exercise, PhaseType, PlanPhase, RoutineType, ExerciseAlternative } from './types';

export const SPECIAL_GYM_HOURS: Record<string, string> = {
  '01-01': 'Cerrado',
  '01-05': '08:00 - 15:00',
  '01-06': 'Cerrado',
  '02-28': '08:00 - 21:00',
  '04-17': '08:00 - 21:00',
  '04-18': '08:00 - 21:00',
  '05-01': '08:00 - 21:00',
  '06-02': '08:00 - 21:00',
  '08-15': '08:00 - 21:00',
  '09-08': '08:00 - 21:00',
  '10-13': '08:00 - 21:00',
  '11-01': '08:00 - 21:00',
  '12-06': '08:00 - 21:00',
  '12-08': '08:00 - 21:00',
  '12-13': '08:00 - 16:00',
  '12-14': '08:00 - 16:00'
};

// --- TRAINING SPLIT CONSTANTS (2026 PLAN) ---

export const EXERCISES_PUSH: Exercise[] = [
  { id: 'push_bench_mach', name: 'Press Banca Máquina', targetSets: '3', targetReps: '6-10', notes: 'RIR 1-2. Retracción escapular.' },
  { id: 'push_incline_mach', name: 'Press Inclinado Máquina', targetSets: '3', targetReps: '8-12', notes: 'RIR 1-2. Foco en clavicular.' },
  { id: 'push_shoulder_mach', name: 'Press Hombro Máquina', targetSets: '3', targetReps: '6-10', notes: 'RIR 1-2. Codos a 30°.' },
  { id: 'push_lat_raise', name: 'Elevaciones Laterales', targetSets: '3', targetReps: '10-15', notes: 'RIR 1-2. Alejar manos del cuerpo.' },
  { id: 'push_tri_ext', name: 'Extensión Tríceps Polea', targetSets: '3', targetReps: '12-15', notes: 'RIR 1-2. Tempo 3s excéntrica.' },
];

export const EXERCISES_PULL: Exercise[] = [
  { id: 'pull_pullups', name: 'Dominadas (con Straps)', targetSets: '3', targetReps: '6-10', notes: 'RIR 1-2. Deprimir escápulas.' },
  { id: 'pull_row_mach', name: 'Remo Máq. Horizontal', targetSets: '3', targetReps: '6-10', notes: 'RIR 1-2. Tracciona hacia el ombligo.' },
  { id: 'pull_rear_delt', name: 'Vuelos Posteriores', targetSets: '3', targetReps: '12-15', notes: 'RIR 1-2. Aislamiento, evita trapecio.' },
  { id: 'pull_shrugs', name: 'Encogimientos Manc.', targetSets: '3', targetReps: '10-15', notes: 'RIR 1-2. Pausa 1s arriba.' },
  { id: 'pull_curl_mach', name: 'Curl Bíceps Máquina', targetSets: '3', targetReps: '8-12', notes: 'RIR 1-2. Conexión mente-músculo.' },
];

export const EXERCISES_LEGS: Exercise[] = [
  { id: 'legs_hack', name: 'Sentadilla Hack', targetSets: '3', targetReps: '8-12', notes: 'RIR 1-2. Cadera pasa la rodilla.' },
  { id: 'legs_press', name: 'Prensa de Piernas', targetSets: '3', targetReps: '8-15', notes: 'RIR 1-2. No bloquear rodillas.' },
  { id: 'legs_ext', name: 'Extensión Cuádriceps', targetSets: '3', targetReps: '12-20', notes: 'RIR 1-2. Estrés metabólico (quemazón).' },
  { id: 'legs_calves', name: 'Elevación Talones', targetSets: '4', targetReps: '10-20', notes: 'RIR 1-2. Estira abajo 1s.' },
];

export const EXERCISES_UPPER: Exercise[] = [
  { id: 'upp_lat_pulldown', name: 'Jalón al Pecho (Prono)', targetSets: '3', targetReps: '6-10', notes: 'RIR 1-2. Alternancia controlada.' },
  { id: 'upp_dips', name: 'Fondos en Paralelas', targetSets: '3', targetReps: '8-12', notes: 'RIR 1-2. Inclina cuerpo adelante.' },
  { id: 'upp_low_row', name: 'Remo Polea Baja', targetSets: '3', targetReps: '10-12', notes: 'RIR 1-2. Rango completo estiramiento.' },
  { id: 'upp_tri_press', name: 'Press Tríceps Sentado', targetSets: '3', targetReps: '8-12', notes: 'RIR 1-2. Baja carga por detrás nuca.' },
  { id: 'upp_hammer', name: 'Curl Martillo Manc.', targetSets: '3', targetReps: '10-15', notes: 'RIR 1-2. Trabaja el braquial.' },
];

export const EXERCISES_LOWER: Exercise[] = [
  { id: 'legs_hip_thrust', name: 'Hip Thrust Máquina', targetSets: '3', targetReps: '10-15', notes: 'RIR 1-2. Bloquea pelvis arriba.' },
  { id: 'legs_curl', name: 'Curl Femoral', targetSets: '3', targetReps: '10-15', notes: 'RIR 1-2. Punta pies hacia espinilla.' },
  { id: 'legs_goblet', name: 'Sentadilla Goblet', targetSets: '3', targetReps: '8-15', notes: 'RIR 1-2. Activa abdomen fuerte.' },
  { id: 'legs_calves_b', name: 'Elevación Talones', targetSets: '4', targetReps: '10-20', notes: 'RIR 1-2. Protocolo intensidad.' },
  { id: 'legs_abs', name: 'Abdominales (VKR)', targetSets: '3-4', targetReps: '12-15', notes: 'RIR 1-2. No usar psoas.' },
];

export const EXERCISE_ALTERNATIVES: Record<string, ExerciseAlternative> = {
  'push_bench_mach': { main: 'Press Banca Barra', secondary: 'Press Mancuernas', note: 'Prioriza estabilidad.' },
  'pull_pullups': { main: 'Jalón al Pecho', secondary: 'Dominadas Asistidas', note: 'Rango completo es clave.' },
  'legs_hack': { main: 'Sentadilla Barra Alta', secondary: 'Sentadilla Multipower', note: 'Profundidad > Carga.' },
  'upp_dips': { main: 'Press Declinado', secondary: 'Flexiones Lastradas', note: 'Cuidado con el hombro.' },
};

export const PHASES: PlanPhase[] = [
  {
    name: PhaseType.CUT_JAN,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    description: "Recorte Final. Déficit -400kcal. Tensión mecánica para retener músculo.",
    nutritionGoal: "Déficit / Prot 2.2g",
    cardio: "30-40 min Post-Pesas",
    trainingFocus: "Fuerza RIR 1-2"
  },
  {
    name: PhaseType.RESET_FEB,
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    description: "Transición y Reset. Estabilización del peso y hormonas (Leptina/Ghrelina).",
    nutritionGoal: "Normocalórica",
    cardio: "30 min x 3 días",
    trainingFocus: "Técnica / Descarga"
  },
  {
    name: PhaseType.HYPERTROPHY_1,
    startDate: '2026-03-01',
    endDate: '2026-06-15',
    description: "Hipertrofia I (Lean Bulk). Superávit +250kcal. Maximizar síntesis proteica.",
    nutritionGoal: "Superávit Ligero",
    cardio: "Mantenimiento",
    trainingFocus: "Volumen Alto (4 series)"
  },
  {
    name: PhaseType.SUMMER_SHRED,
    startDate: '2026-06-16',
    endDate: '2026-07-31',
    description: "Summer Shred. Peak Estético. Reducción grasa subcutánea vía AMPK.",
    nutritionGoal: "Déficit / Ciclado Carbos",
    cardio: "45 min LISS + 12k Pasos",
    trainingFocus: "Intensidad / Menos Volumen"
  },
  {
    name: PhaseType.HYPERTROPHY_2,
    startDate: '2026-08-01',
    endDate: '2026-11-30',
    description: "Hipertrofia II. El día de la bestia. Intensificación y cargas máximas.",
    nutritionGoal: "Superávit +300-450kcal",
    cardio: "Mínimo",
    trainingFocus: "Carga Máxima / RIR 0-1"
  },
  {
    name: PhaseType.CONSOLIDATION,
    startDate: '2026-12-01',
    endDate: '2026-12-31',
    description: "Consolidación y Longevidad. Recuperación articular y reseteo del SNC.",
    nutritionGoal: "Normocalórica",
    cardio: "Lúdico",
    trainingFocus: "RIR 3-4 / Tempo Lento"
  }
];

export const ROUTINE_MAPPING: Record<number, RoutineType> = {
  1: RoutineType.PUSH,    // Lunes
  2: RoutineType.PULL,    // Martes
  3: RoutineType.LEGS,    // Miércoles
  4: RoutineType.REST,    // Jueves
  5: RoutineType.UPPER,   // Viernes
  6: RoutineType.LOWER,   // Sábado
  0: RoutineType.REST     // Domingo
};

export const WARMUP_GUIDE = {
  [RoutineType.PUSH]: [
    {
      title: "1. Movilidad (Universal)",
      tasks: [
        "Cuello y Muñecas (30s)",
        "Balanceos de brazos (15 reps)",
        "Círculos de hombros (20 reps)",
        "Rotaciones 'en L' (15 reps)"
      ]
    },
    {
      title: "2. Activación PUSH",
      tasks: [
        "Flexiones Escapulares: 2 x 12",
        "Aproximación Press: 1x15 (30%), 1x8 (60%)"
      ]
    }
  ],
  [RoutineType.PULL]: [
    {
      title: "1. Movilidad (Universal)",
      tasks: [
        "Rotaciones de Tronco (20 reps)",
        "Círculos Escapulares (12 reps)",
        "Muñecas (30s)"
      ]
    },
    {
      title: "2. Activación PULL",
      tasks: [
        "Aperturas 'Cactus': 2 x 12",
        "Aproximación Jalón: 1x15 (30%), 1x8 (60%)"
      ]
    }
  ],
  [RoutineType.UPPER]: [
    {
      title: "1. Movilidad Híbrida",
      tasks: [
        "Círculos de hombros completos (30s)",
        "Aperturas pectorales dinámicas (15 reps)",
        "Rotaciones torácicas (10/lado)"
      ]
    },
    {
      title: "2. Aproximación",
      tasks: [
        "Jalón al pecho: 1x12 ligero",
        "Fondos (o flexiones): 1x10 controlado"
      ]
    }
  ],
  [RoutineType.LEGS]: [
    {
      title: "1. Temp y Movilidad",
      tasks: [
        "Bici/Elíptica (5 min)",
        "Balanceos de Pierna (15/lado)",
        "Sentadilla Cossack (10 total)"
      ]
    },
    {
      title: "2. Activación Rodilla",
      tasks: [
        "Anclaje de Tobillo: 12 reps",
        "Aproximación Hack: 1x15 (vacía), 1x8 (50%)"
      ]
    }
  ],
  [RoutineType.LOWER]: [
    {
      title: "1. Temp y Movilidad",
      tasks: [
        "Caminata inclinada (5 min)",
        "Balanceos de Pierna (15/lado)",
        "Puente de Glúteo suelo (15 reps)"
      ]
    },
    {
      title: "2. Activación Cadera",
      tasks: [
        "Aproximación Hip Thrust: 1x15 (30%), 1x8 (60%)"
      ]
    }
  ]
};