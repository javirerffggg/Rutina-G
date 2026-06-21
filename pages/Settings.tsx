import React, { useState } from 'react';
import { 
  Palette, Smartphone, Baseline, Moon, Clock, Type,
  User, Calendar, Ruler, Scale, Target, Bell, Flame,
  Download, Upload, Trash2, HardDrive, RefreshCw, Info,
  ChevronRight, Check, FileText
} from 'lucide-react';
import { AppSettings, getSettings, saveSettings } from '../services/settings';
import { getLogs } from '../services/storage';
import { ReportsTab } from '../components/stats/ReportsTab';
import { DataTab } from '../components/stats/DataTab';
import { WeeklyPlanEditor } from '../components/WeeklyPlanEditor';

export const Settings: React.FC = () => {
  const [settings, setSettingsState] = useState<AppSettings>(getSettings());

  const updateSetting = (key: keyof AppSettings, value: any) => {
    const updated = saveSettings({ [key]: value });
    setSettingsState(updated);
  };

  const updateProfile = (key: keyof AppSettings['profile'], value: any) => {
    const newProfile = { ...settings.profile, [key]: value };
    updateSetting('profile', newProfile);
  };

  const updateNotification = (key: keyof AppSettings['notifications'], value: any) => {
    const newNotif = { ...settings.notifications, [key]: value };
    updateSetting('notifications', newNotif);
  };

  const toggleOLED = () => {
    updateSetting('oledMode', !settings.oledMode);
  };

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-2xl mx-auto space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">Ajustes</h1>
        <p className="text-zinc-500 text-sm mt-1">Personaliza tu experiencia de entrenamiento.</p>
      </header>

      {/* ── APARIENCIA ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          <Palette size={14}/> Apariencia
        </h3>
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-1 overflow-hidden">
          {/* Modo OLED */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center text-zinc-400">
                <Moon size={16} />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Modo OLED</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Fondo negro puro</p>
              </div>
            </div>
            <button 
              onClick={toggleOLED}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.oledMode ? 'bg-brand-500' : 'bg-zinc-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.oledMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="h-px bg-white/5 mx-4" />
          {/* Color Acento */}
          <div className="flex items-center justify-between p-4">
             <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center text-zinc-400">
                <Palette size={16} />
              </div>
              <p className="font-bold text-white text-sm">Color de Acento</p>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'blue', hex: '#0ea5e9' },
                { id: 'emerald', hex: '#10b981' },
                { id: 'purple', hex: '#a855f7' },
                { id: 'amber', hex: '#f59e0b' }
              ].map(color => (
                <button
                  key={color.id}
                  onClick={() => updateSetting('accentColor', color.id)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${settings.accentColor === color.id ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: color.hex }}
                >
                  {settings.accentColor === color.id && <Check size={14} className="text-white"/>}
                </button>
              ))}
            </div>
          </div>
          <div className="h-px bg-white/5 mx-4" />
          {/* Tamaño Fuente */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center text-zinc-400">
                <Type size={16} />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Texto Grande</p>
              </div>
            </div>
            <button 
              onClick={() => updateSetting('largeText', !settings.largeText)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.largeText ? 'bg-brand-500' : 'bg-zinc-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.largeText ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* ── PANTALLA DE ENTRENAMIENTO ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          <Target size={14}/> Pantalla de Entreno
        </h3>
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-1">
          <div className="flex items-center justify-between p-4">
            <p className="font-bold text-white text-sm">Carpetas de rutinas</p>
            <button onClick={() => updateSetting('routineFolders', !settings.routineFolders)} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.routineFolders ? 'bg-brand-500' : 'bg-zinc-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.routineFolders ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="h-px bg-white/5 mx-4" />
          <div className="flex items-center justify-between p-4">
            <p className="font-bold text-white text-sm">Ocultar rutinas predefinidas</p>
            <button onClick={() => updateSetting('hideDefaultRoutines', !settings.hideDefaultRoutines)} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.hideDefaultRoutines ? 'bg-brand-500' : 'bg-zinc-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.hideDefaultRoutines ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* ── ENTRENAMIENTO ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          <Clock size={14}/> Entrenamiento
        </h3>
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-1">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center text-zinc-400">
                <Clock size={16} />
              </div>
              <p className="font-bold text-white text-sm">Descanso por defecto</p>
            </div>
            <select 
              value={settings.defaultRestTime} 
              onChange={e => updateSetting('defaultRestTime', parseInt(e.target.value))}
              className="bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none"
            >
              <option value="60">60s</option>
              <option value="90">90s</option>
              <option value="120">120s</option>
              <option value="180">180s</option>
            </select>
          </div>
          <div className="h-px bg-white/5 mx-4" />
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center text-zinc-400">
                <RefreshCw size={16} />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Frecuencia de Deload</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Semanas automáticas</p>
              </div>
            </div>
            <select 
              value={settings.deloadFrequency || 0} 
              onChange={e => updateSetting('deloadFrequency', parseInt(e.target.value))}
              className="bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none"
            >
              <option value="0">Apagado</option>
              <option value="4">Cada 4 sem</option>
              <option value="6">Cada 6 sem</option>
              <option value="8">Cada 8 sem</option>
              <option value="12">Cada 12 sem</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── PLAN SEMANAL ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          <Calendar size={14}/> Configuración Semanal
        </h3>
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-4">
          <WeeklyPlanEditor />
        </div>
      </section>

      {/* ── PERFIL ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          <User size={14}/> Perfil Físico
        </h3>
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-1">
          <div className="grid grid-cols-2 gap-px bg-white/5">
            <div className="bg-zinc-950 p-4">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Altura (cm)</label>
              <input 
                type="number" inputMode="decimal" 
                value={settings.profile.height || ''} 
                onChange={e => updateProfile('height', parseInt(e.target.value) || null)}
                placeholder="Ej: 180"
                className="w-full bg-transparent text-white font-display font-bold text-xl outline-none"
              />
            </div>
            <div className="bg-zinc-950 p-4">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Peso Objetivo (kg)</label>
              <input 
                type="number" inputMode="decimal" 
                value={settings.profile.goalWeight || ''} 
                onChange={e => updateProfile('goalWeight', parseFloat(e.target.value) || null)}
                placeholder="Ej: 75.5"
                step="0.1"
                className="w-full bg-transparent text-white font-display font-bold text-xl outline-none"
              />
            </div>
            <div className="bg-zinc-950 p-4">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">F. Nacimiento</label>
              <input 
                type="date" 
                value={settings.profile.birthDate || ''} 
                onChange={e => updateProfile('birthDate', e.target.value)}
                className="w-full bg-transparent text-white text-sm font-bold outline-none"
              />
            </div>
            <div className="bg-zinc-950 p-4">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Sexo Biológico</label>
              <select 
                value={settings.profile.gender || ''} 
                onChange={e => updateProfile('gender', e.target.value || null)}
                className="w-full bg-transparent text-white text-sm font-bold outline-none"
              >
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTIFICACIONES ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          <Bell size={14}/> Notificaciones
        </h3>
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-1">
          <div className="flex items-center justify-between p-4">
            <p className="font-bold text-white text-sm">Recordatorio de Entreno</p>
            <button onClick={() => updateNotification('workoutReminder', !settings.notifications.workoutReminder)} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.notifications.workoutReminder ? 'bg-brand-500' : 'bg-zinc-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.notifications.workoutReminder ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="h-px bg-white/5 mx-4" />
          <div className="flex items-center justify-between p-4">
            <p className="font-bold text-white text-sm">Registro de Peso</p>
            <button onClick={() => updateNotification('weightReminder', !settings.notifications.weightReminder)} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.notifications.weightReminder ? 'bg-brand-500' : 'bg-zinc-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.notifications.weightReminder ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* ── REPORTES ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          <FileText size={14}/> Reportes Anuales y Mensuales
        </h3>
        <ReportsTab logs={getLogs()} />
      </section>

      {/* ── DATOS Y ALMACENAMIENTO ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          <HardDrive size={14}/> Datos y Almacenamiento
        </h3>
        <DataTab />
      </section>

      {/* ── INTEGRACIÓN Y SYNC ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          <RefreshCw size={14}/> Integración y Sync
        </h3>
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-1">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
               <p className="font-bold text-white text-sm">Convex Cloud Sync</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">Online</span>
          </div>
          <div className="h-px bg-white/5 mx-4" />
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
               <Info size={16} className="text-zinc-500" />
               <p className="font-bold text-white text-sm">Versión de la App</p>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">v1.2.0</span>
          </div>
        </div>
      </section>

    </div>
  );
};
export default Settings;
