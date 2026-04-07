import React from 'react';

const Skeleton = ({ className = '', ...props }) => {
  return (
    <div className={`skeleton ${className}`} {...props} />
  );
};

Skeleton.Card = ({ className = '', ...props }) => (
  <div className={`skeleton w-full h-32 rounded-xl ${className}`} {...props} />
);

Skeleton.Row = ({ className = '', ...props }) => (
  <div className={`skeleton w-full h-12 rounded-lg ${className}`} {...props} />
);

Skeleton.Text = ({ className = '', ...props }) => (
  <div className={`skeleton h-4 rounded-md ${className}`} {...props} />
);

Skeleton.Avatar = ({ className = '', ...props }) => (
  <div className={`skeleton w-10 h-10 rounded-full ${className}`} {...props} />
);

export default Skeleton;
