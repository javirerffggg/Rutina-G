import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import Model from 'react-body-highlighter';

interface BodyHeatmapProps {
  muscleVolume: Record<string, number>;
  muscleSets: Record<string, number>; // series semanales
}

// Mapa nombre interno → react-body-highlighter keys
const MUSCLE_MAPPING: Record<string, string[]> = {
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
const MUSCLE_LABELS: Record<string, string> = {
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
  const [showModal, setShowModal] = useState(false);

  const totalSets = Object.values(muscleSets || {}).reduce((a: number, b: number) => a + b, 0);

  const muscleList = Object.entries(MUSCLE_LABELS)
    .map(([key, label]) => ({ key, label, sets: (muscleSets && muscleSets[key]) || 0 }))
    .sort((a, b) => b.sets - a.sets);

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
      {/* Figura clickable */}
      <div
        className="cursor-pointer active:scale-95 transition-transform select-none"
        onClick={() => setShowModal(true)}
      >
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

        {/* Hint tap */}
        <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">
          Pulsa para ver detalle
        </p>
      </div>

      {/* Bottom Sheet Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full bg-slate-950 rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[80vh] flex flex-col">
            
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Carga Muscular Semanal
              </span>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1 px-5 py-3">
              {/* Total */}
              <div className="flex justify-between items-center py-3 border-b border-white/10 mb-1">
                <span className="text-sm font-bold text-white">Total</span>
                <span className="text-sm font-bold text-white">{totalSets}</span>
              </div>

              {muscleList.map(({ key, label, sets }) => (
                <div key={key} className="flex justify-between items-center py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    {/* Dot de color según volumen */}
                    <div className={`w-2 h-2 rounded-full ${
                      sets === 0 ? 'bg-slate-700' :
                      sets < 6 ? 'bg-amber-400' :
                      sets < 12 ? 'bg-emerald-400' :
                      'bg-red-400'
                    }`} />
                    <span className={`text-sm ${sets > 0 ? 'text-white' : 'text-slate-500'}`}>
                      {label}
                    </span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${sets > 0 ? 'text-white' : 'text-slate-600'}`}>
                    {sets}
                  </span>
                </div>
              ))}
            </div>

            {/* Leyenda */}
            <div className="px-5 py-4 border-t border-white/5 flex gap-4 justify-center">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <div className="w-2 h-2 rounded-full bg-amber-400" /> Bajo (1-5)
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400" /> Óptimo (6-12)
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <div className="w-2 h-2 rounded-full bg-red-400" /> Alto (+12)
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
