/**
 * 🎉 RPG LEVELING SYSTEM - LEVEL UP CELEBRATION
 * Motor de Experiencia Elite - Overlay de celebración animado
 * 
 * Este componente se muestra cuando el usuario sube de nivel.
 * Diseñado para generar un pico de dopamina y gratificación inmediata.
 */

import React, { useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { RPGStats } from '../../types/rpg';
import { Sparkles } from 'lucide-react';

interface LevelUpCelebrationProps {
  stats: RPGStats;
  previousLevel: number;
  onClose: () => void;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  stats,
  previousLevel,
  onClose,
}) => {
  const { level, currentTier } = stats;
  
  // Obtener el icono dinámico de la liga
  const IconComponent = (LucideIcons as any)[currentTier.iconName] ?? LucideIcons.Star;
  
  // Detectar si hubo cambio de liga
  const previousTierLevel = Math.floor((previousLevel - 1) / 100) * 100 + 1;
  const currentTierLevel = Math.floor((level - 1) / 100) * 100 + 1;
  const isTierChange = previousTierLevel !== currentTierLevel && level > 1;
  
  // Prevenir scroll mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-500">
      {/* Partículas decorativas de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full bg-gradient-to-r ${
              currentTier.gradientClass
            } animate-pulse`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center space-y-8 px-6 animate-in zoom-in-50 duration-700 spring-bounce">
        {/* Icono de la liga con resplandor */}
        <div className="relative">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              currentTier.gradientClass
            } rounded-full blur-3xl opacity-50 animate-pulse`}
          />
          <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${
            currentTier.gradientClass
          } flex items-center justify-center shadow-2xl`}>
            <IconComponent className="w-16 h-16 text-white drop-shadow-2xl" />
          </div>
        </div>

        {/* Texto "¡NIVEL ALCANZADO!" */}
        <div className="flex items-center gap-3">
          <Sparkles className={`w-6 h-6 bg-gradient-to-br ${
            currentTier.gradientClass
          } bg-clip-text text-transparent animate-spin`} style={{ animationDuration: '3s' }} />
          <h1 className="text-2xl font-display font-bold uppercase tracking-[0.3em] text-white/90">
            ¡Nivel Alcanzado!
          </h1>
          <Sparkles className={`w-6 h-6 bg-gradient-to-br ${
            currentTier.gradientClass
          } bg-clip-text text-transparent animate-spin`} style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
        </div>

        {/* Número de nivel gigante */}
        <div className="text-center">
          <div className={`text-9xl font-display font-black bg-gradient-to-br ${
            currentTier.gradientClass
          } bg-clip-text text-transparent drop-shadow-2xl animate-in zoom-in-75 duration-700`}>
            {level}
          </div>
          <p className="text-lg font-bold text-white/60 tracking-wider mt-2">
            {currentTier.displayName}
          </p>
        </div>

        {/* Alerta de nueva liga */}
        {isTierChange && (
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${
              currentTier.gradientClass
            } shadow-2xl`}>
              <p className="text-sm font-bold text-white uppercase tracking-wider text-center">
                🏆 ¡Nueva Liga de Prestigio Desbloqueada! 🏆
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Botón de cerrar */}
      <button
        onClick={onClose}
        className={`fixed bottom-12 px-8 py-4 rounded-2xl bg-gradient-to-r ${
          currentTier.gradientClass
        } text-white font-bold text-lg uppercase tracking-wider shadow-2xl hover:scale-105 active:scale-95 transition-transform`}
      >
        Continuar
      </button>
    </div>
  );
};
