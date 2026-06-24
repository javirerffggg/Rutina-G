export const RADAR_AXES = [
  { key: 'Pecho', label: 'Pecho' },
  { key: 'Espalda', label: 'Espalda' },
  { key: 'Hombros', label: 'Hombros' },
  { key: 'Brazos', label: 'Brazos' },
  { key: 'Cuádriceps', label: 'Cuádriceps' },
  { key: 'Cadena Posterior', label: 'Cad. Posterior' },
];

export const RADAR_EXERCISE_MAPPING: Record<string, string> = {
  // Pecho
  'push_bench_mach': 'Pecho',
  'push_incline_mach': 'Pecho',
  'push_dips': 'Pecho',
  'upp_dips': 'Pecho',
  'upp_peck': 'Pecho',
  'upp_bench_plate': 'Pecho',
  
  // Espalda
  'pull_pullups': 'Espalda',
  'pull_row_div': 'Espalda',
  'pull_row_low': 'Espalda',
  'upp_low_row': 'Espalda',
  'upp_lat_pull': 'Espalda',
  'pull_rear_fly': 'Espalda',
  'pull_shrugs': 'Espalda',

  // Hombros
  'push_shoulder_mach': 'Hombros',
  'push_lat_raise': 'Hombros',

  // Brazos
  'push_tri_seat': 'Brazos',
  'upp_tri_mach': 'Brazos',
  'push_tri_rope': 'Brazos',
  'upp_tri_rope': 'Brazos',
  'pull_curl_preach': 'Brazos',
  'pull_hammer': 'Brazos',
  'upp_curl_pre': 'Brazos',

  // Cuádriceps
  'legs_hack': 'Cuádriceps',
  'legs_press': 'Cuádriceps',
  'low_press': 'Cuádriceps',
  'legs_ext': 'Cuádriceps',
  'low_goblet': 'Cuádriceps',

  // Cadena Posterior
  'low_hip': 'Cadena Posterior',
  'low_back_ext': 'Cadena Posterior',
  'low_curl_ly': 'Cadena Posterior',
  'legs_calves': 'Cadena Posterior',
  'low_calves': 'Cadena Posterior',
};

export const getRadarData = (logs: any[], maxDays: number = 7) => {
  const setsData: Record<string, number> = {};
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);

  logs.forEach(log => {
    const logDate = new Date(log.date);
    logDate.setHours(0,0,0,0);
    const diffDays = Math.round(Math.abs(todayDate.getTime() - logDate.getTime()) / 86400000);

    if (diffDays <= maxDays && log.exercises) {
      log.exercises.forEach((ex: any) => {
        const category = RADAR_EXERCISE_MAPPING[ex.exerciseId || ex.id];
        if (!category) return; // Skip if it's not mapped (like core)
        
        const completedSets = ex.sets.filter((s: any) => s.completed && ((s.reps || 0) > 0 || (s.weight || 0) > 0));
        if (completedSets.length === 0) return;
        
        setsData[category] = (setsData[category] || 0) + completedSets.length;
      });
    }
  });

  const radarData = RADAR_AXES.map(({ key, label }) => ({
    muscle: label,
    sets: setsData[key] || 0,
  }));

  const maxSets = Math.max(...radarData.map(d => d.sets), 1);
  const hasMuscleData = radarData.some(d => d.sets > 0);

  return { radarData, hasMuscleData, maxSets };
};
