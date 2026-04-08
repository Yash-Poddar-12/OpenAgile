import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, FolderKanban, Shield, Activity,
  Download, AlertCircle, Columns3, GitBranch,
  X 
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'PM Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Repository Analysis', path: '/filemap', icon: GitBranch },
  { label: 'Issues', path: '/issues', icon: AlertCircle },
  { label: 'Kanban', path: '/kanban', icon: Columns3 },
  { label: 'Export', path: '/export', icon: Download },
  { label: 'Analytics', path: '/analytics', icon: Activity },
  { label: 'Roles & Permissions', path: '/roles', icon: Shield },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const isAdmin = true;
  const links = NAV_ITEMS;

  const asideClass = isAdmin
    ? "bg-[#252537] border-r border-[#2E2E42]"
    : "bg-[#252537] border-r border-[#3a3a4a]";

  const widthClass = isAdmin ? "w-[220px]" : "w-64";

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" 
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out md:relative ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${widthClass} ${asideClass}`}>
        <div className="flex items-center justify-between p-4 md:hidden border-b border-[#3a3a4a]">
           <span className="text-white font-semibold flex-1">Menu</span>
           <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.label}
                to={link.path}
                onClick={() => {
                  if (window.innerWidth < 768) onClose();
                }}
                className={({ isActive }) => `
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                  ${isActive 
                    ? (isAdmin ? 'bg-[#4F8EF7]/10 text-[#4F8EF7] border border-[#4F8EF7]/20' : 'bg-[#4F8EF720] text-[#4F8EF7]') 
                    : (isAdmin ? 'text-gray-400 hover:text-gray-300 hover:bg-[#2E2E42]/50' : 'text-[#9ca3af] hover:bg-[#2a2a3e] hover:text-white')}
                `}
                end={['/admin', '/dashboard', '/projects', '/issues', '/kanban', '/filemap', '/export', '/analytics', '/roles'].includes(link.path)}
              >
                <Icon className={isAdmin ? "w-4 h-4" : "w-5 h-5"} strokeWidth={isAdmin ? 2 : undefined} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
