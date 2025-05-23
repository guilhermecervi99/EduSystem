import React from 'react';
import { useApp } from '../../context/AppContext';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const { sidebarOpen, setSidebar } = useApp();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;