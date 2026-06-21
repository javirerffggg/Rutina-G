import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AchievementDef, AchievementTier, AchievementCategory, TIER_XP } from '../../achievements';
import { getUnlockedAchievements, getLogs } from '../../services/storage';
import { getTodayDateString } from '../../utils';
import * as Icons from 'lucide-react';
import { useProgression } from '../../hooks/useProgression';
import { RankBadge } from '../../components/RankBadge';
import { DailyLog } from '../../types';

const TIERS: AchievementTier[]    = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'ELITE'];
const CATEGORIES: AchievementCategory[] = ['CONSISTENCIA', 'RENDIMIENTO', 'COMPOSICION', 'EXPLORACION', 'EPICO'];

const TIER_META: Record<AchievementTier, { label: string; emoji: string; border: string; bg: string; text: string; glow: string }> = {
  BRONZE:  { label: 'Común',      emoji: '🥉', border: 'border-orange-700/50',                                          bg: 'bg-orange-900/20',  text: 'text-orange-500', glow: '' },
  SILVER:  { label: 'Poco Común', emoji: '🥈', border: 'border-slate-300/50 shadow-[0_0_10px_rgba(203,213,225,0.2)]',   bg: 'bg-slate-300/10',   text: 'text-slate-300',  glow: '' },
  GOLD:    { label: 'Épico',      emoji: '🥇', border: 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]',    bg: 'bg-amber-500/20',   text: 'text-amber-400',  glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
  DIAMOND: { label: 'Legendario', emoji: '💎', border: 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.4)]',     bg: 'bg-cyan-500/20',    text: 'text-cyan-400',   glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]' },
  ELITE:   { label: 'Mítico',     emoji: '👑', border: 'border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.5)]',   bg: 'bg-purple-900/30',  text: 'text-purple-400', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]' },
};

const CATEGORY_ICONS: Record<AchievementCategory, any> = {
  CONSISTENCIA: Icons.CalendarCheck,
  RENDIMIENTO:  Icons.Dumbbell,
  COMPOSICION:  Icons.Scale,
  EXPLORACION:  Icons.Compass,
  EPICO:        Icons.Crown,
};

const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  CONSISTENCIA: 'Consistencia',
  RENDIMIENTO:  'Rendimiento',
  COMPOSICION:  'Composición',
  EXPLORACION:  'Exploración',
  EPICO:        'Épico / Oculto',
};

const LOCKED_STYLES = { border: 'border-zinc-800', bg: 'bg-zinc-900/50', text: 'text-zinc-700', glow: '' };

// ─── Small reusable pieces ────────────────────────────────────────────────────

const TierChip: React.FC<{ tier: AchievementTier; count: number; active: boolean; onClick: () => void }> = ({ tier, count, active, onClick }) => {
  const m = TIER_META[tier];
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
        active ? `${m.bg} ${m.border} ${m.text}` : `${m.text} border-transparent hover:bg-zinc-800`
      }`}
    >
      {m.emoji} {count}
    </button>
  );
};

const AchievementCard: React.FC<{
  ach: AchievementDef & { isUnlocked: boolean; prog: any };
  unlockedDate?: string;
  today: string;
  onClick: () => void;
}> = ({ ach, unlockedDate, today, onClick }) => {
  const isHidden = ach.category === 'EPICO' && !ach.isUnlocked;
  const meta     = ach.isUnlocked ? TIER_META[ach.tier] : LOCKED_STYLES;
  const Icon     = (Icons as any)[ach.icon] || Icons.Trophy;
  const glow     = ach.isUnlocked && ach.tier === 'ELITE' ? 'trophy-card-elite'
                 : ach.isUnlocked && ach.tier === 'DIAMOND' ? 'trophy-card-diamond'
                 : ach.isUnlocked && ach.tier === 'GOLD'    ? 'trophy-card-gold' : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-3 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
        meta.border} ${meta.bg} ${glow} ${!ach.isUnlocked ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
        {isHidden ? <Icons.HelpCircle size={18} className="text-zinc-700" /> : <Icon size={18} className={meta.text} />}
      </div>
      <div className="flex-1 min-w-0">
        {isHidden ? (
          <>
            <p className="text-xs font-bold text-zinc-500 blur-sm select-none">Logro Oculto</p>
            <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${meta.text}`}>{TIER_META[ach.tier].emoji} Oculto</p>
          </>
        ) : (
          <>
            <h4 className={`text-xs font-bold line-clamp-1 ${ach.isUnlocked ? 'text-white' : 'text-zinc-400'}`}>{ach.title}</h4>
            {ach.prog && !ach.isUnlocked ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${(ach.prog.current / ach.prog.max) * 100}%` }} />
                </div>
                <span className="text-[9px] font-bold text-zinc-500 tabular-nums">{ach.prog.current}/{ach.prog.max}</span>
              </div>
            ) : (
              <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${
                ach.isUnlocked ? (meta as any).text : 'text-zinc-600'
              }`}>
                {ach.isUnlocked ? TIER_META[ach.tier].label : 'Bloqueado'}
              </p>
            )}
          </>
        )}
      </div>
      {ach.isUnlocked && unlockedDate?.startsWith(today) && (
        <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse shrink-0" />
      )}
    </div>
  );
};

// ─── Detail panel (replaces grid) ────────────────────────────────────────────

const DetailPanel: React.FC<{
  ach: AchievementDef & { isUnlocked: boolean; prog: any };
  unlocked: Record<string, string>;
  logs: Record<string, DailyLog>;
  onClose: () => void;
}> = ({ ach, unlocked, logs, onClose }) => {
  const isHidden = ach.category === 'EPICO' && !ach.isUnlocked;
  const styles   = ach.isUnlocked ? TIER_META[ach.tier] : LOCKED_STYLES;
  const meta     = TIER_META[ach.tier];
  const Icon     = (Icons as any)[ach.icon] || Icons.Trophy;
  const unlockedDate = unlocked[ach.id];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold">
          <Icons.ChevronLeft size={16} /> Volver a la colección
        </button>
      </div>

      {/* Icon + title */}
      <div className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl ${styles.bg} ${styles.glow}`}>
          <Icon size={56} className={styles.text} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${meta.border} ${meta.bg} ${meta.text}`}>
          {meta.emoji} {meta.label}
        </span>
        <h2 className="text-2xl font-display font-bold text-white leading-tight">
          {isHidden ? 'Logro Oculto' : ach.title}
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
          {ach.isUnlocked ? ach.description : isHidden ? 'Sigue entrenando para descubrirlo.' : ach.hint}
        </p>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
          <Icons.Zap size={12} fill="currentColor" />
          <span className="text-[10px] font-bold tracking-widest uppercase">+{ach.xp || TIER_XP[ach.tier]} XP</span>
        </div>
      </div>

      {/* Progress bar if locked */}
      {!ach.isUnlocked && ach.prog && !isHidden && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
            <span>Progreso</span>
            <span>{ach.prog.current} / {ach.prog.max} {ach.prog.label || ''}</span>
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-700"
              style={{ width: `${(ach.prog.current / ach.prog.max) * 100}%` }}
            />
          </div>
          <p className="text-xs text-brand-300 font-bold mt-2">
            Faltan {ach.prog.max - ach.prog.current} {ach.prog.label || 'más'}
          </p>
        </div>
      )}

      {/* Unlock context if unlocked */}
      {ach.isUnlocked && unlockedDate && (() => {
        const logCtx = logs[unlockedDate];
        const vol = logCtx?.exercises?.reduce((a: number, ex: any) =>
          a + ex.sets.reduce((s: number, set: any) => s + (set.weight || 0) * (set.reps || 0), 0), 0);
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
                <Icons.Calendar size={12} /> Fecha
              </p>
              <p className="text-sm text-white font-bold capitalize">
                {new Date(unlockedDate).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {logCtx?.workoutType && (
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
                  <Icons.Dumbbell size={12} /> Contexto
                </p>
                <p className="text-xs text-zinc-400 leading-snug">
                  Sesión de {logCtx.workoutType}{vol ? ` · ${vol.toLocaleString()} kg tonelaje` : ''}.
                </p>
              </div>
            )}
            <button
              onClick={() => {
                const text = `🏆 ¡He desbloqueado "${ach.title}" en Rutina-G!\n${meta.emoji} ${meta.label}\n\n"${ach.description}"`;
                navigator.clipboard.writeText(text);
              }}
              className="w-full py-2.5 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
            >
              <Icons.Share2 size={14} /> Compartir logro
            </button>
          </div>
        );
      })()}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const DesktopTrophyRoom: React.FC = () => {
  const [unlocked, setUnlocked]               = useState<Record<string, string>>({});
  const [logs, setLogs]                       = useState<Record<string, DailyLog>>({});
  const [achievementsData, setAchievementsData] = useState<AchievementDef[]>([]);
  const [activeCategory, setActiveCategory]   = useState<AchievementCategory>('CONSISTENCIA');
  const [activeTier, setActiveTier]           = useState<AchievementTier | null>(null);
  const [viewMode, setViewMode]               = useState<'GRID' | 'TIMELINE'>('GRID');
  const [selectedAch, setSelectedAch]         = useState<(AchievementDef & { isUnlocked: boolean; prog: any }) | null>(null);

  const today      = getTodayDateString();
  const { rankInfo } = useProgression();

  useEffect(() => { import('../../achievements').then(m => setAchievementsData(m.ACHIEVEMENTS)); }, []);

  const loadData = useCallback(() => {
    setUnlocked(getUnlockedAchievements());
    setLogs(getLogs());
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  const enriched = useMemo(() => achievementsData.map(ach => {
    const isUnlocked = !!unlocked[ach.id];
    let prog: any = null;
    if (ach.progress) { try { prog = ach.progress(logs, today); } catch {} }
    return { ...ach, isUnlocked, prog };
  }), [achievementsData, unlocked, logs, today]);

  const unlockedCount  = Object.keys(unlocked).length;
  const totalCount     = achievementsData.length;
  const globalPct      = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const tierCounts = useMemo(() => {
    const c: Record<string, number> = {};
    TIERS.forEach(t => { c[t] = enriched.filter(a => a.isUnlocked && a.tier === t).length; });
    return c;
  }, [enriched]);

  const recentlyUnlocked = useMemo(() =>
    [...enriched].filter(a => a.isUnlocked)
      .sort((a, b) => new Date(unlocked[b.id]).getTime() - new Date(unlocked[a.id]).getTime())
      .slice(0, 3),
    [enriched, unlocked]
  );

  const almostUnlocked = useMemo(() =>
    enriched.filter(a => !a.isUnlocked && a.prog && a.prog.current > 0 && a.prog.max > 1)
      .sort((a, b) => (b.prog!.current / b.prog!.max) - (a.prog!.current / a.prog!.max))
      .slice(0, 5),
    [enriched]
  );

  const actionable = almostUnlocked[0] ?? null;

  const filteredGrid = useMemo(() => {
    const base = enriched.filter(a => a.category === activeCategory && (activeTier === null || a.tier === activeTier));
    return [...base.filter(a => a.isUnlocked), ...base.filter(a => !a.isUnlocked)];
  }, [enriched, activeCategory, activeTier]);

  const timelineGroups = useMemo(() => {
    const sorted = enriched.filter(a => a.isUnlocked).sort((a, b) =>
      new Date(unlocked[b.id]).getTime() - new Date(unlocked[a.id]).getTime()
    );
    const groups: Record<string, typeof sorted> = {};
    sorted.forEach(ach => {
      const key = new Date(unlocked[ach.id]).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(ach);
    });
    return Object.entries(groups);
  }, [enriched, unlocked]);

  return (
    <div className="flex gap-6 h-full">

      {/* ══ LEFT PANEL (340px sticky) ══════════════════════════════════════════ */}
      <aside className="w-[340px] shrink-0 space-y-4 sticky top-6 self-start max-h-[calc(100vh-120px)] overflow-y-auto pr-1">

        {/* Rank + global progress */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-5">
            <RankBadge rankInfo={rankInfo} size="lg" showLabel showProgress animated />
          </div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Colección completada</span>
            <span className="text-xl font-bold text-white">{unlockedCount}<span className="text-zinc-600 text-sm">/{totalCount}</span></span>
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-purple-500 transition-all duration-700"
              style={{ width: `${globalPct}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-zinc-600 mt-1.5 text-right">{globalPct}%</p>

          {/* Tier filter chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {TIERS.map(t => (
              <TierChip key={t} tier={t} count={tierCounts[t]} active={activeTier === t} onClick={() => setActiveTier(prev => prev === t ? null : t)} />
            ))}
          </div>
        </div>

        {/* CTA accionable */}
        {actionable && (
          <div
            onClick={() => setSelectedAch(actionable)}
            className="bg-brand-900/20 border border-brand-500/30 rounded-2xl p-4 cursor-pointer hover:bg-brand-900/30 transition-all"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-400 mb-1">Objetivo recomendado</p>
            <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{actionable.title}</h3>
            <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{actionable.hint}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                <span>{actionable.prog!.current}/{actionable.prog!.max} {actionable.prog!.label || ''}</span>
                <span className="text-brand-400">{Math.round((actionable.prog!.current / actionable.prog!.max) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(actionable.prog!.current / actionable.prog!.max) * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Últimos desbloqueos */}
        {recentlyUnlocked.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Últimos desbloqueos</p>
            <div className="space-y-2">
              {recentlyUnlocked.map(ach => {
                const m   = TIER_META[ach.tier];
                const Icon = (Icons as any)[ach.icon] || Icons.Trophy;
                return (
                  <div key={ach.id} onClick={() => setSelectedAch(ach)} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-zinc-800 transition-all border ${m.border} ${m.bg}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.bg}`}><Icon size={14} className={m.text} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{ach.title}</p>
                      <p className="text-[9px] text-zinc-500 font-bold">{new Date(unlocked[ach.id]).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
                    </div>
                    <span className={`text-[9px] font-bold ${m.text}`}>{m.emoji}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Casi desbloqueados */}
        {almostUnlocked.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">A punto de conseguir</p>
            <div className="space-y-2">
              {almostUnlocked.map(ach => {
                const pct  = Math.round((ach.prog!.current / ach.prog!.max) * 100);
                const Icon = (Icons as any)[ach.icon] || Icons.Trophy;
                return (
                  <div key={ach.id} onClick={() => setSelectedAch(ach)} className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800 p-2 rounded-xl transition-all">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0"><Icon size={12} className="text-zinc-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-zinc-300 truncate mb-1">{ach.title}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-brand-400">{pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* ══ RIGHT PANEL ════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Category sidebar + grid/timeline */}
        <div className="flex gap-4">

          {/* Category tabs (vertical) */}
          <nav className="w-44 shrink-0 space-y-1">
            {CATEGORIES.map(cat => {
              const CatIcon    = CATEGORY_ICONS[cat];
              const catList    = enriched.filter(a => a.category === cat);
              const catUnlocked = catList.filter(a => a.isUnlocked).length;
              const pct        = catList.length ? Math.round((catUnlocked / catList.length) * 100) : 0;
              const isActive   = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setSelectedAch(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                  }`}
                >
                  <CatIcon size={14} className={isActive ? 'text-brand-400' : ''} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate">{CATEGORY_NAMES[cat]}</p>
                    <p className="text-[9px] text-zinc-600">{catUnlocked}/{catList.length} · {pct}%</p>
                  </div>
                </button>
              );
            })}

            <div className="pt-3 border-t border-zinc-800">
              <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                {(['GRID', 'TIMELINE'] as const).map(v => (
                  <button key={v} onClick={() => { setViewMode(v); setSelectedAch(null); }}
                    className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                      viewMode === v ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}>{v === 'GRID' ? 'Grid' : 'Timeline'}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            {selectedAch ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <DetailPanel
                  ach={selectedAch}
                  unlocked={unlocked}
                  logs={logs}
                  onClose={() => setSelectedAch(null)}
                />
              </div>
            ) : viewMode === 'GRID' ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredGrid.map(ach => (
                  <AchievementCard
                    key={ach.id}
                    ach={ach}
                    unlockedDate={unlocked[ach.id]}
                    today={today}
                    onClick={() => setSelectedAch(ach)}
                  />
                ))}
                {filteredGrid.length === 0 && (
                  <div className="col-span-3 py-20 text-center text-zinc-600">
                    <Icons.Trophy size={32} className="mx-auto mb-3" />
                    <p className="text-sm font-bold">Sin logros en esta categoría</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {timelineGroups.length === 0 ? (
                  <div className="py-20 text-center text-zinc-600 text-sm font-bold">Aún no has desbloqueado ningún logro.</div>
                ) : timelineGroups.map(([month, items]) => (
                  <div key={month}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-zinc-800" />
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{month}</p>
                      <div className="h-px flex-1 bg-zinc-800" />
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                      {items.map(ach => (
                        <AchievementCard key={ach.id} ach={ach} unlockedDate={unlocked[ach.id]} today={today} onClick={() => setSelectedAch(ach)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
