// AppContext.jsx - VERSÃO CORRIGIDA PARA EVITAR LOOPS
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
  
  // ✅ CORREÇÃO CRÍTICA: useRef para controlar operações únicas
  const initializationRef = useRef(false);
  const activeOperationsRef = useRef(new Set());

  // Cache TTL (10 minutos em vez de 5)
  const CACHE_TTL = 10 * 60 * 1000;

  // Função para verificar se o cache é válido
  const isCacheValid = useCallback((timestamp) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
  }, []);

  // ✅ CORREÇÃO: useCallback com controle rigoroso de operações simultâneas
  const loadProgress = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated || !user) return null;

    const operationKey = 'loadProgress';
    
    // Evitar múltiplas chamadas simultâneas
    if (activeOperationsRef.current.has(operationKey)) {
      console.log('⏭️ loadProgress já está em execução, pulando...');
      return state.currentProgress;
    }

    // Verificar cache válido
    if (!forceRefresh && isCacheValid(state.lastProgressUpdate) && state.currentProgress) {
      console.log('📋 Cache de progresso ainda válido');
      return state.currentProgress;
    }

    activeOperationsRef.current.add(operationKey);
    dispatch({ type: APP_ACTIONS.SET_PROGRESS_LOADING, payload: true });

    try {
      console.log('📊 Carregando progresso...');
      const progress = await progressAPI.getCurrentProgress();
      dispatch({ type: APP_ACTIONS.SET_PROGRESS, payload: progress });
      console.log('✅ Progresso carregado:', progress);
      return progress;
    } catch (error) {
      console.error('❌ Erro ao carregar progresso:', error);
      dispatch({ type: APP_ACTIONS.SET_PROGRESS_LOADING, payload: false });
      return null;
    } finally {
      activeOperationsRef.current.delete(operationKey);
    }
  }, [isAuthenticated, user, state.lastProgressUpdate, state.currentProgress, isCacheValid]);

  // ✅ CORREÇÃO: useCallback com controle de operações simultâneas
  const loadAchievements = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated || !user) return null;

    const operationKey = 'loadAchievements';
    
    if (activeOperationsRef.current.has(operationKey)) {
      console.log('⏭️ loadAchievements já está em execução, pulando...');
      return state.achievements;
    }

    if (!forceRefresh && isCacheValid(state.lastAchievementsUpdate) && state.achievements) {
      console.log('🏆 Cache de conquistas ainda válido');
      return state.achievements;
    }

    activeOperationsRef.current.add(operationKey);
    dispatch({ type: APP_ACTIONS.SET_ACHIEVEMENTS_LOADING, payload: true });

    try {
      console.log('🏆 Carregando conquistas...');
      const achievements = await achievementsAPI.getUserAchievements();
      dispatch({ type: APP_ACTIONS.SET_ACHIEVEMENTS, payload: achievements });
      console.log('✅ Conquistas carregadas:', achievements);
      return achievements;
    } catch (error) {
      console.error('❌ Erro ao carregar conquistas:', error);
      dispatch({ type: APP_ACTIONS.SET_ACHIEVEMENTS_LOADING, payload: false });
      return null;
    } finally {
      activeOperationsRef.current.delete(operationKey);
    }
  }, [isAuthenticated, user, state.lastAchievementsUpdate, state.achievements, isCacheValid]);

  // ✅ CORREÇÃO: useCallback com controle de operações simultâneas
  const loadStatistics = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated || !user) return null;

    const operationKey = 'loadStatistics';
    
    if (activeOperationsRef.current.has(operationKey)) {
      console.log('⏭️ loadStatistics já está em execução, pulando...');
      return state.statistics;
    }

    if (!forceRefresh && isCacheValid(state.lastStatisticsUpdate) && state.statistics) {
      console.log('📈 Cache de estatísticas ainda válido');
      return state.statistics;
    }

    activeOperationsRef.current.add(operationKey);
    dispatch({ type: APP_ACTIONS.SET_STATISTICS_LOADING, payload: true });

    try {
      console.log('📈 Carregando estatísticas...');
      const statistics = await progressAPI.getStatistics();
      dispatch({ type: APP_ACTIONS.SET_STATISTICS, payload: statistics });
      console.log('✅ Estatísticas carregadas:', statistics);
      return statistics;
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      dispatch({ type: APP_ACTIONS.SET_STATISTICS_LOADING, payload: false });
      return null;
    } finally {
      activeOperationsRef.current.delete(operationKey);
    }
  }, [isAuthenticated, user, state.lastStatisticsUpdate, state.statistics, isCacheValid]);

  // ✅ CORREÇÃO: useCallback com controle de operações simultâneas
  const loadNextSteps = useCallback(async () => {
    if (!isAuthenticated || !user) return [];

    const operationKey = 'loadNextSteps';
    
    if (activeOperationsRef.current.has(operationKey)) {
      console.log('⏭️ loadNextSteps já está em execução, pulando...');
      return state.nextSteps;
    }

    activeOperationsRef.current.add(operationKey);

    try {
      console.log('📋 Carregando próximos passos...');
      const nextSteps = await progressAPI.getNextSteps();
      const steps = nextSteps.recommendations || [];
      dispatch({ type: APP_ACTIONS.SET_NEXT_STEPS, payload: steps });
      console.log('✅ Próximos passos carregados:', steps);
      return steps;
    } catch (error) {
      console.error('❌ Erro ao carregar próximos passos:', error);
      return [];
    } finally {
      activeOperationsRef.current.delete(operationKey);
    }
  }, [isAuthenticated, user, state.nextSteps]);

  // ✅ CORREÇÃO: Função para carregar dados iniciais COM controle rigoroso
  const initializeAppData = useCallback(async () => {
    // Múltiplas verificações para evitar execução duplicada
    if (!isAuthenticated || !user || initializationRef.current || state.isInitialized) {
      return;
    }

    // Verificar se já temos dados válidos em cache
    const hasValidCache = (
      isCacheValid(state.lastProgressUpdate) && state.currentProgress &&
      isCacheValid(state.lastAchievementsUpdate) && state.achievements &&
      isCacheValid(state.lastStatisticsUpdate) && state.statistics
    );

    if (hasValidCache) {
      console.log('📋 Todos os dados já estão em cache válido');
      dispatch({ type: APP_ACTIONS.SET_INITIALIZED, payload: true });
      return;
    }

    initializationRef.current = true;

    try {
      console.log('🚀 Inicializando dados do app...');
      
      // Carregar dados em paralelo COM Promise.allSettled para não falhar tudo se um falhar
      const promises = [];
      
      if (!isCacheValid(state.lastProgressUpdate) || !state.currentProgress) {
        promises.push(loadProgress(false));
      }
      
      if (!isCacheValid(state.lastAchievementsUpdate) || !state.achievements) {
        promises.push(loadAchievements(false));
      }
      
      if (!isCacheValid(state.lastStatisticsUpdate) || !state.statistics) {
        promises.push(loadStatistics(false));
      }
      
      promises.push(loadNextSteps());

      const results = await Promise.allSettled(promises);
      
      // Log dos resultados
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ Promise ${index} rejeitada:`, result.reason);
        }
      });
      
      dispatch({ type: APP_ACTIONS.SET_INITIALIZED, payload: true });
      console.log('✅ Dados do app inicializados com sucesso');
      
    } catch (error) {
      console.error('❌ Erro crítico ao inicializar dados do app:', error);
    } finally {
      initializationRef.current = false;
    }
  }, [
    isAuthenticated, 
    user, 
    state.isInitialized, 
    state.lastProgressUpdate, 
    state.currentProgress,
    state.lastAchievementsUpdate, 
    state.achievements,
    state.lastStatisticsUpdate, 
    state.statistics,
    isCacheValid, 
    loadProgress, 
    loadAchievements, 
    loadStatistics, 
    loadNextSteps
  ]);

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
      activeOperationsRef.current.clear();
    }
  }, [isAuthenticated]);

  // ✅ CORREÇÃO: Inicializar dados APENAS uma vez quando autenticado
  useEffect(() => {
    if (isAuthenticated && user && !state.isInitialized && !initializationRef.current) {
      console.log('🎯 Condições atendidas para inicialização');
      initializeAppData();
    }
  }, [isAuthenticated, user, state.isInitialized, initializeAppData]);

  // ✅ CORREÇÃO: Carregar tema salvo apenas uma vez
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (state.theme !== savedTheme) {
      dispatch({ type: APP_ACTIONS.SET_THEME, payload: savedTheme });
    }
  }, []); // Array vazio - executa apenas uma vez

  // ✅ DEBUG: Monitorar operações ativas
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeOperationsRef.current.size > 0) {
        console.log('🔄 Operações ativas:', Array.from(activeOperationsRef.current));
      }
    }, 10000);
    
    return () => clearInterval(interval);
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