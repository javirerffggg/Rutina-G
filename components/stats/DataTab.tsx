import React, { useState, useRef } from 'react';
import { clearAllData, importFromHevyCSV, HevyImportResult } from '../../services/storage';
import { Trash2, Upload, AlertTriangle, CheckCircle2, XCircle, FileUp, ShieldAlert, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ---------------------------------------------------------------------------
// DataTab — borrar datos e importar desde Hevy CSV
// ---------------------------------------------------------------------------
export const DataTab: React.FC = () => {
  // --- Delete flow ---
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm1' | 'confirm2'>('idle');
  const [deleted, setDeleted]       = useState(false);

  const handleDeleteConfirm = () => {
    clearAllData();
    setDeleteStep('idle');
    setDeleted(true);
    setTimeout(() => setDeleted(false), 5000);
  };

  // --- Import flow ---
  const fileInputRef                        = useRef<HTMLInputElement>(null);
  const [importing, setImporting]           = useState(false);
  const [importResult, setImportResult]     = useState<HevyImportResult | null>(null);
  const [importError, setImportError]       = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      const text = await file.text();
      const result = importFromHevyCSV(text);
      setImportResult(result);
      // Reset the file input so the same file can be re-selected if needed
      e.target.value = '';
    } catch (err: any) {
      setImportError(err?.message ?? 'Error desconocido al procesar el archivo.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ─── IMPORT SECTION ─── */}
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
            disabled={importing}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-dashed border-sky-500/40 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/60 text-sky-400 font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Upload size={18} />
            {importing ? 'Procesando...' : 'Seleccionar archivo CSV'}
          </button>

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
