import React from 'react';

const ROLE_COLORS = {
  Admin: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20',
  ProjectManager: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
  Developer: 'text-[#4F8EF7] bg-[#4F8EF7]/10 border-[#4F8EF7]/20',
  RepoAnalyst: 'text-[#43D9AD] bg-[#43D9AD]/10 border-[#43D9AD]/20',
  Viewer: 'text-[#6B7280] bg-[#6B7280]/10 border-[#6B7280]/20',
};

const RoleBadge = ({ role }) => {
  const colorClasses = ROLE_COLORS[role] || ROLE_COLORS.Viewer;
  const label = role.replace(/([A-Z])/g, ' $1').trim();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
      {label}
    </span>
  );
};

export default RoleBadge;
