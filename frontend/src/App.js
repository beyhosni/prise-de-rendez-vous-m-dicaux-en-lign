import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import des pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import SearchDoctors from './pages/SearchDoctors';
import BookAppointment from './pages/BookAppointment';
import Profile from './pages/Profile';
import AppointmentHistory from './pages/AppointmentHistory';
import VideoConsultation from './pages/VideoConsultation';
import Payment from './pages/Payment';
import NotFound from './pages/NotFound';

// Configuration du thème Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Vert médical
    },
    secondary: {
      main: '#1976D2', // Bleu
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Configuration du client Apollo pour GraphQL
const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache(),
});

// Composant pour les routes protégées
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              {/* Routes publiques */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search-doctors" element={<SearchDoctors />} />
              <Route path="/not-found" element={<NotFound />} />

              {/* Routes patient */}
              <Route path="/patient" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/patient/profile" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/patient/appointments" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <AppointmentHistory />
                </ProtectedRoute>
              } />
              <Route path="/patient/book-appointment" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <BookAppointment />
                </ProtectedRoute>
              } />
              <Route path="/payment/:appointmentId" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <Payment />
                </ProtectedRoute>
              } />

              {/* Routes médecin */}
              <Route path="/doctor" element={
                <ProtectedRoute requiredRole="DOCTOR">
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/doctor/profile" element={
                <ProtectedRoute requiredRole="DOCTOR">
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/doctor/appointments" element={
                <ProtectedRoute requiredRole="DOCTOR">
                  <AppointmentHistory />
                </ProtectedRoute>
              } />
              <Route path="/doctor/consultation/:appointmentId" element={
                <ProtectedRoute requiredRole="DOCTOR">
                  <VideoConsultation />
                </ProtectedRoute>
              } />

              {/* Routes administrateur */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Route de consultation vidéo (accessible aux patients et médecins) */}
              <Route path="/consultation/:appointmentId" element={
                <ProtectedRoute>
                  <VideoConsultation />
                </ProtectedRoute>
              } />

              {/* Route par défaut */}
              <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default App;
