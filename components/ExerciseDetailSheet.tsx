import React, { useState, useMemo } from 'react';
import { X, BookOpen, History, LineChart as LineChartIcon, ChevronLeft, ChevronRight, Activity, CalendarDays, TrendingUp } from 'lucide-react';
import { ExerciseDBEntry, WorkoutLogEntry, WorkoutSet } from '../types';
import { BodyHeatmap } from './BodyHeatmap';
import { MUSCLE_NAMES_ES, EQUIPMENT_ES } from '../data/translations.es';
import { getExerciseHistory } from '../services/storage';
import { calculateOneRM } from '../utils';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid } from 'recharts';

interface ExerciseDetailSheetProps {
  entry: ExerciseDBEntry;
  exerciseLog?: WorkoutLogEntry;
  onClose: () => void;
}

type TabType = 'guide' | 'history' | 'chart';

export const ExerciseDetailSheet: React.FC<ExerciseDetailSheetProps> = ({ entry, exerciseLog, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('guide');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // History data
  const history = useMemo(() => getExerciseHistory(entry.id, 10), [entry.id]);
  
  // Chart data
  const chartData = useMemo(() => {
    return history.slice().reverse().map(h => {
      const date = new Date(h.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      // Estimate 1RM as the max 1RM of all sets in that session
      let max1RM = 0;
      h.log.sets.forEach((set: WorkoutSet) => {
         if (set.completed && set.weight && set.reps) {
            const rm = calculateOneRM(set.weight, set.reps);
            if (rm > max1RM) max1RM = rm;
         }
      });
      return { date, rawDate: h.date, oneRM: max1RM };
    }).filter(d => d.oneRM > 0);
  }, [history]);

  // Handle swipe images
  const nextImage = () => setCurrentImageIndex(i => (i + 1) % (entry.images?.length || 1));
  const prevImage = () => setCurrentImageIndex(i => (i - 1 + (entry.images?.length || 1)) % (entry.images?.length || 1));

  // Prepare heatmap data
  const heatmapSets = useMemo(() => {
    const data: Record<string, number> = {};
    entry.primaryMuscles?.forEach(m => data[m] = 20); // High intensity for primary
    entry.secondaryMuscles?.forEach(m => data[m] = 5); // Low intensity for secondary
    return data;
  }, [entry.primaryMuscles, entry.secondaryMuscles]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-zinc-400 font-medium mb-1">{label}</p>
          <p className="text-sm text-brand-400 font-semibold">1RM Est: {payload[0].value} kg</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full bg-zinc-950 rounded-t-3xl border-t border-white/10 shadow-2xl flex flex-col h-[90vh] premium-bisel animate-in slide-in-from-bottom-full duration-300">
        
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
        </div>

        {/* Header / Title */}
        <div className="flex justify-between items-center px-5 pb-3 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-display font-bold text-white tracking-tight truncate pr-4">
            {entry.name}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 border border-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          {/* Images Carousel */}
          {entry.images && entry.images.length > 0 && (
            <div className="relative w-full aspect-video bg-white flex items-center justify-center overflow-hidden">
              <img 
                src={`/exercises/${entry.images[currentImageIndex]}`} 
                className="w-full h-full object-contain mix-blend-multiply" 
                alt={`${entry.name} - Imagen ${currentImageIndex + 1}`} 
              />
              {entry.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white"><ChevronLeft size={20}/></button>
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white"><ChevronRight size={20}/></button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {entry.images.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-brand-500 w-3' : 'bg-black/40'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Metadata Chips */}
          <div className="p-5">
            <div className="flex flex-wrap gap-2 mb-6">
              {entry.equipment && (
                <span className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                  {EQUIPMENT_ES[entry.equipment] || entry.equipment}
                </span>
              )}
              {entry.level && (
                <span className="text-[10px] bg-brand-500/20 text-brand-400 border border-brand-500/30 font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                  Nivel {entry.level === 'beginner' ? 'Principiante' : entry.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                </span>
              )}
              {entry.force && (
                <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                  {entry.force === 'push' ? 'Empuje' : entry.force === 'pull' ? 'Tirón' : 'Estático'}
                </span>
              )}
              {entry.mechanic && (
                <span className="text-[10px] bg-violet-500/20 text-violet-400 border border-violet-500/30 font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                  {entry.mechanic === 'compound' ? 'Compuesto' : 'Aislamiento'}
                </span>
              )}
              {entry.category && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                  {MUSCLE_NAMES_ES[entry.category] || entry.category}
                </span>
              )}
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 mb-5">
              <button onClick={() => setActiveTab('guide')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${activeTab === 'guide' ? 'bg-brand-500 text-white border-brand-400 shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}>
                <BookOpen size={16}/> Guía
              </button>
              <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${activeTab === 'history' ? 'bg-brand-500 text-white border-brand-400 shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}>
                <History size={16}/> Historial
              </button>
              <button onClick={() => setActiveTab('chart')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${activeTab === 'chart' ? 'bg-brand-500 text-white border-brand-400 shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}>
                <LineChartIcon size={16}/> Gráfico
              </button>
            </div>

            {/* Tabs Content */}
            <div className="pb-8">
              {activeTab === 'guide' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Heatmap Section */}
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                     <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 text-center">Músculos Involucrados</h3>
                     <div className="pointer-events-none opacity-90 scale-95 transform origin-top pb-4">
                       <BodyHeatmap muscleVolume={{}} muscleSets={heatmapSets} />
                     </div>
                     <div className="flex flex-wrap justify-center gap-2 mt-2 pt-4 border-t border-white/5">
                        {entry.primaryMuscles?.map(m => (
                          <span key={`p-${m}`} className="text-xs font-bold text-white flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> {MUSCLE_NAMES_ES[m] || m}</span>
                        ))}
                        {entry.secondaryMuscles?.map(m => (
                          <span key={`s-${m}`} className="text-xs font-medium text-zinc-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> {MUSCLE_NAMES_ES[m] || m}</span>
                        ))}
                     </div>
                  </div>

                  {/* Instructions */}
                  {entry.instructions && entry.instructions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                         Paso a paso
                      </h3>
                      <div className="space-y-3">
                        {entry.instructions.map((inst, i) => (
                          <div key={i} className="flex gap-3 bg-zinc-900/40 p-4 rounded-2xl border border-white/5">
                            <div className="shrink-0 w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-black">
                              {i + 1}
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed pt-0.5">{inst}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  {history.length > 0 ? (
                    history.map((h, i) => {
                      const dateObj = new Date(h.date);
                      return (
                        <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                            <CalendarDays size={14} className="text-brand-400" />
                            <span className="text-sm font-bold text-white capitalize">
                              {dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {h.log.sets.map((set, sIdx) => {
                              if (!set.completed || !set.weight) return null;
                              return (
                                <div key={sIdx} className="flex justify-between items-center text-sm">
                                  <span className="text-zinc-500 font-medium">Serie {sIdx + 1}</span>
                                  <div className="font-bold text-zinc-300">
                                    <span className="text-white">{set.weight} kg</span> × {set.reps}
                                    {set.rir != null ? <span className="text-zinc-500 ml-1 font-medium">@ RPE {10 - set.rir}</span> : ''}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 mb-3"><History size={24}/></div>
                      <p className="text-sm font-bold text-white">Sin historial</p>
                      <p className="text-xs text-zinc-500">Completa este ejercicio para ver tu progreso.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chart' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4">
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={16} className="text-brand-400"/> Evolución 1RM
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-1">Estimación de tu repetición máxima a lo largo del tiempo</p>
                    </div>
                    {chartData.length >= 2 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" tickMargin={10} minTickGap={15} />
                          <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="oneRM" stroke="#d97706" strokeWidth={3} dot={{ r: 4, fill: '#d97706', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#d97706', stroke: '#f59e0b', strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-sm font-bold text-zinc-400">Datos insuficientes</p>
                        <p className="text-xs text-zinc-600 mt-1">Registra al menos 2 sesiones para ver el gráfico.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};
