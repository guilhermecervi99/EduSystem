// App.jsx - VERSÃO ATUALIZADA COM CORREÇÃO
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import AchievementsPage from './pages/AchievementsPage';
import AreaSelectionPage from './pages/AreaSelectionPage';
import FeedbackPage from './pages/FeedbackPage';
import WelcomePage from './pages/WelcomePage';
import MappingPage from './pages/MappingPage';
import DashboardPage from './pages/DashboardPage';
import LearningPage from './pages/LearningPage';
import ProjectsPage from './pages/ProjectsPage';
import ResourcesPage from './pages/ResourcesPage';
import TeacherPage from './pages/TeacherPage';

// Components
import Layout from './components/layout/Layout';
import Loading from './components/common/Loading';

// Navigation Hook
import { useNavigation } from './hooks/useNavigation';

// Main App Router Component
function AppRouter() {
  const { isAuthenticated, isLoading, hasCompletedMapping, user } = useAuth();
  const [forceMapping, setForceMapping] = React.useState(false);
  const { currentView, navigate } = useNavigation('dashboard');
  
  // ✅ DEBUG MELHORADO
  console.log('🔍 AppRouter Debug:', { 
    isAuthenticated, 
    isLoading, 
    hasCompletedMapping: hasCompletedMapping(),
    userEmail: user?.email,
    currentTrack: user?.current_track,
    recommendedTrack: user?.recommended_track,
    forceMapping,
    timestamp: new Date().toISOString()
  });

  // Show loading screen while checking authentication
  if (isLoading) {
    console.log('⏳ Showing loading screen... isLoading =', isLoading);
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
    console.log('🚪 Not authenticated, showing welcome page');
    return <WelcomePage />;
  }

  console.log('✅ User is authenticated, checking mapping...');

  // ✅ CORREÇÃO: Mostrar mapeamento se não tem recommended_track OU se forçou
  if (!user?.recommended_track || forceMapping) {
    console.log('🗺️ Mostrando mapeamento - recommended_track:', user?.recommended_track, 'forceMapping:', forceMapping);
    return (
      <Layout>
        <MappingPage 
          onNavigate={navigate} 
          onComplete={() => {
            setForceMapping(false);
            navigate('areas');
          }} 
        />
      </Layout>
    );
  }

  // Verificar se tem área mas não tem subárea
  if (user?.recommended_track && !user?.current_track) {
    console.log('🎯 User has recommended area but no subarea, showing area selection');
    return (
      <Layout currentView="areas" onNavigate={navigate}>
        <AreaSelectionPage onNavigate={navigate} />
      </Layout>
    );
  }

  // ✅ Authenticated and mapped - show main app
  console.log('✅ Fully authenticated and mapped, showing main app');
  return <AppRoutes />;
}

// Routes for authenticated users
function AppRoutes() {
  const { currentView, navigate } = useNavigation('dashboard');

  console.log('🧭 Current view:', currentView);

  // Render view baseado no estado atual
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case 'learning':
        return <LearningPage onNavigate={navigate} />;
      case 'areas':
        return <AreaSelectionPage onNavigate={navigate} />;
      case 'feedback':
        return <FeedbackPage onNavigate={navigate} />;
      case 'achievements':
        return <AchievementsPage onNavigate={navigate} />;
      case 'projects':
        return <ProjectsPage onNavigate={navigate} />;
      case 'resources':
        return <ResourcesPage onNavigate={navigate} />;
      case 'mapping':
        return <MappingPage onNavigate={navigate} />;
      case 'teacher':
        return <TeacherPage onNavigate={navigate} />;
      case 'profile':
        // Temporariamente redirecionar para dashboard até criar ProfilePage
        console.warn('ProfilePage não implementada, redirecionando para dashboard');
        return <DashboardPage onNavigate={navigate} />;
      case 'settings':
        // Temporariamente redirecionar para dashboard até criar SettingsPage
        console.warn('SettingsPage não implementada, redirecionando para dashboard');
        return <DashboardPage onNavigate={navigate} />;
      default:
        console.warn(`View desconhecida: ${currentView}, redirecionando para dashboard`);
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={navigate}>
      {renderView()}
    </Layout>
  );
}

// Error Boundary para capturar erros
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Algo deu errado
            </h2>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Recarregar Página
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Detalhes do erro
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ Main App Component with CORRECT provider hierarchy
function App() {
  // Debug de renders
  const renderCount = React.useRef(0);
  renderCount.current++;
  
  React.useEffect(() => {
    console.log(`🎨 App render #${renderCount.current}`);
    
    // Detectar renders excessivos
    if (renderCount.current > 10) {
      console.warn('⚠️ App está re-renderizando muito! Possível loop infinito.');
    }
  });

  console.log('🚀 App initializing...');

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