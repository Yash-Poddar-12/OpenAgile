import React from 'react';

const PriorityBadge = ({ priority = 'Medium', size = 'md', onClick }) => {
  const isSmall = size === 'sm';
  
  const styles = {
    High: { bg: 'bg-[#EF4444]/20', text: 'text-[#EF4444]' },
    Medium: { bg: 'bg-[#F59E0B]/20', text: 'text-[#F59E0B]' },
    Low: { bg: 'bg-[#6B7280]/20', text: 'text-[#6B7280]' }
  };

  const config = styles[priority] || styles.Medium;
  const padding = isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  const BadgeContainer = onClick ? 'button' : 'span';

  return (
    <BadgeContainer
      onClick={onClick}
      className={`rounded-md font-medium ${padding} ${config.bg} ${config.text} ${onClick ? 'cursor-pointer hover:brightness-110 transition-all' : ''}`}
    >
      {priority}
    </BadgeContainer>
  );
};

export default PriorityBadge;
