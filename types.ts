export enum PhaseType {
  TRANSITION = 'Transición y Mantenimiento',
  DEFINITION_MAIN = 'Definición Principal',
  FINAL_POLISH = 'Pulido Final',
  SUMMER = 'Mantenimiento de Verano',
  UNKNOWN = 'Fuera de Temporada'
}

export enum RoutineType {
  PUSH = 'Empuje (Pecho/Hombro/Tríceps)',
  PULL = 'Tirón (Espalda/Bíceps)',
  LEGS = 'Pierna',
  REST = 'Descanso'
}

export interface Exercise {
  id: string;
  name: string;
  targetSets: string; // e.g. "2 series", "3-4 series"
  targetReps: string; // e.g. "8-12"
  notes?: string;
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