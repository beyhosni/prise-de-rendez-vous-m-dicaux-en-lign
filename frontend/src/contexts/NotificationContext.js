import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSubscription } from '@apollo/client';
import { useAuth } from './AuthContext';
import { NOTIFICATION_SUBSCRIPTION } from '../graphql/notification';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Création du contexte
const NotificationContext = createContext();

// Hook personnalisé pour utiliser le contexte de notification
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification doit être utilisé dans un NotificationProvider');
  }
  return context;
};

// Fournisseur du contexte de notification
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationSound = useRef(new Audio('/notification-sound.mp3'));
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('notificationSoundEnabled') !== 'false'
  );

  // S'abonner aux notifications en temps réel
  const { data: notificationData } = useSubscription(NOTIFICATION_SUBSCRIPTION, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  useEffect(() => {
    if (notificationData && notificationData.newNotification) {
      const newNotification = {
        id: Date.now(),
        ...notificationData.newNotification,
        timestamp: new Date(),
        read: false,
      };

      // Ajouter la notification à la liste
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Afficher une notification toast
      toast.info(newNotification.message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Jouer un son de notification si activé
      if (soundEnabled) {
        try {
          notificationSound.current.play().catch(e => console.log("Impossible de jouer le son de notification", e));
        } catch (e) {
          console.log("Erreur lors de la lecture du son de notification", e);
        }
      }
    }
  }, [notificationData, soundEnabled]);

  // Marquer une notification comme lue
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Supprimer une notification
  const removeNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
    // Si la notification n'était pas lue, décrémenter le compteur
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Activer/désactiver le son des notifications
  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    localStorage.setItem('notificationSoundEnabled', newSoundEnabled.toString());
  };

  // Effacer toutes les notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Valeur du contexte
  const value = {
    notifications,
    unreadCount,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    removeNotification,
    toggleSound,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
