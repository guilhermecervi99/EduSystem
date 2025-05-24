
// components/navigation/MobileNav.jsx - Navegação mobile
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import NavBar from './NavBar';

const MobileNav = ({ currentView, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-0 left-0 z-50 w-64 h-full bg-white shadow-lg transform transition-transform duration-300">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded text-gray-600 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <NavBar 
                currentView={currentView} 
                onNavigate={(view) => {
                  onNavigate(view);
                  setIsOpen(false);
                }}
                className="flex-col space-x-0 space-y-2 bg-transparent shadow-none p-0"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileNav;