// hooks/useNavigation.js
import { useState, useCallback } from 'react';

export const useNavigation = (initialView = 'dashboard') => {
  const [currentView, setCurrentView] = useState(initialView);
  const [history, setHistory] = useState([initialView]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigate = useCallback((view, options = {}) => {
    console.log(`🧭 Navegando de ${currentView} para ${view}`);
    
    // Se for a mesma view, não fazer nada
    if (view === currentView && !options.force) {
      return;
    }

    // Adicionar ao histórico se não for navegação via back/forward
    if (!options.fromHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(view);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }

    setCurrentView(view);
    
    // Scroll para o topo
    if (options.scrollToTop !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentView, history, historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousView = history[newIndex];
      
      console.log(`🔙 Voltando para ${previousView}`);
      
      setHistoryIndex(newIndex);
      setCurrentView(previousView);
      
      return previousView;
    }
    return null;
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextView = history[newIndex];
      
      console.log(`🔜 Avançando para ${nextView}`);
      
      setHistoryIndex(newIndex);
      setCurrentView(nextView);
      
      return nextView;
    }
    return null;
  }, [history, historyIndex]);

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
    historyIndex
  };
};