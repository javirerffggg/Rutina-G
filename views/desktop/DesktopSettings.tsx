import React, { useState } from 'react';
import {
  Palette, Moon, Type, Clock, RefreshCw, User, Calendar,
  Bell, HardDrive, Info, Check, FileText, Target, ChevronRight,
} from 'lucide-react';
import { AppSettings, getSettings, saveSettings } from '../../services/settings';
import { getLogs } from '../../services/storage';
import { ReportsTab } from '../../components/stats/ReportsTab';
import { DataTab } from '../../components/stats/DataTab';
import { WeeklyPlanEditor } from '../../components/WeeklyPlanEditor';
import { useConvexConnectionState } from 'convex/react';

const SECTIONS = [
  { id: 'appearance', label: 'Apariencia',         Icon: Palette },
  { id: 'workout',    label: 'Entrenamiento',       Icon: Clock },
  { id: 'plan',       label: 'Plan Semanal',        Icon: Calendar },
  { id: 'profile',    label: 'Perfil Físico',       Icon: User },
  { id: 'notifications', label: 'Notificaciones',   Icon: Bell },
  { id: 'reports',    label: 'Reportes',            Icon: FileText },
  { id: 'data',       label: 'Datos',               Icon: HardDrive },
  { id: 'sync',       label: 'Sync',                Icon: RefreshCw },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

const ToggleSwitch: React.FC<{ value: boolean; onChange: () => void }> = ({ value, onChange }) => (
  <button
    onClick={onChange}
    className={`w-12 h-6 rounded-full p-1 transition-colors ${value ? 'bg-brand-500' : 'bg-zinc-700'}`}
  >
    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const Row: React.FC<{ label: string; sub?: string; Icon?: React.FC<any>; children: React.ReactNode; border?: boolean }> = ({
  label, sub, Icon, children, border = true,
}) => (
  <>
    <div className="flex items-center justify-between py-4 px-1">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
            <Icon size={15} />
          </div>
        )}
        <div>
          <p className="font-bold text-white text-sm">{label}</p>
          {sub && <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{sub}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
    {border && <div className="h-px bg-zinc-800" />}
  </>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <h2 className="flex items-center gap-2 text-[10px] font-bold text-brand-500 uppercase tracking-[0.2em] mb-4">
    {icon} {children}
  </h2>
);

export const DesktopSettings: React.FC = () => {
  const [settings, setSettingsState] = useState<AppSettings>(getSettings());
  const [activeSection, setActiveSection] = useState<SectionId>('appearance');
  const [username, setUsername] = useState(() => localStorage.getItem('rutinag_username') || '');
  const convexState = useConvexConnectionState();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    localStorage.setItem('rutinag_username', val);
    window.dispatchEvent(new Event('storage-update'));
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    const updated = saveSettings({ [key]: value });
    setSettingsState(updated);
  };
  const updateProfile = (key: keyof AppSettings['profile'], value: any) => {
    updateSetting('profile', { ...settings.profile, [key]: value });
  };
  const updateNotif = (key: keyof AppSettings['notifications'], value: any) => {
    updateSetting('notifications', { ...settings.notifications, [key]: value });
  };

  const renderSection = () => {
    switch (activeSection) {

      case 'appearance':
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
            <SectionTitle icon={<Palette size={14} />}>Apariencia</SectionTitle>
            <Row label="Modo OLED" sub="Fondo negro puro" Icon={Moon} border={false}>
              <ToggleSwitch value={settings.oledMode} onChange={() => updateSetting('oledMode', !settings.oledMode)} />
            </Row>
            <div className="py-4 px-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><Palette size={15} /></div>
                  <p className="font-bold text-white text-sm">Color de Acento</p>
                </div>
                <div className="flex gap-2">
                  {[{ id: 'blue', hex: '#0ea5e9' }, { id: 'emerald', hex: '#10b981' }, { id: 'purple', hex: '#a855f7' }, { id: 'amber', hex: '#f59e0b' }].map(c => (
                    <button
                      key={c.id}
                      onClick={() => updateSetting('accentColor', c.id)}
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${settings.accentColor === c.id ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {settings.accentColor === c.id && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Row label="Texto grande" Icon={Type} border={false}>
              <ToggleSwitch value={!!settings.largeText} onChange={() => updateSetting('largeText', !settings.largeText)} />
            </Row>
          </div>
        );

      case 'workout':
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl divide-y divide-zinc-800 p-5">
            <SectionTitle icon={<Clock size={14} />}>Entrenamiento</SectionTitle>
            <Row label="Carpetas de rutinas" border>
              <ToggleSwitch value={!!settings.routineFolders} onChange={() => updateSetting('routineFolders', !settings.routineFolders)} />
            </Row>
            <Row label="Ocultar rutinas predefinidas" border>
              <ToggleSwitch value={!!settings.hideDefaultRoutines} onChange={() => updateSetting('hideDefaultRoutines', !settings.hideDefaultRoutines)} />
            </Row>
            <Row label="Descanso por defecto" sub="segundos entre series" Icon={Clock} border>
              <select
                value={settings.defaultRestTime}
                onChange={e => updateSetting('defaultRestTime', parseInt(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-brand-500"
              >
                <option value="60">60s</option>
                <option value="90">90s</option>
                <option value="120">120s</option>
                <option value="180">180s</option>
              </select>
            </Row>
            <Row label="Descargas automáticas" sub="Detectar semanas de fatiga" Icon={RefreshCw} border={!settings.autoDeload}>
              <ToggleSwitch value={!!settings.autoDeload} onChange={() => updateSetting('autoDeload', !settings.autoDeload)} />
            </Row>
            {settings.autoDeload && (
              <Row label="Frecuencia de descarga" border={false}>
                <select
                  value={settings.deloadFrequency || 6}
                  onChange={e => updateSetting('deloadFrequency', parseInt(e.target.value))}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-brand-500"
                >
                  <option value="4">Cada 4 semanas</option>
                  <option value="6">Cada 6 semanas</option>
                  <option value="8">Cada 8 semanas</option>
                  <option value="12">Cada 12 semanas</option>
                </select>
              </Row>
            )}
          </div>
        );

      case 'plan':
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionTitle icon={<Calendar size={14} />}>Plan Semanal</SectionTitle>
            <WeeklyPlanEditor />
          </div>
        );

      case 'profile':
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionTitle icon={<User size={14} />}>Perfil Físico</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'height' as const,    label: 'Altura',             placeholder: '180',   type: 'number', step: undefined },
                { key: 'goalWeight' as const, label: 'Peso objetivo (kg)', placeholder: '75.5',  type: 'number', step: '0.1' },
                { key: 'birthDate' as const,  label: 'F. Nacimiento',      placeholder: '',      type: 'date',   step: undefined },
              ].map(({ key, label, placeholder, type, step }) => (
                <div key={key} className="bg-zinc-800/60 rounded-xl p-4">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">{label}</label>
                  <input
                    type={type}
                    step={step}
                    value={(settings.profile as any)[key] || ''}
                    placeholder={placeholder}
                    onChange={e => updateProfile(key, type === 'number' ? (parseFloat(e.target.value) || null) : e.target.value)}
                    className="w-full bg-transparent text-white font-bold text-xl outline-none"
                  />
                </div>
              ))}
              <div className="bg-zinc-800/60 rounded-xl p-4">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Sexo Biológico</label>
                <select
                  value={settings.profile.gender || ''}
                  onChange={e => updateProfile('gender', e.target.value || null)}
                  className="w-full bg-transparent text-white font-bold text-xl outline-none"
                >
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 divide-y divide-zinc-800">
            <SectionTitle icon={<Bell size={14} />}>Notificaciones</SectionTitle>
            <Row label="Recordatorio de entreno" border>
              <ToggleSwitch
                value={!!settings.notifications.workoutReminder}
                onChange={() => updateNotif('workoutReminder', !settings.notifications.workoutReminder)}
              />
            </Row>
            <Row label="Registro de peso" border={false}>
              <ToggleSwitch
                value={!!settings.notifications.weightReminder}
                onChange={() => updateNotif('weightReminder', !settings.notifications.weightReminder)}
              />
            </Row>
          </div>
        );

      case 'reports':
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionTitle icon={<FileText size={14} />}>Reportes Anuales y Mensuales</SectionTitle>
            <ReportsTab logs={getLogs()} />
          </div>
        );

      case 'data':
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionTitle icon={<HardDrive size={14} />}>Datos y Almacenamiento</SectionTitle>
            <DataTab />
          </div>
        );

      case 'sync':
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 divide-y divide-zinc-800">
            <SectionTitle icon={<RefreshCw size={14} />}>Integración y Sync</SectionTitle>
            <div className="bg-zinc-800/60 rounded-xl p-4 mb-4">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Nombre de Usuario (Cloud)</label>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Añade un usuario para vincular tu dispositivo"
                className="w-full bg-transparent text-white font-bold text-xl outline-none placeholder:text-zinc-600"
              />
            </div>
            <Row label="Convex Cloud Sync" border>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg flex items-center gap-1.5 ${convexState.isWebSocketConnected ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${convexState.isWebSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} /> {convexState.isWebSocketConnected ? 'Online' : 'Offline'}
              </span>
            </Row>
            {!convexState.isWebSocketConnected && (
              <Row label="Aviso" sub="Conexión bloqueada. Revisa tus bloqueadores de anuncios (ej. escudos de Brave)." border={false}>
                <span className="text-[10px] font-bold text-red-500">Desconectado</span>
              </Row>
            )}
            <Row label="Versión de la App" border={false}>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">v1.2.0</span>
            </Row>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="flex gap-6">

      {/* ══ LEFT NAV ═══════════════════════════════════════════════════════════ */}
      <aside className="w-56 shrink-0 sticky top-6 self-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Ajustes</h1>
          <p className="text-xs text-zinc-500 mb-5">Personaliza tu experiencia.</p>
        </div>
        <nav className="space-y-1">
          {SECTIONS.map(({ id, label, Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={14} className={isActive ? 'text-brand-400' : ''} />
                  <span className="text-sm font-bold">{label}</span>
                </div>
                {isActive && <ChevronRight size={12} className="text-zinc-600" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ══ CONTENT ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0">
        {renderSection()}
      </div>
    </div>
  );
};
