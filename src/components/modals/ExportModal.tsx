import React, { useState } from 'react';
import { Download, FileText, Image, Code, Check, X, Sparkles } from 'lucide-react';
import { ProjectFullState } from '../../types';
import { exportCanvasAsImage, exportProjectAsPDF, exportProjectAsJSON } from '../../utils/exportUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: ProjectFullState;
}

export const ExportModal: React.FC<Props> = ({ isOpen, onClose, state }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      exportProjectAsPDF(state);
      setSuccessMessage('PDF project plan downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`PDF Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async (format: 'png' | 'jpg') => {
    setIsExporting(true);
    try {
      await exportCanvasAsImage('sprintflow-canvas-viewport', format, state.project.name);
      setSuccessMessage(`${format.toUpperCase()} image downloaded successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Image Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    exportProjectAsJSON(state);
    setSuccessMessage('JSON backup exported!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export Project Plan</h3>
              <p className="text-xs text-slate-400">Download formatted deliverables or canvas snapshots</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* PDF Option */}
          <div
            onClick={handleExportPDF}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 cursor-pointer transition flex items-start gap-3 group"
          >
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-200 group-hover:text-white">Executive PDF Report</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">.pdf</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Formatted agile project documentation with Epics, Sprints, Backlog, Team & Risk Analysis.
              </p>
            </div>
          </div>

          {/* PNG Option */}
          <div
            onClick={() => handleExportImage('png')}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 cursor-pointer transition flex items-start gap-3 group"
          >
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 mt-0.5">
              <Image className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-200 group-hover:text-white">High-Resolution Canvas Image (PNG)</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">.png</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                2x crystal-clear capture of your visual canvas layout with all connections.
              </p>
            </div>
          </div>

          {/* JPG Option */}
          <div
            onClick={() => handleExportImage('jpg')}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 cursor-pointer transition flex items-start gap-3 group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
              <Image className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-200 group-hover:text-white">Compressed Canvas Snapshot (JPG)</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">.jpg</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Lightweight image suitable for embedding into Slack, Discord, or slide decks.
              </p>
            </div>
          </div>

          {/* JSON Option */}
          <div
            onClick={handleExportJSON}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 cursor-pointer transition flex items-start gap-3 group"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
              <Code className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-200 group-hover:text-white">Raw JSON State Backup</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">.json</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full relational entity schema export for offline backup or migration.
              </p>
            </div>
          </div>
        </div>

        {isExporting && (
          <div className="mt-4 p-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span>Generating high-resolution export...</span>
          </div>
        )}
      </div>
    </div>
  );
};
