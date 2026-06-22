import React, { useState, useRef } from 'react';
import { clearAllData, importFromHevyCSV, HevyImportResult, analyzeHevyCSV, ALL_EXERCISES } from '../../services/storage';
import { Trash2, Upload, AlertTriangle, CheckCircle2, XCircle, FileUp, ShieldAlert, Info, Share2, Link as LinkIcon } from 'lucide-react';
import { getDeviceId } from '../SyncManager';
import { motion, AnimatePresence } from 'motion/react';
import { useConvex } from 'convex/react';

// @ts-ignore
import { api } from '../../convex/_generated/api';

// ---------------------------------------------------------------------------
// DataTab — borrar datos, exportar/importar JSON y CSV
// ---------------------------------------------------------------------------
export const DataTab: React.FC = () => {
  const convex = useConvex();

  // --- Delete flow ---
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm1' | 'confirm2'>('idle');
  const [deleted, setDeleted]       = useState(false);

  const handleDeleteConfirm = () => {
    clearAllData();
    setDeleteStep('idle');
    setDeleted(true);
    setTimeout(() => setDeleted(false), 5000);
  };

  // --- Import/Export JSON flow ---
  const exportData = () => {
    const data = {
      logs: JSON.parse(localStorage.getItem('fitness_pro_logs_v1') || '{}'),
      achievements: JSON.parse(localStorage.getItem('fitness_pro_achievements_v1') || '{}'),
      routines: JSON.parse(localStorage.getItem('customRoutines') || '[]'),
      settings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
      rpgLevel: localStorage.getItem('rpg_last_seen_level') || '1'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rutina-g-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.logs) localStorage.setItem('fitness_pro_logs_v1', JSON.stringify(data.logs));
        if (data.achievements) localStorage.setItem('fitness_pro_achievements_v1', JSON.stringify(data.achievements));
        if (data.routines) localStorage.setItem('customRoutines', JSON.stringify(data.routines));
        if (data.settings) localStorage.setItem('appSettings', JSON.stringify(data.settings));
        if (data.rpgLevel) localStorage.setItem('rpg_last_seen_level', data.rpgLevel);
        alert('Datos importados correctamente. La app se recargará.');
        window.location.reload();
      } catch (err) {
        alert('Error importando los datos JSON.');
      }
    };
    reader.readAsText(file);
  };

  // --- Import CSV flow ---
  const fileInputRef                        = useRef<HTMLInputElement>(null);
  const [importing, setImporting]           = useState(false);
  const [importResult, setImportResult]     = useState<HevyImportResult | null>(null);
  const [importError, setImportError]       = useState<string | null>(null);
  
  const [csvExercises, setCsvExercises] = useState<Array<{ hevyName: string, suggestedId: string | null }>>([]);
  const [userMapping, setUserMapping]               = useState<Record<string, string>>({});
  const [csvFileText, setCsvFileText]               = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    setCsvExercises([]);
    setUserMapping({});
    setCsvFileText(null);
    try {
      const text = await file.text();
      const allExercises = analyzeHevyCSV(text);
      if (allExercises.length > 0) {
        setCsvExercises(allExercises);
        setCsvFileText(text);
        const initialMapping: Record<string, string> = {};
        allExercises.forEach(ex => initialMapping[ex.hevyName] = ex.suggestedId || '');
        setUserMapping(initialMapping);
      } else {
        const result = importFromHevyCSV(text);
        setImportResult(result);
      }
      e.target.value = '';
    } catch (err: any) {
      setImportError(err?.message ?? 'Error desconocido al procesar el archivo.');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmMapping = () => {
    if (!csvFileText) return;
    setImporting(true);
    try {
      const result = importFromHevyCSV(csvFileText, userMapping);
      setImportResult(result);
      setCsvExercises([]);
      setCsvFileText(null);
    } catch(err: any) {
      setImportError(err?.message ?? 'Error desconocido');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ─── NATIVE JSON IMPORT/EXPORT ─── */}
      <section className="rounded-3xl border border-white/8 bg-zinc-900/50 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Upload size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Datos de la App (JSON)</h3>
            <p className="text-[10px] text-zinc-500 font-medium">Exportar e importar copias de seguridad</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <button onClick={exportData} className="w-full flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left rounded-2xl border border-white/5">
            <Share2 size={18} className="text-blue-400" />
            <p className="font-bold text-white text-sm flex-1">Exportar Copia de Seguridad</p>
          </button>
          
          <label className="w-full flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left cursor-pointer rounded-2xl border border-white/5">
            <Upload size={18} className="text-emerald-400" />
            <p className="font-bold text-white text-sm flex-1">Importar Datos (JSON)</p>
            <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
          </label>
        </div>
      </section>

      {/* ─── IMPORT HEVY SECTION ─── */}
      <section className="rounded-3xl border border-white/8 bg-zinc-900/50 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <FileUp size={18} className="text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Importar desde Hevy</h3>
            <p className="text-[10px] text-zinc-500 font-medium">CSV exportado desde la app Hevy</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* How to export from Hevy */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-sky-500/5 border border-sky-500/15">
            <Info size={15} className="text-sky-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-zinc-400 leading-relaxed space-y-1">
              <p className="font-bold text-sky-300 mb-1">Cómo exportar desde Hevy:</p>
              <p>1. Abre Hevy → Perfil → Settings</p>
              <p>2. Scroll hasta «Export data» → <strong className="text-white">Export Workouts (CSV)</strong></p>
              <p>3. Envíatelo por email o AirDrop y ábrelo aquí.</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing || csvExercises.length > 0}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-dashed border-sky-500/40 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/60 text-sky-400 font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Upload size={18} />
            {importing ? 'Procesando...' : 'Seleccionar archivo CSV'}
          </button>

          {/* Mapping UI */}
          <AnimatePresence>
            {csvExercises.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-2xl border bg-zinc-900/80 border-zinc-700/50 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white">Revisión de Mapeo ({csvExercises.length} ejercicios)</p>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        Revisa y asigna manualmente a qué ejercicio corresponde cada uno.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {csvExercises.map(ex => (
                      <div key={ex.hevyName} className="space-y-1">
                        <label className="text-xs font-bold text-zinc-300 pl-1">{ex.hevyName}</label>
                        <select
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-sky-500/50"
                          value={userMapping[ex.hevyName] || ''}
                          onChange={(e) => setUserMapping(prev => ({ ...prev, [ex.hevyName]: e.target.value }))}
                        >
                          <option value="">-- Ignorar este ejercicio --</option>
                          {ALL_EXERCISES.sort((a,b) => a.name.localeCompare(b.name)).map(dbEx => (
                            <option key={dbEx.id} value={dbEx.id}>{dbEx.name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleConfirmMapping}
                    className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all shadow-lg shadow-sky-500/20"
                  >
                    Confirmar e Importar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Import result */}
          <AnimatePresence>
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-2xl border space-y-3 ${
                  importResult.warnings.length > 0
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {importResult.warnings.length === 0
                    ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    : <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                  }
                  <p className="text-sm font-bold text-white">
                    {importResult.imported} sesión{importResult.imported !== 1 ? 'es' : ''} importada{importResult.imported !== 1 ? 's' : ''}
                    {importResult.skipped > 0 && (
                      <span className="text-amber-400 ml-1">· {importResult.skipped} series omitidas</span>
                    )}
                  </p>
                </div>
                {importResult.warnings.length > 0 && (
                  <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                    {importResult.warnings.map((w, i) => (
                      <p key={i} className="text-[10px] text-amber-300/80 leading-snug">· {w}</p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {importError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-4 rounded-2xl border bg-red-500/5 border-red-500/20"
              >
                <XCircle size={18} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{importError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── EXPORT AI SECTION ─── */}
      <section className="rounded-3xl border border-white/8 bg-zinc-900/50 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Share2 size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Exportación para IA</h3>
            <p className="text-[10px] text-zinc-500 font-medium">Enlace JSON público (Perplexity, ChatGPT)</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/15">
            <Info size={15} className="text-violet-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-zinc-400 leading-relaxed space-y-1">
              <p className="font-bold text-violet-300 mb-1">Analiza tus datos con IA:</p>
              <p>Copia este enlace y pégaselo a una IA pidiéndole que lea tus estadísticas de entrenamiento.</p>
              <p>Nota: Requiere que hayas configurado el servidor Convex.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Enlace de acceso a datos (JSON)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-zinc-400 font-mono truncate select-all">
                {(() => {
                  const url = (import.meta as any).env.VITE_CONVEX_URL;
                  return url ? url.replace('.convex.cloud', '.convex.site') + `/export?token=${getDeviceId()}` : 'Configura Convex primero para generar tu enlace';
                })()}
              </div>
              <button 
                onClick={() => {
                  const url = (import.meta as any).env.VITE_CONVEX_URL;
                  if (url) {
                    navigator.clipboard.writeText(url.replace('.convex.cloud', '.convex.site') + `/export?token=${getDeviceId()}`);
                    alert('Enlace copiado al portapapeles');
                  }
                }}
                className="w-12 h-12 shrink-0 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 flex items-center justify-center transition-all"
              >
                <LinkIcon size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Vincular otro dispositivo</label>
            <p className="text-[10px] text-zinc-400 pl-1 mb-1">Tu ID actual es: <strong className="text-white select-all">{getDeviceId()}</strong></p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                id="linkDeviceInput"
                placeholder="Pega el ID de tu otro dispositivo"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-600 outline-none focus:border-violet-500/50"
              />
              <button 
                onClick={async () => {
                  const input = document.getElementById('linkDeviceInput') as HTMLInputElement;
                  const linkValue = input ? input.value.trim() : '';
                  if (linkValue.length > 2) {
                    try {
                      const resolvedId = await convex.query(api.sync.resolveDevice, { identifier: linkValue });
                      if (resolvedId) {
                        if (confirm(`¿Estás seguro? Encontramos el dispositivo. Esto reemplazará tus datos locales la próxima vez que se sincronice.`)) {
                          localStorage.setItem('ot_device_id', resolvedId);
                          localStorage.setItem('ot_last_update', '0'); // force pull
                          alert('Dispositivo vinculado. Recarga la página para sincronizar.');
                          window.location.reload();
                        }
                      } else {
                        alert('No se encontró ningún dispositivo con ese ID o Nombre de usuario.');
                      }
                    } catch (err) {
                      console.error('Error resolving device:', err);
                      alert('Error al buscar el dispositivo. Comprueba tu conexión a internet o si un bloqueador de anuncios (ej. escudos de Brave) está bloqueando a Convex.');
                    }
                  } else {
                    alert('Por favor, ingresa un ID o Nombre de Usuario válido.');
                  }
                }}
                className="px-4 py-3 shrink-0 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs transition-all shadow-lg shadow-violet-500/20"
              >
                Vincular
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DANGER ZONE ─── */}
      <section className="rounded-3xl border border-red-500/20 bg-red-950/10 overflow-hidden">
        <div className="p-5 border-b border-red-500/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <ShieldAlert size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-300">Zona peligrosa</h3>
            <p className="text-[10px] text-zinc-500 font-medium">Acciones irreversibles</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {deleted && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300 font-bold">Todos los datos han sido eliminados.</p>
            </div>
          )}

          {deleteStep === 'idle' && (
            <button
              onClick={() => setDeleteStep('confirm1')}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold text-sm transition-all active:scale-[0.98]"
            >
              <Trash2 size={18} />
              Borrar todos los datos
            </button>
          )}

          <AnimatePresence>
            {deleteStep === 'confirm1' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="p-4 rounded-2xl border border-red-500/30 bg-red-950/30 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">¿Borrar todos los datos?</p>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Se eliminarán permanentemente todos los registros de entreno,
                      datos de peso, logros y configuración. Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteStep('idle')}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setDeleteStep('confirm2')}
                    className="flex-1 py-3 rounded-xl bg-red-600/80 text-white font-bold text-sm hover:bg-red-600 transition-all"
                  >
                    Continuar
                  </button>
                </div>
              </motion.div>
            )}

            {deleteStep === 'confirm2' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="p-4 rounded-2xl border border-red-500/50 bg-red-950/50 space-y-4"
              >
                <p className="text-sm font-black text-red-300 text-center">
                  ⚠️ Confirmación final
                </p>
                <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
                  Pulsa <strong className="text-red-300">«Borrar todo»</strong> para confirmar.
                  No hay marcha atrás.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteStep('idle')}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-500 transition-all shadow-lg shadow-red-900/50"
                  >
                    Borrar todo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};
