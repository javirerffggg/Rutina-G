import React, { useState, useEffect } from 'react';
import { getLogs, saveLog } from '../services/storage';
import { getTodayDateString } from '../utils';
import { DailyLog } from '../types';
import { CompositionTab } from '../components/stats/CompositionTab';
import { PerformanceTab } from '../components/stats/PerformanceTab';
import { ReportsTab } from '../components/stats/ReportsTab';
import { DataTab } from '../components/stats/DataTab';
import { Activity, Dumbbell, FileText, Database } from 'lucide-react';

const Stats: React.FC = () => {
  const today = getTodayDateString();
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [todayLog, setTodayLog] = useState<DailyLog>({ date: today });
  const [activeTab, setActiveTab] = useState<'composition' | 'performance' | 'reports' | 'data'>('performance');

  useEffect(() => {
    const load = () => {
      const data = getLogs();
      setLogs(data);
      if (data[today]) setTodayLog(data[today]);
    };
    load();
    window.addEventListener('storage-update', load);
    return () => window.removeEventListener('storage-update', load);
  }, [today]);

  const updateLog = (updates: Partial<DailyLog>) => {
    const updated = { ...todayLog, ...updates };
    setTodayLog(updated);
    saveLog(updated);
    setLogs(prev => ({ ...prev, [today]: updated }));
  };

  const sortedDates = Object.keys(logs).sort();
  const weightLogs = sortedDates
    .map(date => logs[date])
    .filter(l => l.weight !== undefined && l.weight > 0);

  const TABS = [
    { id: 'performance', label: 'Rendimiento', Icon: Dumbbell },
    { id: 'composition', label: 'Cuerpo',      Icon: Activity },
    { id: 'reports',     label: 'Reportes',    Icon: FileText },
    { id: 'data',        label: 'Datos',       Icon: Database },
  ] as const;

  return (
    <div className="p-5 space-y-6">
      {/* Tab bar */}
      <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === id
                ? id === 'data'
                  ? 'bg-red-500/80 text-white shadow-lg'
                  : 'bg-brand-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'composition' && (
        <CompositionTab todayLog={todayLog} weightLogs={weightLogs} updateLog={updateLog} today={today} />
      )}
      {activeTab === 'performance' && <PerformanceTab logs={logs} />}
      {activeTab === 'reports'     && <ReportsTab logs={logs} />}
      {activeTab === 'data'        && <DataTab />}
    </div>
  );
};

export default Stats;
