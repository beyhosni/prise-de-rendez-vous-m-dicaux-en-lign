import React, { useState, useEffect } from 'react';
import { Box, Switch, FormControlLabel, Slider, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';
import TextDecreaseIcon from '@mui/icons-material/TextDecrease';
import HighContrastIcon from '@mui/icons-material/HighContrast';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import { useTheme } from '@mui/material/styles';

// Composants stylisés
const AccessibilityContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000,
}));

const AccessibilityButton = styled(Button)(({ theme }) => ({
  minWidth: 'auto',
  padding: theme.spacing(1),
  borderRadius: '50%',
}));

const AccessibilityDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    minWidth: 300,
  },
}));

const Accessibility = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    screenReader: false,
    fontSize: 16,
    volume: 100,
  });

  // Récupérer les paramètres d'accessibilité depuis le localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Sauvegarder les paramètres d'accessibilité dans le localStorage
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
    applyAccessibilitySettings(newSettings);
  };

  // Appliquer les paramètres d'accessibilité
  const applyAccessibilitySettings = (settingsToApply) => {
    // Appliquer le contraste élevé
    if (settingsToApply.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Appliquer la taille du texte
    document.documentElement.style.fontSize = `${settingsToApply.fontSize}px`;

    // Appliquer le volume (pour les lecteurs d'écran)
    // Note: Ceci est un exemple, l'implémentation réelle dépendrait de la bibliothèque utilisée pour le lecteur d'écran
  };

  // Gérer le changement de paramètres
  const handleSettingChange = (setting, value) => {
    saveSettings({
      ...settings,
      [setting]: value,
    });
  };

  // Réinitialiser les paramètres d'accessibilité
  const resetSettings = () => {
    const defaultSettings = {
      highContrast: false,
      largeText: false,
      screenReader: false,
      fontSize: 16,
      volume: 100,
    };
    saveSettings(defaultSettings);
  };

  return (
    <>
      <AccessibilityContainer>
        <AccessibilityButton
          variant="contained"
          color="primary"
          onClick={() => setOpen(true)}
          aria-label="Options d'accessibilité"
        >
          <AccessibilityIcon />
        </AccessibilityButton>
      </AccessibilityContainer>

      <AccessibilityDialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="accessibility-dialog-title"
      >
        <DialogTitle id="accessibility-dialog-title">
          Options d'accessibilité
        </DialogTitle>
        <DialogContent>
          <List>
            {/* Contraste élevé */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.highContrast}
                    onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                    color="primary"
                  />
                }
                label="Contraste élevé"
              />
            </ListItem>

            {/* Texte agrandi */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.largeText}
                    onChange={(e) => handleSettingChange('largeText', e.target.checked)}
                    color="primary"
                  />
                }
                label="Texte agrandi"
              />
            </ListItem>

            {/* Lecteur d'écran */}
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.screenReader}
                    onChange={(e) => handleSettingChange('screenReader', e.target.checked)}
                    color="primary"
                  />
                }
                label="Lecteur d'écran"
              />
            </ListItem>

            <Divider />

            {/* Taille de la police */}
            <ListItem>
              <Typography id="font-size-slider" gutterBottom>
                Taille de la police
              </Typography>
              <Box display="flex" alignItems="center">
                <TextDecreaseIcon />
                <Slider
                  value={settings.fontSize}
                  onChange={(e, value) => handleSettingChange('fontSize', value)}
                  aria-labelledby="font-size-slider"
                  valueLabelDisplay="auto"
                  min={12}
                  max={24}
                  step={1}
                  marks={[
                    { value: 12, label: 'Petit' },
                    { value: 16, label: 'Normal' },
                    { value: 20, label: 'Grand' },
                    { value: 24, label: 'Très grand' },
                  ]}
                  sx={{ mx: 2 }}
                />
                <TextIncreaseIcon />
              </Box>
            </ListItem>

            {/* Volume */}
            <ListItem>
              <Typography id="volume-slider" gutterBottom>
                Volume
              </Typography>
              <Box display="flex" alignItems="center">
                <VolumeDownIcon />
                <Slider
                  value={settings.volume}
                  onChange={(e, value) => handleSettingChange('volume', value)}
                  aria-labelledby="volume-slider"
                  valueLabelDisplay="auto"
                  min={0}
                  max={150}
                  step={10}
                  sx={{ mx: 2 }}
                />
                <VolumeUpIcon />
              </Box>
            </ListItem>

            <Divider />

            {/* Bouton de réinitialisation */}
            <ListItem>
              <Button
                variant="outlined"
                onClick={resetSettings}
                startIcon={<VisibilityIcon />}
                fullWidth
              >
                Réinitialiser les paramètres
              </Button>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </AccessibilityDialog>
    </>
  );
};

export default Accessibility;
