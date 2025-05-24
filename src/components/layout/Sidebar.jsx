import React from 'react';
import { 
  Home, 
  BookOpen, 
  Target, 
  Award, 
  FolderOpen, 
  Library, 
  User, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const Sidebar = ({ currentView, onNavigate }) => {
  const { user } = useAuth();
  const { sidebarOpen, setSidebar } = useApp();

  // Menu items principais
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
    },
    {
      id: 'learning',
      label: 'Aprender',
      icon: BookOpen,
      path: '/learning',
      badge: user?.current_track ? 'Em progresso' : null,
    },
    {
      id: 'projects',
      label: 'Projetos',
      icon: FolderOpen,
      path: '/projects',
      badge: user?.active_projects_count > 0 ? user.active_projects_count : null,
    },
    {
      id: 'achievements',
      label: 'Conquistas',
      icon: Award,
      path: '/achievements',
      badge: user?.total_badges > 0 ? user.total_badges : null,
    },
    {
      id: 'resources',
      label: 'Recursos',
      icon: Library,
      path: '/resources',
    },
    {
      id: 'teacher',
      label: 'Professor Virtual',
      icon: MessageCircle,
      path: '/teacher',
    },
    {
      id: 'mapping',
      label: 'Mapeamento',
      icon: Target,
      path: '/mapping',
    },
  ];

  const bottomMenuItems = [
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      path: '/profile',
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      path: '/settings',
    },
  ];

  const handleMenuClick = (item) => {
    console.log(`🧭 Sidebar: Navegando para ${item.id}`);
    onNavigate?.(item.id);
    
    // Fechar sidebar no mobile após clique
    if (window.innerWidth < 1024) {
      setSidebar(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo/Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {sidebarOpen && (
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">EduSystem</h1>
              <p className="text-xs text-gray-500">Aprendizado Gamificado</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setSidebar(!sidebarOpen)}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* User Stats (quando expandido) */}
      {sidebarOpen && user && (
        <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-200">
          <div className="text-center">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
              {user.email ? (
                <span className="text-xl font-bold text-primary-700">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="h-8 w-8 text-primary-600" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.email || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {user.current_track || 'Trilha não definida'}
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white bg-opacity-60 rounded-lg p-2">
                <div className="flex items-center justify-center space-x-1">
                  <Zap className="h-3 w-3 text-primary-600" />
                  <span className="font-medium">{user.profile_xp || 0}</span>
                </div>
                <p className="text-gray-600">XP</p>
              </div>
              <div className="bg-white bg-opacity-60 rounded-lg p-2">
                <div className="flex items-center justify-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-secondary-600" />
                  <span className="font-medium">{user.profile_level || 1}</span>
                </div>
                <p className="text-gray-600">Nível</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`
                w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-primary-100 text-primary-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
                ${!sidebarOpen ? 'justify-center' : ''}
              `}
              title={!sidebarOpen ? item.label : ''}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
              
              {sidebarOpen && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="px-4 py-4 border-t border-gray-200 space-y-2">
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`
                w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
                ${!sidebarOpen ? 'justify-center' : ''}
              `}
              title={!sidebarOpen ? item.label : ''}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full bg-white border-r border-gray-200 shadow-sm
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-16'}
        hidden lg:block
      `}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:hidden
      `}>
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;