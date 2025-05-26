import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import api, { authAPI } from '../services/api';
import { STORAGE_KEYS } from '../utils/constants';

// Estado inicial
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Actions
const AUTH_ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
};

// Reducer
function authReducer(state, action) {
  console.log('🔄 AuthReducer:', action.type, action.payload);
  
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Context
const AuthContext = createContext();

// Hook customizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Provider
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Flag para evitar múltiplas inicializações
  const hasInitialized = useRef(false);
  const renderCount = useRef(0);

  renderCount.current++;
  console.log(`🔍 AuthProvider render #${renderCount.current} - State:`, {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    hasUser: !!state.user
  });

  // Função para salvar dados no localStorage
  const saveToStorage = useCallback((token, user) => {
    console.log('💾 Saving to storage:', { token: !!token, user: !!user });
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  }, []);

  // Função para remover dados do localStorage
  const clearStorage = useCallback(() => {
    console.log('🗑️ Clearing storage');
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  // ✅ CORREÇÃO PRINCIPAL: Inicialização simplificada
  useEffect(() => {
    if (hasInitialized.current) {
      console.log('⏭️ Auth already initialized, skipping...');
      return;
    }

    hasInitialized.current = true;
    console.log('🎬 AuthProvider useEffect triggered');

    const initializeAuth = async () => {
      console.log('🚀 InitializeAuth started');
      
      try {
        const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

        console.log('🔍 Checking localStorage:', { 
          hasToken: !!savedToken, 
          hasUser: !!savedUser 
        });

        if (savedToken && savedUser) {
          console.log('✅ Found saved credentials, validating...');
          
          try {
            // Verificar se o token ainda é válido
            const currentUser = await authAPI.getCurrentUser();
            
            console.log('✅ Token válido, usuário logado:', currentUser.email);
            
            dispatch({
              type: AUTH_ACTIONS.AUTH_SUCCESS,
              payload: {
                token: savedToken,
                user: currentUser,
              },
            });
          } catch (error) {
            console.log('❌ Token inválido:', error.message);
            // Token inválido, limpar storage
            clearStorage();
            dispatch({
              type: AUTH_ACTIONS.SET_LOADING,
              payload: false,
            });
          }
        } else {
          console.log('📭 No saved credentials found');
          dispatch({
            type: AUTH_ACTIONS.SET_LOADING,
            payload: false,
          });
        }
      } catch (error) {
        console.error('💥 Error in initializeAuth:', error);
        dispatch({
          type: AUTH_ACTIONS.SET_LOADING,
          payload: false,
        });
      }
      
      console.log('🏁 InitializeAuth completed');
    };

    initializeAuth();
  }, []); // Array vazio - executa apenas uma vez

  // ✅ FUNÇÃO LOGIN CORRIGIDA - substituir no AuthContext.jsx

  const login = useCallback(async (credentials) => {
    console.log('🔑 Login attempt:', credentials.username);
    dispatch({ type: AUTH_ACTIONS.AUTH_START });

    try {
      const loginResponse = await authAPI.login(credentials);
      const { access_token, user_id } = loginResponse;

      console.log('✅ Login successful, token received:', !!access_token);

      // ✅ CORREÇÃO: Salvar token IMEDIATAMENTE antes de buscar dados
      console.log('💾 Saving token first...');
      if (access_token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
        console.log('✅ Token saved to localStorage');
      }

      console.log('👤 Now fetching user data...');
      // ✅ AGORA buscar dados do usuário (com token já salvo)
      const userData = await authAPI.getCurrentUser();
      console.log('✅ User data received:', userData.email);

      // ✅ Salvar dados do usuário também
      saveToStorage(access_token, userData);

      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: {
          token: access_token,
          user: userData,
        },
      });

      console.log('🎉 User logged in successfully:', userData.email);
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: { error: error.message },
      });

      return { success: false, error: error.message };
    }
  }, [saveToStorage]);

// Correção completa da função register no AuthContext.jsx
// Substitua toda a função register por esta:

const register = useCallback(async (userData) => {
  console.log('📝 Register attempt:', userData.email);
  dispatch({ type: AUTH_ACTIONS.AUTH_START });

  try {
    // ✅ Usar os dados fornecidos pelo usuário
    const registerData = {
      email: userData.email,
      password: userData.password,
      age: userData.age,
      learning_style: userData.learning_style
    };

    console.log('📤 Enviando dados de registro:', registerData);

    const registerResponse = await authAPI.register(registerData);
    const { access_token, user_id } = registerResponse;

    console.log('✅ Registration successful, token received');

    // ✅ CORREÇÃO CRÍTICA: Salvar token ANTES de fazer qualquer outra chamada
    if (access_token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
      // IMPORTANTE: Também configurar o token no axios imediatamente
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      console.log('✅ Token saved and configured in axios');
    }

    // Pequeno delay para garantir que o token foi processado
    await new Promise(resolve => setTimeout(resolve, 100));

    // Agora sim buscar dados do usuário (com token configurado)
    console.log('👤 Fetching user data with token...');
    const userDetails = await authAPI.getCurrentUser();
    console.log('✅ User data received:', userDetails.email);

    // Salvar dados do usuário
    saveToStorage(access_token, userDetails);

    // Dispatch success
    dispatch({
      type: AUTH_ACTIONS.AUTH_SUCCESS,
      payload: {
        token: access_token,
        user: userDetails,
      },
    });

    console.log('🎉 User registered successfully:', userDetails.email);
    
    // ✅ IMPORTANTE: Retornar com flag indicando que precisa ir pro mapeamento
    return { 
      success: true, 
      user: userDetails,
      needsMapping: !userDetails.current_track // Se não tem trilha, precisa mapear
    };
    
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    
    // Limpar qualquer token inválido
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    delete api.defaults.headers.common['Authorization'];
    
    dispatch({
      type: AUTH_ACTIONS.AUTH_FAILURE,
      payload: { error: error.message },
    });

    return { success: false, error: error.message };
  }
}, [saveToStorage]);


  // Função de logout
  const logout = useCallback(async () => {
    console.log('🚪 Logout attempt');
    try {
      await authAPI.logout();
      console.log('✅ Logout successful');
    } catch (error) {
      // Ignorar erros de logout, apenas limpar localmente
      console.warn('⚠️ Erro ao fazer logout no servidor:', error);
    } finally {
      clearStorage();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      console.log('🧹 Local logout completed');
    }
  }, [clearStorage]);

  // Função para atualizar dados do usuário
  const updateUser = useCallback((userData) => {
    console.log('🔄 Updating user:', userData);
    const updatedUser = { ...state.user, ...userData };
    
    // Atualizar no localStorage também
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: { user: userData },
    });
  }, [state.user]);

  // Função para refresh do token
  const refreshToken = useCallback(async () => {
    console.log('🔄 Refreshing token...');
    try {
      const response = await authAPI.refreshToken();
      const { access_token } = response;

      localStorage.setItem(STORAGE_KEYS.TOKEN, access_token);

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { user: state.user }, // Manter dados do usuário
      });

      console.log('✅ Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // Se não conseguir renovar, fazer logout
      logout();
      return false;
    }
  }, [state.user, logout]);

  // Função para limpar erros
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Função para verificar se o usuário tem permissão
  const hasPermission = useCallback((permission) => {
    if (!state.user) return false;
    return true;
  }, [state.user]);

  // ✅ CORREÇÃO: Função para verificar se completou o mapeamento
  const hasCompletedMapping = useCallback(() => {
    // Verificar se o usuário tem current_track definido
    const result = !!(state.user?.current_track);
    console.log('🗺️ hasCompletedMapping:', result, 'current_track:', state.user?.current_track);
    return result;
  }, [state.user?.current_track]);

  // Valor do contexto
  const contextValue = {
    // Estado
    ...state,
    
    // Ações
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    clearError,
    
    // Utilitários
    hasPermission,
    hasCompletedMapping,
  };

  console.log('📤 AuthProvider context value:', {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    hasUser: !!state.user,
    userEmail: state.user?.email,
    hasCompletedMapping: hasCompletedMapping()
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;