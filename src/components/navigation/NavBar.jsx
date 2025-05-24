
// components/navigation/NavBar.jsx - Componente de navegação horizontal alternativo
import React from 'react';
import { 
  Home, 
  BookOpen, 
  Award, 
  FolderOpen, 
  Library, 
  MessageCircle, 
  Target 
} from 'lucide-react';

const NavBar = ({ currentView, onNavigate, className = '' }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'learning', label: 'Aprender', icon: BookOpen },
    { id: 'achievements', label: 'Conquistas', icon: Award },
    { id: 'projects', label: 'Projetos', icon: FolderOpen },
    { id: 'resources', label: 'Recursos', icon: Library },
    { id: 'teacher', label: 'Professor', icon: MessageCircle },
    { id: 'mapping', label: 'Mapeamento', icon: Target },
  ];

  return (
    <nav className={`flex items-center space-x-1 bg-white rounded-lg shadow-sm p-1 ${className}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-primary-100 text-primary-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:block">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default NavBar;