import React, { useState } from 'react';
import { Database, Copy, Check, X, ShieldCheck, Key, ExternalLink } from 'lucide-react';
import { SUPABASE_SCHEMA_SQL, configureSupabaseCredentials } from '../../services/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onCredentialsUpdated: () => void;
}

export const SupabaseSetupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isConnected,
  onCredentialsUpdated,
}) => {
  const [url, setUrl] = useState(localStorage.getItem('sprintflow_supabase_url') || '');
  const [key, setKey] = useState(localStorage.getItem('sprintflow_supabase_key') || '');
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    configureSupabaseCredentials(url.trim(), key.trim());
    setSavedSuccess(true);
    onCredentialsUpdated();
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-6 my-8 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Supabase Cloud Database Configuration</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isConnected ? 'Connected & Syncing' : 'Using Local Reactive Storage'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dual-layer persistence: immediate local state updates + optional cloud PostgreSQL sync.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 overflow-y-auto space-y-4 text-xs flex-1">
          {savedSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Supabase credentials saved. Testing connection...</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSaveCredentials} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Project API Credentials</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Project URL</label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Anon / Public API Key</label>
              <input
                type="password"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Found in your Supabase Dashboard under Settings &gt; API
              </span>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
              >
                Save & Connect
              </button>
            </div>
          </form>

          {/* SQL Migration Script Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>One-Click SQL Schema with Row Level Security (RLS)</span>
              </div>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition"
              >
                {copiedSQL ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSQL ? 'Copied SQL' : 'Copy Migration SQL'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Run this script once in your Supabase SQL Editor to provision the 8 core tables: <code>projects</code>, <code>epics</code>, <code>backlog_items</code>, <code>sprints</code>, <code>team_members</code>, <code>canvas_blocks</code>, <code>dependencies</code>, and <code>risks</code>.
            </p>

            <div className="max-h-48 overflow-y-auto p-3 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 select-all">
              <pre>{SUPABASE_SCHEMA_SQL}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
