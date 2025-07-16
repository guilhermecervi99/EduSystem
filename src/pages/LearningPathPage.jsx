// LearningPathPage.jsx - VERSÃO CORRIGIDA SEM REACT-ROUTER-DOM
import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Target,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  BookOpen,
  Code,
  FileText,
  Trophy,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Download,
  Share2,
  Edit3
} from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const LearningPathPage = ({ onNavigate, navigationState }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // Estados
  const [learningPath, setLearningPath] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(1);
  const [completedActivities, setCompletedActivities] = useState(new Set());
  const [currentWeek, setCurrentWeek] = useState(1);
  const [viewMode, setViewMode] = useState('week'); // week, month, list
  const [editMode, setEditMode] = useState(false);
  
  // Carregar plano
  useEffect(() => {
    if (navigationState?.path) {
      setLearningPath(navigationState.path);
      calculateCurrentWeek(navigationState.path);
    } else if (navigationState?.pathId) {
      loadLearningPath(navigationState.pathId);
    } else {
      showError('Nenhum plano de estudos encontrado');
      onNavigate?.('dashboard');
    }
  }, [navigationState]);
  
  // Carregar plano do backend
  const loadLearningPath = async (pathId) => {
    try {
      const data = await analyticsAPI.getLearningPathDetails(pathId);
      setLearningPath(data.learning_path);
      calculateCurrentWeek(data.learning_path);
      
      // Carregar atividades completadas
      if (data.completed_activities) {
        setCompletedActivities(new Set(data.completed_activities));
      }
    } catch (error) {
      showError('Erro ao carregar plano de estudos');
      onNavigate?.('dashboard');
    }
  };
  
  // Calcular semana atual
  const calculateCurrentWeek = (path) => {
    const startDate = new Date(path.start_date);
    const today = new Date();
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.min(Math.floor(daysDiff / 7) + 1, path.duration_weeks);
    setCurrentWeek(Math.max(1, weekNumber));
    setExpandedWeek(Math.max(1, weekNumber));
  };
  
  // Marcar atividade como completa
  const handleActivityComplete = async (weekIndex, dayIndex, activityIndex) => {
    const activityId = `${weekIndex}-${dayIndex}-${activityIndex}`;
    const newCompleted = new Set(completedActivities);
    
    if (newCompleted.has(activityId)) {
      newCompleted.delete(activityId);
    } else {
      newCompleted.add(activityId);
    }
    
    setCompletedActivities(newCompleted);
    
    try {
      await analyticsAPI.updateLearningPathProgress(navigationState?.pathId, {
        completed_activities: Array.from(newCompleted),
        last_activity: activityId
      });
      
      showSuccess('Progresso atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
    }
  };
  
  // Calcular progresso
  const calculateProgress = () => {
    if (!learningPath) return { total: 0, completed: 0, percentage: 0 };
    
    let totalActivities = 0;
    learningPath.weekly_plans.forEach(week => {
      week.content.forEach(day => {
        totalActivities += day.activities.length;
      });
    });
    
    const completed = completedActivities.size;
    const percentage = totalActivities > 0 ? (completed / totalActivities) * 100 : 0;
    
    return { total: totalActivities, completed, percentage };
  };
  
  // Exportar plano
  const handleExportPlan = () => {
    const dataStr = JSON.stringify(learningPath, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `plano_estudos_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showSuccess('Plano exportado com sucesso!');
  };
  
  // Compartilhar plano
  const handleSharePlan = () => {
    if (navigator.share) {
      navigator.share({
        title: learningPath.title,
        text: `Confira meu plano de estudos: ${learningPath.title}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      showInfo('Link copiado para a área de transferência!');
    }
  };
  
  // Obter ícone da atividade
  const getActivityIcon = (type) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4" />;
      case 'practice':
        return <Code className="h-4 w-4" />;
      case 'project':
        return <FileText className="h-4 w-4" />;
      case 'assessment':
        return <Target className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };
  
  // Obter cor da prioridade
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };
  
  if (!learningPath) {
    return <Loading text="Carregando plano de estudos..." />;
  }
  
  const progress = calculateProgress();
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{learningPath.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{learningPath.duration_weeks} semanas</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="h-4 w-4" />
                <span>{progress.total} atividades</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Semana {currentWeek} de {learningPath.duration_weeks}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 lg:mt-0 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPlan}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Exportar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSharePlan}
              leftIcon={<Share2 className="h-4 w-4" />}
            >
              Compartilhar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              leftIcon={<Edit3 className="h-4 w-4" />}
            >
              {editMode ? 'Visualizar' : 'Editar'}
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progresso Total</span>
            <span className="font-medium text-gray-900">
              {progress.completed} de {progress.total} atividades ({Math.round(progress.percentage)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary-600 to-secondary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </Card>
      
      {/* Objetivos */}
      {learningPath.goals && (
        <Card>
          <Card.Header>
            <Card.Title>Objetivos do Plano</Card.Title>
          </Card.Header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {learningPath.goals.map((goal, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-primary-50 rounded-lg">
                <Trophy className="h-5 w-5 text-primary-600 mt-0.5" />
                <p className="text-sm text-gray-800">{goal}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* View Mode Selector */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant={viewMode === 'week' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setViewMode('week')}
        >
          Visão Semanal
        </Button>
        <Button
          variant={viewMode === 'month' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setViewMode('month')}
        >
          Visão Mensal
        </Button>
        <Button
          variant={viewMode === 'list' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          Lista Completa
        </Button>
      </div>
      
      {/* Conteúdo do Plano */}
      <div className="space-y-4">
        {learningPath.weekly_plans.map((week, weekIndex) => (
          <Card key={weekIndex} className={weekIndex + 1 === currentWeek ? 'ring-2 ring-primary-500' : ''}>
            <div
              className="cursor-pointer"
              onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
            >
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      weekIndex + 1 < currentWeek 
                        ? 'bg-success-100' 
                        : weekIndex + 1 === currentWeek 
                        ? 'bg-primary-100' 
                        : 'bg-gray-100'
                    }`}>
                      {weekIndex + 1 < currentWeek ? (
                        <CheckCircle className="h-5 w-5 text-success-600" />
                      ) : weekIndex + 1 === currentWeek ? (
                        <Circle className="h-5 w-5 text-primary-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Semana {week.week}: {week.theme}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {week.objectives.join(' • ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {weekIndex + 1 === currentWeek && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                        Semana Atual
                      </span>
                    )}
                    {expandedWeek === week.week ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </Card.Header>
            </div>
            
            {/* Conteúdo Expandido */}
            {expandedWeek === week.week && (
              <div className="border-t">
                <div className="p-4 space-y-4">
                  {week.content.map((day, dayIndex) => (
                    <div key={dayIndex} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Dia {day.day} - {new Date(day.date).toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {day.estimated_time} min
                        </span>
                      </div>
                      
                      {/* Atividades do Dia */}
                      <div className="space-y-2">
                        {day.activities.map((activity, activityIndex) => {
                          const activityId = `${weekIndex}-${dayIndex}-${activityIndex}`;
                          const isCompleted = completedActivities.has(activityId);
                          
                          return (
                            <div
                              key={activityIndex}
                              className={`flex items-start space-x-3 p-3 rounded-lg border ${
                                isCompleted 
                                  ? 'bg-success-50 border-success-200' 
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              } ${editMode ? 'cursor-move' : ''}`}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivityComplete(weekIndex, dayIndex, activityIndex);
                                }}
                                className="mt-0.5"
                                disabled={editMode}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-success-600" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-400 hover:text-primary-600" />
                                )}
                              </button>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  {getActivityIcon(activity.type)}
                                  <h5 className="font-medium text-gray-900">{activity.title}</h5>
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(activity.priority)}`}>
                                    {activity.priority}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                                
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{activity.duration_minutes} min</span>
                                  </span>
                                  
                                  {activity.resources && (
                                    <span>{activity.resources.length} recursos</span>
                                  )}
                                  
                                  {day.flexibility === 'flexible' && (
                                    <span className="text-blue-600">Flexível</span>
                                  )}
                                </div>
                              </div>
                              
                              {!editMode && !isCompleted && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => {
                                    // Navegar para a atividade específica
                                    if (activity.type === 'lesson') {
                                      onNavigate?.('learning');
                                    } else if (activity.type === 'assessment') {
                                      onNavigate?.('assessment');
                                    } else if (activity.type === 'project') {
                                      onNavigate?.('projects');
                                    }
                                  }}
                                >
                                  Iniciar
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {/* Marcos e Avaliação da Semana */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {week.milestones && week.milestones.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Marcos da Semana</h4>
                          <ul className="space-y-1">
                            {week.milestones.map((milestone, index) => (
                              <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                                <TrendingUp className="h-4 w-4 text-primary-600" />
                                <span>{milestone}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {week.assessment && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Avaliação</h4>
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm font-medium text-yellow-900">{week.assessment.title}</p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Dia {week.assessment.scheduled_day} • Tipo: {week.assessment.type}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {/* Projetos do Plano */}
      {learningPath.projects && learningPath.projects.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Projetos Práticos</Card.Title>
            <Card.Subtitle>Aplique seus conhecimentos em projetos reais</Card.Subtitle>
          </Card.Header>
          
          <div className="space-y-3">
            {learningPath.projects.map((project, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Início: Semana {project.start_week}</span>
                      <span>Duração: {project.duration_weeks} semanas</span>
                    </div>
                    
                    {project.deliverables && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-700">Entregáveis:</span>
                        <ul className="mt-1 space-y-0.5">
                          {project.deliverables.map((deliverable, idx) => (
                            <li key={idx} className="text-xs text-gray-600 ml-4">• {deliverable}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate?.('projects')}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Regras de Adaptação */}
      {learningPath.adaptation_rules && (
        <Card>
          <Card.Header>
            <Card.Title>Flexibilidade e Adaptação</Card.Title>
            <Card.Subtitle>O plano se adapta ao seu ritmo</Card.Subtitle>
          </Card.Header>
          
          <div className="space-y-2">
            {learningPath.adaptation_rules.map((rule, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{rule.condition}</p>
                  <p className="text-sm text-blue-700">{rule.action}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Métricas de Sucesso */}
      <Card>
        <Card.Header>
          <Card.Title>Critérios de Sucesso</Card.Title>
        </Card.Header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {learningPath.success_metrics.map((metric, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Target className="h-5 w-5 text-gray-600" />
              <p className="text-sm text-gray-700">{metric}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LearningPathPage;