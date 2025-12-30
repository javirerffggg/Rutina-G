import React from 'react';
import { PHASES } from '../constants';
import { getCurrentPhase } from '../utils';
import { Info, Target, Flame, HeartPulse, ChevronRight, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Plan: React.FC = () => {
  const currentPhase = getCurrentPhase();
  const navigate = useNavigate();

  return (
    <div className="p-5 space-y-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Roadmap
          </h1>
          <p className="text-gold-500 text-xs font-bold tracking-widest uppercase mt-1 flex items-center gap-1">
            <Crown size={12} />
            Elite Definition Program
          </p>
        </div>
      </header>

      {/* Hero Card - Current Phase */}
      <div className="relative group rounded-2xl overflow-hidden shadow-2xl shadow-brand-900/20 border border-brand-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 via-slate-900 to-black z-0"></div>
        <div className="absolute top-0 right-0 p-3 opacity-20">
          <Target size={120} className="text-white" />
        </div>
        
        <div className="relative z-10 p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="inline-block px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 backdrop-blur-sm">
              <span className="text-brand-300 text-[10px] font-bold uppercase tracking-wider">Fase Actual</span>
            </div>
            <span className="text-slate-400 text-xs font-mono">
              {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{currentPhase.name}</h2>
          <p className="text-sm text-slate-300 mb-5 leading-relaxed opacity-90">{currentPhase.description}</p>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card p-2 rounded-lg text-center">
              <Flame size={16} className="text-orange-500 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 uppercase font-bold">Dieta</p>
              <p className="text-[10px] text-white leading-tight mt-1 line-clamp-2">{currentPhase.nutritionGoal.split('(')[0]}</p>
            </div>
            <div className="glass-card p-2 rounded-lg text-center">
              <HeartPulse size={16} className="text-red-500 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 uppercase font-bold">Cardio</p>
              <p className="text-[10px] text-white leading-tight mt-1 line-clamp-2">{currentPhase.cardio.split(' ')[0]}</p>
            </div>
            <div className="glass-card p-2 rounded-lg text-center border-brand-500/30 bg-brand-500/10">
               <Target size={16} className="text-brand-400 mx-auto mb-1" />
               <p className="text-[10px] text-brand-300 uppercase font-bold">Foco</p>
               <p className="text-[10px] text-white leading-tight mt-1 line-clamp-2">RIR {currentPhase.trainingFocus.match(/RIR (\d-\d)/)?.[1] || 'Opt'}</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/today')}
            className="w-full mt-4 py-2.5 bg-white text-dark-bg font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
          >
            Ver Tareas de Hoy <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Compact Timeline */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Línea de Tiempo</h3>
        <div className="space-y-0 relative border-l border-slate-800 ml-2 pl-6">
          {PHASES.map((phase, idx) => {
            const isCurrent = phase.name === currentPhase.name;
            const isPast = new Date(phase.endDate) < new Date();
            
            return (
              <div key={idx} className={`relative py-3 group ${isCurrent ? 'opacity-100' : 'opacity-50 hover:opacity-80 transition-opacity'}`}>
                {/* Dot */}
                <div className={`absolute -left-[29px] top-4 w-3 h-3 rounded-full border-2 transition-all duration-300 z-10 
                  ${isCurrent 
                    ? 'bg-brand-500 border-brand-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] scale-110' 
                    : isPast 
                      ? 'bg-slate-800 border-slate-600'
                      : 'bg-dark-bg border-slate-700'}`} 
                />
                
                {/* Content */}
                <div className={`rounded-xl p-3 border transition-all duration-300
                   ${isCurrent 
                     ? 'bg-gradient-to-r from-slate-900 to-transparent border-slate-700 translate-x-1' 
                     : 'border-transparent hover:border-slate-800'}`}>
                   
                   <div className="flex justify-between items-baseline mb-0.5">
                     <h4 className={`text-sm font-bold ${isCurrent ? 'text-brand-400' : 'text-slate-200'}`}>
                       {phase.name}
                     </h4>
                     <span className="text-[10px] text-slate-500 font-mono tracking-tighter">
                       {new Date(phase.startDate).toLocaleDateString('es-ES', { month: 'short' })} - {new Date(phase.endDate).toLocaleDateString('es-ES', { month: 'short' })}
                     </span>
                   </div>
                   
                   <p className="text-xs text-slate-400 line-clamp-1">{phase.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Philosophy Compact */}
      <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
        <Info size={18} className="text-gold-500 mt-0.5 shrink-0" />
        <div>
           <h3 className="text-xs font-bold text-gold-400 uppercase tracking-wider mb-1">Filosofía Elite</h3>
           <p className="text-xs text-slate-300 leading-relaxed">
             La intensidad y el déficit calórico son las herramientas. La paciencia es el camino. Mantén la fuerza para preservar el músculo.
           </p>
        </div>
      </div>
      <div className="h-4"></div>
    </div>
  );
};

export default Plan;