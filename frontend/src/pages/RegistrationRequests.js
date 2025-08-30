import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Badge,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  PersonAdd as PersonAddIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Kayıt istekleri API servisi
const registrationRequestsApi = {
  // Tüm kayıt isteklerini getir
  getAllRequests: async () => {
    try {
      const response = await fetch('http://localhost:5223/api/registrationrequest', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Kayıt istekleri alınamadı');
      return await response.json();
    } catch (error) {
      console.error('Kayıt istekleri hatası:', error);
      throw error;
    }
  },

  // Kayıt isteğini kabul et
  approveRequest: async (requestId, adminNotes) => {
    try {
      const response = await fetch(`http://localhost:5223/api/registrationrequest/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes })
      });
      if (!response.ok) throw new Error('Kayıt isteği onaylanamadı');
      return await response.json();
    } catch (error) {
      console.error('Onaylama hatası:', error);
      throw error;
    }
  },

  // Kayıt isteğini reddet
  rejectRequest: async (requestId, rejectionReason) => {
    try {
      const response = await fetch(`http://localhost:5223/api/registrationrequest/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason })
      });
      if (!response.ok) throw new Error('Kayıt isteği reddedilemedi');
      return await response.json();
    } catch (error) {
      console.error('Reddetme hatası:', error);
      throw error;
    }
  }
};

function RegistrationRequests() {
  // State yönetimi
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // İstatistikler
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Sayfa yüklendiğinde kayıt isteklerini getir
  useEffect(() => {
    loadRequests();
  }, []);

  // İstatistikleri hesapla
  useEffect(() => {
    const newStats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'Beklemede').length,
      approved: requests.filter(r => r.status === 'Onaylandı').length,
      rejected: requests.filter(r => r.status === 'Reddedildi').length
    };
    setStats(newStats);
  }, [requests]);

  // Kayıt isteklerini yükle
  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await registrationRequestsApi.getAllRequests();
      setRequests(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Kayıt istekleri yüklenirken hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const q = search.trim().toLowerCase();
    const matchesName = q === '' || (r.name||'').toLowerCase().includes(q);
    const matchesRole = !roleFilter || r.requestedRole === roleFilter;
    return matchesName && matchesRole;
  });

  // Detay görüntüleme
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  // Onaylama işlemi
  const handleApprove = async () => {
    if (!selectedRequest || !adminNotes.trim()) {
      setSnackbar({
        open: true,
        message: 'Lütfen not ekleyin',
        severity: 'warning'
      });
      return;
    }

    try {
      setProcessing(true);
      await registrationRequestsApi.approveRequest(selectedRequest.id, adminNotes);
      
      setSnackbar({
        open: true,
        message: 'Kayıt isteği başarıyla onaylandı. Kullanıcı artık giriş yapabilir.',
        severity: 'success'
      });
      
      setApprovalDialogOpen(false);
      setAdminNotes('');
      loadRequests(); // Listeyi yenile
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Onaylama işlemi başarısız',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Reddetme işlemi
  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      setSnackbar({
        open: true,
        message: 'Lütfen red sebebi yazın',
        severity: 'warning'
      });
      return;
    }

    try {
      setProcessing(true);
      await registrationRequestsApi.rejectRequest(selectedRequest.id, rejectionReason);
      
      setSnackbar({
        open: true,
        message: 'Kayıt isteği reddedildi',
        severity: 'success'
      });
      
      setRejectionDialogOpen(false);
      setRejectionReason('');
      loadRequests(); // Listeyi yenile
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Reddetme işlemi başarısız',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Durum rengi
  const getStatusColor = (status) => {
    switch (status) {
      case 'Beklemede': return 'warning';
      case 'Onaylandı': return 'success';
      case 'Reddedildi': return 'error';
      default: return 'default';
    }
  };

  // Rol rengi
  const getRoleColor = (role) => {
    switch (role) {
      case 'Site Sakini': return '#388e3c';
      case 'Güvenlik': return '#d32f2f';
      case 'Kapıcı': return '#f57c00';
      default: return '#1976d2';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
          Kayıt İstekleri Yönetimi
        </Typography>
      </motion.div>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #1976d215, #1976d205)' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={stats.total} color="primary" sx={{ mr: 2 }}>
                    <PersonAddIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                  </Badge>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Toplam Başvuru
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #f57c0015, #f57c0005)' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={stats.pending} color="warning" sx={{ mr: 2 }}>
                    <NotificationsIcon sx={{ fontSize: 40, color: '#f57c00' }} />
                  </Badge>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                      {stats.pending}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Bekleyen İstek
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #388e3c15, #388e3c05)' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={stats.approved} color="success" sx={{ mr: 2 }}>
                    <CheckIcon sx={{ fontSize: 40, color: '#388e3c' }} />
                  </Badge>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                      {stats.approved}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Onaylanan
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #d32f2f15, #d32f2f05)' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={stats.rejected} color="error" sx={{ mr: 2 }}>
                    <CancelIcon sx={{ fontSize: 40, color: '#d32f2f' }} />
                  </Badge>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                      {stats.rejected}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Reddedilen
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Kayıt İstekleri Tablosu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 2 }}>
              Kayıt İstekleri Listesi
            </Typography>

            {/* Arama & Filtreler */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <TextField value={search} onChange={(e)=>setSearch(e.target.value)} label="İsme göre ara" size="small" sx={{ minWidth: 240 }} />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>İstenen Rol</InputLabel>
                <Select value={roleFilter} label="İstenen Rol" onChange={(e)=>setRoleFilter(e.target.value)}>
                  <MenuItem value="">Hepsi</MenuItem>
                  <MenuItem value="Site Sakini">Site Sakini</MenuItem>
                  <MenuItem value="Güvenlik">Güvenlik</MenuItem>
                  <MenuItem value="Kapıcı">Kapıcı</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>İsim</TableCell>
                    <TableCell>E-posta</TableCell>
                    <TableCell>Telefon</TableCell>
                    <TableCell>İstenen Rol</TableCell>
                    <TableCell>Blog/Daire</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Başvuru Tarihi</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: getRoleColor(request.requestedRole) }}>
                            {request.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {request.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.phone}</TableCell>
                      <TableCell>
                        <Chip 
                          label={request.requestedRole} 
                          size="small"
                          sx={{ 
                            backgroundColor: getRoleColor(request.requestedRole),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.blogNumber} / {request.apartmentNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status} 
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(request)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                          
                          {request.status === 'Beklemede' && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setApprovalDialogOpen(true);
                                }}
                                color="success"
                              >
                                <CheckIcon />
                              </IconButton>
                              
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setRejectionDialogOpen(true);
                                }}
                                color="error"
                              >
                                <CancelIcon />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detay Görüntüleme Dialog'u */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PersonAddIcon sx={{ mr: 1, color: '#1976d2' }} />
            Başvuru Detayları
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getRoleColor(selectedRequest.requestedRole) }}>
                          {selectedRequest.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={selectedRequest.name}
                        secondary="İsim Soyisim"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <EmailIcon color="primary" />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={selectedRequest.email}
                        secondary="E-posta"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <PhoneIcon color="primary" />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={selectedRequest.phone}
                        secondary="Telefon"
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <WorkIcon sx={{ color: getRoleColor(selectedRequest.requestedRole) }} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={selectedRequest.requestedRole}
                        secondary="İstenen Rol"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <HomeIcon color="primary" />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`${selectedRequest.blogNumber} / ${selectedRequest.apartmentNumber}`}
                        secondary="Blog / Daire No"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <CalendarIcon color="primary" />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={new Date(selectedRequest.createdAt).toLocaleDateString('tr-TR')}
                        secondary="Başvuru Tarihi"
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Açıklama
                  </Typography>
                  <Typography variant="body1" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {selectedRequest.description || 'Açıklama bulunmuyor'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Onaylama Dialog'u */}
      <Dialog 
        open={approvalDialogOpen} 
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <CheckIcon sx={{ mr: 1, color: '#388e3c' }} />
            Başvuruyu Onayla
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bu başvuruyu onaylamak istediğinizden emin misiniz?
          </Typography>
                     <Typography variant="body2" color="textSecondary" gutterBottom>
             Onaylandıktan sonra kullanıcı hesabı oluşturulacak ve kullanıcı kendi belirlediği şifre ile giriş yapabilecek.
           </Typography>
          
                     <Box sx={{ mt: 2 }}>
             <Typography variant="subtitle2" gutterBottom>
               Yönetici Notu (Opsiyonel):
             </Typography>
             <textarea
               value={adminNotes}
               onChange={(e) => setAdminNotes(e.target.value)}
               placeholder="Onaylama notu ekleyebilirsiniz..."
               style={{
                 width: '100%',
                 minHeight: '100px',
                 padding: '12px',
                 border: '1px solid #ccc',
                 borderRadius: '4px',
                 fontFamily: 'inherit',
                 fontSize: '14px',
                 resize: 'vertical'
               }}
             />
           </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)} disabled={processing}>
            İptal
          </Button>
          <Button 
            onClick={handleApprove} 
            variant="contained" 
            color="success"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {processing ? 'Onaylanıyor...' : 'Onayla'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reddetme Dialog'u */}
      <Dialog 
        open={rejectionDialogOpen} 
        onClose={() => setRejectionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <CancelIcon sx={{ mr: 1, color: '#d32f2f' }} />
            Başvuruyu Reddet
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bu başvuruyu reddetmek istediğinizden emin misiniz?
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Red sebebi başvuru sahibine bildirilecektir.
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Red Sebebi *:
            </Typography>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Red sebebini yazın..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)} disabled={processing}>
            İptal
          </Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {processing ? 'Reddediliyor...' : 'Reddet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bildirim Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default RegistrationRequests; 