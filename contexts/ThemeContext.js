// contexts/ThemeContext.js
import React, { createContext, useContext, useState } from 'react';
import { themes } from '../styles/themeColors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  
  return (
    <ThemeContext.Provider value={{ 
      theme: themes[currentTheme], 
      setTheme: setCurrentTheme,
      currentThemeName: currentTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Make sure to EXPORT the useTheme hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};