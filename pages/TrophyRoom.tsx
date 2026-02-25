import React, { useState, useEffect } from 'react';
import { ACHIEVEMENTS, AchievementDef } from '../achievements';
import { getUnlockedAchievements } from '../services/storage';
import * as Icons from 'lucide-react';

const TrophyRoom: React.FC = () => {
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<AchievementDef | null>(null);

  useEffect(() => {
    setUnlocked(getUnlockedAchievements());
  }, []);

  const getTierStyles = (tier: string, isUnlocked: boolean) => {
    if (!isUnlocked) return { border: 'border-slate-800', bg: 'bg-slate-900/50', text: 'text-slate-700' };
    
    switch(tier) {
      case 'BRONZE': return { border: 'border-orange-700/50', bg: 'bg-orange-900/20', text: 'text-orange-500' };
      case 'SILVER': return { border: 'border-slate-300/50 shadow-[0_0_10px_rgba(203,213,225,0.2)]', bg: 'bg-slate-300/10', text: 'text-slate-300' };
      case 'GOLD': return { border: 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]', bg: 'bg-amber-500/20', text: 'text-amber-400' };
      case 'DIAMOND': return { border: 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.4)]', bg: 'bg-cyan-500/20 animate-pulse', text: 'text-cyan-400' };
      case 'ELITE': return { border: 'border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.5)]', bg: 'bg-purple-900/30', text: 'text-purple-400' };
      default: return { border: 'border-slate-700', bg: 'bg-slate-800', text: 'text-slate-500' };
    }
  };

  const getTierName = (tier: string) => {
    switch(tier) {
      case 'BRONZE': return 'Común';
      case 'SILVER': return 'Poco Común';
      case 'GOLD': return 'Épico';
      case 'DIAMOND': return 'Legendario';
      case 'ELITE': return 'Mítico';
      default: return '';
    }
  };

  const unlockedCount = Object.keys(unlocked).length;
  const totalCount = ACHIEVEMENTS.length;
  const progress = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="p-5 space-y-6 pb-24">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Sala de Trofeos</h1>
          <p className="text-brand-400 text-xs font-bold tracking-widest uppercase">
            {unlockedCount} / {totalCount} Desbloqueados
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{progress}%</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Completado</div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {ACHIEVEMENTS.map(ach => {
          const isUnlocked = !!unlocked[ach.id];
          const styles = getTierStyles(ach.tier, isUnlocked);
          const IconComponent = (Icons as any)[ach.icon] || Icons.Trophy;

          return (
            <div 
              key={ach.id}
              onClick={() => setSelected(ach)}
              className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-300 ${styles.border} ${styles.bg} ${isUnlocked ? 'hover:scale-105' : 'grayscale opacity-50'}`}
            >
              <IconComponent size={32} className={`${styles.text} mb-2`} strokeWidth={isUnlocked ? 2 : 1.5} />
              <span className="text-[9px] font-bold text-center leading-tight text-white line-clamp-2">
                {isUnlocked ? ach.title : '???'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalle */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          ></div>
          <div className={`relative w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${getTierStyles(selected.tier, !!unlocked[selected.id]).border}`}>
            <button 
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <Icons.X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mt-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${getTierStyles(selected.tier, !!unlocked[selected.id]).bg}`}>
                {React.createElement((Icons as any)[selected.icon] || Icons.Trophy, { 
                  size: 40, 
                  className: getTierStyles(selected.tier, !!unlocked[selected.id]).text 
                })}
              </div>
              
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${getTierStyles(selected.tier, !!unlocked[selected.id]).text}`}>
                {getTierName(selected.tier)}
              </span>
              
              <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                {!!unlocked[selected.id] ? selected.title : 'Logro Bloqueado'}
              </h3>
              
              <p className="text-sm text-slate-300 mb-6">
                {!!unlocked[selected.id] ? selected.description : selected.hint}
              </p>

              {!!unlocked[selected.id] && (
                <div className="bg-slate-800/50 rounded-xl px-4 py-2 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Desbloqueado el</p>
                  <p className="text-xs text-white font-mono">
                    {new Date(unlocked[selected.id]).toLocaleDateString('es-ES', { 
                      day: '2-digit', month: 'long', year: 'numeric' 
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrophyRoom;
