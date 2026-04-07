import React from 'react';
import { Share2, LogOut } from 'lucide-react';
import RoleBadge from './RoleBadge';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-[48px] bg-sidebar border-b border-border z-10 flex items-center justify-between px-4">
      {/* Left */}
      <div className="flex items-center gap-2 w-[220px]">
        <Share2 className="w-5 h-5 text-blue" />
        <span className="font-bold text-[15px] tracking-wide text-white">File-Map</span>
      </div>

      {/* Center */}
      <div className="flex-1 flex justify-center lg:justify-start lg:pl-10">
        <h1 className="text-[16px] font-semibold text-white">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {user && <RoleBadge role={user.role} />}
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue to-mint flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
            {getInitials(user?.name)}
          </div>
          <button 
            onClick={logout}
            className="text-muted hover:text-white transition-colors p-1 rounded-md"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
