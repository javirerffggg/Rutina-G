export enum PhaseType {
  CUT_JAN       = 'Fase 1: Recorte Final',
  RESET_FEB     = 'Fase 2: Transici\u00f3n/Reset',
  HYPERTROPHY_1 = 'Fase 3: Hipertrofia I',
  SUMMER_SHRED  = 'Fase 4: Summer Shred',
  HYPERTROPHY_2 = 'Fase 5: Hipertrofia II',
  CONSOLIDATION = 'Fase 6: Consolidaci\u00f3n',
  UNKNOWN       = 'Fuera de Plan'
}

export enum RoutineType {
  PUSH  = 'Push (Pecho/Hombro/Tr\u00edceps)',
  PULL  = 'Pull (Espalda/B\u00edceps)',
  LEGS  = 'Legs (Cu\u00e1driceps)',
  UPPER = 'Upper (Torso H\u00edbrido)',
  LOWER = 'Lower (Gl\u00fateo/Femoral)',
  REST  = 'Descanso'
}

export interface Exercise {
  id: string;
  name: string;
  /** e.g. "3", "3-4" — use string to allow ranges; compare with startsWith/includes, not ===  */
  targetSets: string;
  targetReps: string;
  notes?: string;
  /** Optional override for rest timer in seconds */
  restSeconds?: number;
}

export interface ExerciseAlternative {
  main: string;
  secondary: string;
  note: string;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  rir?: number;
  completed?: boolean;
}

export interface WorkoutLogEntry {
  exerciseId: string;
  sets: WorkoutSet[];
  completed?: boolean;
}

export interface DailyLog {
  date: string; // ISO YYYY-MM-DD
  weight?: number;
  isRefeed?: boolean;

  // Antropometria
  waist?: number;
  chest?: number;
  arm?: number;
  thigh?: number;

  // Biofeedback
  sleep?: number;   // 1-5
  energy?: number;  // 1-5
  stress?: number;  // 1-5

  notes?: string;
  workoutCompleted?: boolean;
  workoutType?: RoutineType;
  exercises?: WorkoutLogEntry[];
  duration?: number; // minutes
}

export type PhaseKind = 'bulk' | 'volume' | 'cut' | 'deficit' | 'maintenance';

export interface PlanPhase {
  name: PhaseType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  description: string;
  nutritionGoal: string;
  cardio: string;
  trainingFocus: string;
  /** Drives badge color in Plan.tsx and supplement alert in Workout.tsx */
  type?: PhaseKind;
}
