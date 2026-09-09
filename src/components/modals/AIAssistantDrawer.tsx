import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { ProjectFullState } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectState: ProjectFullState;
  onApplyAIChanges: (updatedState: ProjectFullState) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_COMMANDS = [
  'Generate 3 QA Testing tasks',
  'Add CI/CD Cloud Deployment task',
  'Balance sprint workloads',
  'Suggest UI wireframe tasks',
];

export const AIAssistantDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  projectState,
  onApplyAIChanges,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I'm your SprintFlow AI Assistant. You can ask me to create sprints, generate tasks for Designing, Development, Testing, or Deployment, or rebalance team workloads. How can I help?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isProcessing) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          current_project_state: projectState,
        }),
      });

      if (!response.ok) {
        throw new Error('AI Assistant service unavailable.');
      }

      const data = await response.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Changes successfully applied to project board!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (data.updated_project_state) {
        onApplyAIChanges(data.updated_project_state);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        text: `Sorry, I encountered an issue: ${err?.message || 'Unable to complete action.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col text-slate-800 dark:text-slate-100 select-none animate-in slide-in-from-right duration-200 transition-colors">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">AI Project Assistant</h3>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-semibold">
                AI Engine
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Natural Language Scrum Master & Planner</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-slate-50/40 dark:bg-transparent">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-750 shadow-xs'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs py-2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Analyzing project state & updating canvas...</span>
          </div>
        )}
      </div>

      {/* Quick Command Chips */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/80">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1.5 uppercase tracking-wider">
          Suggested Commands
        </span>
        <div className="flex flex-wrap gap-1">
          {QUICK_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(cmd)}
              disabled={isProcessing}
              className="px-2 py-1 rounded bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] border border-slate-200 dark:border-slate-700/80 transition shadow-2xs"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. Create a sprint for payments..."
          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition shadow"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
