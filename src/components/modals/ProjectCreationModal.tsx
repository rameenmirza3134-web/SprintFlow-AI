import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  Compass,
  Layers,
  Code2,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import { GenerateProjectPayload } from '../../types';

interface Props {
  isOpen: boolean;
  onGenerate: (payload: GenerateProjectPayload) => Promise<void>;
  onStartManually: () => void;
  onLoadDemoProject: () => void;
  isGenerating: boolean;
}

export const ProjectCreationModal: React.FC<Props> = ({
  isOpen,
  onGenerate,
  onStartManually,
  onLoadDemoProject,
  isGenerating,
}) => {
  const [scenario, setScenario] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [sprintDuration, setSprintDuration] = useState(2);
  const [teamMembers, setTeamMembers] = useState<{ name: string; role: string }[]>([
    { name: 'Rameen', role: 'Product Owner' },
    { name: 'Zainab', role: 'Frontend Developer' },
    { name: 'Anees', role: 'Backend Developer' },
    { name: 'Moniba', role: 'DevOps & Cloud' }
  ]);
  const [singleMemberInput, setSingleMemberInput] = useState('');
  const [singleMemberRole, setSingleMemberRole] = useState('Backend Developer');
  const [techStack, setTechStack] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMember = () => {
    const trimmed = singleMemberInput.trim();
    if (!trimmed) return;
    if (!teamMembers.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setTeamMembers([...teamMembers, { name: trimmed, role: singleMemberRole }]);
    }
    setSingleMemberInput('');
  };

  const handleRemoveMember = (name: string) => {
    setTeamMembers(teamMembers.filter(m => m.name !== name));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim()) {
      setError('Please provide a project scenario or description to analyze.');
      return;
    }
    setError(null);

    await onGenerate({
      scenario: scenario.trim(),
      project_name: projectName.trim() || undefined,
      project_type: projectType.trim() || undefined,
      start_date: startDate,
      deadline: deadline || undefined,
      sprint_duration: sprintDuration,
      team_members: teamMembers.length > 0 ? teamMembers.map(m => `${m.name} (${m.role})`).join(', ') : undefined,
      tech_stack: techStack.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 my-8 transition-colors duration-200">
        {/* Top Gradient Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Project Architect</span>
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Turn your project idea into a complete visual plan
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Describe your project and let AI organize the requirements, backlog, sprints, and tasks for you.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Project Scenario <span className="text-indigo-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">AI will accurately map your scope</span>
              </div>
              <textarea
                value={scenario}
                onChange={e => {
                  setScenario(e.target.value);
                  if (error) setError(null);
                }}
                rows={5}
                placeholder="Example:&#10;We want to build a mobile app for pet owners to book veterinarians, track pet health records, and receive medication reminders. We have 2 frontend developers and 1 backend developer. Target launch is in 3 months."
                className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                💡 Tip: You can paste user requirements, feature requests, or product ideas.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Optional Parameters Accordion */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => setShowOptional(!showOptional)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                <span>Optional Project Parameters (Timeline, Team, Stack)</span>
                {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showOptional && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs bg-slate-50 dark:bg-slate-950/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Project Name (optional)</label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        placeholder="e.g. PetHealth Mobile"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Project Type</label>
                      <input
                        type="text"
                        value={projectType}
                        onChange={e => setProjectType(e.target.value)}
                        placeholder="e.g. Mobile Application / SaaS / E-Commerce"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Deadline (Target Date)</label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Sprint Cadence</label>
                      <select
                        value={sprintDuration}
                        onChange={e => setSprintDuration(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-xs"
                      >
                        <option value={1}>1-Week Sprints</option>
                        <option value={2}>2-Week Sprints (Recommended)</option>
                        <option value={3}>3-Week Sprints</option>
                        <option value={4}>4-Week Sprints</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 block">
                          Team Members (Add one by one)
                        </label>
                        <span className="text-[10px] text-slate-400">{teamMembers.length} added</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <input
                          type="text"
                          value={singleMemberInput}
                          onChange={e => setSingleMemberInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddMember();
                            }
                          }}
                          placeholder="Member name..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <select
                          value={singleMemberRole}
                          onChange={e => setSingleMemberRole(e.target.value)}
                          className="w-32 px-1.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Backend Developer">Backend Dev</option>
                          <option value="DevOps & Cloud">DevOps Cloud</option>
                          <option value="Frontend Developer">Frontend Dev</option>
                          <option value="Product Owner">Product Owner</option>
                          <option value="UI/UX Designer">UI/UX Designer</option>
                          <option value="QA & Testing">QA & Testing</option>
                          <option value="Full Stack Dev">Full Stack</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleAddMember}
                          disabled={!singleMemberInput.trim()}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                      {/* Tag Pills */}
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {teamMembers.map(m => (
                          <span
                            key={m.name}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[11px]"
                          >
                            <span className="font-medium">{m.name}</span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400">({m.role})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.name)}
                              className="hover:text-rose-500 transition ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Tech Stack (comma separated)</label>
                      <input
                        type="text"
                        value={techStack}
                        onChange={e => setTechStack(e.target.value)}
                        placeholder="React, TypeScript, TailwindCSS, PostgreSQL"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onStartManually}
                  disabled={isGenerating}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                >
                  Start Manually
                </button>
                <button
                  type="button"
                  onClick={onLoadDemoProject}
                  disabled={isGenerating}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Explore Demo Project</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing & Synthesizing Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Project</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
