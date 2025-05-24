
// components/navigation/index.js - Arquivo de exportação
export { default as Breadcrumbs } from './Breadcrumbs';
export { default as QuickActions } from './QuickActions';
export { default as ViewRenderer } from './ViewRenderer';
export { default as NavBar } from './NavBar';
export { default as MobileNav } from './MobileNav';
export { NavigationProvider, useNavigationContext } from './NavigationProvider';

// utils/navigation.js - Utilitários de navegação
export const getViewTitle = (view) => {
  const titles = {
    dashboard: 'Dashboard',
    learning: 'Aprendizado',
    achievements: 'Conquistas',
    projects: 'Projetos',
    resources: 'Recursos',
    mapping: 'Mapeamento de Interesses',
    teacher: 'Professor Virtual',
    profile: 'Perfil do Usuário',
    settings: 'Configurações'
  };
  return titles[view] || 'Página';
};

export const getViewDescription = (view) => {
  const descriptions = {
    dashboard: 'Visão geral do seu progresso e atividades',
    learning: 'Continue sua jornada de aprendizado',
    achievements: 'Suas conquistas e badges',
    projects: 'Gerencie seus projetos',
    resources: 'Materiais e recursos educacionais',
    mapping: 'Descubra suas áreas de interesse',
    teacher: 'Converse com o professor virtual',
    profile: 'Informações do seu perfil',
    settings: 'Configurações da plataforma'
  };
  return descriptions[view] || 'Navegue pela plataforma';
};

export const getViewIcon = (view) => {
  const icons = {
    dashboard: 'home',
    learning: 'book-open',
    achievements: 'award',
    projects: 'folder-open',
    resources: 'library',
    mapping: 'target',
    teacher: 'message-circle',
    profile: 'user',
    settings: 'settings'
  };
  return icons[view] || 'circle';
};

export const isValidView = (view) => {
  const validViews = [
    'dashboard', 'learning', 'achievements', 'projects', 
    'resources', 'mapping', 'teacher', 'profile', 'settings'
  ];
  return validViews.includes(view);
};