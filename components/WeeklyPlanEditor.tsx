import React, { useState, useEffect } from 'react';
import { RoutineType } from '../types';
import { ROUTINE_MAPPING } from '../constants';
import { getWeeklyPlan, saveWeeklyPlan } from '../services/storage';
import { GripVertical, RefreshCw } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' }
];

const ROUTINE_COLORS: Record<string, string> = {
  [RoutineType.PUSH]: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  [RoutineType.PULL]: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  [RoutineType.LEGS]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  [RoutineType.UPPER]: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  [RoutineType.LOWER]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  [RoutineType.REST]: 'bg-zinc-800 text-zinc-400 border-zinc-700'
};

const ROUTINE_OPTIONS = [RoutineType.PUSH, RoutineType.PULL, RoutineType.LEGS, RoutineType.UPPER, RoutineType.LOWER, RoutineType.REST];

export const WeeklyPlanEditor: React.FC = () => {
  const [plan, setPlan] = useState<Record<number, RoutineType>>({});
  const [draggedRoutine, setDraggedRoutine] = useState<RoutineType | null>(null);

  useEffect(() => {
    const saved = getWeeklyPlan();
    setPlan(saved || { ...ROUTINE_MAPPING });
  }, []);

  const handleUpdate = (day: number, routine: RoutineType) => {
    const newPlan = { ...plan, [day]: routine };
    setPlan(newPlan);
    saveWeeklyPlan(newPlan);
  };

  const handleReset = () => {
    setPlan({ ...ROUTINE_MAPPING });
    saveWeeklyPlan({ ...ROUTINE_MAPPING });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Planificador Semanal</h3>
        <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-lg transition-colors uppercase tracking-widest">
          <RefreshCw size={12} /> Reset
        </button>
      </div>

      <div className="text-xs text-zinc-400 mb-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl leading-relaxed">
        Arrastra rutinas desde la paleta hasta el día que desees, o usa el menú desplegable en cada día.
      </div>

      {/* Routine Bank */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
        {ROUTINE_OPTIONS.map(routine => (
          <div
            key={routine}
            draggable
            onDragStart={() => setDraggedRoutine(routine)}
            onDragEnd={() => setDraggedRoutine(null)}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl border cursor-grab active:cursor-grabbing flex items-center gap-1.5 transition-transform hover:scale-105 ${ROUTINE_COLORS[routine] || ROUTINE_COLORS[RoutineType.REST]}`}
          >
            <GripVertical size={12} className="opacity-50" />
            {routine.split(' ')[0]}
          </div>
        ))}
      </div>

      {/* Weekly Slots */}
      <div className="space-y-2">
        {DAYS.map(day => (
          <div
            key={day.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedRoutine) {
                handleUpdate(day.id, draggedRoutine);
              }
            }}
            className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
          >
            <span className="text-xs font-bold text-zinc-300 w-24">{day.name}</span>
            <select
              value={plan[day.id] || RoutineType.REST}
              onChange={(e) => handleUpdate(day.id, e.target.value as RoutineType)}
              className={`flex-1 ml-4 px-3 py-2 text-xs font-bold rounded-xl border focus:outline-none appearance-none cursor-pointer text-center ${ROUTINE_COLORS[plan[day.id] || RoutineType.REST]}`}
            >
              {ROUTINE_OPTIONS.map(opt => (
                <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
