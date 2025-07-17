import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';

// Lazy loading para otimização de performance
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const AreaSelectionPage = lazy(() => import('./pages/AreaSelectionPage'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const LearningPage = lazy(() => import('./pages/LearningPage'));
const LearningPathPage = lazy(() => import('./pages/LearningPathPage'));
const MappingPage = lazy(() => import('./pages/MappingPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProgressDetailsPage = lazy(() => import('./pages/ProgressDetailsPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const StudySessionPage = lazy(() => import('./pages/StudySessionPage'));
const TeacherPage = lazy(() => import('./pages/TeacherPage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));

// Components
import Layout from './components/layout/Layout';
import Loading from './components/common/Loading';
import { useNavigation } from './hooks/useNavigation';

// Loading component para lazy loading
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loading size="lg" text="Carregando página..." />
  </div>
);

// Main App Router Component
function AppRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { currentView, navigate, navigationState } = useNavigation('dashboard');
  
  // Debug logs com controle
  const DEBUG = process.env.NODE_ENV === 'development';
  
  useEffect(() => {
    if (DEBUG) {
      console.log('🔍 AppRouter Debug:', { 
        isAuthenticated, 
        isLoading, 
        userEmail: user?.email,
        hasRecommendedTrack: !!user?.recommended_track,
        hasCurrentTrack: !!user?.current_track,
        hasCurrentSubarea: !!user?.current_subarea,
        currentView,
        navigationState,
        timestamp: new Date().toISOString()
      });
    }
  }, [isAuthenticated, isLoading, user, currentView, navigationState, DEBUG]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show welcome page
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoading />}>
        <WelcomePage />
      </Suspense>
    );
  }

  // Verificar estado do usuário
  const isUserCompletelyConfigured = !!(user?.current_track && user?.current_subarea);
  const hasRecommendedTrack = !!user?.recommended_track;
  const isNewUser = !hasRecommendedTrack && !user?.current_track;

  // Se for um usuário novo (sem trilha recomendada), força o mapeamento
  if (isNewUser && currentView !== 'mapping') {
    return (
      <Layout>
        <Suspense fallback={<PageLoading />}>
          <MappingPage 
            onNavigate={navigate} 
            onComplete={() => {
              if (DEBUG) console.log('✅ Mapeamento inicial concluído, indo para seleção de áreas');
              navigate('areas');
            }} 
          />
        </Suspense>
      </Layout>
    );
  }

  // Se tem uma trilha recomendada mas ainda não escolheu a área/subárea, força a seleção
  if (hasRecommendedTrack && !user?.current_track && currentView !== 'areas') {
    return (
      <Layout currentView="areas" onNavigate={navigate}>
        <Suspense fallback={<PageLoading />}>
          <AreaSelectionPage onNavigate={navigate} />
        </Suspense>
      </Layout>
    );
  }

  // Se usuário está completamente configurado, permitir navegação manual
  if (isUserCompletelyConfigured) {
    // Permitir navegação manual para mapeamento (NOVO mapeamento)
    if (currentView === 'mapping') {
      return (
        <Layout currentView="mapping" onNavigate={navigate}>
          <Suspense fallback={<PageLoading />}>
            <MappingPage 
              onNavigate={navigate} 
              onComplete={() => {
                if (DEBUG) console.log('✅ Novo mapeamento concluído, indo para seleção de áreas');
                navigate('areas');
              }} 
            />
          </Suspense>
        </Layout>
      );
    }

    // Permitir navegação manual para áreas (trocar área)
    if (currentView === 'areas') {
      return (
        <Layout currentView="areas" onNavigate={navigate}>
          <Suspense fallback={<PageLoading />}>
            <AreaSelectionPage onNavigate={navigate} />
          </Suspense>
        </Layout>
      );
    }
  }

  // Mostrar app principal
  return <AppRoutes />;
}

// Routes for authenticated users
function AppRoutes() {
  const { currentView, navigate, navigationState } = useNavigation('dashboard');
  const DEBUG = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (DEBUG) {
      console.log('🧭 Current view:', currentView);
      console.log('📦 Navigation state:', navigationState);
    }
  }, [currentView, navigationState, DEBUG]);

  // Mapeamento de rotas para componentes
  const routeMap = {
    'dashboard': <DashboardPage onNavigate={navigate} />,
    'learning': <LearningPage onNavigate={navigate} navigationState={navigationState} />,
    'areas': <AreaSelectionPage onNavigate={navigate} />,
    'feedback': <FeedbackPage onNavigate={navigate} />,
    'achievements': <AchievementsPage onNavigate={navigate} />,
    'projects': <ProjectsPage onNavigate={navigate} navigationState={navigationState} />,
    'resources': <ResourcesPage onNavigate={navigate} />,
    'mapping': (
      <MappingPage 
        onNavigate={navigate} 
        onComplete={() => {
          if (DEBUG) console.log('✅ Re-mapeamento concluído, redirecionando');
          navigate('areas');
        }} 
      />
    ),
    'teacher': <TeacherPage onNavigate={navigate} />,
    'assessment': <AssessmentPage onNavigate={navigate} navigationState={navigationState} />,
    'study-session': <StudySessionPage onNavigate={navigate} navigationState={navigationState} />,
    'learning-path': <LearningPathPage onNavigate={navigate} navigationState={navigationState} />,
    'profile': <ProfilePage onNavigate={navigate} />,
    'settings': <SettingsPage onNavigate={navigate} />,
    'community': <CommunityPage onNavigate={navigate} />,
    'progress-details': <ProgressDetailsPage onNavigate={navigate} />,
  };

  // Componente a ser renderizado ou fallback para dashboard
  const componentToRender = routeMap[currentView] || <DashboardPage onNavigate={navigate} />;

  // Log de aviso para rotas não encontradas
  useEffect(() => {
    if (!routeMap[currentView] && DEBUG) {
      console.warn(`⚠️ View desconhecida: ${currentView}, redirecionando para dashboard`);
    }
  }, [currentView, DEBUG]);

  return (
    <Layout currentView={currentView} onNavigate={navigate}>
      <Suspense fallback={<PageLoading />}>
        {componentToRender}
      </Suspense>
    </Layout>
  );
}

// Error Boundary para capturar erros
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    // Em produção, você poderia enviar esse erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Algo deu errado
            </h2>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Recarregar Página
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="mt-2 space-y-2">
                  <pre className="text-xs text-red-600 bg-red-50 p-3 rounded overflow-x-auto">
                    {this.state.error?.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App Component with provider hierarchy
function App() {
  // Debug de renders apenas em desenvolvimento
  const renderCount = useRef(0);
  const DEBUG = process.env.NODE_ENV === 'development';
  
  useEffect(() => {
    renderCount.current++;
    
    if (DEBUG) {
      console.log(`🎨 App render #${renderCount.current}`);
      
      // Detectar renders excessivos
      if (renderCount.current > 50) {
        console.warn('⚠️ App está re-renderizando muito! Possível loop infinito ou problema de performance.');
      }
    }
  });

  return (
    <div className="App">
      <ErrorBoundary>
        <NotificationProvider>
          <AuthProvider>
            <AppProvider>
              <AppRouter />
            </AppProvider>
          </AuthProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;