import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart2, Users, FolderKanban, Shield, Activity, 
  FileOutput, Briefcase, ListTodo, Columns, Calendar, 
  Code2, Network
} from 'lucide-react';

const ROLE_LINKS = {
  Admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: BarChart2 },
    { label: 'Users', path: '/users', icon: Users },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Roles & Permissions', path: '/admin/roles', icon: Shield },
    { label: 'Scan History', path: '/scan-history', icon: Activity },
    { label: 'System Logs', path: '/logs', icon: Activity },
    { label: 'Export Reports', path: '/export', icon: FileOutput },
  ],
  ProjectManager: [
    { label: 'Dashboard', path: '/dashboard', icon: BarChart2 },
    { label: 'My Projects', path: '/projects', icon: Briefcase },
    { label: 'Issues', path: '/issues', icon: ListTodo },
    { label: 'Kanban Board', path: '/kanban', icon: Columns },
    { label: 'Sprints', path: '/sprints', icon: Calendar },
    { label: 'Repository Analysis', path: '/filemap', icon: Network },
    { label: 'Export', path: '/export', icon: FileOutput },
  ],
  Developer: [
    { label: 'Issues', path: '/issues', icon: ListTodo },
    { label: 'Kanban Board', path: '/kanban', icon: Columns },
    { label: 'Repository Analysis', path: '/filemap', icon: Network },
  ],
  RepoAnalyst: [
    { label: 'Repository Analysis', path: '/filemap', icon: Network },
    { label: 'Scan History', path: '/scan-history', icon: Activity },
    { label: 'Export', path: '/export', icon: FileOutput },
  ],
  Viewer: [
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Repository Analysis', path: '/filemap', icon: Network },
  ],
};

const Sidebar = () => {
  const { user } = useAuth();
  const links = ROLE_LINKS[user?.role] || [];

  return (
    <aside className="fixed top-[48px] left-0 bottom-0 w-[220px] bg-sidebar border-r border-border overflow-y-auto">
      <nav className="flex flex-col py-4 gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-l-4 border-blue bg-[#1E1E2E] text-white'
                    : 'border-l-4 border-transparent text-muted hover:text-white hover:bg-[#1E1E2E]/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
