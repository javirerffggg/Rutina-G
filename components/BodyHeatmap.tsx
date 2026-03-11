import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface BodyHeatmapProps {
  muscleVolume: Record<string, number>;
  muscleSets: Record<string, number>; // series semanales
}

const getVolumeColor = (reps: number = 0) => {
  if (reps < 30) return 'bg-slate-800 border border-slate-700';
  if (reps < 120) return 'bg-amber-500 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
  return 'bg-red-500 border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
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

  return (
    <>
      {/* Figura clickable */}
      <div
        className="cursor-pointer active:scale-95 transition-transform select-none"
        onClick={() => setShowModal(true)}
      >
        {/* —— figura original sin cambios —— */}
        <div className="flex justify-around items-center pt-4 pb-2">
          {/* FRONTAL */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Frontal</span>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 bg-slate-800 rounded-full mb-0.5 border border-white/5" />
              <div className="flex gap-1">
                <div className="flex flex-col gap-1 mt-1">
                  <div className={`w-4 h-5 rounded-full transition-colors ${getVolumeColor(muscleVolume['shoulders'])}`} />
                  <div className={`w-3 h-7 rounded-full mx-auto transition-colors ${getVolumeColor(muscleVolume['biceps'])}`} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    <div className={`w-7 h-8 rounded-tl-xl rounded-bl-sm transition-colors ${getVolumeColor(muscleVolume['chest'])}`} />
                    <div className={`w-7 h-8 rounded-tr-xl rounded-br-sm transition-colors ${getVolumeColor(muscleVolume['chest'])}`} />
                  </div>
                  <div className={`w-10 h-10 mx-auto rounded-md transition-colors ${getVolumeColor(muscleVolume['abs'])}`} />
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <div className={`w-4 h-5 rounded-full transition-colors ${getVolumeColor(muscleVolume['shoulders'])}`} />
                  <div className={`w-3 h-7 rounded-full mx-auto transition-colors ${getVolumeColor(muscleVolume['biceps'])}`} />
                </div>
              </div>
              <div className="flex gap-1.5 mt-1">
                <div className={`w-6 h-14 rounded-lg transition-colors ${getVolumeColor(muscleVolume['quads'])}`} />
                <div className={`w-6 h-14 rounded-lg transition-colors ${getVolumeColor(muscleVolume['quads'])}`} />
              </div>
            </div>
          </div>
          {/* TRASERO */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Trasero</span>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 bg-slate-800 rounded-full mb-0.5 border border-white/5" />
              <div className="flex gap-1">
                <div className="flex flex-col gap-1 mt-1">
                  <div className={`w-4 h-5 rounded-full transition-colors ${getVolumeColor(muscleVolume['shoulders'])}`} />
                  <div className={`w-3 h-7 rounded-full mx-auto transition-colors ${getVolumeColor(muscleVolume['triceps'])}`} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className={`w-[52px] h-8 rounded-t-xl rounded-b-sm transition-colors ${getVolumeColor(muscleVolume['back'])}`} />
                  <div className={`w-10 h-10 mx-auto rounded-md transition-colors ${getVolumeColor(muscleVolume['back'])}`} />
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <div className={`w-4 h-5 rounded-full transition-colors ${getVolumeColor(muscleVolume['shoulders'])}`} />
                  <div className={`w-3 h-7 rounded-full mx-auto transition-colors ${getVolumeColor(muscleVolume['triceps'])}`} />
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-1 items-center">
                <div className="flex gap-1">
                  <div className={`w-7 h-5 rounded-t-lg rounded-b-sm transition-colors ${getVolumeColor(muscleVolume['glutes'])}`} />
                  <div className={`w-7 h-5 rounded-t-lg rounded-b-sm transition-colors ${getVolumeColor(muscleVolume['glutes'])}`} />
                </div>
                <div className="flex gap-1">
                  <div className={`w-6 h-8 rounded-sm transition-colors ${getVolumeColor(muscleVolume['hamstrings'])}`} />
                  <div className={`w-6 h-8 rounded-sm transition-colors ${getVolumeColor(muscleVolume['hamstrings'])}`} />
                </div>
                <div className="flex gap-1">
                  <div className={`w-5 h-7 rounded-b-lg transition-colors ${getVolumeColor(muscleVolume['calves'])}`} />
                  <div className={`w-5 h-7 rounded-b-lg transition-colors ${getVolumeColor(muscleVolume['calves'])}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hint tap */}
        <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">
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
