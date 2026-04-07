import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppLayout = ({ children, title = "Dashboard", isFullWidth = false }) => {
  return (
    <div className="min-h-screen bg-page text-white flex flex-col font-sans">
      <Navbar title={title} />
      <div className="flex flex-1 pt-[48px]">
        <Sidebar />
        <main className={`flex-1 ml-[220px] ${isFullWidth ? '' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
