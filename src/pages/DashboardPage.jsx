// DashboardPage.jsx - VERSÃO COM ATUALIZAÇÃO AUTOMÁTICA
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
  CheckCircle,
  FileText,
  Map,
  BarChart3,
  Settings,
  Users,
  Brain,
  Lightbulb,
  Timer,
  Activity,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api, { progressAPI, llmAPI, contentAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
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
  const { showSuccess, showError } = useNotification();
  
  const [currentContent, setCurrentContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [recentBadges, setRecentBadges] = useState([]);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [todayProgress, setTodayProgress] = useState(null);
  const [weeklyGoal, setWeeklyGoal] = useState({ target: 5, completed: 0 });
  
  // ✅ CORREÇÃO CRÍTICA: useRef para controlar carregamentos únicos
  const loadedContentRef = useRef(false);
  const lastProgressIdRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);

  // ✅ NOVA FUNCIONALIDADE: Auto-refresh automático
  const startAutoRefresh = useCallback(() => {
    // Limpar interval anterior se existir
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    // ✅ Auto-refresh a cada 30 segundos (ajustável)
    autoRefreshIntervalRef.current = setInterval(async () => {
      try {
        console.log('🔄 Auto-refresh automático executando...');
        
        // Recarregar dados silenciosamente (sem mostrar loading ou notificações)
        await Promise.allSettled([
          loadProgress(true),
          loadAchievements(true), 
          loadStatistics(true),
          loadNextSteps(),
          loadTodayProgress()
        ]);
        
        console.log('✅ Auto-refresh concluído silenciosamente');
      } catch (error) {
        console.error('❌ Erro no auto-refresh:', error);
        // Não mostrar erro para o usuário em auto-refresh
      }
    }, 30000); // 30 segundos

    console.log('⏰ Auto-refresh iniciado (30s)');
  }, [loadProgress, loadAchievements, loadStatistics, loadNextSteps]);

  // ✅ Cleanup do auto-refresh
  useEffect(() => {
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        console.log('🛑 Auto-refresh parado');
      }
    };
  }, []);

  // ✅ Iniciar auto-refresh quando componente monta
  useEffect(() => {
    if (isInitialized) {
      startAutoRefresh();
    }
  }, [isInitialized, startAutoRefresh]);

  // ✅ CORREÇÃO: Função para carregar conteúdo APENAS quando necessário
  const loadCurrentContent = useCallback(async () => {
    // Evitar múltiplas chamadas
    if (!currentProgress || loadingContent || loadedContentRef.current) {
      return;
    }

    // Verificar se o progresso mudou
    const progressId = `${currentProgress.area}-${currentProgress.subarea}-${currentProgress.progress_percentage}`;
    if (lastProgressIdRef.current === progressId) {
      return; // Mesmo progresso, não recarregar
    }

    loadedContentRef.current = true;
    setLoadingContent(true);
    
    try {
      console.log('📚 Carregando conteúdo atual...');
      const content = await progressAPI.getCurrentContent();
      setCurrentContent(content);
      lastProgressIdRef.current = progressId;
      console.log('✅ Conteúdo carregado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar conteúdo:', error);
    } finally {
      setLoadingContent(false);
      // Resetar flag após delay para permitir próximo carregamento se necessário
      setTimeout(() => {
        loadedContentRef.current = false;
      }, 5000);
    }
  }, [currentProgress, loadingContent]);

  // ✅ CORREÇÃO: useCallback para extrair badges recentes SEM causar re-renders
  const updateRecentBadges = useCallback(() => {
    if (!achievements?.badge_categories) return;
    
    try {
      const allBadges = achievements.badge_categories.flatMap(category => category.badges || []);
      const recent = allBadges
        .filter(badge => badge.earned_date)
        .sort((a, b) => new Date(b.earned_date) - new Date(a.earned_date))
        .slice(0, 3);
      
      setRecentBadges(recent);
    } catch (error) {
      console.error('Erro ao processar badges:', error);
      setRecentBadges([]);
    }
  }, [achievements?.badge_categories]); // Dependência específica

  // ✅ CORREÇÃO: useCallback estável para cálculo de nível
  const getNextLevelInfo = useCallback(() => {
    if (!user) return null;
    
    const currentXP = user.profile_xp || 0;
    const currentLevel = user.profile_level || 1;
    const nextLevelXP = currentLevel * 100;
    const progress = ((currentXP % 100) / 100) * 100;
    
    return {
      currentXP,
      nextLevelXP,
      progress,
      xpNeeded: nextLevelXP - (currentXP % 100)
    };
  }, [user?.profile_xp, user?.profile_level]); // Dependências específicas

  // Carregar progresso do dia
  const loadTodayProgress = useCallback(async () => {
    try {
      const today = await progressAPI.getTodayProgress();
      setTodayProgress(today);
      
      // Atualizar meta semanal
      const weekly = await progressAPI.getWeeklyProgress();
      setWeeklyGoal(weekly);
    } catch (error) {
      console.error('Erro ao carregar progresso diário:', error);
    }
  }, []);

  // Gerar avaliação personalizada
  const handleGenerateAssessment = async () => {
    setGeneratingContent(true);
    try {
      const assessment = await llmAPI.generateAssessment({
        area: currentProgress?.area || user?.current_track,
        subarea: currentProgress?.subarea || user?.current_subarea,
        level: currentProgress?.level || 'iniciante',
        question_count: 10
      });
      
      showSuccess('Avaliação gerada com sucesso!');
      onNavigate?.('assessment', { assessment });
    } catch (error) {
      showError('Erro ao gerar avaliação: ' + error.message);
    } finally {
      setGeneratingContent(false);
    }
  };

  // Gerar plano de estudos
  const handleGenerateLearningPath = async () => {
    setGeneratingContent(true);
    try {
      const learningPath = await llmAPI.generateLearningPath({
        current_area: currentProgress?.area || user?.current_track,
        current_level: currentProgress?.level || 'iniciante',
        goals: user?.learning_goals || [],
        time_available: 'flexible',
        duration_weeks: 4
      });
      
      showSuccess('Plano de estudos criado!');
      onNavigate?.('learning-path', { path: learningPath });
    } catch (error) {
      showError('Erro ao gerar plano: ' + error.message);
    } finally {
      setGeneratingContent(false);
    }
  };

  // Gerar sessão de estudo focada
  const handleGenerateStudySession = async () => {
    setGeneratingContent(true);
    try {
      const session = await llmAPI.generateStudySession({
        topic: currentContent?.title || 'Tópico atual',
        duration_minutes: 30,
        difficulty: currentProgress?.level || 'iniciante',
        include_practice: true
      });
      
      showSuccess('Sessão de estudo criada!');
      onNavigate?.('study-session', { session });
    } catch (error) {
      showError('Erro ao criar sessão: ' + error.message);
    } finally {
      setGeneratingContent(false);
    }
  };

  // ✅ Effect para atualizar badges APENAS quando necessário
  useEffect(() => {
    if (achievements?.badge_categories) {
      updateRecentBadges();
    }
  }, [updateRecentBadges]); // Dependência do callback

  // ✅ CORREÇÃO: Effect para carregar conteúdo APENAS quando progresso mudar
  useEffect(() => {
    if (currentProgress && isInitialized && !loadingContent) {
      const progressId = `${currentProgress.area}-${currentProgress.subarea}-${currentProgress.progress_percentage}`;
      
      // Só carregar se o progresso realmente mudou
      if (lastProgressIdRef.current !== progressId) {
        loadCurrentContent();
      }
    }
  }, [currentProgress?.area, currentProgress?.subarea, currentProgress?.progress_percentage, isInitialized, loadCurrentContent]);

  // Carregar dados iniciais
  useEffect(() => {
    if (isInitialized) {
      loadTodayProgress();
    }
  }, [isInitialized, loadTodayProgress]);

  const nextLevelInfo = getNextLevelInfo();

  // ✅ CORREÇÃO: Loading mais específico
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Inicializando dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - ✅ REMOVIDO BOTÃO ATUALIZAR */}
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
              {todayProgress && (
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4" />
                  <span>{todayProgress.lessons_completed || 0} lições hoje</span>
                </div>
              )}
            </div>
          </div>
          
          {/* ✅ REMOVIDO BOTÃO ATUALIZAR - SÓ MANTÉM O PRINCIPAL */}
          <div className="mt-4 lg:mt-0">
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

      {/* ✅ INDICADOR VISUAL DE AUTO-REFRESH */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Dados atualizados automaticamente</span>
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
        {/* Conteúdo Principal */}
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

          {/* Ações Disponíveis */}
          <Card>
            <Card.Header>
              <Card.Title>O que você pode fazer agora</Card.Title>
              <Card.Subtitle>Funcionalidades inteligentes para otimizar seus estudos</Card.Subtitle>
            </Card.Header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleGenerateAssessment}
                disabled={generatingContent}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium">Gerar Avaliação</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Teste seus conhecimentos atuais com questões personalizadas
                </p>
              </button>

              <button
                onClick={handleGenerateLearningPath}
                disabled={generatingContent}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Map className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium">Plano de Estudos</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Gere um roteiro personalizado baseado no seu progresso
                </p>
              </button>

              <button
                onClick={handleGenerateStudySession}
                disabled={generatingContent}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium">Sessão Focada</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Crie uma sessão de estudos com duração e objetivos definidos
                </p>
              </button>

              <button
                onClick={() => onNavigate?.('progress-details')}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <h4 className="font-medium">Progresso Detalhado</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Veja estatísticas completas e insights sobre seu aprendizado
                </p>
              </button>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  <h4 className="font-medium">Mudar Área</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Explore outras áreas de estudo ou altere sua trilha atual
                </p>
                <AreaSwitcher />
              </div>

              <button
                onClick={() => onNavigate?.('teacher')}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-5 w-5 text-pink-600" />
                  <h4 className="font-medium">Tutor IA</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Converse com o tutor inteligente sobre qualquer dúvida
                </p>
              </button>
            </div>

            {generatingContent && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-primary-600">
                <Loading size="sm" />
                <span className="text-sm">Gerando conteúdo inteligente...</span>
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
              <div className="text-center py-4">
                <Lightbulb className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  Continue estudando para receber recomendações personalizadas
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta Semanal */}
          <Card>
            <Card.Header>
              <Card.Title>Meta da Semana</Card.Title>
            </Card.Header>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-4">
                <span className="text-xl font-bold text-secondary-600">
                  {weeklyGoal.completed}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                {weeklyGoal.completed} de {weeklyGoal.target} lições esta semana
              </p>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-secondary-600 to-success-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((weeklyGoal.completed / weeklyGoal.target) * 100, 100)}%` }}
                />
              </div>
              
              <p className="text-xs text-gray-500">
                {Math.max(0, weeklyGoal.target - weeklyGoal.completed)} lições restantes
              </p>
            </div>
          </Card>

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

          {/* Ações Rápidas */}
          <Card>
            <Card.Header>
              <Card.Title>Ações Rápidas</Card.Title>
            </Card.Header>

            <div className="space-y-2">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => onNavigate?.('projects')}
                leftIcon={<Target className="h-4 w-4" />}
              >
                Meus Projetos
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => onNavigate?.('resources')}
                leftIcon={<BookOpen className="h-4 w-4" />}
              >
                Recursos Extras
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => onNavigate?.('community')}
                leftIcon={<Users className="h-4 w-4" />}
              >
                Comunidade
              </Button>

              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => onNavigate?.('settings')}
                leftIcon={<Settings className="h-4 w-4" />}
              >
                Configurações
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ✅ CORREÇÃO DO BUG: AreaSwitcher não deve ir para mapeamento
const AreaSwitcher = () => {
  const { user, updateUser } = useAuth();
  const { showError, showSuccess } = useNotification();
  
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [subareas, setSubareas] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAreas = async () => {
    try {
      // ✅ CORREÇÃO: Usar contentAPI importado corretamente
      const response = await contentAPI.browseAreas();
      setAreas(response.areas);
    } catch (error) {
      showError('Erro ao carregar áreas');
    }
  };

  const loadSubareas = async (areaName) => {
    setLoading(true);
    try {
      // ✅ CORREÇÃO: Usar contentAPI importado corretamente
      const response = await contentAPI.getAreaDetails(areaName);
      setSubareas(response.subareas);
      setSelectedArea(areaName);
    } catch (error) {
      showError('Erro ao carregar subáreas');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREÇÃO PRINCIPAL: handleSwitchArea deve ficar no dashboard
  const handleSwitchArea = async (subareaName) => {
    try {
      setLoading(true);
      
      console.log('🔄 Mudando para área:', { selectedArea, subareaName });
      
      // 1. Verificar se já tem progresso nesta combinação
      let hasExistingProgress = false;
      try {
        const existingProgress = await progressAPI.getProgressForAreaSubarea(selectedArea, subareaName);
        hasExistingProgress = !!(existingProgress && existingProgress.module_index !== undefined);
        console.log('📊 Progresso existente:', hasExistingProgress);
      } catch (error) {
        hasExistingProgress = false;
      }
      
      // 2. Definir área no backend
      await contentAPI.setCurrentArea(selectedArea, subareaName);
      
      // 3. ✅ CORREÇÃO: Se não tem progresso, inicializar em 0,0,0
      if (!hasExistingProgress) {
        console.log('🚀 Inicializando progresso em 0,0,0...');
        try {
          await progressAPI.navigateTo({
            area: selectedArea,
            subarea: subareaName,
            level: 'iniciante',
            module_index: 0,
            lesson_index: 0,
            step_index: 0
          });
        } catch (initError) {
          console.error('❌ Erro ao inicializar progresso:', initError);
        }
      }
      
      // 4. Atualizar usuário
      updateUser({
        current_track: selectedArea,
        current_subarea: subareaName
      });
      
      const message = hasExistingProgress 
        ? `Voltando para: ${selectedArea} - ${subareaName}` 
        : `Nova área definida: ${selectedArea} - ${subareaName}`;
      showSuccess(message);
      
      setShowAreaModal(false);
      
      // ✅ CORREÇÃO CRÍTICA: NÃO recarregar página - deixar dashboard atualizar automaticamente
      // O auto-refresh vai pegar as mudanças
      console.log('✅ Área alterada - dashboard vai atualizar automaticamente');
      
    } catch (error) {
      showError('Erro ao mudar área: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setShowAreaModal(true);
          loadAreas();
        }}
        leftIcon={<Target className="h-4 w-4" />}
      >
        Explorar
      </Button>

      {showAreaModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowAreaModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Mudar Área de Estudo</h2>
              
              {!selectedArea ? (
                <>
                  <p className="text-gray-600 mb-6">
                    Seu progresso atual será salvo e você poderá retornar quando quiser.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {areas.map((area) => (
                      <Card
                        key={area.name}
                        hover
                        clickable
                        onClick={() => loadSubareas(area.name)}
                      >
                        <div className="p-4">
                          <h3 className="font-semibold mb-2">{area.name}</h3>
                          <p className="text-sm text-gray-600">{area.description}</p>
                          {area.name === user?.current_track && (
                            <span className="inline-block mt-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                              Área Atual
                            </span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedArea(null);
                      setSubareas([]);
                    }}
                    className="mb-4"
                  >
                    ← Voltar para áreas
                  </Button>
                  
                  <h3 className="text-lg font-semibold mb-4">
                    Subáreas de {selectedArea}
                  </h3>
                  
                  {loading ? (
                    <Loading text="Carregando subáreas..." />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subareas.map((subarea) => (
                        <Card
                          key={subarea.name}
                          hover
                          clickable
                          onClick={() => handleSwitchArea(subarea.name)}
                        >
                          <div className="p-4">
                            <h4 className="font-medium mb-2">{subarea.name}</h4>
                            <p className="text-sm text-gray-600">{subarea.description}</p>
                            {selectedArea === user?.current_track && 
                             subarea.name === user?.current_subarea && (
                              <span className="inline-block mt-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                Subárea Atual
                              </span>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAreaModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;