import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyQuery, useMutation } from '@apollo/client';
import { LOGIN_MUTATION, REFRESH_TOKEN_MUTATION, ME_QUERY } from '../graphql/auth';

// Création du contexte
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Fournisseur du contexte d'authentification
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Requêtes GraphQL
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN_MUTATION);
  const [loadUser] = useLazyQuery(ME_QUERY, {
    onCompleted: (data) => {
      if (data && data.me) {
        setUser(data.me);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    },
    onError: () => {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setLoading(false);
    }
  });

  // Vérifier si l'utilisateur est authentifié au chargement
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  // Fonction de connexion
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await loginMutation({
        variables: {
          input: {
            email,
            password
          }
        }
      });

      if (data && data.login) {
        const { accessToken, refreshToken, user } = data.login;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
        setIsAuthenticated(true);

        // Rediriger selon le rôle de l'utilisateur
        switch (user.role) {
          case 'PATIENT':
            navigate('/patient');
            break;
          case 'DOCTOR':
            navigate('/doctor');
            break;
          case 'ADMIN':
            navigate('/admin');
            break;
          default:
            navigate('/');
        }

        return { success: true };
      }
      return { success: false, message: 'Identifiants incorrects' };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { 
        success: false, 
        message: error.message || 'Une erreur est survenue lors de la connexion' 
      };
    }
  }, [loginMutation, navigate]);

  // Fonction de déconnexion
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  }, [navigate]);

  // Fonction de rafraîchissement du token
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('Pas de token de rafraîchissement');
      }

      const { data } = await refreshTokenMutation({
        variables: { refreshToken }
      });

      if (data && data.refreshToken) {
        const { accessToken, refreshToken: newRefreshToken } = data.refreshToken;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        return accessToken;
      }
      throw new Error('Échec du rafraîchissement du token');
    } catch (error) {
      console.error('Erreur de rafraîchissement du token:', error);
      logout();
      throw error;
    }
  }, [refreshTokenMutation, logout]);

  // Valeur du contexte
  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
