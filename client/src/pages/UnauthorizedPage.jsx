import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-danger/10 rounded-3xl mx-auto flex items-center justify-center border border-danger/20 shadow-card mb-8">
          <Lock className="w-10 h-10 text-danger" />
        </div>
        
        <h1 className="text-5xl font-bold text-white drop-shadow-lg">
          Access Denied
        </h1>
        
        <p className="text-muted text-base">
          You do not have the necessary permissions to view this page.
        </p>

        <button 
          onClick={() => navigate(-1)}
          className="mt-8 px-6 py-3 bg-card border border-border hover:bg-[#1A1A2E] text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};
