// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  THEME: 'theme_preference',
  LANGUAGE: 'language_preference',
};

// Routes
export const ROUTES = {
  HOME: '/',
  WELCOME: '/welcome',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  MAPPING: '/mapping',
  LEARNING: '/learning',
  PROJECTS: '/projects',
  ACHIEVEMENTS: '/achievements',
  RESOURCES: '/resources',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

// Learning Styles
export const LEARNING_STYLES = {
  DIDATICO: 'didático',
  SOCRATICO: 'socrático',
  STORYTELLING: 'storytelling',
  VISUAL: 'visual',
  GAMIFICADO: 'gamificado',
  PROJETO: 'projeto',
};

export const LEARNING_STYLES_LABELS = {
  [LEARNING_STYLES.DIDATICO]: 'Didático',
  [LEARNING_STYLES.SOCRATICO]: 'Socrático',
  [LEARNING_STYLES.STORYTELLING]: 'Storytelling',
  [LEARNING_STYLES.VISUAL]: 'Visual',
  [LEARNING_STYLES.GAMIFICADO]: 'Gamificado',
  [LEARNING_STYLES.PROJETO]: 'Baseado em Projetos',
};

// Knowledge Levels
export const KNOWLEDGE_LEVELS = {
  INICIANTE: 'iniciante',
  BASICO: 'básico',
  INTERMEDIARIO: 'intermediário',
  AVANCADO: 'avançado',
};

export const KNOWLEDGE_LEVELS_LABELS = {
  [KNOWLEDGE_LEVELS.INICIANTE]: 'Iniciante',
  [KNOWLEDGE_LEVELS.BASICO]: 'Básico',
  [KNOWLEDGE_LEVELS.INTERMEDIARIO]: 'Intermediário',
  [KNOWLEDGE_LEVELS.AVANCADO]: 'Avançado',
};

// Badge Rarities
export const BADGE_RARITIES = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

export const BADGE_RARITY_COLORS = {
  [BADGE_RARITIES.COMMON]: 'text-gray-600 bg-gray-100',
  [BADGE_RARITIES.RARE]: 'text-blue-600 bg-blue-100',
  [BADGE_RARITIES.EPIC]: 'text-purple-600 bg-purple-100',
  [BADGE_RARITIES.LEGENDARY]: 'text-yellow-600 bg-yellow-100',
};

// Project Types
export const PROJECT_TYPES = {
  LESSON: 'lesson',
  MODULE: 'module',
  FINAL: 'final',
  PERSONAL: 'personal',
  DISCOVERY: 'discovery',
};

export const PROJECT_TYPE_LABELS = {
  [PROJECT_TYPES.LESSON]: 'Projeto de Lição',
  [PROJECT_TYPES.MODULE]: 'Projeto de Módulo',
  [PROJECT_TYPES.FINAL]: 'Projeto Final',
  [PROJECT_TYPES.PERSONAL]: 'Projeto Pessoal',
  [PROJECT_TYPES.DISCOVERY]: 'Projeto de Descoberta',
};

// Status
export const STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle',
};

export const PROJECT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAUSED: 'paused',
};

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.IN_PROGRESS]: 'Em Progresso',
  [PROJECT_STATUS.COMPLETED]: 'Concluído',
  [PROJECT_STATUS.PAUSED]: 'Pausado',
};

// Assessment Types
export const ASSESSMENT_TYPES = {
  MULTIPLE_CHOICE: 'múltipla escolha',
  TRUE_FALSE: 'verdadeiro/falso',
  ESSAY: 'dissertativa',
};

// XP Rewards (matching backend)
export const XP_REWARDS = {
  COMPLETE_LESSON: 10,
  COMPLETE_MODULE: 15,
  COMPLETE_PROJECT: 25,
  COMPLETE_FINAL_PROJECT: 50,
  PASS_ASSESSMENT: 10,
  ASK_TEACHER: 2,
  ACCESS_RESOURCE: 3,
  DAILY_LOGIN: 5,
};

// UI Constants
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  ACCENT: 'accent',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
};

// Academic Areas
export const ACADEMIC_AREAS = {
  TECNOLOGIA: 'Tecnologia e Computação',
  CIENCIAS_EXATAS: 'Ciências Exatas',
  ARTES: 'Artes e Cultura',
  ESPORTES: 'Esportes e Atividades Físicas',
  BIOLOGICAS: 'Ciências Biológicas e Saúde',
  HUMANAS: 'Ciências Humanas e Sociais',
  LITERATURA: 'Literatura e Linguagem',
  NEGOCIOS: 'Negócios e Empreendedorismo',
  COMUNICACAO: 'Comunicação Profissional',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso!',
  REGISTER_SUCCESS: 'Conta criada com sucesso!',
  LESSON_COMPLETED: 'Lição completada com sucesso!',
  PROJECT_COMPLETED: 'Projeto completado com sucesso!',
  ACHIEVEMENT_UNLOCKED: 'Nova conquista desbloqueada!',
  PROGRESS_UPDATED: 'Progresso atualizado!',
};

// Time Formats
export const TIME_FORMATS = {
  DATE: 'DD/MM/YYYY',
  DATETIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm',
  RELATIVE: 'relative', // para usar com bibliotecas como date-fns
};