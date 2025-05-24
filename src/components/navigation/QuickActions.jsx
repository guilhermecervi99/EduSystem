// components/navigation/QuickActions.jsx
import React from 'react';
import { 
  BookOpen, 
  Target, 
  Award, 
  FolderOpen, 
  Library, 
  Settings,
  TrendingUp,
  MessageCircle,
  Plus,
  Search
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const QuickActions = ({ onNavigate, currentProgress, user }) => {
  const actions = [
    {
      id: 'continue-learning',
      label: 'Continuar Aprendendo',
      description: currentProgress ? `${currentProgress.area} - ${currentProgress.subarea}` : 'Comece sua jornada',
      icon: BookOpen,
      color: 'primary',
      onClick: () => onNavigate('learning'),
      badge: currentProgress ? `${Math.round(currentProgress.progress_percentage)}%` : null
    },
    {
      id: 'view-achievements',
      label: 'Minhas Conquistas',
      description: `${user?.total_badges || 0} badges conquistadas`,
      icon: Award,
      color: 'warning',
      onClick: () => onNavigate('achievements'),
      badge: user?.total_badges > 0 ? 'Novo!' : null
    },
    {
      id: 'my-projects',
      label: 'Meus Projetos',
      description: `${user?.active_projects_count || 0} projetos ativos`,
      icon: FolderOpen,
      color: 'secondary',
      onClick: () => onNavigate('projects'),
      badge: user?.active_projects_count > 0 ? user.active_projects_count : null
    },
    {
      id: 'resources',
      label: 'Recursos',
      description: 'Materiais de apoio',
      icon: Library,
      color: 'accent',
      onClick: () => onNavigate('resources')
    },
    {
      id: 'mapping',
      label: 'Refazer Mapeamento',
      description: 'Descobrir novos interesses',
      icon: Target,
      color: 'success',
      onClick: () => onNavigate('mapping')
    },
    {
      id: 'teacher-chat',
      label: 'Professor Virtual',
      description: 'Tire suas dúvidas',
      icon: MessageCircle,
      color: 'primary',
      onClick: () => onNavigate('teacher')
    }
  ];

  return (
    <Card>
      <Card.Header>
        <Card.Title>Ações Rápidas</Card.Title>
        <Card.Subtitle>O que você gostaria de fazer agora?</Card.Subtitle>
      </Card.Header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`
                p-4 text-left rounded-lg border-2 transition-all duration-200 relative
                border-${action.color}-200 hover:border-${action.color}-300 
                hover:bg-${action.color}-50 hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-${action.color}-500
              `}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 bg-${action.color}-100 rounded-lg flex-shrink-0`}>
                  <Icon className={`h-5 w-5 text-${action.color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {action.label}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
              
              {action.badge && (
                <span className={`
                  absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full
                  bg-${action.color}-100 text-${action.color}-700
                `}>
                  {action.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default QuickActions;
