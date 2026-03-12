/**
 * 🎨 RPG LEVELING SYSTEM - PROGRESS BAR COMPONENT
 * Motor de Experiencia Elite - HUD visual premium
 * 
 * Este componente es el showcase visual del sistema RPG.
 * Diseñado con inspiración en HUDs de juegos AAA modernos.
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { RPGStats } from '../../types/rpg';
import { Zap, Trophy } from 'lucide-react';

interface RPGProgressBarProps {
  stats: RPGStats;
}

export const RPGProgressBar: React.FC<RPGProgressBarProps> = ({ stats }) => {
  const {
    level,
    currentTier,
    expInCurrentLevel,
    expForNextLevel,
    expForCurrentLevel,
    progressPercentage,
    streakMultiplier,
    bonusExpFromAchievements,
    isMaxLevel,
  } = stats;

  // Obtener el icono dinámico de lucide-react
  const IconComponent = (LucideIcons as any)[currentTier.iconName] ?? LucideIcons.Star;

  // Calcular EXP necesaria para subir de nivel
  const expNeeded = expForNextLevel - expForCurrentLevel;
  const expRemaining = expNeeded - expInCurrentLevel;

  // Formatear números con separadores de miles
  const formatNumber = (num: number) => num.toLocaleString('es-ES');

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border-2 transition-all duration-500 hover:scale-[1.01] ${
        currentTier.borderColorClass
      } ${
        currentTier.glowClass ?? ''
      }`}
      style={{
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4)`,
      }}
    >
      {/* Contenido principal */}
      <div className="relative z-10 p-6 space-y-4">
        {/* ─── CABECERA DE ESTADO ─── */}
        <div className="flex items-start justify-between">
          {/* Bloque izquierdo: Icono y título */}
          <div className="flex items-center gap-4">
            {/* Icono circular con fondo difuminado */}
            <div
              className={`relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br ${
                currentTier.gradientClass
              } opacity-20`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <IconComponent className={`w-8 h-8 bg-gradient-to-br ${
                  currentTier.gradientClass
                } bg-clip-text text-transparent drop-shadow-lg`} />
              </div>
            </div>

            {/* Título de liga y nivel */}
            <div>
              <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-none">
                {currentTier.displayName}
              </h3>
              <p className="text-sm font-bold text-zinc-400 mt-1">
                Nivel <span className="text-white text-lg">{level}</span>
              </p>
            </div>
          </div>

          {/* Bloque derecho: Badges de estado */}
          <div className="flex flex-col gap-2">
            {/* Badge de multiplicador por racha */}
            {streakMultiplier > 1.0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <Zap size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  x{streakMultiplier.toFixed(2)}
                </span>
              </div>
            )}

            {/* Badge de EXP por logros */}
            {bonusExpFromAchievements > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                <Trophy size={12} className="text-yellow-400" />
                <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider">
                  +{(bonusExpFromAchievements / 1000).toFixed(1)}k
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── BARRA DE PROGRESO PRINCIPAL ─── */}
        <div className="space-y-2">
          {/* Contenedor de la barra */}
          <div className="relative w-full h-5 rounded-full bg-black/60 shadow-inner overflow-hidden">
            {/* Relleno dinámico con gradiente de la liga */}
            <div
              className={`h-full bg-gradient-to-r ${
                currentTier.gradientClass
              } transition-all duration-1500 ease-[cubic-bezier(0.25,1,0.5,1)] relative`}
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Glow effect al final de la barra */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/40 to-transparent" />
            </div>
          </div>

          {/* Texto de porcentaje centrado sobre la barra */}
          <div className="absolute inset-x-0 top-[88px] flex justify-center">
            <span className="text-xs font-bold text-white/90 drop-shadow-md">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ─── FOOTER DE INFORMACIÓN ─── */}
        <div className="flex justify-between items-center text-sm">
          {/* Izquierda: EXP actual vs necesaria */}
          <div className="font-bold">
            <span className="text-white">{formatNumber(expInCurrentLevel)}</span>
            <span className="text-zinc-500"> / </span>
            <span className="text-zinc-400">{formatNumber(expNeeded)}</span>
            <span className="text-zinc-600 text-xs ml-1">EXP</span>
          </div>

          {/* Derecha: Texto motivacional dinámico */}
          <div className="text-right">
            {isMaxLevel ? (
              <p className="text-xs font-bold text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text">
                Máximo Potencial Desbloqueado
              </p>
            ) : (
              <p className="text-xs font-bold text-zinc-400">
                <span className="text-white">{formatNumber(expRemaining)}</span> EXP para Nivel {level + 1}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fondo decorativo con opacidad muy baja */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          currentTier.gradientClass
        } opacity-5 pointer-events-none`}
      />
    </div>
  );
};
