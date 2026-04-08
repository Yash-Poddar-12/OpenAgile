import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Network, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const roleStyles = {
  Admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  ProjectManager: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Developer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  RepoAnalyst: 'bg-[#43D9AD]/10 text-[#43D9AD] border-[#43D9AD]/20',
  Viewer: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const WORKSPACE_STORAGE_KEY = 'openagile_current_workspace_project_id';

function RoleBadge({ role }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${roleStyles[role] || roleStyles.Viewer}`}>{role}</span>
  );
}

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'Admin';

  const [projects, setProjects] = useState([]);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    () => localStorage.getItem(WORKSPACE_STORAGE_KEY) || ''
  );

  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'US';

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        const nextProjects = response.data.projects || [];
        setProjects(nextProjects);

        const preferredProject = nextProjects.find((project) => project.projectId === selectedWorkspaceId) || nextProjects[0];

        if (preferredProject && preferredProject.projectId !== selectedWorkspaceId) {
          const fallbackId = preferredProject.projectId;
          setSelectedWorkspaceId(fallbackId);
          localStorage.setItem(WORKSPACE_STORAGE_KEY, fallbackId);
        }
      } catch (error) {
        setProjects([]);
      }
    };

    fetchProjects();
  }, []);

  const selectedWorkspace = useMemo(
    () => projects.find((project) => project.projectId === selectedWorkspaceId) || null,
    [projects, selectedWorkspaceId]
  );

  const handleWorkspaceSelect = (projectId) => {
    setSelectedWorkspaceId(projectId);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, projectId);
    setWorkspaceMenuOpen(false);

    if (location.pathname.startsWith('/filemap')) {
      navigate(`/filemap?projectId=${projectId}`);
      return;
    }

    if (location.pathname.startsWith('/issues')) {
      navigate(`/issues?projectId=${projectId}`);
      return;
    }

    if (location.pathname.startsWith('/kanban')) {
      navigate('/kanban');
      return;
    }

    navigate(`/issues?projectId=${projectId}`);
  };

  const workspaceButton = (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setWorkspaceMenuOpen((current) => !current)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#1E1E2E] hover:bg-[#2a2a3e] rounded-lg border border-[#3a3a4a] transition-colors"
      >
        <span className="text-white text-sm truncate max-w-[180px]">
          {selectedWorkspace?.name || 'Select Workspace'}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#9ca3af] transition-transform ${workspaceMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {workspaceMenuOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-lg border border-[#3a3a4a] bg-[#252537] shadow-xl z-20 overflow-hidden">
          <div className="px-3 py-2 border-b border-[#3a3a4a] text-xs uppercase tracking-wider text-[#9ca3af]">
            Current Workspace
          </div>
          {projects.length === 0 ? (
            <div className="px-3 py-3 text-sm text-[#9ca3af]">No projects available</div>
          ) : (
            projects.map((project) => (
              <button
                key={project.projectId}
                type="button"
                onClick={() => handleWorkspaceSelect(project.projectId)}
                className={`flex w-full items-start justify-between px-3 py-3 text-left transition-colors ${
                  selectedWorkspaceId === project.projectId ? 'bg-[#4F8EF7]/10 text-white' : 'text-[#D1D5DB] hover:bg-[#2a2a3e]'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{project.name}</div>
                  <div className="truncate text-xs text-[#9ca3af]">{project.repositoryPath || 'No repository path set'}</div>
                </div>
                {selectedWorkspaceId === project.projectId && (
                  <span className="ml-3 text-xs text-[#4F8EF7]">Active</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );

  if (isAdmin) {
    return (
      <nav className="h-12 bg-[#252537] border-b border-[#2E2E42] flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onMenuClick} className="md:hidden mr-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
          <Network className="w-5 h-5 text-[#4F8EF7]" strokeWidth={2} />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
          <h1 className="text-base font-semibold text-white">File-Map Suite</h1>
        </div>
        <div className="flex items-center gap-3">
          {workspaceButton}
          <RoleBadge role="Admin" />
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-md border border-[#2E2E42] bg-[#1E1E2E] px-3 py-1.5 text-sm text-gray-300 transition-colors hover:text-white"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#43D9AD] flex items-center justify-center">
            <span className="text-white text-sm font-medium">{initials}</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="h-12 bg-[#252537] border-b border-[#3a3a4a] flex items-center px-6 z-10 shrink-0">
      <div className="flex items-center gap-8 flex-1">
        <div className="flex items-center gap-2">
          <button onClick={onMenuClick} className="md:hidden mr-2 text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
          <div className="w-8 h-8 bg-gradient-to-br from-[#4F8EF7] to-[#43D9AD] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">OA</span>
          </div>
          <span className="text-white font-semibold text-lg hidden sm:block">OpenAgile</span>
        </div>
        {workspaceButton}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4F8EF720] rounded-lg border border-[#4F8EF740]">
          <div className="w-6 h-6 bg-[#4F8EF7] rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <span className="text-white text-sm font-medium hidden sm:block">{user?.role || 'Guest'}</span>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-lg border border-[#3a3a4a] bg-[#1E1E2E] px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-[#2a2a3e] hover:text-white"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};
