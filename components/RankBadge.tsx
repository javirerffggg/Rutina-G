import React from 'react';
import { RankInfo } from '../types/progression';

interface RankBadgeProps {
  rankInfo: RankInfo | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showProgress?: boolean;
  animated?: boolean;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-16 h-16',
  lg: 'w-24 h-24'
};

export const RankBadge: React.FC<RankBadgeProps> = ({ 
  rankInfo, 
  size = 'md', 
  showLabel = false, 
  showProgress = false,
  animated = false
}) => {
  if (!rankInfo) return null;

  const isNearLevelUp = rankInfo.progressPercent > 80;
  const pulseClass = animated && isNearLevelUp ? 'animate-pulse' : '';
  const imgSizeClass = SIZE_CLASSES[size];

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`relative ${imgSizeClass} ${pulseClass} transition-transform duration-300 hover:scale-105`}>
        <img 
          src={rankInfo.imageSrc} 
          srcSet={rankInfo.imageSrcSet} 
          alt={rankInfo.rankLabel}
          role="img"
          className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
          loading="lazy"
        />
      </div>

      {showLabel && (
        <div className="text-center">
          <p className="text-white font-display font-bold text-sm tracking-tight">{rankInfo.rankLabel}</p>
          <p className="text-brand-400 font-bold text-[10px] uppercase tracking-widest">{rankInfo.prestigeLabel}</p>
        </div>
      )}

      {showProgress && (
        <div className="w-full mt-1">
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-600 to-amber-400 transition-all duration-700 ease-out"
              style={{ width: `${rankInfo.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{rankInfo.xpCurrent} XP</span>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{rankInfo.xpRequired} XP</span>
          </div>
        </div>
      )}
    </div>
  );
};
