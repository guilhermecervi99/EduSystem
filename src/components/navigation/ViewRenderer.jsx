// components/navigation/ViewRenderer.jsx
import React, { Suspense, lazy } from 'react';
import Loading from '../common/Loading';

// Lazy load das páginas para melhor performance
const DashboardPage = lazy(() => import('../../pages/DashboardPage'));
const LearningPage = lazy(() => import('../../pages/LearningPage'));
const AchievementsPage = lazy(() => import('../../pages/AchievementsPage'));
const ProjectsPage = lazy(() => import('../../pages/ProjectsPage'));
const ResourcesPage = lazy(() => import('../../pages/ResourcesPage'));
const MappingPage = lazy(() => import('../../pages/MappingPage'));
const TeacherPage = lazy(() => import('../../pages/TeacherPage'));
const ProfilePage = lazy(() => import('../../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../../pages/SettingsPage'));
const AssessmentPage = lazy(() => import('../../pages/AssessmentPage'));
const StudySessionPage = lazy(() => import('../../pages/StudySessionPage'));
const LearningPathPage = lazy(() => import('../../pages/LearningPathPage'));
const AreaSelectionPage = lazy(() => import('../../pages/AreaSelectionPage'));
const FeedbackPage = lazy(() => import('../../pages/FeedbackPage'));

const ViewRenderer = ({ currentView, onNavigate, navigationState }) => {
  
  // Log para debug
  console.log('🎯 ViewRenderer:', { currentView, hasNavigationState: !!navigationState });
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onNavigate={onNavigate} />;
        
      case 'learning':
        return <LearningPage onNavigate={onNavigate} navigationState={navigationState} />;
        
      case 'achievements':
        return <AchievementsPage onNavigate={onNavigate} />;
        
      case 'projects':
        return <ProjectsPage onNavigate={onNavigate} navigationState={navigationState} />;
        
      case 'resources':
        return <ResourcesPage onNavigate={onNavigate} />;
        
      case 'areas':
        return <AreaSelectionPage onNavigate={onNavigate} />;
        
      case 'feedback':
        return <FeedbackPage onNavigate={onNavigate} />;
        
      case 'mapping':
        return <MappingPage onNavigate={onNavigate} />;
        
      case 'teacher':
        return <TeacherPage onNavigate={onNavigate} />;
        
      case 'profile':
        return <ProfilePage onNavigate={onNavigate} />;
        
      case 'settings':
        return <SettingsPage onNavigate={onNavigate} />;
        
      // Componentes que PRECISAM de navigationState
      case 'assessment':
        console.log('📋 Renderizando AssessmentPage com navigationState:', navigationState);
        return <AssessmentPage onNavigate={onNavigate} navigationState={navigationState} />;
        
      case 'study-session':
        console.log('📚 Renderizando StudySessionPage com navigationState:', navigationState);
        return <StudySessionPage onNavigate={onNavigate} navigationState={navigationState} />;
        
      case 'learning-path':
        console.log('🗺️ Renderizando LearningPathPage com navigationState:', navigationState);
        return <LearningPathPage onNavigate={onNavigate} navigationState={navigationState} />;
        
      default:
        console.warn(`View desconhecida: ${currentView}, redirecionando para dashboard`);
        return <DashboardPage onNavigate={onNavigate} />;
    }
  };

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" text="Carregando página..." />
        </div>
      }
    >
      {renderView()}
    </Suspense>
  );
};

export default ViewRenderer;