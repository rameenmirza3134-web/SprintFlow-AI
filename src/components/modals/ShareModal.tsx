import React, { useState } from 'react';
import { Share2, Copy, Check, X, Shield, Users, Globe } from 'lucide-react';
import { Project } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateShareSettings?: (isPublic: boolean, token?: string) => void;
}

export const ShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  onUpdateShareSettings,
}) => {
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}?project=${project.id}&mode=${permission}&token=${project.share_token || 'demo-token'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Share Project Plan</h3>
              <p className="text-xs text-slate-400">Collaborate with stakeholders and team members</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Permission selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-2">Access Permission</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPermission('view')}
                className={`p-3 rounded-xl border text-left transition ${
                  permission === 'view'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>View Only</span>
                </div>
                <p className="text-[10px] text-slate-400">Can view the visual canvas & sprint plans without editing.</p>
              </button>

              <button
                type="button"
                onClick={() => setPermission('edit')}
                className={`p-3 rounded-xl border text-left transition ${
                  permission === 'edit'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Can Edit</span>
                </div>
                <p className="text-[10px] text-slate-400">Can add tasks, adjust sprints, drag blocks & re-arrange.</p>
              </button>
            </div>
          </div>

          {/* Share Link Field */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Generated Share URL</label>
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-2 text-[11px] text-slate-300 focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1 transition shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Live Sync Note */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
            <Globe className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300 block mb-0.5">Instant Web Access</span>
              Recipients can open this link directly in their browser without signing up to view your interactive visual project canvas.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
