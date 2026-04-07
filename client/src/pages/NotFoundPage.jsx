import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-card rounded-3xl mx-auto flex items-center justify-center border border-border shadow-card mb-8">
          <Search className="w-10 h-10 text-blue" />
        </div>
        
        <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue to-mint drop-shadow-lg">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-white tracking-wide">
          Page not found
        </h2>
        
        <p className="text-muted text-base">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <button 
          onClick={() => navigate(-1)}
          className="mt-8 px-6 py-3 bg-blue hover:bg-[#3E7DE6] text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};
