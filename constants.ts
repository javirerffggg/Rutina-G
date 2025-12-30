import { Exercise, PhaseType, PlanPhase, RoutineType } from './types';

export const EXERCISES_PUSH: Exercise[] = [
  { id: 'p_bench_machine', name: 'Press de Banca en Máquina', targetSets: '2-3', targetReps: '6-10' },
  { id: 'p_incline_machine', name: 'Press Inclinado en Máquina', targetSets: '2-3', targetReps: '8-12' },
  { id: 'p_dips', name: 'Fondos en Paralelas/Máquina', targetSets: '2-3', targetReps: '8-12' },
  { id: 'p_shoulder_machine', name: 'Press de Hombro en Máquina', targetSets: '2-3', targetReps: '6-10' },
  { id: 'p_lat_raise', name: 'Elevaciones Laterales', targetSets: '2-4', targetReps: '10-15' },
  { id: 'p_tri_press', name: 'Máquina Press Tríceps Sentado', targetSets: '2-3', targetReps: '8-12' },
  { id: 'p_tri_ext', name: 'Ext. Tríceps Polea Cuerda', targetSets: '2-3', targetReps: '12-15' },
];

export const EXERCISES_PULL: Exercise[] = [
  { id: 'pu_pullups', name: 'Dominadas o Jalón al Pecho', targetSets: '2-3', targetReps: '6-10' },
  { id: 'pu_row_machine', name: 'Remo Máquina Horiz. Divergente', targetSets: '2-3', targetReps: '6-10' },
  { id: 'pu_row_cable', name: 'Remo Sentado Polea Baja', targetSets: '2-3', targetReps: '10-12', notes: 'Agarre Neutro/Cerrado' },
  { id: 'pu_rear_delt', name: 'Vuelos Posteriores en Máquina', targetSets: '2-4', targetReps: '12-15' },
  { id: 'pu_shrugs', name: 'Encogimientos con Mancuernas', targetSets: '2-3', targetReps: '10-15' },
  { id: 'pu_curl_machine', name: 'Curl de Bíceps en Máquina', targetSets: '2-3', targetReps: '8-12' },
  { id: 'pu_curl_hammer', name: 'Curl Martillo con Mancuernas', targetSets: '2-3', targetReps: '10-15' },
];

export const EXERCISES_LEGS: Exercise[] = [
  { id: 'l_hack', name: 'Sentadilla Hack en Máquina', targetSets: '2-4', targetReps: '6-12' },
  { id: 'l_press', name: 'Prensa de Piernas', targetSets: '2-4', targetReps: '8-15' },
  { id: 'l_curl', name: 'Curl Femoral', targetSets: '2-3', targetReps: '10-15' },
  { id: 'l_goblet', name: 'Sentadilla Goblet Mancuerna', targetSets: '2-4', targetReps: '6-15' },
  { id: 'l_ext', name: 'Extensiones de Cuádriceps', targetSets: '2-3', targetReps: '12-20' },
  { id: 'l_hip', name: 'Hip Thrust en Máquina', targetSets: '2-3', targetReps: '8-15' },
  { id: 'l_calves', name: 'Elevación de Talones', targetSets: '2-4', targetReps: '10-20' },
  { id: 'l_abs', name: 'Abdominales (Máquina/VKR)', targetSets: '2-4', targetReps: '12-15' },
];

export const PHASES: PlanPhase[] = [
  {
    name: PhaseType.TRANSITION,
    startDate: '2025-11-04',
    endDate: '2025-12-01',
    description: "Transición y Mantenimiento. Recuperación del ciclo de hipertrofia.",
    nutritionGoal: "Calorías de Mantenimiento",
    cardio: "1-2 sesiones LISS",
    trainingFocus: "Descarga (RIR 3-4)"
  },
  {
    name: PhaseType.DEFINITION_MAIN,
    startDate: '2025-12-02',
    endDate: '2026-03-30',
    description: "Definición Principal. Pérdida gradual (0.5-1% peso/semana).",
    nutritionGoal: "Déficit Calórico. Proteína ALTA",
    cardio: "3 sesiones LISS",
    trainingFocus: "Fuerza RIR 1-2"
  },
  {
    name: PhaseType.FINAL_POLISH,
    startDate: '2026-04-01',
    endDate: '2026-06-15',
    description: "Pulido Final. Alcanzar pico de definición.",
    nutritionGoal: "Déficit Agresivo",
    cardio: "4 sesiones LISS / HIIT",
    trainingFocus: "Intensidad Máxima"
  },
  {
    name: PhaseType.SUMMER,
    startDate: '2026-06-16',
    endDate: '2026-12-31',
    description: "Mantenimiento de Verano.",
    nutritionGoal: "Dieta Inversa",
    cardio: "1-2 sesiones",
    trainingFocus: "Mantenimiento RIR 2-3"
  }
];

export const ROUTINE_MAPPING: Record<number, RoutineType> = {
  1: RoutineType.PUSH, // Monday
  2: RoutineType.PULL, // Tuesday
  3: RoutineType.LEGS, // Wednesday
  4: RoutineType.PUSH, // Thursday
  5: RoutineType.PULL, // Friday
  6: RoutineType.LEGS, // Saturday
  0: RoutineType.REST  // Sunday
};