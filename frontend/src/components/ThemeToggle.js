import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { useThemeContext } from '../contexts/ThemeContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const ThemeToggle = () => {
  const { themeMode, toggleTheme } = useThemeContext();
  const theme = useTheme();

  return (
    <Tooltip title={themeMode === 'light' ? 'Passer au mode sombre' : 'Passer au mode clair'}>
      <IconButton
        color="inherit"
        onClick={toggleTheme}
        aria-label="Changer de thème"
      >
        {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
