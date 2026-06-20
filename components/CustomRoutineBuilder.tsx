import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Trash2, Dumbbell, Activity, Target } from 'lucide-react';
import { CustomRoutine, Exercise, ExerciseDBEntry } from '../types';
import { MUSCLE_NAMES_ES } from '../data/translations.es';

interface CustomRoutineBuilderProps {
  onClose: () => void;
  onSave: (routine: CustomRoutine) => void;
}

export const CustomRoutineBuilder: React.FC<CustomRoutineBuilderProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💪');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  const [db, setDb] = useState<ExerciseDBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    import('../data/exercises.json')
      .then((module) => {
        setDb(module.default as ExerciseDBEntry[]);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const filteredDb = useMemo(() => {
    if (!search) return db.slice(0, 20); // show some by default
    const lower = search.toLowerCase();
    return db.filter(e => {
      const translatedMuscles = e.primaryMuscles.map(m => MUSCLE_NAMES_ES[m] || m);
      return e.name.toLowerCase().includes(lower) || 
             translatedMuscles.some(m => m.toLowerCase().includes(lower));
    }).slice(0, 50); // limit to 50 for perf
  }, [db, search]);

  const addExercise = (entry: ExerciseDBEntry) => {
    const newEx: Exercise = {
      id: entry.id,
      name: entry.name,
      targetSets: '3',
      targetReps: '10',
    };
    setExercises(prev => [...prev, newEx]);
    setShowSearch(false);
    setSearch('');
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, field: keyof Exercise, value: string) => {
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const handleSave = () => {
    if (!name.trim() || exercises.length === 0) return;
    const routine: CustomRoutine = {
      id: `CUSTOM_${Date.now()}`,
      name: name.trim(),
      emoji: emoji.trim() || '💪',
      exercises
    };
    onSave(routine);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-[80vh] overflow-hidden premium-bisel animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-display font-bold text-white">Crear Rutina</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Info Básica */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-16">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Icono</label>
                <input 
                  type="text" 
                  value={emoji} 
                  onChange={e => setEmoji(e.target.value)} 
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-center text-xl focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Ej: Pierna Pesada"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Ejercicios */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex justify-between items-center">
              Ejercicios ({exercises.length})
            </h3>
            
            {exercises.length === 0 ? (
              <div className="p-8 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600">
                <Dumbbell size={32} className="mb-2 opacity-50"/>
                <p className="text-sm font-bold">Sin ejercicios</p>
                <p className="text-xs">Añade tu primer ejercicio abajo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="bg-zinc-900/80 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{ex.name}</p>
                      <div className="flex gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                          <span className="text-[9px] text-zinc-500 uppercase font-bold">Sets</span>
                          <input type="text" value={ex.targetSets} onChange={e=>updateExercise(idx,'targetSets',e.target.value)} className="w-8 bg-transparent text-white text-xs text-center focus:outline-none font-bold" />
                        </div>
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                          <span className="text-[9px] text-zinc-500 uppercase font-bold">Reps</span>
                          <input type="text" value={ex.targetReps} onChange={e=>updateExercise(idx,'targetReps',e.target.value)} className="w-8 bg-transparent text-white text-xs text-center focus:outline-none font-bold" />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeExercise(idx)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowSearch(true)} className="w-full py-4 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-brand-500/20 transition-all">
              <Plus size={16}/> Añadir Ejercicio
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-zinc-950">
          <button 
            onClick={handleSave}
            disabled={!name.trim() || exercises.length === 0}
            className="w-full py-4 rounded-xl bg-brand-500 text-white font-bold uppercase tracking-[0.2em] text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(217,119,6,0.3)]"
          >
            Guardar Rutina
          </button>
        </div>

      </div>

      {/* Selector de Ejercicios Modal/Drawer */}
      {showSearch && (
        <div className="absolute inset-0 z-50 bg-zinc-950 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
          <div className="p-4 border-b border-white/5 flex gap-3 items-center bg-zinc-900/50">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
              <input 
                autoFocus
                type="text" 
                placeholder="Buscar ejercicio o músculo..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button onClick={() => setShowSearch(false)} className="text-xs font-bold uppercase tracking-widest text-zinc-400">Cancelar</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="py-10 text-center text-zinc-500 text-sm">Cargando base de datos...</div>
            ) : filteredDb.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 text-sm">No se encontraron ejercicios.</div>
            ) : (
              filteredDb.map(entry => (
                <button key={entry.id} onClick={() => addExercise(entry)} className="w-full text-left p-3 rounded-xl border border-white/5 bg-zinc-900/30 hover:bg-zinc-800 transition-all flex items-center gap-4">
                  {entry.images && entry.images.length > 0 ? (
                    <img src={`/exercises/${entry.images[0]}`} className="w-12 h-12 rounded-lg object-cover bg-black" loading="lazy" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600"><Dumbbell size={20}/></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{entry.name}</p>
                    <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest truncate mt-0.5">
                      {entry.primaryMuscles.map(m => MUSCLE_NAMES_ES[m] || m).join(', ')}
                    </p>
                  </div>
                  <Plus size={16} className="text-zinc-500 shrink-0"/>
                </button>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
