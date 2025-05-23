import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import WelcomePage from './pages/WelcomePage';
import MappingPage from './pages/MappingPage';
import DashboardPage from './pages/DashboardPage';
import LearningPage from './pages/LearningPage';

// Components
import Layout from './components/layout/Layout';
import Loading from './components/common/Loading';

// Main App Router Component
function AppRouter() {
  const { isAuthenticated, isLoading, hasCompletedMapping } = useAuth();

  // ✅ DEBUG DETALHADO
  console.log('🔍 AppRouter Debug:', { 
    isAuthenticated, 
    isLoading, 
    hasCompletedMapping: hasCompletedMapping(),
    timestamp: new Date().toISOString()
  });

  console.log('🔍 AppRouter State:', { 
    isAuthenticated, 
    isLoading, 
    hasCompletedMapping: hasCompletedMapping() 
  });

  console.log('🔍 isLoading type:', typeof isLoading);
  console.log('🔍 isLoading === true:', isLoading === true);
  console.log('🔍 isLoading === false:', isLoading === false);

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

  console.log('✅ Passou do if(isLoading), continuando...');

  // If not authenticated, show welcome page
  if (!isAuthenticated) {
    console.log('🚪 Not authenticated, showing welcome page');
    return <WelcomePage />;
  }

  // If authenticated but hasn't completed mapping, show mapping page
  if (!hasCompletedMapping()) {
    console.log('🗺️ No mapping completed, showing mapping page');
    return (
      <Layout>
        <MappingPage />
      </Layout>
    );
  }

  // ✅ CORREÇÃO: Authenticated and mapped - show main app
  console.log('✅ Fully authenticated, showing main app');
  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

// Routes for authenticated users
function AppRoutes() {
  const [currentView, setCurrentView] = React.useState('dashboard');

  console.log('🧭 Current view:', currentView);

  // useCallback para evitar recriação da função
  const handleNavigate = React.useCallback((view) => {
    console.log(`🧭 Navegando para: ${view}`);
    setCurrentView(view);
  }, []);

  // This could be replaced with React Router for more complex routing
  const renderView = React.useCallback(() => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'learning':
        return <LearningPage onNavigate={handleNavigate} />;
      case 'mapping':
        return <MappingPage onNavigate={handleNavigate} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  }, [currentView, handleNavigate]);

  return renderView();
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

// ✅ CORREÇÃO: Main App Component with CORRECT provider hierarchy
function App() {
  // Debug de renders
  const renderCount = React.useRef(0);
  renderCount.current++;
  
  React.useEffect(() => {
    console.log(`🎨 App render #${renderCount.current}`);
    
    // Detectar renders excessivos
    if (renderCount.current > 5) {
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