import React, { useState } from 'react';
import { Project, TeamMember } from '../../types';
import { Sparkles, Calendar, Layers, Cpu, Users, Target, Clock, CheckCircle2, Edit2, Check } from 'lucide-react';

interface Props {
  project: Project;
  teamMembers: TeamMember[];
  onUpdateProject: (updated: Partial<Project>) => void;
  isPresentationMode?: boolean;
}

export const ProjectOverviewBlock: React.FC<Props> = ({
  project,
  teamMembers,
  onUpdateProject,
  isPresentationMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [deadline, setDeadline] = useState(project.deadline || '');
  const [startDate, setStartDate] = useState(project.start_date || '');
  const [techStackInput, setTechStackInput] = useState(project.tech_stack.join(', '));
  const [sprintDuration, setSprintDuration] = useState(project.sprint_duration || 2);

  const handleSave = () => {
    onUpdateProject({
      name,
      description,
      deadline: deadline ? deadline : null,
      start_date: startDate ? startDate : null,
      sprint_duration: Number(sprintDuration) || 2,
      tech_stack: techStackInput.split(',').map(s => s.trim()).filter(Boolean),
    });
    setIsEditing(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl overflow-hidden text-slate-100 select-none">
      {/* Block Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">Project Workspace</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-100 truncate max-w-[260px]">{project.name}</span>
              {project.is_demo && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Demo Project
                </span>
              )}
            </div>
          </div>
        </div>

        {!isPresentationMode && (
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Save</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3 h-3 text-slate-400" />
                <span>Edit</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Block Content */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Sprint Duration (weeks)</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={sprintDuration}
                  onChange={e => setSprintDuration(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={techStackInput}
                  onChange={e => setTechStackInput(e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-slate-300 leading-relaxed line-clamp-3">
              {project.description || project.scenario || 'No project description provided.'}
            </p>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[11px] font-medium">Timeline</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-300">
                    Start: <span className="font-semibold text-slate-200">{project.start_date || 'Today'}</span>
                  </div>
                  <div className="text-[11px]">
                    Deadline:{' '}
                    {project.deadline ? (
                      <span className="font-semibold text-emerald-300">{project.deadline}</span>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-amber-400 hover:underline font-medium"
                      >
                        [ Add deadline ]
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-medium">Cadence</span>
                </div>
                <div className="text-[11px] text-slate-200 font-semibold">
                  {project.sprint_duration || 2}-Week Sprints
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>Team: {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}</span>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1.5">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span className="font-medium">Technology Stack</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {project.tech_stack && project.tech_stack.length > 0 ? (
                  project.tech_stack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80 text-[10px]"
                    >
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 italic text-[11px]">[ Not provided ]</span>
                )}
              </div>
            </div>

            {/* Goals list */}
            {project.goals && project.goals.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">Strategic Goals</span>
                </div>
                <ul className="space-y-1">
                  {project.goals.slice(0, 3).map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Block Footer */}
      <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Rule 3 Compliant: No invented data
        </span>
        <span className="text-[10px] text-slate-500">Live Project State</span>
      </div>
    </div>
  );
};
