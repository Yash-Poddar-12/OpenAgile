import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted mb-6">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-2">
            {isLast ? (
              <span className="text-white font-medium">{item.label}</span>
            ) : (
              <>
                <Link to={item.path} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
                <span>/</span>
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
