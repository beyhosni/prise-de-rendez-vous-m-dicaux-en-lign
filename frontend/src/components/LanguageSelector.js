import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Typography, Box, ListItemIcon } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageIcon from '@mui/icons-material/Language';

// Composants stylisés
const LanguageMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    minWidth: 180,
  },
}));

const LanguageSelector = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    handleClose();
  };

  const open = Boolean(anchorEl);

  const getCurrentLanguage = () => {
    return availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];
  };

  return (
    <>
      <IconButton
        color="inherit"
        aria-label="Choisir la langue"
        onClick={handleOpen}
        size="small"
      >
        <LanguageIcon />
      </IconButton>

      <LanguageMenu
        id="language-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
      >
        {availableLanguages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === currentLanguage}
          >
            <ListItemIcon>
              <Typography variant="body1">{language.flag}</Typography>
            </ListItemIcon>
            <Typography variant="body1">{language.name}</Typography>
          </MenuItem>
        ))}
      </LanguageMenu>
    </>
  );
};

export default LanguageSelector;
