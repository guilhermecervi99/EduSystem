// hooks/useNavigation.js - ADAPTADO PARA MANTER ASSINATURA ATUAL
import { useState, useCallback } from 'react';

export const useNavigation = (initialView = 'dashboard') => {
  const [currentView, setCurrentView] = useState(initialView);
  const [history, setHistory] = useState([initialView]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // NOVO: Estado para dados de navegação
  const [navigationState, setNavigationState] = useState(null);
  
  // NOVO: Histórico de estados para suportar back/forward com dados
  const [stateHistory, setStateHistory] = useState([null]);

  const navigate = useCallback((viewOrOptions, options = {}) => {
    // ADAPTAÇÃO: Suportar ambos os formatos
    // Formato 1: navigate('view')
    // Formato 2: navigate('view', { state: data })
    // Formato 3: navigate('view', data) - NOVO!
    
    let view, state, finalOptions;
    
    if (typeof viewOrOptions === 'string') {
      // Formatos 1 e 2/3
      view = viewOrOptions;
      
      // Se options é um objeto sem as propriedades especiais (force, fromHistory, scrollToTop)
      // então é o estado de navegação
      if (options && typeof options === 'object' && 
          !('force' in options) && 
          !('fromHistory' in options) && 
          !('scrollToTop' in options)) {
        // É o estado de navegação direto
        state = options;
        finalOptions = {};
      } else {
        // É um objeto de opções com possível estado dentro
        state = options?.state || options;
        finalOptions = options || {};
      }
    } else if (typeof viewOrOptions === 'object' && viewOrOptions.view) {
      // Formato objeto: navigate({ view: 'dashboard', state: data })
      view = viewOrOptions.view;
      state = viewOrOptions.state;
      finalOptions = viewOrOptions.options || {};
    } else {
      console.error('Formato de navegação inválido:', viewOrOptions);
      return;
    }
    
    console.log(`🧭 Navegando de ${currentView} para ${view}`);
    console.log(`📦 Navigation state:`, state);
    
    // Se for a mesma view, não fazer nada
    if (view === currentView && !finalOptions.force) {
      return;
    }
  
    // Adicionar ao histórico se não for navegação via back/forward
    if (!finalOptions.fromHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(view);
      setHistory(newHistory);
      
      // NOVO: Adicionar estado ao histórico de estados
      const newStateHistory = stateHistory.slice(0, historyIndex + 1);
      newStateHistory.push(state || null);
      setStateHistory(newStateHistory);
      
      setHistoryIndex(newHistory.length - 1);
    }

    setCurrentView(view);
    setNavigationState(state || null); // NOVO: Atualizar estado de navegação
    
    // Scroll para o topo
    if (finalOptions.scrollToTop !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentView, history, historyIndex, stateHistory]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousView = history[newIndex];
      const previousState = stateHistory[newIndex]; // NOVO: Recuperar estado anterior
      
      console.log(`🔙 Voltando para ${previousView}`);
      console.log(`📦 Estado anterior:`, previousState);
      
      setHistoryIndex(newIndex);
      setCurrentView(previousView);
      setNavigationState(previousState); // NOVO: Restaurar estado
      
      return previousView;
    }
    return null;
  }, [history, historyIndex, stateHistory]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextView = history[newIndex];
      const nextState = stateHistory[newIndex]; // NOVO: Recuperar próximo estado
      
      console.log(`🔜 Avançando para ${nextView}`);
      console.log(`📦 Próximo estado:`, nextState);
      
      setHistoryIndex(newIndex);
      setCurrentView(nextView);
      setNavigationState(nextState); // NOVO: Restaurar estado
      
      return nextView;
    }
    return null;
  }, [history, historyIndex, stateHistory]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  return {
    currentView,
    navigate,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    history,
    historyIndex,
    navigationState, // NOVO: Expor estado de navegação
    setNavigationState // NOVO: Permitir atualização manual se necessário
  };
};