import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Card, CardContent, Button, TextField, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, Pagination, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { USERS_QUERY, UPDATE_USER_STATUS_MUTATION } from '../../graphql/admin';
import { useAuth } from '../../contexts/AuthContext';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const ManagementContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const UserCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  margin: '0 auto',
  marginBottom: theme.spacing(2),
  bgcolor: theme.palette.primary.main,
}));

const UserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'grid' ou 'table'
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  // Récupérer les utilisateurs
  const { data: usersData, loading: usersLoading, error: usersError } = useQuery(USERS_QUERY, {
    variables: { 
      page,
      limit: 10,
      search: searchQuery,
      role: roleFilter,
      status: statusFilter
    },
  });

  // Mutation pour mettre à jour le statut d'un utilisateur
  const [updateUserStatus] = useMutation(UPDATE_USER_STATUS_MUTATION, {
    onCompleted: (data) => {
      if (data && data.updateUserStatus) {
        setUsers(prev => 
          prev.map(user => 
            user.id === data.updateUserStatus.id 
              ? data.updateUserStatus 
              : user
          )
        );
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  useEffect(() => {
    if (usersData && usersData.users) {
      setUsers(usersData.users.users);
      setTotalPages(usersData.users.totalPages);
      setLoading(false);
    }
  }, [usersData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedUser(null);
  };

  const handleUpdateUserStatus = (userId, isActive) => {
    updateUserStatus({
      variables: {
        userId,
        isActive
      }
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'DOCTOR':
        return 'primary';
      case 'PATIENT':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'DOCTOR':
        return 'Médecin';
      case 'PATIENT':
        return 'Patient';
      default:
        return role;
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Actif' : 'Inactif';
  };

  if (loading) {
    return (
      <ManagementContainer maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </ManagementContainer>
    );
  }

  return (
    <ManagementContainer maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Gestion des utilisateurs
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Statut de l'utilisateur mis à jour avec succès</Alert>}

      {/* Barre de recherche et filtres */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Rechercher un utilisateur..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="role-filter-label">Rôle</InputLabel>
            <Select
              labelId="role-filter-label"
              id="role-filter"
              value={roleFilter}
              label="Rôle"
              onChange={handleRoleFilterChange}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="PATIENT">Patients</MenuItem>
              <MenuItem value="DOCTOR">Médecins</MenuItem>
              <MenuItem value="ADMIN">Administrateurs</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Statut</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Statut"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="true">Actifs</MenuItem>
              <MenuItem value="false">Inactifs</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Button
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('grid')}
            sx={{ mr: 1 }}
          >
            Grille
          </Button>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
          >
            Tableau
          </Button>
        </Box>
      </Paper>

      {users.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Aucun utilisateur correspondant à votre recherche.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Vue en grille */}
          {viewMode === 'grid' && (
            <Grid container spacing={3}>
              {users.map((userItem) => (
                <Grid item xs={12} sm={6} md={4} key={userItem.id}>
                  <UserCard elevation={2}>
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                      <UserAvatar>
                        <PersonIcon fontSize="large" />
                      </UserAvatar>
                      <Typography variant="h6" gutterBottom>
                        {userItem.firstName} {userItem.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {userItem.email}
                      </Typography>
                      <Box display="flex" justifyContent="center" gap={1} mb={2}>
                        <Chip 
                          label={getRoleText(userItem.role)} 
                          color={getRoleColor(userItem.role)} 
                          size="small" 
                        />
                        <Chip 
                          label={getStatusText(userItem.isActive)} 
                          color={getStatusColor(userItem.isActive)} 
                          size="small" 
                        />
                      </Box>
                      <Box display="flex" justifyContent="center" gap={1}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewUserDetails(userItem)}
                        >
                          Voir
                        </Button>
                        <Button
                          variant={userItem.isActive ? "outlined" : "contained"}
                          color={userItem.isActive ? "error" : "success"}
                          startIcon={userItem.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          onClick={() => handleUpdateUserStatus(userItem.id, !userItem.isActive)}
                        >
                          {userItem.isActive ? 'Désactiver' : 'Activer'}
                        </Button>
                      </Box>
                    </CardContent>
                  </UserCard>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Vue en tableau */}
          {viewMode === 'table' && (
            <TableContainer component={Paper} elevation={2}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date d'inscription</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                          {userItem.firstName} {userItem.lastName}
                        </Box>
                      </TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getRoleText(userItem.role)} 
                          color={getRoleColor(userItem.role)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(userItem.isActive)} 
                          color={getStatusColor(userItem.isActive)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {dayjs(userItem.createdAt).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewUserDetails(userItem)}
                          sx={{ mr: 1 }}
                        >
                          Voir
                        </Button>
                        <Button
                          variant={userItem.isActive ? "outlined" : "contained"}
                          color={userItem.isActive ? "error" : "success"}
                          startIcon={userItem.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          onClick={() => handleUpdateUserStatus(userItem.id, !userItem.isActive)}
                        >
                          {userItem.isActive ? 'Désactiver' : 'Activer'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* Dialogue de détails de l'utilisateur */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>Détails de l'utilisateur</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip 
                      label={getRoleText(selectedUser.role)} 
                      color={getRoleColor(selectedUser.role)} 
                      size="small" 
                    />
                    <Chip 
                      label={getStatusText(selectedUser.isActive)} 
                      color={getStatusColor(selectedUser.isActive)} 
                      size="small" 
                    />
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Informations générales</Typography>
                  <Typography variant="body2" paragraph>
                    ID: {selectedUser.id}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Date d'inscription: {dayjs(selectedUser.createdAt).format('DD MMMM YYYY')}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Dernière connexion: {selectedUser.lastLogin ? dayjs(selectedUser.lastLogin).format('DD MMMM YYYY à HH:mm') : 'Jamais'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Informations spécifiques</Typography>
                  {selectedUser.patient && (
                    <>
                      <Typography variant="body2" paragraph>
                        Date de naissance: {selectedUser.patient.dateOfBirth ? dayjs(selectedUser.patient.dateOfBirth).format('DD/MM/YYYY') : ''}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Ville: {selectedUser.patient.city}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Téléphone: {selectedUser.patient.phone}
                      </Typography>
                    </>
                  )}
                  {selectedUser.doctor && (
                    <>
                      <Typography variant="body2" paragraph>
                        Spécialité: {selectedUser.doctor.specialty}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Numéro de licence: {selectedUser.doctor.licenseNumber}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Ville: {selectedUser.doctor.city}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Téléphone: {selectedUser.doctor.phone}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Fermer</Button>
          <Button 
            variant="contained" 
            color={selectedUser?.isActive ? "error" : "success"}
            onClick={() => {
              if (selectedUser) {
                handleUpdateUserStatus(selectedUser.id, !selectedUser.isActive);
                handleCloseDetailsDialog();
              }
            }}
          >
            {selectedUser?.isActive ? 'Désactiver' : 'Activer'}
          </Button>
        </DialogActions>
      </Dialog>
    </ManagementContainer>
  );
};

export default UserManagement;
