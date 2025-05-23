import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  BookOpen, 
  Award, 
  Target, 
  TrendingUp, 
  Calendar, 
  Clock,
  Star,
  ArrowRight,
  Zap,
  Trophy,
  Play,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { progressAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const DashboardPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { 
    currentProgress, 
    achievements, 
    statistics, 
    nextSteps,
    isInitialized,
    loadProgress, 
    loadAchievements, 
    loadStatistics, 
    loadNextSteps 
  } = useApp();
  
  const [currentContent, setCurrentContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [recentBadges, setRecentBadges] = useState([]);
  
  // ✅ CORREÇÃO: useRef para evitar múltiplas chamadas
  const contentLoadedRef = useRef(false);
  const dashboardInitializedRef = useRef(false);

  // ✅ CORREÇÃO: useCallback para carregar conteúdo atual
  const loadCurrentContent = useCallback(async () => {
    if (!currentProgress || contentLoadedRef.current || loadingContent) {
      return;
    }

    contentLoadedRef.current = true;
    setLoadingContent(true);
    
    try {
      const content = await progressAPI.getCurrentContent();
      setCurrentContent(content);
    } catch (error) {
      console.error('Erro ao carregar conteúdo atual:', error);
    } finally {
      setLoadingContent(false);
      contentLoadedRef.current = false;
    }
  }, [currentProgress, loadingContent]);

  // ✅ CORREÇÃO: useCallback para extrair badges recentes
  const updateRecentBadges = useCallback(() => {
    if (achievements?.badge_categories) {
      const allBadges = achievements.badge_categories.flatMap(category => category.badges);
      const recent = allBadges
        .filter(badge => badge.earned_date)
        .sort((a, b) => new Date(b.earned_date) - new Date(a.earned_date))
        .slice(0, 3);
      setRecentBadges(recent);
    }
  }, [achievements]);

  // ✅ CORREÇÃO: useCallback para calcular próximo nível
  const getNextLevelInfo = useCallback(() => {
    if (!user) return null;
    
    const currentXP = user.profile_xp || 0;
    const currentLevel = user.profile_level || 1;
    const nextLevelXP = currentLevel * 100; // Simplificado
    const progress = ((currentXP % 100) / 100) * 100;
    
    return {
      currentXP,
      nextLevelXP,
      progress,
      xpNeeded: nextLevelXP - (currentXP % 100)
    };
  }, [user]);

  // ✅ CORREÇÃO: Atualizar badges quando achievements mudar
  useEffect(() => {
    updateRecentBadges();
  }, [updateRecentBadges]);

  // ✅ CORREÇÃO: Carregar conteúdo quando progresso estiver disponível
  useEffect(() => {
    if (currentProgress && !loadingContent) {
      loadCurrentContent();
    }
  }, [currentProgress, loadCurrentContent, loadingContent]);

  // ✅ CORREÇÃO: Aguardar inicialização do AppContext
  useEffect(() => {
    if (!isInitialized || dashboardInitializedRef.current) {
      return;
    }

    dashboardInitializedRef.current = true;
    
    console.log('📊 Dashboard inicializado com dados do AppContext');
    
    // Reset flag após alguns segundos para permitir refresh manual
    setTimeout(() => {
      dashboardInitializedRef.current = false;
    }, 10000);
    
  }, [isInitialized]);

  // ✅ CORREÇÃO: Função para refresh manual dos dados
  const handleRefreshData = useCallback(async () => {
    try {
      await Promise.all([
        loadProgress(true),
        loadAchievements(true),
        loadStatistics(true),
        loadNextSteps()
      ]);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  }, [loadProgress, loadAchievements, loadStatistics, loadNextSteps]);

  const nextLevelInfo = getNextLevelInfo();

  // ✅ CORREÇÃO: Loading mais inteligente
  if (!isInitialized && !currentProgress && !achievements && !statistics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Olá, {user?.email?.split('@')[0] || 'Estudante'}! 👋
            </h1>
            <p className="text-primary-100 mb-4">
              {user?.current_track 
                ? `Continuando seus estudos em ${user.current_track}`
                : 'Pronto para começar sua jornada de aprendizado?'
              }
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4" />
                <span>{user?.profile_xp || 0} XP</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className="h-4 w-4" />
                <span>Nível {user?.profile_level || 1}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Award className="h-4 w-4" />
                <span>{achievements?.total_badges || 0} Badges</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 lg:mt-0 flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshData}
              className="text-sm"
            >
              Atualizar
            </Button>
            <Button
              variant="accent"
              size="lg"
              onClick={() => onNavigate?.('learning')}
              rightIcon={<Play className="h-5 w-5" />}
            >
              Continuar Aprendendo
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Lições Completadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.completed_lessons || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <Target className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Projetos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.active_projects || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sequência de Estudos</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.current_streak || 0} dias
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tempo Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor((statistics?.total_study_time_minutes || 0) / 60)}h
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progresso Atual */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conteúdo Atual */}
          <Card>
            <Card.Header>
              <Card.Title>Continuar Estudando</Card.Title>
              <Card.Subtitle>
                {currentProgress?.area} - {currentProgress?.subarea}
              </Card.Subtitle>
            </Card.Header>

            {loadingContent ? (
              <Loading text="Carregando conteúdo..." />
            ) : currentContent ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {currentContent.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {currentContent.content_type === 'step' 
                    ? `Passo ${currentContent.context?.step || '1'}`
                    : 'Lição completa'
                  }
                </p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progresso no Nível</span>
                    <span>{Math.round(currentProgress?.progress_percentage || 0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentProgress?.progress_percentage || 0}%` }}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => onNavigate?.('learning')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continuar Lição
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Nenhum conteúdo ativo no momento
                </p>
                <Button
                  onClick={() => onNavigate?.('learning')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Começar a Estudar
                </Button>
              </div>
            )}
          </Card>

          {/* Próximos Passos */}
          <Card>
            <Card.Header>
              <Card.Title>Próximos Passos</Card.Title>
              <Card.Subtitle>Recomendações personalizadas para você</Card.Subtitle>
            </Card.Header>

            {nextSteps && nextSteps.length > 0 ? (
              <div className="space-y-3">
                {nextSteps.slice(0, 4).map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">
                Continue estudando para receber recomendações personalizadas
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progresso do Nível */}
          {nextLevelInfo && (
            <Card>
              <Card.Header>
                <Card.Title>Progresso do Nível</Card.Title>
              </Card.Header>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <span className="text-xl font-bold text-primary-600">
                    {user?.profile_level || 1}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {nextLevelInfo.xpNeeded} XP para o próximo nível
                </p>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${nextLevelInfo.progress}%` }}
                  />
                </div>
                
                <p className="text-xs text-gray-500">
                  {nextLevelInfo.currentXP} / {nextLevelInfo.nextLevelXP} XP
                </p>
              </div>
            </Card>
          )}

          {/* Conquistas Recentes */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>Conquistas Recentes</Card.Title>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.('achievements')}
                >
                  Ver todas
                </Button>
              </div>
            </Card.Header>

            {recentBadges.length > 0 ? (
              <div className="space-y-3">
                {recentBadges.map((badge, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                    <Award className="h-6 w-6 text-yellow-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {badge.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {badge.earned_date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Complete atividades para ganhar conquistas
                </p>
              </div>
            )}
          </Card>

          {/* Calendário de Estudos */}
          <Card>
            <Card.Header>
              <Card.Title>Calendário de Estudos</Card.Title>
            </Card.Header>

            <div className="text-center py-4">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Defina uma rotina de estudos
              </p>
              <Button variant="outline" size="sm">
                Configurar Horários
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;