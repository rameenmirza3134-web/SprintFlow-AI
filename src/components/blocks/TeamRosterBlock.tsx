import React, { useState } from 'react';
import { TeamMember, BacklogItem } from '../../types';
import { Users, Plus, Trash2, Mail, Sparkles, Check, Tag } from 'lucide-react';

interface Props {
  members: TeamMember[];
  tasks: BacklogItem[];
  onAddMember: (member: Omit<TeamMember, 'id' | 'created_at'>) => void;
  onDeleteMember: (id: string) => void;
  isPresentationMode?: boolean;
}

export const TeamRosterBlock: React.FC<Props> = ({
  members,
  tasks,
  onAddMember,
  onDeleteMember,
  isPresentationMode = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [email, setEmail] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    onAddMember({
      project_id: '',
      name: name.trim(),
      role: role.trim(),
      skills: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
      email: email.trim() || undefined,
      is_ai_suggested: false,
    });

    setName('');
    setRole('');
    setSkillsInput('');
    setEmail('');
    setIsAdding(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800 hover:border-slate-700 shadow-xl overflow-hidden text-slate-100 select-none">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-100">Team Management</span>
            <span className="text-[11px] text-slate-400 ml-2">{members.length} members</span>
          </div>
        </div>

        {!isPresentationMode && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Cancel' : 'Add Member'}</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex-1 overflow-y-auto space-y-2.5 text-xs">
        {/* Add Form */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-3 rounded-lg bg-slate-950 border border-slate-700 space-y-2.5 mb-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                required
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Role *</label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Frontend Engineer / Scrum Master"
                required
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Skills (comma separated)</label>
              <input
                type="text"
                value={skillsInput}
                onChange={e => setSkillsInput(e.target.value)}
                placeholder="React, CSS, Testing"
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="alex@example.com (optional)"
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Save Team Member
            </button>
          </form>
        )}

        {members.length === 0 ? (
          <div className="p-6 text-center text-slate-500 flex flex-col items-center justify-center">
            <Users className="w-8 h-8 text-slate-700 mb-2" />
            <span>No team members registered yet.</span>
            <span className="text-[10px] text-slate-600 mt-1">
              Add members to enable task assignment & capacity balancing.
            </span>
          </div>
        ) : (
          members.map(member => {
            const assignedTasks = tasks.filter(t => t.assignee_id === member.id);
            const totalAssignedPoints = assignedTasks.reduce((acc, curr) => acc + (curr.story_points || 0), 0);

            return (
              <div
                key={member.id}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-200 text-xs">{member.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {member.role}
                    </span>
                    {member.is_ai_suggested && (
                      <span className="flex items-center gap-1 px-1 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <Sparkles className="w-2 h-2" />
                        AI Role
                      </span>
                    )}
                  </div>

                  {member.skills && member.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.skills.map((skill, idx) => (
                        <span key={idx} className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded">
                          #{skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                    <span>
                      Assigned: <strong className="text-slate-200">{assignedTasks.length}</strong> tasks ({totalAssignedPoints} pts)
                    </span>
                    {member.email && (
                      <span className="flex items-center gap-1 text-slate-500 truncate max-w-[140px]">
                        <Mail className="w-2.5 h-2.5" />
                        {member.email}
                      </span>
                    )}
                  </div>
                </div>

                {!isPresentationMode && (
                  <button
                    onClick={() => onDeleteMember(member.id)}
                    title="Remove member"
                    className="text-slate-500 hover:text-rose-400 p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Required for task assignment</span>
        <span className="text-slate-500 font-mono">Team Roster</span>
      </div>
    </div>
  );
};
