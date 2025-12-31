import { Exercise, PhaseType, PlanPhase, RoutineType, ExerciseAlternative } from './types';

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

export const EXERCISE_ALTERNATIVES: Record<string, ExerciseAlternative> = {
  // PUSH
  'p_bench_machine': { main: 'Press de Banca con Barra', secondary: 'Press con Mancuernas', note: 'El peso libre requiere más estabilización. Las mancuernas permiten mayor estiramiento.' },
  'p_incline_machine': { main: 'Press Inclinado con Barra', secondary: 'Press Inclinado con Mancuernas', note: 'La inclinación debe ser 30º-45º para incidir en la zona clavicular.' },
  'p_dips': { main: 'Press Declinado', secondary: 'Press de Banca Agarre Cerrado', note: 'Si no hay paralelas, el press declinado ataca el pectoral inferior de forma similar.' },
  'p_shoulder_machine': { main: 'Press Militar con Barra', secondary: 'Press Mancuernas Sentado', note: 'En el press militar con barra, mantén el core fuerte y no arquees la espalda.' },
  'p_lat_raise': { main: 'Elevaciones Lat. en Polea', secondary: 'Elevaciones en Máquina', note: 'La polea mantiene la tensión constante en todo el recorrido.' },
  'p_tri_press': { main: 'Fondos entre Bancos', secondary: 'Press Francés Mancuernas', note: 'Los fondos entre bancos son excelentes si añades lastre sobre los muslos.' },
  'p_tri_ext': { main: 'Rompecráneos (Barra)', secondary: 'Patada de Tríceps', note: 'El press francés es un constructor de masa básico para las tres cabezas.' },
  
  // PULL
  'pu_pullups': { main: 'Dominadas con ayuda (goma)', secondary: 'Jalón al Pecho en Polea', note: 'Si no puedes hacer dominadas libres, el jalón es biomecánicamente similar.' },
  'pu_row_machine': { main: 'Remo con Barra (90º o 45º)', secondary: 'Remo Polea Baja (Gironda)', note: 'El remo con barra es el constructor de densidad por excelencia.' },
  'pu_row_cable': { main: 'Remo Mancuerna a una mano', secondary: 'Remo en Punta (Barra T)', note: 'En el remo con mancuerna, mantén el tronco horizontal para proteger lumbares.' },
  'pu_rear_delt': { main: 'Pájaros con Mancuernas', secondary: 'Cruces Poleas Invertido', note: 'Evita balancear el cuerpo para aislar el deltoides posterior.' },
  'pu_shrugs': { main: 'Encogimientos con Barra', secondary: 'Remo al Cuello', note: 'El remo al cuello también trabaja deltoides, pero enfatiza trapecio superior.' },
  'pu_curl_machine': { main: 'Curl con Barra de Pie', secondary: 'Curl con Barra Z', note: 'El curl con barra es el rey para masa de bíceps. No balancees.' },
  'pu_curl_hammer': { main: 'Curl Martillo Polea (Cuerda)', secondary: 'Curl con Barra Romana', note: 'El agarre neutro enfoca el trabajo en el braquial y braquiorradial.' },

  // LEGS
  'l_hack': { main: 'Sentadilla con Barra', secondary: 'Sentadilla en Multipower', note: 'La sentadilla libre requiere más técnica; el multipower centra el empuje.' },
  'l_press': { main: 'Zancadas (Barra/Mancuerna)', secondary: 'Sentadilla Jaca', note: 'Las zancadas requieren equilibrio pero trabajan glúteo y cuádriceps intensamente.' },
  'l_curl': { main: 'Peso Muerto Rumano', secondary: 'Curl Femoral de Pie', note: 'El Peso Muerto Rumano es superior para la cadena posterior. Espalda recta.' },
  'l_goblet': { main: 'Sentadilla Frontal Barra', secondary: 'Prensa (pies bajos/juntos)', note: 'La sentadilla frontal enfatiza más los cuádriceps y menos el glúteo.' },
  'l_ext': { main: 'Sentadilla Sissy', secondary: 'Zancadas Cortas', note: 'La Sissy es dura. Úsala con precaución si tienes problemas de rodilla.' },
  'l_hip': { main: 'Hip Thrust con Barra', secondary: 'Puente Glúteos Suelo', note: 'Aprieta arriba 1 segundo. El mejor constructor de glúteo.' },
  'l_calves': { main: 'Elevación Talones "Burro"', secondary: 'Elevación en Prensa', note: 'Si lo haces tipo burro, protege la espalda baja.' },
  'l_abs': { main: 'Crunch en Polea', secondary: 'Elevación Piernas Tumbado', note: 'Busca la sensación de "enrollamiento", no solo doblar la cintura.' },
};

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