import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ACHIEVEMENTS, AchievementDef } from '../achievements';
import { getUnlockedAchievements } from '../services/storage';
import * as Icons from 'lucide-react';

const TIERS = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'ELITE'] as const;
type Tier = typeof TIERS[number];

const TIER_META: Record<Tier, { label: string; emoji: string; border: string; bg: string; text: string; glow: string }> = {
  BRONZE:  { label: 'Común',      emoji: '🥉', border: 'border-orange-700/50',                                    bg: 'bg-orange-900/20',   text: 'text-orange-500',  glow: '' },
  SILVER:  { label: 'Poco Común', emoji: '🥈', border: 'border-slate-300/50 shadow-[0_0_10px_rgba(203,213,225,0.2)]', bg: 'bg-slate-300/10',    text: 'text-slate-300',   glow: '' },
  GOLD:    { label: 'Épico',      emoji: '🥇', border: 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]',  bg: 'bg-amber-500/20',    text: 'text-amber-400',   glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
  DIAMOND: { label: 'Legendario', emoji: '💎', border: 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.4)]',   bg: 'bg-cyan-500/20',     text: 'text-cyan-400',    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]' },
  ELITE:   { label: 'Mítico',     emoji: '👑', border: 'border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.5)]', bg: 'bg-purple-900/30',   text: 'text-purple-400',  glow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]' },
};

const LOCKED_STYLES = { border: 'border-zinc-800', bg: 'bg-zinc-900/50', text: 'text-zinc-700', glow: '' };

const TrophyRoom: React.FC = () => {
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<AchievementDef | null>(null);
  const [filterTier, setFilterTier] = useState<Tier | 'ALL'>('ALL');

  const loadUnlocked = useCallback(() => {
    setUnlocked(getUnlockedAchievements());
  }, []);

  useEffect(() => {
    loadUnlocked();
    window.addEventListener('focus', loadUnlocked);
    return () => window.removeEventListener('focus', loadUnlocked);
  }, [loadUnlocked]);

  const getTierStyles = useCallback((tier: Tier, isUnlocked: boolean) => {
    if (!isUnlocked) return LOCKED_STYLES;
    return TIER_META[tier] ?? LOCKED_STYLES;
  }, []);

  // Stats
  const unlockedCount = Object.keys(unlocked).length;
  const totalCount = ACHIEVEMENTS.length;
  const progress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const tierCounts = useMemo(() => {
    const counts: Record<string, { total: number; unlocked: number }> = {};
    ACHIEVEMENTS.forEach(a => {
      if (!counts[a.tier]) counts[a.tier] = { total: 0, unlocked: 0 };
      counts[a.tier].total++;
      if (unlocked[a.id]) counts[a.tier].unlocked++;
    });
    return counts;
  }, [unlocked]);

  // Last 3 unlocked sorted by date desc
  const recentlyUnlocked = useMemo(() => {
    return ACHIEVEMENTS
      .filter(a => unlocked[a.id])
      .sort((a, b) => new Date(unlocked[b.id]).getTime() - new Date(unlocked[a.id]).getTime())
      .slice(0, 3);
  }, [unlocked]);

  const filteredAchievements = useMemo(() => {
    if (filterTier === 'ALL') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter(a => a.tier === filterTier);
  }, [filterTier]);

  const selectedStyles = selected ? getTierStyles(selected.tier as Tier, !!unlocked[selected.id]) : LOCKED_STYLES;

  return (
    <div className="p-5 space-y-6 pb-24">

      {/* ── HEADER ── */}
      <header className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Colección</p>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Sala de Trofeos</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-bold text-white">{unlockedCount}<span className="text-zinc-600 text-base">/{totalCount}</span></div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Desbloqueados</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-purple-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <span>0%</span>
            <span className="text-zinc-400">{progress}% completado</span>
            <span>100%</span>
          </div>
        </div>

        {/* Tier counters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TIERS.map(tier => {
            const counts = tierCounts[tier];
            if (!counts) return null;
            const meta = TIER_META[tier];
            return (
              <div key={tier} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold ${
                counts.unlocked === counts.total
                  ? `${meta.border} ${meta.bg} ${meta.text}`
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-500'
              }`}>
                <span>{meta.emoji}</span>
                <span>{counts.unlocked}/{counts.total}</span>
              </div>
            );
          })}
        </div>
      </header>

      {/* ── RECIENTES ── */}
      {recentlyUnlocked.length > 0 && filterTier === 'ALL' && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">Últimos desbloqueados</h2>
          <div className="space-y-2">
            {recentlyUnlocked.map(ach => {
              const meta = TIER_META[ach.tier as Tier];
              const IconComponent = (Icons as any)[ach.icon] || Icons.Trophy;
              return (
                <div
                  key={ach.id}
                  onClick={() => setSelected(ach)}
                  className={`flex items-center gap-4 p-3 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${meta.border} ${meta.bg}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                    <IconComponent size={20} className={meta.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-widest ${meta.text}`}>{meta.label}</p>
                    <p className="text-sm font-display font-bold text-white truncate">{ach.title}</p>
                  </div>
                  <p className="text-[10px] text-zinc-600 font-bold shrink-0">
                    {new Date(unlocked[ach.id]).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── FILTER PILLS ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['ALL', ...TIERS] as const).map(tier => {
          const isActive = filterTier === tier;
          const meta = tier !== 'ALL' ? TIER_META[tier] : null;
          return (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                isActive
                  ? meta ? `${meta.border} ${meta.bg} ${meta.text}` : 'bg-white/10 border-white/20 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tier === 'ALL' ? `Todos (${unlockedCount}/${totalCount})` : `${meta!.emoji} ${meta!.label}`}
            </button>
          );
        })}
      </div>

      {/* ── GRID ── */}
      {filteredAchievements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
          <Icons.Trophy size={40} className="text-zinc-600 mb-4" />
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Sin logros en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filteredAchievements.map((ach, i) => {
            const isUnlocked = !!unlocked[ach.id];
            const styles = getTierStyles(ach.tier as Tier, isUnlocked);
            const IconComponent = (Icons as any)[ach.icon] || Icons.Trophy;

            return (
              <div
                key={ach.id}
                onClick={() => setSelected(ach)}
                style={{ animationDelay: `${i * 30}ms` }}
                className={`aspect-square max-h-28 rounded-2xl border flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-300 animate-in fade-in zoom-in-95
                  ${styles.border} ${styles.bg}
                  ${isUnlocked ? 'hover:scale-105' : 'grayscale opacity-40'}`}
              >
                <IconComponent
                  size={28}
                  className={`${styles.text} mb-1.5`}
                  strokeWidth={isUnlocked ? 2 : 1.5}
                />
                <span className="text-[9px] font-bold text-center leading-tight text-white line-clamp-2 px-1">
                  {isUnlocked ? ach.title : '???'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selected && (() => {
        const isUnlocked = !!unlocked[selected.id];
        const styles = selectedStyles;
        const meta = TIER_META[selected.tier as Tier];
        const IconComponent = (Icons as any)[selected.icon] || Icons.Trophy;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <div className={`relative w-full max-w-sm bg-zinc-950/95 backdrop-blur-xl border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${styles.border}`}>
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                <Icons.X size={20} />
              </button>

              <div className="flex flex-col items-center text-center mt-4 space-y-3">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${styles.bg} ${styles.glow}`}>
                  <IconComponent size={40} className={styles.text} />
                </div>

                {meta && (
                  <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${meta.border} ${meta.bg} ${meta.text}`}>
                    {meta.emoji} {meta.label}
                  </span>
                )}

                <h3 className="text-2xl font-display font-bold text-white leading-tight">
                  {isUnlocked ? selected.title : 'Logro Bloqueado'}
                </h3>

                <p className="text-sm text-zinc-300 leading-relaxed">
                  {isUnlocked ? selected.description : selected.hint}
                </p>

                {isUnlocked && unlocked[selected.id] && (
                  <div className="mt-2 bg-zinc-800/50 rounded-xl px-5 py-3 border border-white/5 w-full">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Desbloqueado el</p>
                    <p className="text-sm text-white font-bold">
                      {new Date(unlocked[selected.id]).toLocaleDateString('es-ES', {
                        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {!isUnlocked && (
                  <div className="mt-2 bg-zinc-800/30 rounded-xl px-5 py-3 border border-zinc-800 w-full">
                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Pista</p>
                    <p className="text-xs text-zinc-500 italic">{selected.hint}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TrophyRoom;
