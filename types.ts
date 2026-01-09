export enum PhaseType {
  CUT_JAN = 'Fase 1: Recorte Final',
  RESET_FEB = 'Fase 2: Transición/Reset',
  HYPERTROPHY_1 = 'Fase 3: Hipertrofia I',
  SUMMER_SHRED = 'Fase 4: Summer Shred',
  HYPERTROPHY_2 = 'Fase 5: Hipertrofia II',
  CONSOLIDATION = 'Fase 6: Consolidación',
  UNKNOWN = 'Fuera de Plan'
}

export enum RoutineType {
  PUSH = 'Push (Pecho/Hombro/Tríceps)',
  PULL = 'Pull (Espalda/Bíceps)',
  LEGS = 'Legs (Cuádriceps)',
  UPPER = 'Upper (Torso Híbrido)',
  LOWER = 'Lower (Glúteo/Femoral)',
  REST = 'Descanso'
}

export interface Exercise {
  id: string;
  name: string;
  targetSets: string; // e.g. "2 series", "3-4 series"
  targetReps: string; // e.g. "8-12"
  notes?: string;
}

export interface ExerciseAlternative {
  main: string; // Peso Libre
  secondary: string; // Máquina/Cable
  note: string;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  rir?: number;
}

export interface WorkoutLogEntry {
  exerciseId: string;
  sets: WorkoutSet[];
  completed?: boolean;
}

export interface DailyLog {
  date: string; // ISO string YYYY-MM-DD
  weight?: number;
  isRefeed?: boolean; // New: Gestion de Glucogeno
  
  // Antropometria
  waist?: number;
  chest?: number; // Hombros/Pecho
  arm?: number;
  thigh?: number;
  
  // Biofeedback
  sleep?: number; // 1-5
  energy?: number; // 1-5
  stress?: number; // 1-5
  
  notes?: string;
  workoutCompleted?: boolean;
  workoutType?: RoutineType;
  exercises?: WorkoutLogEntry[];
}

export interface PlanPhase {
  name: PhaseType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  description: string;
  nutritionGoal: string;
  cardio: string;
  trainingFocus: string; // e.g. "RIR 3-4, Volumen 50%"
}