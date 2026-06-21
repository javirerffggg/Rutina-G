import React, { useMemo } from 'react';
import { getLogs } from '../../services/storage';
import { getSettings } from '../../services/settings';
import { getTodayDateString, getCurrentPhase } from '../../utils';
import { Dumbbell, Moon } from 'lucide-react';

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const DesktopPlan: React.FC = () => {
  const today = getTodayDateString();
  const settings = useMemo(() => getSettings(), []);
  const allLogs = useMemo(() => getLogs(), []);
  const phase = useMemo(
    () => getCurrentPhase(today, allLogs, settings.autoDeload ? settings.deloadFrequency : 0),
    [today, allLogs, settings]
  );

  // Build current week (Mon → Sun)
  const weekDays = useMemo(() => {
    const todayDate = new Date(today);
    const dayOfWeek = todayDate.getDay(); // 0=Sun
    const monday = new Date(todayDate);
    monday.setDate(todayDate.getDate() - ((dayOfWeek + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const log = allLogs[iso];
      return {
        iso,
        label: DAYS_ES[i],
        dayNum: d.getDate(),
        month: d.toLocaleDateString('es-ES', { month: 'short' }),
        isToday: iso === today,
        isFuture: iso > today,
        log,
        exCount: log?.exercises?.length ?? 0,
        setCount: log?.exercises?.reduce((a: number, ex: any) =>
          a + ex.sets.filter((s: any) => s.completed).length, 0) ?? 0,
        completed: !!log?.workoutCompleted,
        hasWeight: !!log?.weight,
      };
    });
  }, [today, allLogs]);

  // Last 4 weeks history
  const pastWeeks = useMemo(() => {
    return Array.from({ length: 4 }, (_, weekIdx) => {
      const offset = (weekIdx + 1) * 7;
      const weekStart = new Date(today);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - ((dayOfWeek + 6) % 7) - offset);
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        return { iso, completed: !!allLogs[iso]?.workoutCompleted };
      });
      const completedCount = days.filter(d => d.completed).length;
      return { weekIdx, days, completedCount, startDate: weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) };
    });
  }, [today, allLogs]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Plan Semanal</h1>
      <p className="text-sm text-zinc-500 mb-6">{phase.name}</p>

      {/* Current week calendar */}
      <div className="grid grid-cols-7 gap-3 mb-8">
        {weekDays.map(day => (
          <div
            key={day.iso}
            className={`rounded-2xl p-4 border transition-all ${
              day.isToday
                ? 'bg-brand-500/10 border-brand-500/40'
                : day.completed
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            {/* Header */}
            <div className="mb-3">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${
                day.isToday ? 'text-brand-400' : 'text-zinc-500'
              }`}>{day.label}</p>
              <p className={`text-xl font-bold ${
                day.isToday ? 'text-white' : day.isFuture ? 'text-zinc-600' : 'text-zinc-300'
              }`}>{day.dayNum}</p>
              <p className="text-[10px] text-zinc-600">{day.month}</p>
            </div>

            {/* Content */}
            {day.completed ? (
              <div>
                <div className="flex items-center gap-1 text-emerald-400 mb-2">
                  <Dumbbell size={12} />
                  <span className="text-[10px] font-bold">Completado</span>
                </div>
                <p className="text-[10px] text-zinc-500">{day.exCount} ejerc.</p>
                <p className="text-[10px] text-zinc-500">{day.setCount} sets</p>
                {day.log?.weight && (
                  <p className="text-[10px] text-zinc-600 mt-1">{day.log.weight} kg</p>
                )}
              </div>
            ) : day.isFuture ? (
              <div className="flex items-center gap-1 text-zinc-700">
                <Moon size={12} />
                <span className="text-[10px]">Pendiente</span>
              </div>
            ) : day.log ? (
              <div>
                <p className="text-[10px] text-zinc-500">Sin entreno</p>
                {day.log.weight && <p className="text-[10px] text-zinc-600">{day.log.weight} kg</p>}
              </div>
            ) : (
              <p className="text-[10px] text-zinc-700">Sin registro</p>
            )}
          </div>
        ))}
      </div>

      {/* Phase info */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-3">Nutrición de fase</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{phase.nutritionGoal}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-3">Foco de entrenamiento</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{phase.trainingFocus}</p>
        </div>
      </div>

      {/* Past 4 weeks */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Historial — últimas 4 semanas</h3>
        <div className="space-y-3">
          {pastWeeks.map(week => (
            <div key={week.weekIdx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-6">
              <div className="w-28 shrink-0">
                <p className="text-xs font-bold text-zinc-300">{week.startDate}</p>
                <p className="text-[10px] text-zinc-500">{week.completedCount}/7 sesiones</p>
              </div>
              <div className="flex gap-1.5">
                {week.days.map(d => (
                  <div
                    key={d.iso}
                    title={d.iso}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      d.completed ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-zinc-800 text-zinc-600'
                    }`}
                  >
                    {DAYS_ES[week.days.indexOf(d)].charAt(0)}
                  </div>
                ))}
              </div>
              <div className="ml-auto">
                <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${(week.completedCount / 7) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
