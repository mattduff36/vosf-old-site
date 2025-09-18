'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const NavigationHistoryContext = createContext();

export function NavigationHistoryProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const pushToHistory = useCallback((path, title) => {
    setHistory(prev => {
      // Remove any forward history when pushing new path
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Don't add duplicate consecutive entries
      if (newHistory.length > 0 && newHistory[newHistory.length - 1].path === path) {
        return newHistory;
      }
      
      const newEntry = { path, title, timestamp: Date.now() };
      const updatedHistory = [...newHistory, newEntry];
      
      // Limit history to 50 entries
      if (updatedHistory.length > 50) {
        updatedHistory.shift();
        setCurrentIndex(prev => Math.max(0, prev));
        return updatedHistory;
      }
      
      setCurrentIndex(updatedHistory.length - 1);
      return updatedHistory;
    });
  }, [currentIndex]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  const getCurrentEntry = () => {
    return currentIndex >= 0 ? history[currentIndex] : null;
  };

  const value = {
    history,
    currentIndex,
    pushToHistory,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    getCurrentEntry
  };

  return (
    <NavigationHistoryContext.Provider value={value}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error('useNavigationHistory must be used within a NavigationHistoryProvider');
  }
  return context;
}
