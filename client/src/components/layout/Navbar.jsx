import React from 'react';
import { Network, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const roleStyles = {
  Admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  ProjectManager: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Developer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  RepoAnalyst: 'bg-[#43D9AD]/10 text-[#43D9AD] border-[#43D9AD]/20',
  Viewer: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function RoleBadge({ role }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${roleStyles[role] || roleStyles.Viewer}`}>{role}</span>
  );
}

export const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US';

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
          <RoleBadge role="Admin" />
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
            <span className="text-white font-bold text-sm">PM</span>
          </div>
          <span className="text-white font-semibold text-lg hidden sm:block">ProjectFlow</span>
        </div>
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1E1E2E] hover:bg-[#2a2a3e] rounded-lg border border-[#3a3a4a] transition-colors">
          <span className="text-white text-sm truncate max-w-[150px]">Current Workspace</span>
          <ChevronDown className="w-4 h-4 text-[#9ca3af]" />
        </button>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4F8EF720] rounded-lg border border-[#4F8EF740]">
        <div className="w-6 h-6 bg-[#4F8EF7] rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-semibold">{initials}</span>
        </div>
        <span className="text-white text-sm font-medium hidden sm:block">{user?.role || 'Guest'}</span>
      </div>
    </nav>
  );
};
