import React from 'react';
import { RankInfo } from '../types/progression';
import { RankBadge } from './RankBadge';

interface LevelUpModalProps {
  previousRank: RankInfo;
  newRank: RankInfo;
  levelsGained: number;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ previousRank, newRank, levelsGained, onClose }) => {
  const prestigeChanged = previousRank.prestige !== newRank.prestige;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`relative w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center overflow-hidden premium-bisel border ${prestigeChanged ? 'bg-gradient-to-br from-amber-500/20 to-black border-amber-500/50' : 'bg-zinc-900 border-white/10'}`}>
        {prestigeChanged && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
        )}

        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2 className={`text-2xl font-display font-black tracking-tight ${prestigeChanged ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'text-white'}`}>
              {prestigeChanged ? '¡ASCENSO DE PRESTIGIO!' : `¡Nivel ${newRank.rankLabel} desbloqueado!`}
            </h2>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Has subido {levelsGained} {levelsGained === 1 ? 'nivel' : 'niveles'}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 py-4 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.15),transparent_70%)] animate-pulse" />
            
            <div className="opacity-50 scale-75 transform -translate-y-4">
              <RankBadge rankInfo={previousRank} size="sm" />
            </div>
            
            <div className="animate-in zoom-in-50 duration-500 delay-150 fill-mode-both">
              <RankBadge rankInfo={newRank} size="lg" showLabel />
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-sm active:scale-95 transition-all ${
              prestigeChanged 
                ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]' 
                : 'bg-brand-600 text-white hover:bg-brand-500 shadow-[0_0_20px_rgba(217,119,6,0.4)]'
            }`}
          >
            ¡Genial!
          </button>
        </div>
      </div>
    </div>
  );
};
