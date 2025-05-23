import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Award,
  Zap,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';

const Header = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar, sidebarOpen } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Implementar busca
    console.log('Buscar:', searchQuery);
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Menu Toggle */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conteúdo, projetos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 lg:w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* User Stats */}
          {user && (
            <div className="hidden lg:flex items-center space-x-4 mr-4">
              {/* XP Display */}
              <div className="flex items-center space-x-1 bg-primary-50 px-3 py-1 rounded-full">
                <Zap className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">
                  {user.profile_xp || 0} XP
                </span>
              </div>

              {/* Level Display */}
              <div className="flex items-center space-x-1 bg-secondary-50 px-3 py-1 rounded-full">
                <Award className="h-4 w-4 text-secondary-600" />
                <span className="text-sm font-medium text-secondary-700">
                  Nível {user.profile_level || 1}
                </span>
              </div>
            </div>
          )}

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Bell className="h-6 w-6" />
            {/* Notification Badge */}
            <span className="absolute top-1 right-1 h-2 w-2 bg-danger-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                {user?.email ? (
                  <span className="text-sm font-medium text-primary-700">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="h-4 w-4 text-primary-600" />
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      {user?.email ? (
                        <span className="text-lg font-medium text-primary-700">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User className="h-6 w-6 text-primary-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.email || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.current_track || 'Trilha não definida'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Perfil</span>
                  </button>

                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </button>

                  <div className="border-t border-gray-200 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Search */}
          <button className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Search className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden border-t border-gray-200 p-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </form>
      </div>
    </header>
  );
};

export default Header;