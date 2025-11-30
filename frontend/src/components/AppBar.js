import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  useTheme,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  Collapse,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Home,
  Search,
  CalendarMonth,
  Person,
  MedicalServices,
  Message,
  Settings,
  Notifications,
  ExpandMore,
  ExpandLess,
  Dashboard,
  People,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import Notifications from './Notifications';
import Accessibility from './Accessibility';
import { useTranslation } from 'react-i18next';

// Composants stylisés
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  paddingRight: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const Logo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: theme.palette.primary.contrastText,
  '&:hover': {
    color: alpha(theme.palette.primary.contrastText, 0.7),
  },
  transition: 'color 0.3s ease',
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: 240,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  [theme.breakpoints.up('sm')]: {
    width: 240,
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[8],
  },
}));

const drawerWidth = 240;

const AppBar = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { currentTheme, toggleTheme } = useThemeContext();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [doctorMenuOpen, setDoctorMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDoctorMenuClick = () => {
    setDoctorMenuOpen(!doctorMenuOpen);
  };

  const handleAdminMenuClick = () => {
    setAdminMenuOpen(!adminMenuOpen);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    handleMenuClose();
  };

  const menuItems = [
    {
      text: t('navigation.dashboard'),
      icon: <Dashboard />,
      path: user?.role === 'PATIENT' ? '/patient' : user?.role === 'DOCTOR' ? '/doctor' : '/admin',
    },
    {
      text: t('navigation.appointments'),
      icon: <CalendarMonth />,
      path: user?.role === 'PATIENT' ? '/patient/appointments' : user?.role === 'DOCTOR' ? '/doctor/appointments' : '/admin/appointments',
    },
    {
      text: t('navigation.searchDoctors'),
      icon: <Search />,
      path: '/search-doctors',
      visible: user?.role === 'PATIENT',
    },
    {
      text: t('navigation.profile'),
      icon: <Person />,
      path: user?.role === 'PATIENT' ? '/patient/profile' : user?.role === 'DOCTOR' ? '/doctor/profile' : '/admin/profile',
    },
    {
      text: t('navigation.messages'),
      icon: <Message />,
      path: '/messaging',
    },
    {
      text: t('navigation.documents'),
      icon: <MedicalServices />,
      path: user?.role === 'PATIENT' ? '/patient/documents' : user?.role === 'DOCTOR' ? '/doctor/documents' : '/admin/documents',
    },
    {
      text: t('navigation.settings'),
      icon: <Settings />,
      path: user?.role === 'PATIENT' ? '/patient/settings' : user?.role === 'DOCTOR' ? '/doctor/settings' : '/admin/settings',
    },
  ];

  const doctorMenuItems = [
    {
      text: t('doctor.manageSchedule'),
      icon: <CalendarMonth />,
      path: '/doctor/schedule',
    },
    {
      text: t('doctor.managePatients'),
      icon: <People />,
      path: '/doctor/patients',
    },
  ];

  const adminMenuItems = [
    {
      text: t('admin.userManagement'),
      icon: <People />,
      path: '/admin/users',
    },
    {
      text: t('admin.doctorManagement'),
      icon: <MedicalServices />,
      path: '/admin/doctors',
    },
    {
      text: t('admin.reportManagement'),
      icon: <Assessment />,
      path: '/admin/reports',
    },
    {
      text: t('admin.systemSettings'),
      icon: <Settings />,
      path: '/admin/system-settings',
    },
  ];

  const drawer = (
    <div>
      <DrawerHeader>
        <Logo component="a" href="/" onClick={() => navigate('/')}>
          <MedicalServices sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap>
            {t('common.appName')}
          </Typography>
        </Logo>
      </DrawerHeader>
      <Divider />
      <List>
        {menuItems.filter(item => item.visible !== false).map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}

        {user?.role === 'DOCTOR' && (
          <>
            <ListItem button onClick={handleDoctorMenuClick}>
              <ListItemIcon>
                <MedicalServices />
              </ListItemIcon>
              <ListItemText primary="Médecin" />
              {doctorMenuOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={doctorMenuOpen} timeout="auto" unmountOnExit>
              {doctorMenuItems.map((item) => (
                <ListItem
                  button
                  key={item.text}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }}
                  selected={location.pathname === item.path}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </Collapse>
          </>
        )}

        {user?.role === 'ADMIN' && (
          <>
            <ListItem button onClick={handleAdminMenuClick}>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="Administration" />
              {adminMenuOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={adminMenuOpen} timeout="auto" unmountOnExit>
              {adminMenuItems.map((item) => (
                <ListItem
                  button
                  key={item.text}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }}
                  selected={location.pathname === item.path}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </Collapse>
          </>
        )}
      </List>
    </div>
  );

  return (
    <>
      <StyledAppBar position="fixed">
        <StyledToolbar>
          {!isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Logo component="a" href="/" onClick={() => navigate('/')}>
            <MedicalServices sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap component="div">
              {t('common.appName')}
            </Typography>
          </Logo>

          <Box sx={{ flexGrow: 1 }} />

          {/* Composants d'accessibilité et de personnalisation */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ThemeToggle />
            <LanguageSelector />
            <Notifications />
            <Accessibility />

            {/* Menu utilisateur */}
            <Tooltip title={user ? `${user.firstName} ${user.lastName}` : 'Menu'}>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>

            <StyledMenu
              id="menu-appbar"
              anchorEl={anchorEl}
              keepMounted
              open={isMenuOpen}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => navigate(user?.role === 'PATIENT' ? '/patient/profile' : user?.role === 'DOCTOR' ? '/doctor/profile' : '/admin/profile')}>
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText primary={t('navigation.profile')} />
              </MenuItem>

              <MenuItem onClick={() => navigate(user?.role === 'PATIENT' ? '/patient/settings' : user?.role === 'DOCTOR' ? '/doctor/settings' : '/admin/settings')}>
                <ListItemIcon>
                  <Settings />
                </ListItemIcon>
                <ListItemText primary={t('navigation.settings')} />
              </MenuItem>

              <Divider />

              {/* Sélection de langue */}
              {availableLanguages.map((language) => (
                <MenuItem
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  selected={currentLanguage === language.code}
                >
                  <ListItemText primary={`${language.flag} ${language.name}`} />
                </MenuItem>
              ))}

              <Divider />

              {/* Déconnexion */}
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Settings />
                </ListItemIcon>
                <ListItemText primary={t('common.logout')} />
              </MenuItem>
            </StyledMenu>
          </Box>
        </StyledToolbar>
      </StyledAppBar>

      {/* Drawer pour mobile */}
      <StyledDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {drawer}
      </StyledDrawer>

      {/* Drawer pour desktop */}
      {!isMobile && (
        <StyledDrawer
          variant="permanent"
          open
        >
          {drawer}
        </StyledDrawer>
      )}
    </>
  );
};

export default AppBar;
