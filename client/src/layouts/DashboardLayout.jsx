import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import AppErrorBoundary from '../components/common/AppErrorBoundary';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="h-screen w-screen bg-[#1E1E2E] flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <AppErrorBoundary resetKey={`${location.pathname}${location.search}`}>
            {children || <Outlet />}
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
