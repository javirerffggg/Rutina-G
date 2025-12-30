import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getLogs } from '../services/storage';

const Stats: React.FC = () => {
  const logs = getLogs();
  
  const data = Object.values(logs)
    .filter(l => l.weight)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(l => ({
      date: new Date(l.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      weight: l.weight
    }));

  const last7 = data.slice(-7);
  const avgWeight = last7.length > 0 
    ? (last7.reduce((acc, curr) => acc + (curr.weight || 0), 0) / last7.length).toFixed(1) 
    : '--';

  return (
    <div className="p-5 space-y-6">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">Progreso</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Peso Actual</span>
          <div className="text-3xl font-bold text-white mt-2">
            {data[data.length - 1]?.weight || '--'} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Promedio 7d</span>
          <div className="text-3xl font-bold text-brand-400 mt-2">
            {avgWeight} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
        </div>
      </div>

      {/* Weight Chart */}
      <div className="glass-panel p-5 rounded-2xl h-80 border border-white/5">
        <h3 className="text-white font-bold mb-6 text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-500"></span>
          Tendencia de Peso
        </h3>
        {data.length > 1 ? (
          <div className="h-64 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tick={{fontSize: 10, fill: '#64748b'}} 
                  tickMargin={15}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']} 
                  stroke="#64748b" 
                  tick={{fontSize: 10, fill: '#64748b'}}
                  width={40}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    color: '#f8fafc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{color: '#38bdf8'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#38bdf8" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                  activeDot={{r: 6, strokeWidth: 0, fill: '#fff'}}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center opacity-50">
               <span className="text-xl">📊</span>
            </div>
            Registra más datos para visualizar.
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;