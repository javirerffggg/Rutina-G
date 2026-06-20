import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Trash2, Dumbbell, ChevronUp, ChevronDown, Check, AlertTriangle, Minus } from 'lucide-react';
import { CustomRoutine, Exercise, ExerciseDBEntry } from '../types';
import { MUSCLE_NAMES_ES } from '../data/translations.es';
import { getSettings } from '../services/settings';

const EMOJIS = ['💪', '🏋️', '🦵', '🔥', '⚡', '🎯', '🏃', '🤸', '🧠', '💀', '👑', '🔱', '🦍', '🐅', '🦖', '🚀'];
const POPULAR_EXERCISES = ['Barbell Squat', 'Bench Press', 'Deadlift', 'Pull Up', 'Push Up', 'Overhead Press', 'Barbell Row', 'Dumbbell Curl'];
const MUSCLE_FILTERS = [{id:'chest', label:'Pecho'}, {id:'back', label:'Espalda'}, {id:'legs', label:'Pierna'}, {id:'shoulders', label:'Hombros'}, {id:'arms', label:'Brazos'}, {id:'core', label:'Core'}];
const EQUIPMENT_FILTERS = [{id:'barbell', label:'Barra'}, {id:'dumbbell', label:'Mancuerna'}, {id:'machine', label:'Máquina'}, {id:'body only', label:'Peso Corp.'}, {id:'cable', label:'Polea'}];

interface CustomRoutineBuilderProps {
  onClose: () => void;
  onSave: (routine: CustomRoutine) => void;
}

export const CustomRoutineBuilder: React.FC<CustomRoutineBuilderProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('');
  const [emoji, setEmoji] = useState('💪');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const settings = useMemo(() => getSettings(), []);
  
  const [db, setDb] = useState<ExerciseDBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [filterEquipment, setFilterEquipment] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    import('../data/exercises.json')
      .then((module) => {
        setDb(module.default as ExerciseDBEntry[]);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const filteredDb = useMemo(() => {
    let result = db;

    if (filterMuscle) {
      if (filterMuscle === 'arms') {
        result = result.filter(e => e.primaryMuscles.includes('biceps') || e.primaryMuscles.includes('triceps') || e.primaryMuscles.includes('forearms'));
      } else if (filterMuscle === 'legs') {
        result = result.filter(e => e.primaryMuscles.includes('quadriceps') || e.primaryMuscles.includes('hamstrings') || e.primaryMuscles.includes('glutes') || e.primaryMuscles.includes('calves'));
      } else if (filterMuscle === 'back') {
        result = result.filter(e => e.primaryMuscles.includes('lats') || e.primaryMuscles.includes('middle back') || e.primaryMuscles.includes('lower back'));
      } else if (filterMuscle === 'chest') {
        result = result.filter(e => e.primaryMuscles.includes('chest'));
      } else if (filterMuscle === 'shoulders') {
        result = result.filter(e => e.primaryMuscles.includes('shoulders'));
      } else if (filterMuscle === 'core') {
        result = result.filter(e => e.primaryMuscles.includes('abdominals'));
      }
    }

    if (filterEquipment) {
      result = result.filter(e => e.equipment?.toLowerCase().includes(filterEquipment));
    }

    if (!search && !filterMuscle && !filterEquipment) {
      return result.filter(e => POPULAR_EXERCISES.includes(e.name)).slice(0, 20);
    }
    
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(e => {
        const translatedMuscles = e.primaryMuscles.map(m => MUSCLE_NAMES_ES[m] || m);
        return e.name.toLowerCase().includes(lower) || 
               translatedMuscles.some(m => m.toLowerCase().includes(lower));
      });
    }

    return result.slice(0, 50); // limit to 50 for perf
  }, [db, search, filterMuscle, filterEquipment]);

  const addExercise = (entry: ExerciseDBEntry) => {
    if (exercises.some(e => e.id === entry.id)) return;
    const newEx: Exercise = {
      id: entry.id,
      name: entry.name,
      targetSets: '3',
      targetReps: '10',
      targetRIR: 2,
      primaryMuscles: entry.primaryMuscles
    };
    setExercises(prev => [...prev, newEx]);
    setShowSearch(false);
    setSearch('');
    setFilterMuscle(null);
    setFilterEquipment(null);
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const moveExercise = (idx: number, dir: number) => {
    if (idx + dir < 0 || idx + dir >= exercises.length) return;
    setExercises(prev => {
      const clone = [...prev];
      const temp = clone[idx];
      clone[idx] = clone[idx + dir];
      clone[idx + dir] = temp;
      return clone;
    });
  };

  const updateNumeric = (idx: number, field: keyof Exercise, delta: number, min: number = 0) => {
    setExercises(prev => prev.map((e, i) => {
      if (i === idx) {
        const current = parseInt(e[field] as string) || min;
        return { ...e, [field]: Math.max(min, current + delta).toString() };
      }
      return e;
    }));
  };

  const handleClose = () => {
    if (name.trim() || exercises.length > 0) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (!name.trim() || exercises.length === 0) return;
    const routine: CustomRoutine = {
      id: `CUSTOM_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      folder: settings.routineFolders && folder.trim() ? folder.trim() : undefined,
      emoji: emoji,
      exercises
    };
    onSave(routine);
  };

  const canSave = name.trim() && exercises.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-[85vh] overflow-hidden premium-bisel animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 shrink-0">
          <h2 className="text-xl font-display font-bold text-white">Crear Rutina</h2>
          <button onClick={handleClose} className="text-zinc-500 hover:text-white"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Info Básica */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Icono</label>
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-14 h-[46px] bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-xl hover:border-brand-500/50 transition-all"
                >
                  {emoji}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 z-20 w-[240px] bg-zinc-800 border border-zinc-700 rounded-xl p-2 grid grid-cols-4 gap-1 shadow-xl">
                    {EMOJIS.map(em => (
                      <button 
                        key={em} 
                        onClick={() => { setEmoji(em); setShowEmojiPicker(false); }}
                        className="h-10 rounded-lg hover:bg-zinc-700 text-lg flex items-center justify-center transition-colors"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Ej: Pierna Pesada"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 h-[46px] text-white focus:border-brand-500 focus:outline-none transition-all font-bold"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Descripción (Opcional)</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Ej: Enfoque en sentadilla pesada y aislamientos."
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-brand-500 focus:outline-none transition-all"
              />
            </div>

            {settings.routineFolders && (
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Carpeta / Etiqueta (Opcional)</label>
                <input 
                  type="text" 
                  value={folder} 
                  onChange={e => setFolder(e.target.value)} 
                  placeholder="Ej: Fuerza, Hipertrofia, Piernas..."
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* Ejercicios */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex justify-between items-center">
              Ejercicios ({exercises.length})
            </h3>
            
            {exercises.length === 0 ? (
              <div className="p-8 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/20">
                <Dumbbell size={32} className="mb-2 opacity-50"/>
                <p className="text-sm font-bold">Sin ejercicios</p>
                <p className="text-xs">Añade tu primer ejercicio abajo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="bg-zinc-900/60 border border-white/5 p-3 rounded-2xl flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <p className="text-sm font-bold text-white leading-tight">{ex.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mt-1">
                          {ex.primaryMuscles?.map(m => MUSCLE_NAMES_ES[m] || m).join(', ') || 'Varios'}
                        </p>
                      </div>
                      <div className="flex flex-col items-center bg-black/30 rounded-lg p-0.5 border border-white/5 shrink-0">
                        <button onClick={() => moveExercise(idx, -1)} disabled={idx === 0} className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors">
                          <ChevronUp size={16} />
                        </button>
                        <button onClick={() => moveExercise(idx, 1)} disabled={idx === exercises.length - 1} className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors">
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Steppers */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-2 flex flex-col items-center">
                         <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Sets</span>
                         <div className="flex items-center justify-between w-full">
                           <button onClick={() => updateNumeric(idx, 'targetSets', -1, 1)} className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white"><Minus size={12}/></button>
                           <span className="text-sm font-black text-white">{ex.targetSets}</span>
                           <button onClick={() => updateNumeric(idx, 'targetSets', 1)} className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white"><Plus size={12}/></button>
                         </div>
                      </div>
                      <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-2 flex flex-col items-center">
                         <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Reps</span>
                         <div className="flex items-center justify-between w-full">
                           <button onClick={() => updateNumeric(idx, 'targetReps', -1, 1)} className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white"><Minus size={12}/></button>
                           <span className="text-sm font-black text-white">{ex.targetReps}</span>
                           <button onClick={() => updateNumeric(idx, 'targetReps', 1)} className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white"><Plus size={12}/></button>
                         </div>
                      </div>
                      <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-2 flex flex-col items-center relative">
                         <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">RIR</span>
                         <div className="flex items-center justify-between w-full">
                           <button onClick={() => updateNumeric(idx, 'targetRIR', -1, 0)} className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white"><Minus size={12}/></button>
                           <span className="text-sm font-black text-white">{ex.targetRIR ?? 2}</span>
                           <button onClick={() => updateNumeric(idx, 'targetRIR', 1)} className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white"><Plus size={12}/></button>
                         </div>
                      </div>
                      <button onClick={() => removeExercise(idx)} className="h-[52px] w-[42px] rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20 hover:bg-red-500/20 transition-all ml-1">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowSearch(true)} className="w-full py-4 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-brand-500/20 transition-all mt-4">
              <Plus size={16}/> Añadir Ejercicio
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-zinc-950 flex flex-col gap-2 shrink-0">
          {!canSave && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest justify-center">
              <AlertTriangle size={12} /> Añade un nombre y al menos 1 ejercicio
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-4 rounded-xl bg-brand-500 text-white font-bold uppercase tracking-[0.2em] text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:bg-brand-400 transition-all active:scale-[0.98]"
          >
            Guardar Rutina
          </button>
        </div>

      </div>

      {/* Modal Descartar Cambios */}
      {showCloseConfirm && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">¿Descartar cambios?</h3>
              <p className="text-zinc-400 text-sm mb-6">Si cierras ahora, se perderá la rutina que estás creando.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowCloseConfirm(false)} className="py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-700 transition-colors">Seguir Editando</button>
                <button onClick={() => { setShowCloseConfirm(false); onClose(); }} className="py-3 rounded-xl bg-red-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-400 transition-colors">Descartar</button>
              </div>
           </div>
        </div>
      )}

      {/* Selector de Ejercicios Modal/Drawer */}
      {showSearch && (
        <div className="absolute inset-0 z-50 bg-zinc-950 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
          <div className="p-4 border-b border-white/5 flex gap-3 items-center bg-zinc-900/50 shrink-0">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
              <input 
                autoFocus
                type="text" 
                placeholder="Buscar ejercicio o músculo..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-white focus:border-brand-500 focus:outline-none transition-colors"
              />
            </div>
            <button onClick={() => setShowSearch(false)} className="text-xs font-bold uppercase tracking-widest text-zinc-400">Volver</button>
          </div>
          
          {/* Filters */}
          <div className="px-4 py-3 border-b border-white/5 bg-zinc-950 shrink-0 space-y-3">
             <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x pb-1">
               {MUSCLE_FILTERS.map(f => (
                 <button 
                   key={f.id} 
                   onClick={() => setFilterMuscle(filterMuscle === f.id ? null : f.id)}
                   className={`snap-center shrink-0 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${filterMuscle === f.id ? 'bg-brand-500 border-brand-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                 >
                   {f.label}
                 </button>
               ))}
             </div>
             <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x pb-1">
               {EQUIPMENT_FILTERS.map(f => (
                 <button 
                   key={f.id} 
                   onClick={() => setFilterEquipment(filterEquipment === f.id ? null : f.id)}
                   className={`snap-center shrink-0 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${filterEquipment === f.id ? 'bg-zinc-200 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                 >
                   {f.label}
                 </button>
               ))}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-20 custom-scrollbar">
            {loading ? (
              <div className="py-10 text-center text-zinc-500 text-sm">Cargando base de datos...</div>
            ) : filteredDb.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 text-sm">No se encontraron ejercicios con esos filtros.</div>
            ) : (
              filteredDb.map(entry => {
                const isAdded = exercises.some(e => e.id === entry.id);
                return (
                  <button 
                    key={entry.id} 
                    onClick={() => addExercise(entry)} 
                    disabled={isAdded}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-4 ${isAdded ? 'bg-emerald-950/20 border-emerald-500/20 opacity-70' : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-800 hover:border-zinc-700'}`}
                  >
                    {entry.images && entry.images.length > 0 ? (
                      <img src={`/exercises/${entry.images[0]}`} className="w-12 h-12 rounded-lg object-cover bg-black" loading="lazy" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600"><Dumbbell size={20}/></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate leading-tight">{entry.name}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate mt-1">
                        {entry.primaryMuscles.map(m => MUSCLE_NAMES_ES[m] || m).join(', ')}
                      </p>
                    </div>
                    {isAdded ? (
                      <div className="flex flex-col items-center justify-center text-emerald-500 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 shrink-0">
                        <Check size={16} />
                      </div>
                    ) : (
                      <Plus size={20} className="text-zinc-500 shrink-0 mr-2"/>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
};

