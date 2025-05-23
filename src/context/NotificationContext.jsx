import React, { createContext, useContext, useReducer } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { NOTIFICATION_TYPES } from '../utils/constants';

// Estado inicial
const initialState = {
  notifications: [],
};

// Actions
const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL_NOTIFICATIONS: 'CLEAR_ALL_NOTIFICATIONS',
};

// Reducer
function notificationReducer(state, action) {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        ),
      };

    case NOTIFICATION_ACTIONS.CLEAR_ALL_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };

    default:
      return state;
  }
}

// Context
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

  // Função para adicionar notificação
  const addNotification = (message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      action: options.action || null,
      persistent: options.persistent || false,
      createdAt: new Date(),
    };

    dispatch({
      type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
      payload: notification,
    });

    // Auto-remover se não for persistente
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  };

  // Função para remover notificação
  const removeNotification = (id) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
      payload: id,
    });
  };

  // Função para limpar todas as notificações
  const clearAllNotifications = () => {
    dispatch({
      type: NOTIFICATION_ACTIONS.CLEAR_ALL_NOTIFICATIONS,
    });
  };

  // Funções de conveniência
  const showSuccess = (message, options = {}) => {
    return addNotification(message, NOTIFICATION_TYPES.SUCCESS, options);
  };

  const showError = (message, options = {}) => {
    return addNotification(message, NOTIFICATION_TYPES.ERROR, {
      ...options,
      duration: options.duration || 7000, // Erros ficam mais tempo
    });
  };

  const showWarning = (message, options = {}) => {
    return addNotification(message, NOTIFICATION_TYPES.WARNING, options);
  };

  const showInfo = (message, options = {}) => {
    return addNotification(message, NOTIFICATION_TYPES.INFO, options);
  };

  // Valor do contexto
  const contextValue = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// Container de notificações
function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

// Item de notificação individual
function NotificationItem({ notification, onRemove }) {
  const { type, message, action } = notification;

  // Configurações por tipo
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
  };

  const config = typeConfig[type] || typeConfig[NOTIFICATION_TYPES.INFO];
  const Icon = config.icon;

  return (
    <div className={`
      ${config.bgColor} ${config.borderColor} ${config.textColor}
      border rounded-lg p-4 shadow-lg animate-slide-down
      transform transition-all duration-300 ease-out
    `}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {message}
          </p>
          
          {action && (
            <div className="mt-2">
              <button
                onClick={action.onClick}
                className={`text-xs font-medium ${config.iconColor} hover:underline`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={onRemove}
            className={`${config.iconColor} hover:${config.textColor} transition-colors`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationContext;