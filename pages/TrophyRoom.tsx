import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ACHIEVEMENTS, AchievementDef, AchievementTier, AchievementCategory, TIER_XP } from '../achievements';
import { getUnlockedAchievements, getLogs } from '../services/storage';
import { getTodayDateString } from '../utils';
import * as Icons from 'lucide-react';
import { useProgression } from '../hooks/useProgression';
import { RankBadge } from '../components/RankBadge';
import { DailyLog } from '../types';

const TIERS: AchievementTier[] = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'ELITE'];
const CATEGORIES: AchievementCategory[] = ['CONSISTENCIA', 'RENDIMIENTO', 'COMPOSICION', 'EXPLORACION', 'EPICO'];

const TIER_META: Record<AchievementTier, { label: string; emoji: string; border: string; bg: string; text: string; glow: string }> = {
  BRONZE:  { label: 'Común',      emoji: '🥉', border: 'border-orange-700/50',                                    bg: 'bg-orange-900/20',   text: 'text-orange-500',  glow: '' },
  SILVER:  { label: 'Poco Común', emoji: '🥈', border: 'border-slate-300/50 shadow-[0_0_10px_rgba(203,213,225,0.2)]', bg: 'bg-slate-300/10',    text: 'text-slate-300',   glow: '' },
  GOLD:    { label: 'Épico',      emoji: '🥇', border: 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]',  bg: 'bg-amber-500/20',    text: 'text-amber-400',   glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
  DIAMOND: { label: 'Legendario', emoji: '💎', border: 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.4)]',   bg: 'bg-cyan-500/20',     text: 'text-cyan-400',    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]' },
  ELITE:   { label: 'Mítico',     emoji: '👑', border: 'border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.5)]', bg: 'bg-purple-900/30',   text: 'text-purple-400',  glow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]' },
};

const CATEGORY_ICONS: Record<AchievementCategory, any> = {
  CONSISTENCIA: Icons.CalendarCheck,
  RENDIMIENTO: Icons.Dumbbell,
  COMPOSICION: Icons.Scale,
  EXPLORACION: Icons.Compass,
  EPICO: Icons.Crown
};

const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  CONSISTENCIA: 'Consistencia',
  RENDIMIENTO: 'Rendimiento',
  COMPOSICION: 'Composición',
  EXPLORACION: 'Exploración',
  EPICO: 'Épico / Oculto'
};

const LOCKED_STYLES = { border: 'border-zinc-800', bg: 'bg-zinc-900/50', text: 'text-zinc-700', glow: '' };

const TrophyRoom: React.FC = () => {
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [selected, setSelected] = useState<AchievementDef | null>(null);
  const [activeTab, setActiveTab] = useState<AchievementCategory>('CONSISTENCIA');
  const [activeTier, setActiveTier] = useState<AchievementTier | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'TIMELINE'>('GRID');
  const [visibleCount, setVisibleCount] = useState(20);

  const today = getTodayDateString();
  const { rankInfo } = useProgression();

  const [achievementsData, setAchievementsData] = useState<AchievementDef[]>(ACHIEVEMENTS);

  const loadData = useCallback(() => {
    setUnlocked(getUnlockedAchievements());
    setLogs(getLogs());
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  // Derived state with progress
  const enrichedAchievements = useMemo(() => {
    return achievementsData.map(ach => {
      const isUnlocked = !!unlocked[ach.id];
      let prog = null;
      if (ach.progress) {
        try {
          prog = ach.progress(logs, today);
        } catch (e) {
          console.error('Error in progress calc', ach.id, e);
        }
      }
      return { ...ach, isUnlocked, prog };
    });
  }, [unlocked, logs, today]);

  // Global stats
  const unlockedCount = Object.keys(unlocked).length;
  const totalCount = achievementsData.length;
  const globalProgress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Recently unlocked
  const recentlyUnlocked = useMemo(() => {
    return [...enrichedAchievements]
      .filter(a => a.isUnlocked)
      .sort((a, b) => new Date(unlocked[b.id]).getTime() - new Date(unlocked[a.id]).getTime())
      .slice(0, 3);
  }, [enrichedAchievements, unlocked]);

  // Almost unlocked
  const almostUnlocked = useMemo(() => {
    return enrichedAchievements
      .filter(a => !a.isUnlocked && a.prog && a.prog.current > 0 && a.prog.max > 1)
      .sort((a, b) => (b.prog!.current / b.prog!.max) - (a.prog!.current / a.prog!.max))
      .slice(0, 4);
  }, [enrichedAchievements]);

  // Actionable CTA (Pick one from almost unlocked)
  const actionableAchievement = almostUnlocked.length > 0 ? almostUnlocked[0] : null;

  const filteredCollection = useMemo(() => {
    return enrichedAchievements.filter(a => a.category === activeTab && (activeTier === null || a.tier === activeTier));
  }, [enrichedAchievements, activeTab, activeTier]);

  useEffect(() => {
    setVisibleCount(20);
  }, [activeTab, activeTier, viewMode]);

  const timelineGroups = useMemo(() => {
    if (viewMode !== 'TIMELINE') return [];
    const unlockedArr = enrichedAchievements.filter(a => a.isUnlocked).sort((a, b) => new Date(unlocked[b.id]).getTime() - new Date(unlocked[a.id]).getTime());
    const groups: Record<string, typeof unlockedArr> = {};
    unlockedArr.forEach(ach => {
      const d = new Date(unlocked[ach.id]);
      const monthYear = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase();
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(ach);
    });
    return Object.entries(groups);
  }, [enrichedAchievements, unlocked, viewMode]);

  const sortedCollection = useMemo(() => [
    ...filteredCollection.filter(a => a.isUnlocked),
    ...filteredCollection.filter(a => !a.isUnlocked),
  ], [filteredCollection]);

  return (
    <div className="p-4 sm:p-6 space-y-8 pb-24 max-w-2xl mx-auto">
      
      {/* ── RPG RANK BADGE ── */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col items-center">
        <RankBadge rankInfo={rankInfo} size="lg" showLabel showProgress animated />
      </div>

      {/* ── HERO ── */}
      <header className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="shrink-0 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800/50">
             <RankBadge rankInfo={rankInfo} size="md" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Sala de Trofeos</h1>
            <p className="text-xs text-zinc-400 font-medium">Progreso global de tu colección</p>
          </div>
        </div>
        <div className="w-full md:w-auto flex-1 md:flex-none flex flex-col items-end min-w-[200px]">
          <div className="w-full flex justify-between items-end mb-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Completado</span>
            <div className="text-2xl font-display font-bold text-white">{unlockedCount}<span className="text-zinc-600 text-base">/{totalCount}</span></div>
          </div>
          <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-purple-500 transition-all duration-700"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
          <div className="flex gap-2 sm:gap-3 mt-2 w-full justify-between sm:justify-end">
            {TIERS.map(tier => {
              const count = enrichedAchievements.filter(a => a.isUnlocked && a.tier === tier).length;
              const meta = TIER_META[tier];
              return (
                <button 
                  key={tier} 
                  onClick={() => setActiveTier(prev => prev === tier ? null : tier)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all active:scale-95 ${activeTier === tier ? `${meta.bg} ${meta.border} ring-1 ring-white/20 ${meta.text}` : `${meta.text} hover:bg-zinc-800 border border-transparent`}`}
                >
                  {meta.emoji} {count}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── CTA ACCIONABLE ── */}
      {actionableAchievement && (
        <div 
          onClick={() => setSelected(actionableAchievement)}
          className="bg-brand-900/20 border border-brand-500/30 rounded-2xl p-4 flex items-start gap-4 cursor-pointer hover:bg-brand-900/30 transition-all active:scale-[0.98]"
        >
          <div className="p-2.5 bg-brand-500/20 rounded-xl text-brand-400 shrink-0">
            <Icons.Target size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-400 mb-0.5">Objetivo Recomendado</p>
            <h3 className="text-sm font-bold text-white mb-1">Hoy puedes avanzar en "{actionableAchievement.title}"</h3>
            <p className="text-xs text-zinc-400 mb-2 line-clamp-1">{actionableAchievement.hint}</p>
            <p className="text-xs text-brand-300 font-bold mb-3">
              Faltan solo {actionableAchievement.prog!.max - actionableAchievement.prog!.current} {actionableAchievement.prog!.label || 'más'}
            </p>
            
            {actionableAchievement.prog && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                  <span>{actionableAchievement.prog.current} {actionableAchievement.prog.label || ''}</span>
                  <span>{actionableAchievement.prog.max} {actionableAchievement.prog.label || ''}</span>
                </div>
                <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-500 rounded-full" 
                    style={{ width: `${(actionableAchievement.prog.current / actionableAchievement.prog.max) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RECIENTES ── */}
      {recentlyUnlocked.length > 0 && (
        <section>
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Últimos Desbloqueos</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {recentlyUnlocked.map(ach => {
              const meta = TIER_META[ach.tier];
              const IconComponent = (Icons as any)[ach.icon] || Icons.Trophy;
              return (
                <div 
                  key={ach.id} 
                  onClick={() => setSelected(ach)}
                  className={`shrink-0 w-[240px] snap-center p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all active:scale-[0.98] ${meta.border} ${meta.bg}`}
                >
                  <div className="flex justify-between items-start mb-4 relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${meta.bg} ${meta.glow}`}>
                      {unlocked[ach.id]?.startsWith(today) && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-brand-400 rounded-full animate-pulse" />
                      )}
                      <IconComponent size={20} className={meta.text} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${meta.border} ${meta.text}`}>
                      {meta.emoji} {meta.label}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-white line-clamp-1">{ach.title}</h3>
                    <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                      Obtenido el {new Date(unlocked[ach.id]).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── CASI DESBLOQUEADOS ── */}
      {almostUnlocked.length > 0 && (
        <section>
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">A punto de conseguir</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {almostUnlocked.map(ach => {
              const IconComponent = (Icons as any)[ach.icon] || Icons.Trophy;
              const percent = Math.round((ach.prog!.current / ach.prog!.max) * 100);
              return (
                <div 
                  key={ach.id}
                  onClick={() => setSelected(ach)}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 sm:p-4 cursor-pointer hover:bg-zinc-900 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400 shrink-0">
                      <IconComponent size={16} />
                    </div>
                    <span className="text-xs font-bold text-zinc-300 line-clamp-2 leading-snug">{ach.title}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-zinc-500">{ach.prog!.current}/{ach.prog!.max}</span>
                      <span className="text-[10px] font-bold text-brand-400">{percent}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── COLECCIÓN COMPLETA ── */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Colección Completa</h2>
          <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button onClick={() => setViewMode('GRID')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'GRID' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Grid</button>
            <button onClick={() => setViewMode('TIMELINE')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'TIMELINE' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Timeline</button>
          </div>
        </div>
        
        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map(cat => {
            const isActive = activeTab === cat;
            const CatIcon = CATEGORY_ICONS[cat];
            const catAchievements = enrichedAchievements.filter(a => a.category === cat);
            const catUnlocked = catAchievements.filter(a => a.isUnlocked).length;
            const percent = catAchievements.length > 0 ? Math.round((catUnlocked / catAchievements.length) * 100) : 0;
            
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                  isActive 
                    ? 'bg-zinc-800 border-zinc-700 text-white' 
                    : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
              >
                <CatIcon size={14} className={isActive ? 'text-brand-400' : ''} />
                {CATEGORY_NAMES[cat]}
                <span className={`ml-1 px-1.5 py-0.5 rounded-md ${isActive ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-zinc-500'}`}>
                  {percent}%
                </span>
              </button>
            )
          })}
        </div>

        {/* GRID DE CATEGORÍA */}
        {viewMode === 'GRID' ? (
          <>
            {(() => {
              const catStats = filteredCollection.reduce((acc, a) => {
                if (a.isUnlocked) acc.unlocked++;
                acc.total++;
                return acc;
              }, { unlocked: 0, total: 0 });
              return (
                <p className="text-xs text-zinc-500 mb-3">
                  {catStats.unlocked} de {catStats.total} desbloqueados
                  {catStats.unlocked === catStats.total && ' · ✅ Completado'}
                </p>
              );
            })()}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedCollection.slice(0, visibleCount).map((ach) => {
                const isHidden = ach.category === 'EPICO' && !ach.isUnlocked;
                const meta = ach.isUnlocked ? TIER_META[ach.tier] : LOCKED_STYLES;
                const IconComponent = (Icons as any)[ach.icon] || Icons.Trophy;
                
                let cssClass = '';
                if (ach.isUnlocked) {
                  if (ach.tier === 'ELITE') cssClass = 'trophy-card-elite';
                  else if (ach.tier === 'DIAMOND') cssClass = 'trophy-card-diamond';
                  else if (ach.tier === 'GOLD') cssClass = 'trophy-card-gold';
                }

                if (isHidden) {
                  const hiddenMeta = TIER_META[ach.tier];
                  return (
                    <div key={ach.id} onClick={() => setSelected(ach)} className="rounded-2xl border border-zinc-800 p-3 flex items-center gap-3 cursor-pointer hover:bg-zinc-900 transition-all">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-zinc-900 border border-zinc-800">
                        <Icons.HelpCircle size={20} className="text-zinc-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-500 line-clamp-1 mb-1 blur-[3px] select-none">Logro Secreto</h4>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${hiddenMeta.text}`}>{hiddenMeta.emoji} Oculto</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={ach.id}
                    onClick={() => setSelected(ach)}
                    className={`rounded-2xl border p-3 flex items-center gap-3 cursor-pointer transition-all active:scale-[0.98] hover:bg-zinc-900 ${meta.border} ${meta.bg} ${cssClass} ${!ach.isUnlocked ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                      <IconComponent size={20} className={meta.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold line-clamp-1 mb-1 ${ach.isUnlocked ? 'text-white' : 'text-zinc-400'}`}>
                        {ach.title}
                      </h4>
                      {ach.prog && !ach.isUnlocked ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${(ach.prog.current / ach.prog.max) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-zinc-500 tabular-nums">{ach.prog.current}/{ach.prog.max}</span>
                        </div>
                      ) : (
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${ach.isUnlocked ? meta.text : 'text-zinc-600'}`}>
                          {ach.isUnlocked ? TIER_META[ach.tier].label : 'Bloqueado'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {visibleCount < sortedCollection.length && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setVisibleCount(v => v + 20)}
                  className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
                >
                  Cargar más
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {timelineGroups.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900/50 flex items-center justify-center mb-4 border border-zinc-800 rotate-12 transition-transform hover:rotate-0">
                   <Icons.Award size={32} className="text-zinc-600" />
                </div>
                <h3 className="text-white font-bold mb-1">Aún no hay trofeos</h3>
                <p className="text-zinc-500 text-xs font-medium max-w-[200px]">Continúa entrenando para ganar tus primeros logros y verlos aquí.</p>
              </div>
            ) : (
              timelineGroups.map(([month, items]) => (
                <div key={month} className="relative">
                  <div className="sticky top-0 bg-black/80 backdrop-blur-md py-2 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 mb-3 border-b border-white/5">
                    <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest">{month}</h3>
                  </div>
                  <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[23px] before:w-px before:bg-white/5">
                    {items.map((ach) => {
                      const meta = TIER_META[ach.tier];
                      const IconComponent = (Icons as any)[ach.icon] || Icons.Trophy;
                      let cssClass = '';
                      if (ach.tier === 'ELITE') cssClass = 'trophy-card-elite';
                      else if (ach.tier === 'DIAMOND') cssClass = 'trophy-card-diamond';
                      else if (ach.tier === 'GOLD') cssClass = 'trophy-card-gold';

                      return (
                        <div key={ach.id} onClick={() => setSelected(ach)} className={`relative pl-14 pr-4 py-3 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all bg-black ${meta.border} ${cssClass}`}>
                          <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center z-10 ${meta.bg} ${meta.border} border`}>
                            <IconComponent size={12} className={meta.text} />
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${meta.text}`}>{meta.emoji} {meta.label}</p>
                              <h4 className="text-sm font-bold text-white truncate">{ach.title}</h4>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-bold shrink-0">{new Date(unlocked[ach.id]).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* ── DETAIL MODAL ── */}
      {selected && (() => {
        const isHidden = selected.category === 'EPICO' && !selected.isUnlocked;
        const styles = selected.isUnlocked ? TIER_META[selected.tier] : LOCKED_STYLES;
        const meta = TIER_META[selected.tier];
        const IconComponent = (Icons as any)[selected.icon] || Icons.Trophy;
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <div className={`relative w-full max-w-sm bg-zinc-950 border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${styles.border}`}>
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                <Icons.X size={20} />
              </button>

              <div className="flex flex-col items-center text-center mt-4 space-y-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl ${styles.bg} ${styles.glow}`}>
                  <IconComponent size={48} className={styles.text} />
                </div>

                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${meta.border} ${meta.bg} ${meta.text}`}>
                  {meta.emoji} {meta.label}
                </span>

                <h3 className="text-2xl font-display font-bold text-white leading-tight">
                  {isHidden ? 'Logro Oculto' : selected.title}
                </h3>

                <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
                  {selected.isUnlocked ? selected.description : isHidden ? 'Sigue entrenando para descubrir de qué se trata.' : selected.hint}
                </p>

                {/* Recompensa XP */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                  <Icons.Zap size={12} fill="currentColor" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">+{selected.xp || TIER_XP[selected.tier]} XP</span>
                </div>

                {/* Progreso parcial si aplica */}
                {!selected.isUnlocked && selected.prog && !isHidden && (
                  <div className="w-full mt-2 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                      <span>Progreso</span>
                      <span>{selected.prog.current} / {selected.prog.max}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${(selected.prog.current / selected.prog.max) * 100}%` }} />
                    </div>
                  </div>
                )}

                {selected.isUnlocked && unlocked[selected.id] && (() => {
                  const unlockDate = unlocked[selected.id];
                  const logContext = logs[unlockDate];
                  let contextText = '';
                  if (logContext && logContext.workoutType) {
                    const vol = logContext.exercises?.reduce((a, ex) => a + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);
                    contextText = `Obtenido en tu sesión de ${logContext.workoutType}${vol ? ` con un tonelaje de ${vol.toLocaleString()}kg` : ''}.`;
                  }

                  return (
                    <div className="mt-4 bg-zinc-900/50 rounded-xl px-5 py-4 border border-zinc-800 w-full text-left space-y-3">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5"><Icons.Calendar size={12}/> Fecha</p>
                        <p className="text-sm text-white font-bold capitalize">
                          {new Date(unlockDate).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      {contextText && (
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5"><Icons.Dumbbell size={12}/> Contexto</p>
                          <p className="text-xs text-zinc-400 leading-snug">{contextText}</p>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => {
                          const text = `🏆 ¡He desbloqueado el logro "${selected.title}" en Rutina-G!\n${meta.emoji} Rareza: ${meta.label}\n\n" ${selected.description} "`;
                          navigator.clipboard.writeText(text);
                          alert('¡Copiado al portapapeles!');
                        }}
                        className="w-full mt-2 py-2.5 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        <Icons.Share2 size={14} /> Compartir Logro
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default TrophyRoom;
