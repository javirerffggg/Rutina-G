import React from 'react';

interface BodyHeatmapProps {
  muscleVolume: Record<string, number>;
}

const getVolumeColor = (reps: number = 0) => {
  if (reps < 30) return 'bg-slate-800 border border-slate-700'; // Descansado
  if (reps < 120) return 'bg-amber-500 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'; // Óptimo
  return 'bg-red-500 border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'; // Fatigado
};

export const BodyHeatmap: React.FC<BodyHeatmapProps> = ({ muscleVolume }) => {
  return (
    <div className="flex justify-around items-center pt-4 pb-2">
      {/* FIGURA FRONTAL */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Frontal</span>
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 bg-slate-800 rounded-full mb-0.5 border border-white/5" /> {/* Cabeza */}
          <div className="flex gap-1">
            {/* Brazo Izquierdo */}
            <div className="flex flex-col gap-1 mt-1">
              <div className={`w-4 h-5 rounded-full transition-colors ${getVolumeColor(muscleVolume.shoulders)}`} />
              <div className={`w-3 h-7 rounded-full mx-auto transition-colors ${getVolumeColor(muscleVolume.biceps)}`} />
            </div>
            {/* Torso */}
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                <div className={`w-7 h-8 rounded-tl-xl rounded-bl-sm transition-colors ${getVolumeColor(muscleVolume.chest)}`} />
                <div className={`w-7 h-8 rounded-tr-xl rounded-br-sm transition-colors ${getVolumeColor(muscleVolume.chest)}`} />
              </div>
              <div className={`w-10 h-10 mx-auto rounded-md transition-colors ${getVolumeColor(muscleVolume.abs)}`} />
            </div>
            {/* Brazo Derecho */}
            <div className="flex flex-col gap-1 mt-1">
              <div className={`w-4 h-5 rounded-full transition-colors ${getVolumeColor(muscleVolume.shoulders)}`} />
              <div className={`w-3 h-7 rounded-full mx-auto transition-colors ${getVolumeColor(muscleVolume.biceps)}`} />
            </div>
          </div>
          {/* Piernas (Quads) */}
          <div className="flex gap-1.5 mt-1">
            <div className={`w-6 h-14 rounded-lg transition-colors ${getVolumeColor(muscleVolume.quads)}`} />
            <div className={`w-6 h-14 rounded-lg transition-colors ${getVolumeColor(muscleVolume.quads)}`} />
          </div>
        </div>
      </div>

      {/* FIGURA TRASERA */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Trasero</span>
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 bg-slate-800 rounded-full mb-0.5 border border-white/5" /> {/* Cabeza */}
          <div className="flex gap-1">
            {/* Brazo Izquierdo */}
            <div className="flex flex-col gap-1 mt-1">
              <div className={`w-4 h-5 rounded-full transition-colors ${getVolumeColor(muscleVolume.shoulders)}`} />
              <div className={`w-3 h-7 rounded-full mx-auto transition-colors ${getVolumeColor(muscleVolume.triceps)}`} />
            </div>
            {/* Torso Trasero */}
            <div className="flex flex-col gap-1">
              <div className={`w-[52px] h-8 rounded-t-xl rounded-b-sm transition-colors ${getVolumeColor(muscleVolume.back)}`} />
              <div className={`w-10 h-10 mx-auto rounded-md transition-colors ${getVolumeColor(muscleVolume.back)}`} />
            </div>
            {/* Brazo Derecho */}
            <div className="flex flex-col gap-1 mt-1">
              <div className={`w-4 h-5 rounded-full transition-colors ${getVolumeColor(muscleVolume.shoulders)}`} />
              <div className={`w-3 h-7 rounded-full mx-auto transition-colors ${getVolumeColor(muscleVolume.triceps)}`} />
            </div>
          </div>
          {/* Tren Inferior Trasero */}
          <div className="flex flex-col gap-1 mt-1 items-center">
            <div className="flex gap-1">
              <div className={`w-7 h-5 rounded-t-lg rounded-b-sm transition-colors ${getVolumeColor(muscleVolume.glutes)}`} />
              <div className={`w-7 h-5 rounded-t-lg rounded-b-sm transition-colors ${getVolumeColor(muscleVolume.glutes)}`} />
            </div>
            <div className="flex gap-1">
              <div className={`w-6 h-8 rounded-sm transition-colors ${getVolumeColor(muscleVolume.hamstrings)}`} />
              <div className={`w-6 h-8 rounded-sm transition-colors ${getVolumeColor(muscleVolume.hamstrings)}`} />
            </div>
            <div className="flex gap-1">
              <div className={`w-5 h-7 rounded-b-lg transition-colors ${getVolumeColor(muscleVolume.calves)}`} />
              <div className={`w-5 h-7 rounded-b-lg transition-colors ${getVolumeColor(muscleVolume.calves)}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
