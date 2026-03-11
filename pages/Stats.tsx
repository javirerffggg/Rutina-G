import React, { useState, useEffect } from 'react';
import { getLogs, saveLog } from '../services/storage';
import { getTodayDateString } from '../utils';
import { DailyLog } from '../types';
import { CompositionTab } from '../components/stats/CompositionTab';
import { PerformanceTab } from '../components/stats/PerformanceTab';
import { ReportsTab } from '../components/stats/ReportsTab';
import { Activity, Dumbbell, FileText } from 'lucide-react';

const Stats: React.FC = () => {
  const today = getTodayDateString();
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [todayLog, setTodayLog] = useState<DailyLog>({ date: today });
  const [activeTab, setActiveTab] = useState<'composition' | 'performance' | 'reports'>('performance');

  useEffect(() => {
    const data = getLogs();
    setLogs(data);
    if (data[today]) {
      setTodayLog(data[today]);
    }
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

  return (
    <div className="p-5 space-y-6">
      <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5 mb-6">
        <button 
          onClick={() => setActiveTab('performance')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'performance' ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Dumbbell size={14} /> Rendimiento
        </button>
        <button 
          onClick={() => setActiveTab('composition')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'composition' ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Activity size={14} /> Cuerpo
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'reports' ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <FileText size={14} /> Reportes
        </button>
      </div>

      {activeTab === 'composition' && (
        <CompositionTab 
          todayLog={todayLog} 
          weightLogs={weightLogs} 
          updateLog={updateLog} 
          today={today} 
        />
      )}
      {activeTab === 'performance' && (
        <PerformanceTab logs={logs} />
      )}
      {activeTab === 'reports' && (
        <ReportsTab logs={logs} />
      )}
    </div>
  );
};

export default Stats;