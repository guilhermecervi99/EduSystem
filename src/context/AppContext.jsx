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
  
  // Navigation state
  isNavigating: false,
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
  
  // Navigation Actions
  SET_NAVIGATING: 'SET_NAVIGATING',
  FORCE_UPDATE_PROGRESS: 'FORCE_UPDATE_PROGRESS',
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
      // IMPORTANTE: Validar campos essenciais
      if (!action.payload) {
        console.warn('⚠️ Tentativa de setar progresso vazio bloqueada');
        return state;
      }
      
      const validProgress = action.payload && 
        action.payload.area && 
        action.payload.subarea && 
        action.payload.level !== undefined;
        
      if (!validProgress) {
        console.warn('⚠️ Progresso inválido:', action.payload);
        return state;
      }
      
      // Salvar no sessionStorage como backup
      sessionStorage.setItem('currentProgress', JSON.stringify(action.payload));
      
      return {
        ...state,
        currentProgress: action.payload,
        progressLoading: false,
        lastProgressUpdate: Date.now(),
      };
      
    case APP_ACTIONS.FORCE_UPDATE_PROGRESS:
      // Força atualização do progresso sem validação
      if (!action.payload) return state;
      
      sessionStorage.setItem('currentProgress', JSON.stringify(action.payload));
      
      return {
        ...state,
        currentProgress: { ...action.payload },
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
      
    case APP_ACTIONS.SET_NAVIGATING:
      return {
        ...state,
        isNavigating: action.payload,
      };

    case APP_ACTIONS.UPDATE_CACHE_TIMESTAMP:
      return {
        ...state,
        [`last${action.payload.type}Update`]: Date.now(),
      };

    case APP_ACTIONS.CLEAR_CACHE:
      sessionStorage.removeItem('currentProgress');
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
        isNavigating: false,
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
  
  // Refs para controle
  const initializationRef = useRef(false);
  const activeOperationsRef = useRef(new Set());
  const lastNavigationRef = useRef(null);

  // Cache TTL (10 minutos)
  const CACHE_TTL = 10 * 60 * 1000;

  // Função para verificar se o cache é válido
  const isCacheValid = useCallback((timestamp) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
  }, []);

  // Função para forçar atualização do progresso (usada após navegação)
  const forceUpdateProgress = useCallback((newProgress) => {
    console.log('🔄 Forçando atualização do progresso:', newProgress);
    dispatch({ type: APP_ACTIONS.FORCE_UPDATE_PROGRESS, payload: newProgress });
  }, []);

  // Função para definir estado de navegação
  const setNavigating = useCallback((isNavigating) => {
    dispatch({ type: APP_ACTIONS.SET_NAVIGATING, payload: isNavigating });
  }, []);

  const loadProgress = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated || !user) return null;

    const operationKey = 'loadProgress';
    
    // Se está navegando, esperar
    if (state.isNavigating) {
      console.log('🚫 Navegação em andamento, aguardando...');
      return state.currentProgress;
    }
    
    if (activeOperationsRef.current.has(operationKey)) {
      console.log('⏭️ loadProgress já está em execução, pulando...');
      return state.currentProgress;
    }

    // Verificar cache apenas se não for forceRefresh
    if (!forceRefresh && isCacheValid(state.lastProgressUpdate) && state.currentProgress) {
      console.log('📋 Cache de progresso ainda válido');
      return state.currentProgress;
    }

    activeOperationsRef.current.add(operationKey);
    dispatch({ type: APP_ACTIONS.SET_PROGRESS_LOADING, payload: true });

    try {
      console.log('📊 Carregando progresso do servidor...');
      
      const progress = await progressAPI.getCurrentProgress();
      
      console.log('✅ Progresso recebido da API:', progress);
      
      // Validar se o progresso retornado é válido
      if (progress && progress.area && progress.subarea && progress.level !== undefined) {
        dispatch({ type: APP_ACTIONS.SET_PROGRESS, payload: progress });
        
        // Verificar se houve mudança significativa
        if (state.currentProgress) {
          const changed = (
            state.currentProgress.area !== progress.area ||
            state.currentProgress.subarea !== progress.subarea ||
            state.currentProgress.level !== progress.level ||
            state.currentProgress.module_index !== progress.module_index ||
            state.currentProgress.lesson_index !== progress.lesson_index
          );
          
          if (changed) {
            console.log('📍 Progresso mudou significativamente');
          }
        }
        
        return progress;
      } else {
        console.warn('⚠️ Progresso inválido recebido da API:', progress);
        
        // Tentar recuperar do sessionStorage
        const savedProgress = sessionStorage.getItem('currentProgress');
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          console.log('📦 Usando progresso do sessionStorage:', parsed);
          dispatch({ type: APP_ACTIONS.SET_PROGRESS, payload: parsed });
          return parsed;
        }
        
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar progresso:', error);
      dispatch({ type: APP_ACTIONS.SET_PROGRESS_LOADING, payload: false });
      
      // Em caso de erro, tentar usar cache local
      const savedProgress = sessionStorage.getItem('currentProgress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        return parsed;
      }
      
      return null;
    } finally {
      activeOperationsRef.current.delete(operationKey);
    }
  }, [isAuthenticated, user, state.lastProgressUpdate, state.currentProgress, state.isNavigating, isCacheValid]);

  // Função específica para navegação
  const navigateAndUpdateProgress = useCallback(async (navigationData) => {
    console.log('🧭 navigateAndUpdateProgress:', navigationData);
    
    // Prevenir navegação duplicada
    const navKey = JSON.stringify(navigationData);
    if (lastNavigationRef.current === navKey) {
      console.log('🚫 Navegação duplicada detectada, ignorando');
      return state.currentProgress;
    }
    
    lastNavigationRef.current = navKey;
    setNavigating(true);
    
    try {
      // Fazer a navegação
      await progressAPI.navigateTo(navigationData);
      
      // Aguardar um pouco para o servidor processar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Forçar atualização do progresso
      const newProgress = await loadProgress(true);
      
      // Se o progresso não foi atualizado corretamente, forçar manualmente
      if (newProgress && (
        newProgress.level !== navigationData.level ||
        newProgress.module_index !== navigationData.module_index ||
        newProgress.lesson_index !== navigationData.lesson_index
      )) {
        console.log('⚠️ Progresso não atualizado corretamente, forçando...');
        const forcedProgress = {
          ...newProgress,
          ...navigationData
        };
        forceUpdateProgress(forcedProgress);
        return forcedProgress;
      }
      
      return newProgress;
    } catch (error) {
      console.error('❌ Erro na navegação:', error);
      throw error;
    } finally {
      setNavigating(false);
      setTimeout(() => {
        lastNavigationRef.current = null;
      }, 1000);
    }
  }, [state.currentProgress, loadProgress, setNavigating, forceUpdateProgress]);

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
      const statistics = await progressAPI.getStatistics(user.id); 
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

  const initializeAppData = useCallback(async () => {
    if (!isAuthenticated || !user || initializationRef.current || state.isInitialized) {
      return;
    }

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

  const checkNewAchievements = useCallback(async () => {
    if (!isAuthenticated || !user) return [];

    try {
      const result = await achievementsAPI.checkNewAchievements();
      
      if (result.new_badges && result.new_badges.length > 0) {
        await loadAchievements(true);
        
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

  const completeLesson = useCallback(async (lessonData) => {
    try {
      const result = await progressAPI.completeLesson(lessonData);
      
      await loadProgress(true);
      
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

  const advanceProgress = useCallback(async (stepType) => {
    try {
      const result = await progressAPI.advanceProgress(stepType);
      
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

  // Limpar cache quando o usuário faz logout
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: APP_ACTIONS.CLEAR_CACHE });
      initializationRef.current = false;
      activeOperationsRef.current.clear();
    }
  }, [isAuthenticated]);

  // Log de mudanças no currentProgress
  useEffect(() => {
    console.log('🔍 AppContext - currentProgress mudou:', state.currentProgress);
  }, [state.currentProgress]);

  // Inicializar dados quando autenticado
  useEffect(() => {
    if (isAuthenticated && user && !state.isInitialized && !initializationRef.current) {
      console.log('🎯 Condições atendidas para inicialização');
      initializeAppData();
    }
  }, [isAuthenticated, user, state.isInitialized, initializeAppData]);

  // Carregar tema salvo
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (state.theme !== savedTheme) {
      dispatch({ type: APP_ACTIONS.SET_THEME, payload: savedTheme });
    }
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
    navigateAndUpdateProgress,
    forceUpdateProgress,
    setNavigating,
    
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