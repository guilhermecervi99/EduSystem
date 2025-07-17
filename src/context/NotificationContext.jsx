import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Award } from 'lucide-react';
import { NOTIFICATION_TYPES } from '../utils/constants';

// Estado inicial mais completo
const initialState = {
  toasts: [], // Notificações temporárias (pop-ups)
  notifications: [], // Notificações persistentes (para o centro de notificações)
  unreadCount: 0,
};

// Actions expandidas
const NOTIFICATION_ACTIONS = {
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  CLEAR_ALL_TOASTS: 'CLEAR_ALL_TOASTS',
  CLEAR_ALL_NOTIFICATIONS: 'CLEAR_ALL_NOTIFICATIONS',
};

// Reducer para gerenciar o estado complexo
function notificationReducer(state, action) {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };

    case NOTIFICATION_ACTIONS.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
        unreadCount: state.unreadCount + 1,
      };

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      const notificationToRemove = state.notifications.find(n => n.id === action.payload);
      const wasUnread = notificationToRemove && !notificationToRemove.is_read;
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };

    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.is_read).length,
      };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      };

    case NOTIFICATION_ACTIONS.CLEAR_ALL_TOASTS:
      return {
        ...state,
        toasts: [],
      };

    case NOTIFICATION_ACTIONS.CLEAR_ALL_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    default:
      return state;
  }
}

// Contexto
const NotificationContext = createContext();

// Hook customizado
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

// Provider
export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Simula a busca de notificações persistentes do backend ao iniciar
  useEffect(() => {
    // Em uma aplicação real, você faria uma chamada à API aqui
    const fetchNotifications = async () => {
      try {
        // const response = await fetch('/api/notifications');
        // const data = await response.json();
        // dispatch({ type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, payload: data });
        
        // Mock de notificações para desenvolvimento
        const mockNotifications = [
          { 
            id: 'notif-1', 
            message: "Você desbloqueou a conquista 'Iniciante Curioso'!", 
            type: "award", 
            is_read: false, 
            created_at: new Date(Date.now() - 3600000).toISOString(), 
            link: "/achievements" 
          },
          { 
            id: 'notif-2', 
            message: "Seu relatório semanal de progresso está pronto.", 
            type: "info", 
            is_read: true, 
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(), 
            link: "/progress-details" 
          },
          {
            id: 'notif-3',
            message: "Nova atualização no seu projeto 'Aplicativo de Tarefas'",
            type: "info",
            is_read: false,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            link: "/projects"
          }
        ];
        
        dispatch({ type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, payload: mockNotifications });
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Função para adicionar um toast (pop-up)
  const addToast = useCallback((message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      action: options.action || null,
    };

    dispatch({ type: NOTIFICATION_ACTIONS.ADD_TOAST, payload: toast });

    if (toast.duration > 0 && !options.persistent) {
      setTimeout(() => {
        dispatch({ type: NOTIFICATION_ACTIONS.REMOVE_TOAST, payload: id });
      }, toast.duration);
    }
    
    return id;
  }, []);

  // Função para remover um toast manualmente
  const removeToast = useCallback((id) => {
    dispatch({ type: NOTIFICATION_ACTIONS.REMOVE_TOAST, payload: id });
  }, []);

  // Função para adicionar uma notificação persistente
  const addNotification = useCallback((notification) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotification = {
      id,
      ...notification,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION, payload: newNotification });

    // Em uma aplicação real, você sincronizaria com o backend
    // await notificationsAPI.create(newNotification);

    return id;
  }, []);

  // Função para remover uma notificação
  const removeNotification = useCallback((id) => {
    dispatch({ type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION, payload: id });
    
    // Em uma aplicação real, você sincronizaria com o backend
    // await notificationsAPI.delete(id);
  }, []);

  // Função para marcar uma notificação como lida
  const markAsRead = useCallback((id) => {
    dispatch({ type: NOTIFICATION_ACTIONS.MARK_AS_READ, payload: id });
    
    // Em uma aplicação real, você sincronizaria com o backend
    // await notificationsAPI.markAsRead(id);
  }, []);

  // Função para marcar todas as notificações como lidas
  const markAllAsRead = useCallback(() => {
    dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });
    
    // Em uma aplicação real, você sincronizaria com o backend
    // await notificationsAPI.markAllAsRead();
  }, []);

  // Função para limpar todos os toasts
  const clearAllToasts = useCallback(() => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_ALL_TOASTS });
  }, []);

  // Função para limpar todas as notificações
  const clearAllNotifications = useCallback(() => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_ALL_NOTIFICATIONS });
    
    // Em uma aplicação real, você sincronizaria com o backend
    // await notificationsAPI.clearAll();
  }, []);

  // Funções de conveniência para toasts
  const showSuccess = useCallback((message, options = {}) => {
    return addToast(message, NOTIFICATION_TYPES.SUCCESS, options);
  }, [addToast]);

  const showError = useCallback((message, options = {}) => {
    return addToast(message, NOTIFICATION_TYPES.ERROR, { 
      duration: 7000, 
      ...options 
    });
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    return addToast(message, NOTIFICATION_TYPES.WARNING, options);
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    return addToast(message, NOTIFICATION_TYPES.INFO, options);
  }, [addToast]);

  const showAward = useCallback((message, options = {}) => {
    return addToast(message, 'award', { 
      duration: 7000, 
      ...options 
    });
  }, [addToast]);

  // Valor do contexto exposto para os componentes filhos
  const contextValue = {
    // Estado
    toasts: state.toasts,
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    
    // Funções para toasts
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAward,
    clearAllToasts,
    
    // Funções para notificações
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={state.toasts} onRemove={removeToast} />
    </NotificationContext.Provider>
  );
}

// Container para os Toasts (pop-ups)
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Componente de um item de Toast
function ToastItem({ toast, onRemove }) {
  const { id, type, message, action } = toast;

  // Mapeamento de tipo para estilo e ícone
  const typeConfig = {
    [NOTIFICATION_TYPES.SUCCESS]: { 
      icon: CheckCircle, 
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      textColor: 'text-success-800',
      iconColor: 'text-success-600',
    },
    [NOTIFICATION_TYPES.ERROR]: { 
      icon: AlertCircle, 
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
      textColor: 'text-danger-800',
      iconColor: 'text-danger-600',
    },
    [NOTIFICATION_TYPES.WARNING]: { 
      icon: AlertTriangle, 
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      textColor: 'text-warning-800',
      iconColor: 'text-warning-600',
    },
    [NOTIFICATION_TYPES.INFO]: { 
      icon: Info, 
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-800',
      iconColor: 'text-primary-600',
    },
    'award': { 
      icon: Award, 
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      textColor: 'text-warning-800',
      iconColor: 'text-warning-600',
    }
  };

  const config = typeConfig[type] || typeConfig[NOTIFICATION_TYPES.INFO];
  const Icon = config.icon;

  return (
    <div className={`
      ${config.bgColor} ${config.borderColor} ${config.textColor}
      border rounded-lg p-4 shadow-lg animate-slide-down
      transform transition-all duration-300 ease-out
      pointer-events-auto
    `}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
          
          {action && (
            <div className="mt-2">
              <button
                onClick={action.onClick}
                className={`text-xs font-medium ${config.iconColor} hover:underline focus:outline-none`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={() => onRemove(id)}
            className={`${config.iconColor} hover:${config.textColor} transition-colors focus:outline-none`}
            aria-label="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationContext;