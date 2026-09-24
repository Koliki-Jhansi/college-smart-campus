import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatFloatingWidget from '../chat/ChatFloatingWidget';

const DashboardLayout = ({ children }) => {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleChat={() => setShowChat(!showChat)} />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children || <Outlet />}
        </main>
      </div>

      {/* Floating Real-time Chat Widget */}
      <ChatFloatingWidget isOpen={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
};

export { DashboardLayout };
export default DashboardLayout;
