import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { progressAPI, achievementsAPI } from '../services/api';

// Estado inicial
const initialState = {
  // UI State
  sidebarOpen: false,
  theme: 'light',
  
  // Data State
  currentProgress: null,
  achievements: null,
  statistics: null,
  nextSteps: [],
  
  // Loading States
  progressLoading: false,
  achievementsLoading: false,
  statisticsLoading: false,
  
  // Cache timestamps
  lastProgressUpdate: null,
  lastAchievementsUpdate: null,
  lastStatisticsUpdate: null,
  
  // Initialization state
  isInitialized: false,
};

// Actions
const APP_ACTIONS = {
  // UI Actions
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR: 'SET_SIDEBAR',
  SET_THEME: 'SET_THEME',
  
  // Data Actions
  SET_PROGRESS: 'SET_PROGRESS',
  SET_ACHIEVEMENTS: 'SET_ACHIEVEMENTS',
  SET_STATISTICS: 'SET_STATISTICS',
  SET_NEXT_STEPS: 'SET_NEXT_STEPS',
  
  // Loading Actions
  SET_PROGRESS_LOADING: 'SET_PROGRESS_LOADING',
  SET_ACHIEVEMENTS_LOADING: 'SET_ACHIEVEMENTS_LOADING',
  SET_STATISTICS_LOADING: 'SET_STATISTICS_LOADING',
  
  // Cache Actions
  UPDATE_CACHE_TIMESTAMP: 'UPDATE_CACHE_TIMESTAMP',
  CLEAR_CACHE: 'CLEAR_CACHE',
  SET_INITIALIZED: 'SET_INITIALIZED',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case APP_ACTIONS.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };

    case APP_ACTIONS.SET_SIDEBAR:
      return {
        ...state,
        sidebarOpen: action.payload,
      };

    case APP_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };

    case APP_ACTIONS.SET_PROGRESS:
      return {
        ...state,
        currentProgress: action.payload,
        progressLoading: false,
        lastProgressUpdate: Date.now(),
      };

    case APP_ACTIONS.SET_ACHIEVEMENTS:
      return {
        ...state,
        achievements: action.payload,
        achievementsLoading: false,
        lastAchievementsUpdate: Date.now(),
      };

    case APP_ACTIONS.SET_STATISTICS:
      return {
        ...state,
        statistics: action.payload,
        statisticsLoading: false,
        lastStatisticsUpdate: Date.now(),
      };

    case APP_ACTIONS.SET_NEXT_STEPS:
      return {
        ...state,
        nextSteps: action.payload,
      };

    case APP_ACTIONS.SET_PROGRESS_LOADING:
      return {
        ...state,
        progressLoading: action.payload,
      };

    case APP_ACTIONS.SET_ACHIEVEMENTS_LOADING:
      return {
        ...state,
        achievementsLoading: action.payload,
      };

    case APP_ACTIONS.SET_STATISTICS_LOADING:
      return {
        ...state,
        statisticsLoading: action.payload,
      };

    case APP_ACTIONS.UPDATE_CACHE_TIMESTAMP:
      return {
        ...state,
        [`last${action.payload.type}Update`]: Date.now(),
      };

    case APP_ACTIONS.CLEAR_CACHE:
      return {
        ...state,
        currentProgress: null,
        achievements: null,
        statistics: null,
        nextSteps: [],
        lastProgressUpdate: null,
        lastAchievementsUpdate: null,
        lastStatisticsUpdate: null,
        isInitialized: false,
      };

    case APP_ACTIONS.SET_INITIALIZED:
      return {
        ...state,
        isInitialized: action.payload,
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext();

// Hook customizado
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};

// Provider
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { isAuthenticated, user, updateUser } = useAuth();
  
  // ✅ CORREÇÃO: useRef para evitar múltiplas chamadas
  const initializationRef = useRef(false);
  const loadingOperationsRef = useRef(new Set());

  // Cache TTL (5 minutos)
  const CACHE_TTL = 5 * 60 * 1000;

  // Função para verificar se o cache é válido
  const isCacheValid = useCallback((timestamp) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
  }, []);

  // ✅ CORREÇÃO: useCallback com controle de loading para evitar chamadas simultâneas
  const loadProgress = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated || !user) return null;

    const operationKey = 'loadProgress';
    
    // Evitar múltiplas chamadas simultâneas
    if (loadingOperationsRef.current.has(operationKey)) {
      return state.currentProgress;
    }

    if (!forceRefresh && isCacheValid(state.lastProgressUpdate)) {
      return state.currentProgress;
    }

    loadingOperationsRef.current.add(operationKey);
    dispatch({ type: APP_ACTIONS.SET_PROGRESS_LOADING, payload: true });

    try {
      const progress = await progressAPI.getCurrentProgress();
      dispatch({ type: APP_ACTIONS.SET_PROGRESS, payload: progress });
      return progress;
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
      dispatch({ type: APP_ACTIONS.SET_PROGRESS_LOADING, payload: false });
      return null;
    } finally {
      loadingOperationsRef.current.delete(operationKey);
    }
  }, [isAuthenticated, user, state.lastProgressUpdate, isCacheValid]);

  // ✅ CORREÇÃO: useCallback com controle de loading
  const loadAchievements = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated || !user) return null;

    const operationKey = 'loadAchievements';
    
    if (loadingOperationsRef.current.has(operationKey)) {
      return state.achievements;
    }

    if (!forceRefresh && isCacheValid(state.lastAchievementsUpdate)) {
      return state.achievements;
    }

    loadingOperationsRef.current.add(operationKey);
    dispatch({ type: APP_ACTIONS.SET_ACHIEVEMENTS_LOADING, payload: true });

    try {
      const achievements = await achievementsAPI.getUserAchievements();
      dispatch({ type: APP_ACTIONS.SET_ACHIEVEMENTS, payload: achievements });
      return achievements;
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
      dispatch({ type: APP_ACTIONS.SET_ACHIEVEMENTS_LOADING, payload: false });
      return null;
    } finally {
      loadingOperationsRef.current.delete(operationKey);
    }
  }, [isAuthenticated, user, state.lastAchievementsUpdate, isCacheValid]);

  // ✅ CORREÇÃO: useCallback com controle de loading
  const loadStatistics = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated || !user) return null;

    const operationKey = 'loadStatistics';
    
    if (loadingOperationsRef.current.has(operationKey)) {
      return state.statistics;
    }

    if (!forceRefresh && isCacheValid(state.lastStatisticsUpdate)) {
      return state.statistics;
    }

    loadingOperationsRef.current.add(operationKey);
    dispatch({ type: APP_ACTIONS.SET_STATISTICS_LOADING, payload: true });

    try {
      const statistics = await progressAPI.getStatistics();
      dispatch({ type: APP_ACTIONS.SET_STATISTICS, payload: statistics });
      return statistics;
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      dispatch({ type: APP_ACTIONS.SET_STATISTICS_LOADING, payload: false });
      return null;
    } finally {
      loadingOperationsRef.current.delete(operationKey);
    }
  }, [isAuthenticated, user, state.lastStatisticsUpdate, isCacheValid]);

  // ✅ CORREÇÃO: useCallback com controle de loading
  const loadNextSteps = useCallback(async () => {
    if (!isAuthenticated || !user) return [];

    const operationKey = 'loadNextSteps';
    
    if (loadingOperationsRef.current.has(operationKey)) {
      return state.nextSteps;
    }

    loadingOperationsRef.current.add(operationKey);

    try {
      const nextSteps = await progressAPI.getNextSteps();
      dispatch({ type: APP_ACTIONS.SET_NEXT_STEPS, payload: nextSteps.recommendations || [] });
      return nextSteps.recommendations || [];
    } catch (error) {
      console.error('Erro ao carregar próximos passos:', error);
      return [];
    } finally {
      loadingOperationsRef.current.delete(operationKey);
    }
  }, [isAuthenticated, user]);

  // ✅ CORREÇÃO: Função para carregar dados iniciais apenas uma vez
  const initializeAppData = useCallback(async () => {
    if (!isAuthenticated || !user || initializationRef.current || state.isInitialized) {
      return;
    }

    initializationRef.current = true;

    try {
      console.log('🚀 Inicializando dados do app...');
      
      // Carregar dados em paralelo apenas se não existirem no cache
      const promises = [];
      
      if (!isCacheValid(state.lastProgressUpdate)) {
        promises.push(loadProgress());
      }
      
      if (!isCacheValid(state.lastAchievementsUpdate)) {
        promises.push(loadAchievements());
      }
      
      if (!isCacheValid(state.lastStatisticsUpdate)) {
        promises.push(loadStatistics());
      }
      
      promises.push(loadNextSteps());

      await Promise.allSettled(promises);
      
      dispatch({ type: APP_ACTIONS.SET_INITIALIZED, payload: true });
      console.log('✅ Dados do app inicializados');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar dados do app:', error);
    } finally {
      initializationRef.current = false;
    }
  }, [isAuthenticated, user, state.isInitialized, state.lastProgressUpdate, state.lastAchievementsUpdate, state.lastStatisticsUpdate, isCacheValid, loadProgress, loadAchievements, loadStatistics, loadNextSteps]);

  // Verificar novas conquistas
  const checkNewAchievements = useCallback(async () => {
    if (!isAuthenticated || !user) return [];

    try {
      const result = await achievementsAPI.checkNewAchievements();
      
      if (result.new_badges && result.new_badges.length > 0) {
        // Atualizar dados do usuário se houver novas badges
        await loadAchievements(true);
        
        // Atualizar XP do usuário
        if (result.xp_earned) {
          updateUser({
            profile_xp: (user.profile_xp || 0) + result.xp_earned,
          });
        }

        return result.new_badges;
      }

      return [];
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
      return [];
    }
  }, [isAuthenticated, user, loadAchievements, updateUser]);

  // Função para completar uma lição
  const completeLesson = useCallback(async (lessonData) => {
    try {
      const result = await progressAPI.completeLesson(lessonData);
      
      // Atualizar cache local
      await loadProgress(true);
      
      // Verificar novas conquistas
      const newBadges = await checkNewAchievements();
      
      return {
        ...result,
        newBadges,
      };
    } catch (error) {
      console.error('Erro ao completar lição:', error);
      throw error;
    }
  }, [loadProgress, checkNewAchievements]);

  // Função para avançar progresso
  const advanceProgress = useCallback(async (stepType) => {
    try {
      const result = await progressAPI.advanceProgress(stepType);
      
      // Atualizar cache local
      await loadProgress(true);
      
      return result;
    } catch (error) {
      console.error('Erro ao avançar progresso:', error);
      throw error;
    }
  }, [loadProgress]);

  // UI Actions
  const toggleSidebar = useCallback(() => {
    dispatch({ type: APP_ACTIONS.TOGGLE_SIDEBAR });
  }, []);

  const setSidebar = useCallback((open) => {
    dispatch({ type: APP_ACTIONS.SET_SIDEBAR, payload: open });
  }, []);

  const setTheme = useCallback((theme) => {
    localStorage.setItem('theme', theme);
    dispatch({ type: APP_ACTIONS.SET_THEME, payload: theme });
  }, []);

  // ✅ CORREÇÃO: Limpar cache quando o usuário faz logout
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: APP_ACTIONS.CLEAR_CACHE });
      initializationRef.current = false;
      loadingOperationsRef.current.clear();
    }
  }, [isAuthenticated]);

  // ✅ CORREÇÃO: Inicializar dados apenas quando necessário
  useEffect(() => {
    if (isAuthenticated && user && !state.isInitialized) {
      initializeAppData();
    }
  }, [isAuthenticated, user, state.isInitialized, initializeAppData]);

  // ✅ CORREÇÃO: Carregar tema salvo apenas uma vez
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    dispatch({ type: APP_ACTIONS.SET_THEME, payload: savedTheme });
  }, []);

  // Valor do contexto
  const contextValue = {
    // Estado
    ...state,
    
    // Data Loaders
    loadProgress,
    loadAchievements,
    loadStatistics,
    loadNextSteps,
    checkNewAchievements,
    
    // Actions
    completeLesson,
    advanceProgress,
    
    // UI Actions
    toggleSidebar,
    setSidebar,
    setTheme,
    
    // Utilities
    isCacheValid,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export default AppContext;