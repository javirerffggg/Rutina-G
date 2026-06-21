export interface AppSettings {
  oledMode: boolean;
  accentColor: string; // 'blue', 'emerald', 'purple', 'amber'
  largeText: boolean;
  routineFolders: boolean;
  hideDefaultRoutines: boolean;
  hideCustomRoutines: boolean;
  defaultRestTime: number; // 90, 120, 180
  deloadFrequency: number; // 4-12 para semanas
  autoDeload: boolean;
  profile: {
    height: number | null;
    birthDate: string | null;
    gender: 'M' | 'F' | 'O' | null;
    goalWeight: number | null;
  };
  notifications: {
    workoutReminder: boolean;
    weightReminder: boolean;
    streakWarning: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  oledMode: false,
  accentColor: 'blue',
  largeText: false,
  routineFolders: false,
  hideDefaultRoutines: false,
  hideCustomRoutines: false,
  defaultRestTime: 90,
  deloadFrequency: 6,
  autoDeload: true,
  profile: {
    height: null,
    birthDate: null,
    gender: null,
    goalWeight: null,
  },
  notifications: {
    workoutReminder: false,
    weightReminder: false,
    streakWarning: false,
  }
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem('appSettings');
    if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: Partial<AppSettings>) => {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem('appSettings', JSON.stringify(updated));
  applySettings(updated);
  return updated;
};

export const applySettings = (settings: AppSettings) => {
  // OLED
  if (settings.oledMode) {
    document.documentElement.classList.add('oled-mode');
  } else {
    document.documentElement.classList.remove('oled-mode');
  }
  
  // Large Text
  if (settings.largeText) {
    document.documentElement.classList.add('large-text');
  } else {
    document.documentElement.classList.remove('large-text');
  }
  
  // Accent Color
  const colors: Record<string, any> = {
    blue: { 50: '#f0f9ff', 100: '#e0f2fe', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 900: '#0c4a6e' },
    emerald: { 50: '#ecfdf5', 100: '#d1fae5', 400: '#34d399', 500: '#10b981', 600: '#059669', 900: '#064e3b' },
    purple: { 50: '#faf5ff', 100: '#f3e8ff', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 900: '#581c87' },
    amber: { 50: '#fffbeb', 100: '#fef3c7', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 900: '#78350f' }
  };
  const theme = colors[settings.accentColor] || colors.blue;
  document.documentElement.style.setProperty('--brand-50', theme[50]);
  document.documentElement.style.setProperty('--brand-100', theme[100]);
  document.documentElement.style.setProperty('--brand-400', theme[400]);
  document.documentElement.style.setProperty('--brand-500', theme[500]);
  document.documentElement.style.setProperty('--brand-600', theme[600]);
  document.documentElement.style.setProperty('--brand-900', theme[900]);
  document.documentElement.setAttribute('data-theme', settings.accentColor);
};

// Initialize on load
applySettings(getSettings());
