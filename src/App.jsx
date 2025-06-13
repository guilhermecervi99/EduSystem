// App.jsx - VERSÃO CORRIGIDA PARA FLUXO DE NAVEGAÇÃO
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
  const { isAuthenticated, isLoading, user } = useAuth();
  const { currentView, navigate } = useNavigation('dashboard');
  
  console.log('🔍 AppRouter Debug:', { 
    isAuthenticated, 
    isLoading, 
    userEmail: user?.email,
    hasRecommendedTrack: !!user?.recommended_track,
    hasCurrentTrack: !!user?.current_track,
    currentView,
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

  console.log('✅ User is authenticated, checking flow...');

  // ✅ CORREÇÃO CRÍTICA: Priorizar estado do usuário sobre currentView para F5/reload
  // ORDEM CORRETA: 
  // 1. Verificar se usuário está completamente configurado PRIMEIRO
  // 2. Depois verificar navegação manual
  // 3. Por último, forçar fluxos obrigatórios

  console.log('🔍 Debug detalhado:', {
    currentView,
    hasRecommendedTrack: !!user?.recommended_track,
    hasCurrentTrack: !!user?.current_track,
    isFullyConfigured: !!(user?.recommended_track && user?.current_track)
  });

  // 1. ✅ CORREÇÃO F5: Se usuário está completamente configurado, mostrar app principal
  // (independente do currentView - resolve o bug do F5)
  if (user?.recommended_track && user?.current_track) {
    console.log('✅ Usuário completamente configurado - verificando navegação manual');
    
    // Permitir navegação manual para mapeamento/áreas mesmo estando configurado
    if (currentView === 'mapping') {
      console.log('🗺️ Navegação manual para mapeamento (usuário configurado)');
      return (
        <Layout currentView="mapping" onNavigate={navigate}>
          <MappingPage 
            onNavigate={navigate} 
            onComplete={() => {
              console.log('✅ Re-mapeamento concluído, indo para seleção de áreas');
              navigate('areas');
            }} 
          />
        </Layout>
      );
    }

    if (currentView === 'areas') {
      console.log('🎯 Navegação manual para seleção de áreas (usuário configurado)');
      return (
        <Layout currentView="areas" onNavigate={navigate}>
          <AreaSelectionPage onNavigate={navigate} />
        </Layout>
      );
    }

    // Se não é navegação manual, mostrar app principal
    console.log('✅ Mostrando app principal (usuário configurado)');
    return <AppRoutes />;
  }

  // 2. Se não tem recommended_track, forçar mapeamento inicial
  if (!user?.recommended_track) {
    console.log('🗺️ Usuário sem recommended_track, forçando mapeamento inicial');
    return (
      <Layout>
        <MappingPage 
          onNavigate={navigate} 
          onComplete={() => {
            console.log('✅ Mapeamento inicial concluído, indo para seleção de áreas');
            navigate('areas');
          }} 
        />
      </Layout>
    );
  }

  // 3. Se tem recommended_track mas não tem current_track, ir para seleção
  if (user?.recommended_track && !user?.current_track) {
    console.log('🎯 User tem recommended_track mas não current_track, indo para seleção');
    return (
      <Layout currentView="areas" onNavigate={navigate}>
        <AreaSelectionPage onNavigate={navigate} />
      </Layout>
    );
  }

  // 4. Fallback - não deveria chegar aqui
  console.warn('⚠️ Estado inesperado, redirecionando para dashboard');
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
        return (
          <MappingPage 
            onNavigate={navigate} 
            onComplete={() => {
              console.log('✅ Re-mapeamento concluído, redirecionando');
              navigate('dashboard');
            }} 
          />
        );
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