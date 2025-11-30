import React, { useState, useRef, useEffect } from 'react';
import { Badge, IconButton, Menu, MenuItem, Typography, Box, ListItemText, ListItemIcon, Divider, Switch, FormControlLabel, Button, List, ListItem, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const NotificationsContainer = styled(Paper)(({ theme }) => ({
  width: 360,
  maxHeight: 480,
  overflow: 'auto',
}));

const NotificationsHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const NotificationItem = styled(ListItem)(({ theme, read }) => ({
  backgroundColor: read ? 'transparent' : theme.palette.action.hover,
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const formatNotificationTime = (timestamp) => {
  const now = dayjs();
  const notificationTime = dayjs(timestamp);

  if (notificationTime.isSame(now, 'day')) {
    return notificationTime.format('HH:mm');
  } else if (notificationTime.isSame(now.subtract(1, 'day'), 'day')) {
    return 'Hier';
  } else if (notificationTime.isSame(now, 'year')) {
    return notificationTime.format('D MMM');
  } else {
    return notificationTime.format('D MMM YYYY');
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const anchorEl = useRef(null);
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    removeNotification,
    toggleSound,
    clearAllNotifications,
  } = useNotification();

  const handleOpen = (event) => {
    setOpen(true);
    anchorEl.current = event.currentTarget;
  };

  const handleClose = () => {
    setOpen(false);
    anchorEl.current = null;
  };

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRemoveNotification = (notificationId) => {
    removeNotification(notificationId);
  };

  const handleClearAllNotifications = () => {
    clearAllNotifications();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Naviguer vers la page appropriée en fonction du type de notification
    switch (notification.type) {
      case 'APPOINTMENT_REMINDER':
        navigate('/patient/appointments');
        break;
      case 'APPOINTMENT_CONFIRMED':
        navigate('/patient/appointments');
        break;
      case 'APPOINTMENT_CANCELLED':
        navigate('/patient/appointments');
        break;
      case 'NEW_MESSAGE':
        navigate(`/messaging/${notification.data.conversationId}`);
        break;
      case 'PAYMENT_SUCCESS':
        navigate('/patient/appointments');
        break;
      default:
        break;
    }

    handleClose();
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        aria-label="Notifications"
        aria-controls="notifications-menu"
        aria-haspopup="true"
      >
        <Badge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        id="notifications-menu"
        anchorEl={anchorEl.current}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{ elevation: 3 }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <NotificationsContainer>
          <NotificationsHeader>
            <Typography variant="h6">
              Notifications
              {unreadCount > 0 && (
                <Typography variant="caption" color="primary" ml={1}>
                  ({unreadCount} non lues)
                </Typography>
              )}
            </Typography>
            <Box>
              <IconButton size="small" onClick={toggleSound}>
                {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
              </IconButton>
            </Box>
          </NotificationsHeader>

          {notifications.length === 0 ? (
            <Box p={2} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Aucune notification
              </Typography>
            </Box>
          ) : (
            <>
              <List dense>
                {notifications.slice(0, 10).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    button
                    onClick={() => handleNotificationClick(notification)}
                    read={notification.read}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'}>
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatNotificationTime(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                    {!notification.read && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        <MarkEmailReadIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveNotification(notification.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </NotificationItem>
                ))}
              </List>

              <Divider />

              <Box p={1} display="flex" justifyContent="space-between">
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    startIcon={<DoneAllIcon />}
                    onClick={handleMarkAllAsRead}
                  >
                    Tout marquer comme lu
                  </Button>
                )}
                <Button
                  size="small"
                  startIcon={<ClearAllIcon />}
                  onClick={handleClearAllNotifications}
                >
                  Tout effacer
                </Button>
              </Box>
            </>
          )}
        </NotificationsContainer>
      </Menu>
    </>
  );
};

export default Notifications;
