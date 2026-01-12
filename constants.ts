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

// --- TRAINING SPLIT CONSTANTS (2026 MASTER PLAN) ---

export const EXERCISES_PUSH: Exercise[] = [
  { id: 'push_bench_mach', name: 'Press Banca Máquina', targetSets: '3-4', targetReps: '6-8', notes: 'Fuerza base. Retracción escapular.' },
  { id: 'push_incline_mach', name: 'Press Inclinado Máquina', targetSets: '3-4', targetReps: '8-10', notes: 'Enfoque superior.' },
  { id: 'push_dips', name: 'Fondos en Paralelas', targetSets: '3-4', targetReps: '8-12', notes: 'Lastre progresivo.' },
  { id: 'push_shoulder_mach', name: 'Press Hombro Máquina', targetSets: '3', targetReps: '8-10', notes: 'Potencia vertical.' },
  { id: 'push_lat_raise', name: 'Elevaciones Laterales', targetSets: '3-4', targetReps: '12-15', notes: 'Anchura. Lejos del cuerpo.' },
  { id: 'push_tri_seat', name: 'Press Tríceps Sentado', targetSets: '3', targetReps: '10-12', notes: 'Estabilidad máxima.' },
  { id: 'push_tri_rope', name: 'Extensión Tríceps Cuerda', targetSets: '3', targetReps: '12-15', notes: 'Bombeo final.' },
];

export const EXERCISES_PULL: Exercise[] = [
  { id: 'pull_pullups', name: 'Dominadas (o Jalón)', targetSets: '3-4', targetReps: 'Fallo', notes: 'USA STRAPS. Depresión escapular.' },
  { id: 'pull_row_div', name: 'Remo Máq. Divergente', targetSets: '3-4', targetReps: '8-10', notes: 'Densidad.' },
  { id: 'pull_row_low', name: 'Remo Polea Baja', targetSets: '3-4', targetReps: '10-12', notes: 'Amplitud.' },
  { id: 'pull_rear_fly', name: 'Vuelos Posteriores Máq.', targetSets: '3-4', targetReps: '12-15', notes: 'Hombro 3D.' },
  { id: 'pull_shrugs', name: 'Encogimientos Manc.', targetSets: '3-4', targetReps: '10-12', notes: 'Usa Straps.' },
  { id: 'pull_curl_preach', name: 'Curl Bíceps Predicador', targetSets: '3', targetReps: '10-12', notes: 'Aislamiento estricto.' },
  { id: 'pull_hammer', name: 'Curl Martillo Manc.', targetSets: '3', targetReps: '10-12', notes: 'Enfoque Braquial.' },
];

export const EXERCISES_LEGS: Exercise[] = [
  { id: 'legs_hack', name: 'Sentadilla Hack', targetSets: '4', targetReps: '8-10', notes: 'Ejercicio Principal. Profundidad.' },
  { id: 'legs_press', name: 'Prensa de Piernas', targetSets: '3-4', targetReps: '10-12', notes: 'Carga masiva sin bloquear.' },
  { id: 'legs_ext', name: 'Extensión Cuádriceps', targetSets: '3', targetReps: '15-20', notes: 'Detalle y quemazón.' },
  { id: 'legs_calves', name: 'Elevación Talones', targetSets: '4', targetReps: '12-15', notes: 'Prensa o Máquina.' },
  { id: 'legs_abs_vkr', name: 'Abdominales VKR', targetSets: '4-6', targetReps: '15', notes: 'Flexión de cadera controlada.' },
];

export const EXERCISES_UPPER: Exercise[] = [
  { id: 'upp_inc_db', name: 'Press Inclinado Manc.', targetSets: '3-4', targetReps: '10', notes: 'Estabilidad.' },
  { id: 'upp_lat_pull', name: 'Jalón al Pecho Prono', targetSets: '3-4', targetReps: '8-10', notes: 'V-Taper.' },
  { id: 'upp_dips', name: 'Fondos en Paralelas', targetSets: '3-4', targetReps: '10-12', notes: 'Potencia.' },
  { id: 'upp_low_row', name: 'Remo Polea Baja', targetSets: '3-4', targetReps: '10-12', notes: 'Agarre ancho. Grosor.' },
  { id: 'upp_peck', name: 'Peck Deck (Aperturas)', targetSets: '3-4', targetReps: '12-15', notes: 'Aislamiento.' },
  { id: 'upp_pullover', name: 'Pullover Polea Alta', targetSets: '3', targetReps: '15', notes: 'Expansión / Serratos.' },
  { id: 'upp_tri_mach', name: 'Press Tríceps Sentado', targetSets: '3-4', targetReps: '10-12', notes: 'Aislamiento.' },
  { id: 'upp_curl_pre', name: 'Curl Predicador Máq.', targetSets: '3-4', targetReps: '10-12', notes: 'Aislamiento.' },
];

export const EXERCISES_LOWER: Exercise[] = [
  { id: 'low_hip', name: 'Hip Thrust Máquina', targetSets: '4', targetReps: '10-12', notes: 'Glúteo/Isquio. Bloquea arriba.' },
  { id: 'low_rdl', name: 'Peso Muerto Rumano', targetSets: '4', targetReps: '10-12', notes: 'Mancuernas. Isquios.' },
  { id: 'low_curl', name: 'Curl Femoral', targetSets: '4', targetReps: '12-15', notes: 'Sentado o acostado.' },
  { id: 'low_press_high', name: 'Prensa Pies Altos', targetSets: '3-4', targetReps: '12', notes: 'Énfasis Glúteo.' },
  { id: 'low_goblet', name: 'Sentadilla Goblet', targetSets: '3', targetReps: '12-15', notes: 'Bombeo final.' },
  { id: 'low_calves', name: 'Elevación Talones', targetSets: '4', targetReps: '15-20', notes: 'De pie o sentado.' },
  { id: 'low_crunch', name: 'Crunch Abdominal Máq.', targetSets: '4-6', targetReps: '15', notes: 'Flexión tronco.' },
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
    description: "Fase I: Recorte Final. Eficiencia metabólica. Mantener cargas, bajar volumen.",
    nutritionGoal: "Déficit -400kcal (12G/9P)",
    cardio: "30-40 min Post-Pesas",
    trainingFocus: "Fuerza RIR 1-2 (3 Series)"
  },
  {
    name: PhaseType.RESET_FEB,
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    description: "Fase II: Reset Hormonal. Estabilización del set-point y recuperación del SNC.",
    nutritionGoal: "Normocalórica (10G/8P)",
    cardio: "30 min x 3 días",
    trainingFocus: "Técnica / Descarga"
  },
  {
    name: PhaseType.HYPERTROPHY_1,
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    description: "Fase III: Hipertrofia I. Ganancia muscular limpia (Lean Bulk).",
    nutritionGoal: "Superávit +250kcal (18G/12P)",
    cardio: "Mantenimiento",
    trainingFocus: "Volumen Alto (3-4 Series)"
  },
  {
    name: PhaseType.SUMMER_SHRED,
    startDate: '2026-06-01',
    endDate: '2026-07-31',
    description: "Fase IV: Summer Shred. Peak Estético (12% grasa).",
    nutritionGoal: "Déficit -400kcal (12G/9P)",
    cardio: "45 min LISS + 12k Pasos",
    trainingFocus: "Intensidad / Menos Volumen"
  },
  {
    name: PhaseType.HYPERTROPHY_2,
    startDate: '2026-08-01',
    endDate: '2026-11-30',
    description: "Fase V: Hipertrofia II. Máxima densidad. El día de la bestia.",
    nutritionGoal: "Superávit +400kcal (18G/12P)",
    cardio: "Mínimo",
    trainingFocus: "Carga Máxima / RIR 0-1"
  },
  {
    name: PhaseType.CONSOLIDATION,
    startDate: '2026-12-01',
    endDate: '2026-12-31',
    description: "Fase VI: Consolidación. Salud articular y reseteo metabólico.",
    nutritionGoal: "Normocalórica (10G/8P)",
    cardio: "Lúdico",
    trainingFocus: "RIR 3-4 / Salud"
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