import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Création du contexte
const ThemeContext = createContext();

// Hook personnalisé pour utiliser le contexte de thème
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext doit être utilisé dans un ThemeProvider');
  }
  return context;
};

// Thème clair
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32', // Vert médical
    },
    secondary: {
      main: '#1976D2', // Bleu
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Thème sombre
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4CAF50', // Vert médical plus clair pour le mode sombre
    },
    secondary: {
      main: '#2196F3', // Bleu plus clair pour le mode sombre
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Fournisseur du contexte de thème
export const ThemeProviderWrapper = ({ children }) => {
  // Récupérer le mode de thème depuis le localStorage
  const savedThemeMode = localStorage.getItem('themeMode') || 'light';
  const [themeMode, setThemeMode] = useState(savedThemeMode);

  // Changer le thème
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // Définir le thème actuel
  const currentTheme = themeMode === 'light' ? lightTheme : darkTheme;

  // Valeur du contexte
  const value = {
    themeMode,
    toggleTheme,
    currentTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
