import React, { useMemo } from 'react';
import Model from 'react-body-highlighter';

interface BodyHeatmapProps {
  muscleVolume: Record<string, number>;
  muscleSets: Record<string, number>; // series semanales
}

// Mapa nombre interno → react-body-highlighter keys
export const MUSCLE_MAPPING: Record<string, string[]> = {
  shoulders: ['front-deltoids', 'back-deltoids'],
  biceps: ['biceps'],
  chest: ['chest'],
  abs: ['abs', 'obliques'],
  quads: ['quadriceps'],
  triceps: ['triceps'],
  back: ['upper-back', 'lower-back'],
  glutes: ['gluteal'],
  hamstrings: ['hamstring'],
  calves: ['calves'],
  traps: ['trapezius'],
  forearms: ['forearm'],
};

// Mapa nombre interno → etiqueta legible en español
export const MUSCLE_LABELS: Record<string, string> = {
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  chest: 'Pecho',
  abs: 'Abdominales',
  quads: 'Cuádriceps',
  triceps: 'Tríceps',
  back: 'Dorsales',
  glutes: 'Glúteos',
  hamstrings: 'Isquiotibiales',
  calves: 'Gemelos',
  traps: 'Trapecio',
  forearms: 'Antebrazos',
};

export const BodyHeatmap: React.FC<BodyHeatmapProps> = ({ muscleVolume = {}, muscleSets = {} }) => {
  const totalSets = Object.values(muscleSets || {}).reduce((a: number, b: number) => a + b, 0);

  // Generamos el array de datos para react-body-highlighter
  // Repetimos los ejercicios tantas veces como sets para incrementar su 'frequency'
  const modelData = useMemo(() => {
    const data: Array<{ name: string; muscles: string[] }> = [];
    Object.entries(muscleSets).forEach(([key, sets]) => {
      const targetMuscles = MUSCLE_MAPPING[key] || [];
      if (targetMuscles.length > 0) {
        // Expand sets to individual items to build frequency
        for (let i = 0; i < sets; i++) {
          data.push({ name: `${key}-${i}`, muscles: targetMuscles });
        }
      }
    });
    return data;
  }, [muscleSets]);

  // Generamos escala de color continua (hasta MAX_SETS = 40)
  const MAX_SETS = 40;
  const highlightedColors = useMemo(() => {
    return Array.from({ length: MAX_SETS }, (_, i) => {
      const sets = i + 1;
      const ratio = Math.min(sets / MAX_SETS, 1);
      const l = 0.3 + ratio * 0.25;
      const c = ratio * 0.18;
      const h = 30 - ratio * 20;
      return `oklch(${l} ${c} ${h})`;
    });
  }, []);

  return (
    <>
      <div className="flex justify-around items-center pt-4 pb-2">
        {/* FRONTAL */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Frontal</span>
          <Model
            data={modelData}
            type="anterior"
            bodyColor="#1e293b" // slate-800
            highlightedColors={highlightedColors}
            style={{ width: '8rem', color: '#1e293b' }}
          />
        </div>

        {/* TRASERO */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Trasero</span>
          <Model
            data={modelData}
            type="posterior"
            bodyColor="#1e293b"
            highlightedColors={highlightedColors}
            style={{ width: '8rem', color: '#1e293b' }}
          />
        </div>
      </div>
    </>
  );
};
