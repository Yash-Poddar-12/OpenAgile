import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, AlertCircle, Calendar, Users, ChevronDown, LayoutDashboard, Columns3, GitBranch, Download, MoreVertical, ExternalLink, Archive } from 'lucide-react';

import { usePMDashboard } from '../hooks/usePMDashboard';
import { useAuth } from '../context/AuthContext';

const activityColor = { PROJECT_CREATED: '#4F8EF7', PROJECT_ARCHIVED: '#43D9AD', ISSUE_CREATED: '#F7B84F', moved: '#9ca3af' };

const pmMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { id: 'projects', label: 'My Projects', icon: FolderKanban, to: '/dashboard' },
  { id: 'issues', label: 'Issues', icon: AlertCircle, to: '/issues' },
  { id: 'kanban', label: 'Kanban Board', icon: Columns3, to: '/kanban' },
  { id: 'sprints', label: 'Sprints', icon: Calendar, to: '/dashboard' },
  { id: 'repository', label: 'Repository Analysis', icon: GitBranch, to: '/filemap' },
  { id: 'export', label: 'Export', icon: Download, to: '/export' },
];

function MetricCard({ title, value, icon, accentColor = '#4F8EF7', showProgress = false, progressValue = 0 }) {
  return (
    <div className="bg-[#252537] rounded-lg p-6 border border-[#3a3a4a]">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[#9ca3af] text-sm">{title}</p>
        <p className="text-white text-3xl font-semibold">{value}</p>
      </div>
      {showProgress && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#9ca3af]">Progress</span>
            <span className="text-xs font-medium text-white">{progressValue}%</span>
          </div>
          <div className="w-full h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressValue}%`, backgroundColor: accentColor }} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE' || status === 'Active';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-[#43D9AD20] text-[#43D9AD]' : 'bg-[#6b728080] text-[#9ca3af]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-[#43D9AD]' : 'bg-[#9ca3af]'}`} />
      {status}
    </span>
  );
}

export function PMDashboard() {
  const [activeItem, setActiveItem] = useState('dashboard');
  const { user } = useAuth();
  const { projects, issues, users, activities, loading, archiveProject } = usePMDashboard();

  return (
    <div className="p-8 space-y-8 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Projects" value={projects.length} icon={<FolderKanban className="w-6 h-6" />} accentColor="#4F8EF7" />
        <MetricCard title="Total Issues" value={issues.length} icon={<AlertCircle className="w-6 h-6" />} accentColor="#F7B84F" />
        <MetricCard title="Active Projects" value={projects.filter(p => p.status === 'ACTIVE').length} icon={<FolderKanban className="w-6 h-6" />} accentColor="#43D9AD" />
        <MetricCard title="Team Members" value={users?.length || 0} icon={<Users className="w-6 h-6" />} accentColor="#9B7EF7" />
      </div>

      <div className="bg-[#252537] rounded-lg border border-[#3a3a4a] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#3a3a4a]">
          <h2 className="text-white text-lg font-semibold">Projects</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3a3a4a]">
              {['Name', 'Status', 'Issues', 'Sprint', 'Actions'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[#9ca3af] text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3a3a4a]">
            {projects.map((project) => (
              <tr key={project.projectId || project._id} className="hover:bg-[#2a2a3e] transition-colors">
                <td className="px-6 py-4"><span className="text-white font-medium">{project.name}</span></td>
                <td className="px-6 py-4"><StatusBadge status={project.status || 'ACTIVE'} /></td>
                <td className="px-6 py-4"><span className="text-white">{project.openIssueCount ?? project.issueCount ?? 0}</span></td>
                <td className="px-6 py-4"><span className="text-[#9ca3af]">{project.sprintName || 'No sprint'}</span></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {project.status === 'ACTIVE' && (
                      <button onClick={() => archiveProject(project.projectId)} className="p-1.5 hover:bg-[#9ca3af20] rounded text-[#9ca3af] transition-colors"><Archive className="w-4 h-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#252537] rounded-lg border border-[#3a3a4a]">
        <div className="px-6 py-4 border-b border-[#3a3a4a]">
          <h2 className="text-white text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="p-6 space-y-4">
          {activities.map((activity, index) => (
            <div key={activity._id || index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: activityColor[activity.action] || '#9ca3af' }} />
                {index < activities.length - 1 && <div className="w-px h-full bg-[#3a3a4a] mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-white text-sm leading-relaxed">{`${activity.action} - ${activity.details?.name || ''}`}</p>
                <p className="text-[#9ca3af] text-xs mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
