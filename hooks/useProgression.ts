import { useState, useEffect, useCallback } from 'react';
import { RankInfo } from '../types/progression';
import { XP_REWARDS } from '../constants/xpRewards';
import { getRankInfo, addXP } from '../utils/progression';

const XP_STORAGE_KEY = 'rutinag_xp_total';

export function useProgression() {
  const [xpTotal, setXpTotal] = useState<number>(0);
  const [rankInfo, setRankInfo] = useState<RankInfo | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ previousRank: RankInfo; newRank: RankInfo; levelsGained: number } | null>(null);

  // Inicializar en SSR o cliente y escuchar cambios
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadXP = () => {
      const stored = localStorage.getItem(XP_STORAGE_KEY);
      const currentXP = stored ? parseInt(stored, 10) : 0;
      setXpTotal(currentXP);
      setRankInfo(getRankInfo(currentXP));
    };

    loadXP();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ newXP: number; oldXP: number; levelsGained: number; newRank: RankInfo }>;
      setXpTotal(customEvent.detail.newXP);
      setRankInfo(customEvent.detail.newRank);
      
      if (customEvent.detail.levelsGained > 0) {
        setLevelUpData({
          previousRank: getRankInfo(customEvent.detail.oldXP),
          newRank: customEvent.detail.newRank,
          levelsGained: customEvent.detail.levelsGained
        });
      }
    };

    window.addEventListener('xp-updated', handleUpdate);
    return () => window.removeEventListener('xp-updated', handleUpdate);
  }, []);

  const handleAddXP = useCallback((amount: number, reason: keyof typeof XP_REWARDS) => {
    if (typeof window === 'undefined') return;
    
    setXpTotal(prev => {
      const result = addXP(prev, amount);
      localStorage.setItem(XP_STORAGE_KEY, result.newXPTotal.toString());
      
      // Emitir evento para que otros hooks se actualicen
      window.dispatchEvent(new CustomEvent('xp-updated', { 
        detail: { 
          newXP: result.newXPTotal, 
          oldXP: prev, 
          levelsGained: result.levelsGained,
          newRank: result.newRank 
        } 
      }));
      
      return result.newXPTotal;
    });
  }, []);

  const clearLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  return {
    xpTotal,
    rankInfo,
    addXP: handleAddXP,
    levelUpData,
    clearLevelUp
  };
}
