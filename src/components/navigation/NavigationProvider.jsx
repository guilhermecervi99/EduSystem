// components/navigation/NavigationProvider.jsx
import React, { createContext, useContext } from 'react';
import { useNavigation } from '../../hooks/useNavigation';

const NavigationContext = createContext();

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children, initialView = 'dashboard' }) => {
  const navigation = useNavigation(initialView);

  return (
    <NavigationContext.Provider value={navigation}>
      {children}
    </NavigationContext.Provider>
  );
};