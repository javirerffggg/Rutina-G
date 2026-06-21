import React, { useState, useEffect, useMemo } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { getLogs, saveLog } from '../../services/storage';
import { getTodayDateString } from '../../utils';
import { DailyLog } from '../../types';
import { PerformanceTab } from '../../components/stats/PerformanceTab';
import { CompositionTab } from '../../components/stats/CompositionTab';
import MuscleLoadScreen from '../../pages/MuscleLoadScreen';
import ConsistencyScreen from '../../pages/ConsistencyScreen';
import VolumeEvolutionScreen from '../../pages/VolumeEvolutionScreen';

/**
 * DesktopStats — muestra PerformanceTab y CompositionTab en paralelo.
 *
 * PerformanceTab usa useNavigate() internamente (muscle-load, consistency,
 * volume-evolution), así que envolvemos todo en un MemoryRouter propio.
 * Las rutas de detalle se renderizan en la columna de Rendimiento cuando
 * el usuario pulsa los botones de navegación, y tienen un botón "← Volver"
 * para regresar a la vista principal del tab.
 */

const STORAGE_EVENT = 'storage-update';

const DesktopStatsInner: React.FC = () => {
  const today = useMemo(() => getTodayDateString(), []);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [todayLog, setTodayLog] = useState<DailyLog>({ date: today });

  useEffect(() => {
    const load = () => {
      const data = getLogs();
      setLogs(data);
      setTodayLog(data[today] ?? { date: today });
    };
    load();
    window.addEventListener(STORAGE_EVENT, load);
    return () => window.removeEventListener(STORAGE_EVENT, load);
  }, [today]);

  const updateLog = (updates: Partial<DailyLog>) => {
    const updated = { ...todayLog, ...updates };
    setTodayLog(updated);
    saveLog(updated);
    setLogs(prev => ({ ...prev, [today]: updated }));
  };

  const sortedDates = Object.keys(logs).sort();
  const weightLogs = sortedDates
    .map(d => logs[d])
    .filter(l => l.weight !== undefined && l.weight > 0);

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-white mb-6 shrink-0">Estadísticas</h1>

      {/* 2-column layout — each column scrolls independently */}
      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">

        {/* ── Columna izquierda: Rendimiento ── */}
        <div className="flex flex-col min-h-0">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 shrink-0">
            Rendimiento
          </p>
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <Routes>
              <Route path="/" element={<PerformanceTab logs={logs} />} />
              <Route path="/muscle-load" element={
                <>
                  <BackButton />
                  <MuscleLoadScreen />
                </>
              } />
              <Route path="/consistency" element={
                <>
                  <BackButton />
                  <ConsistencyScreen />
                </>
              } />
              <Route path="/volume-evolution" element={
                <>
                  <BackButton />
                  <VolumeEvolutionScreen />
                </>
              } />
            </Routes>
          </div>
        </div>

        {/* ── Columna derecha: Cuerpo ── */}
        <div className="flex flex-col min-h-0">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 shrink-0">
            Cuerpo
          </p>
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <CompositionTab
              todayLog={todayLog}
              weightLogs={weightLogs}
              updateLog={updateLog}
              today={today}
              allLogs={logs}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/** Botón volver para las sub-rutas de PerformanceTab */
const BackButton: React.FC = () => {
  // Importamos useNavigate dentro del componente para que use el MemoryRouter
  const { useNavigate } = require('react-router-dom');
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/')}
      className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white mb-4 transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Volver
    </button>
  );
};

export const DesktopStats: React.FC = () => (
  <MemoryRouter>
    <DesktopStatsInner />
  </MemoryRouter>
);
