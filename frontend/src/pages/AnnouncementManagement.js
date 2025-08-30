import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Fab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Notifications as NotificationsIcon,
  Announcement as AnnouncementIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

  // Duyuru API servisi
const announcementApi = {
  // Tüm duyuruları getir
  getAllAnnouncements: async () => {
    try {
      const response = await fetch('http://localhost:5223/api/announcement', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Duyurular alınamadı');
      return await response.json();
    } catch (error) {
      console.error('Duyuru hatası:', error);
      throw error;
    }
  },

  // Yeni duyuru oluştur
  createAnnouncement: async (announcementData) => {
    try {
      const response = await fetch('http://localhost:5223/api/announcement', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(announcementData)
      });
      if (!response.ok) throw new Error('Duyuru oluşturulamadı');
      return await response.json();
    } catch (error) {
      console.error('Duyuru oluşturma hatası:', error);
      throw error;
    }
  },

  // Duyuru güncelle
  updateAnnouncement: async (id, announcementData) => {
    try {
      const response = await fetch(`http://localhost:5223/api/announcement/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(announcementData)
      });
      if (!response.ok) throw new Error('Duyuru güncellenemedi');
      return true;
    } catch (error) {
      console.error('Duyuru güncelleme hatası:', error);
      throw error;
    }
  },

  // Duyuru sil
  deleteAnnouncement: async (id) => {
    try {
      const response = await fetch(`http://localhost:5223/api/announcement/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Duyuru silinemedi');
      return true;
    } catch (error) {
      console.error('Duyuru silme hatası:', error);
      throw error;
    }
  },

  // Duyuru istatistiklerini getir
  getAnnouncementStats: async () => {
    try {
      const response = await fetch('http://localhost:5223/api/announcement/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('İstatistikler alınamadı');
      return await response.json();
    } catch (error) {
      console.error('İstatistik hatası:', error);
      throw error;
    }
  }
};

function AnnouncementManagement() {
  // State yönetimi
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    important: 0,
    urgent: 0,
    general: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'Duyuru',
    category: 'Genel',
    isImportant: false,
    isUrgent: false
  });

  // Kategori seçenekleri
  const categories = [
    { value: 'Genel', label: 'Genel', color: '#1976d2', icon: <InfoIcon /> }
  ];

  const types = [
    { value: 'Duyuru', label: 'Duyuru' },
    { value: 'Şikayet', label: 'Şikayet' },
    { value: 'Öneri', label: 'Öneri' }
  ];

  // Sayfa yüklendiğinde duyuruları getir
  useEffect(() => {
    loadAnnouncements();
    loadStats();
  }, []);

  // Duyuruları yükle
  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementApi.getAllAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Duyurular yüklenirken hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // İstatistikleri yükle
  const loadStats = async () => {
    try {
      const data = await announcementApi.getAnnouncementStats();
      setStats(data);
    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
    }
  };

  // Form temizle
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'Duyuru',
      category: 'Genel',
      isImportant: false,
      isUrgent: false
    });
    setEditingAnnouncement(null);
  };

  // Dialog aç
  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type || 'Duyuru',
        category: announcement.category,
        isImportant: announcement.isImportant,
        isUrgent: announcement.isUrgent
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  // Dialog kapat
  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  // Duyuru kaydet
  const handleSaveAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setSnackbar({
        open: true,
        message: 'Lütfen tüm alanları doldurun',
        severity: 'warning'
      });
      return;
    }

    try {
      setProcessing(true);
      
      if (editingAnnouncement) {
        await announcementApi.updateAnnouncement(editingAnnouncement.id, formData);
        setSnackbar({
          open: true,
          message: 'Duyuru başarıyla güncellendi',
          severity: 'success'
        });
      } else {
        await announcementApi.createAnnouncement(formData);
        setSnackbar({
          open: true,
          message: 'Duyuru başarıyla oluşturuldu',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
      loadAnnouncements();
      loadStats();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'İşlem başarısız',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Duyuru sil
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setProcessing(true);
      await announcementApi.deleteAnnouncement(id);
      
      setSnackbar({
        open: true,
        message: 'Duyuru başarıyla silindi',
        severity: 'success'
      });
      
      loadAnnouncements();
      loadStats();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Silme işlemi başarısız',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Kategori rengi
  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : '#1976d2';
  };

  // Kategori ikonu
  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : <InfoIcon />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1, py: 3 }}>
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
          Duyuru Yönetimi
        </Typography>
      </motion.div>

      {/* İstatistik Kartları - en üstte yan yana ve daha sıkı boşluklarla */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
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
                    <AnnouncementIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                  </Badge>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Toplam Duyuru
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
                  <Badge badgeContent={stats.important} color="warning" sx={{ mr: 2 }}>
                    <WarningIcon sx={{ fontSize: 40, color: '#f57c00' }} />
                  </Badge>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                      {stats.important}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Önemli Duyuru
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
            <Card sx={{ background: 'linear-gradient(135deg, #d32f2f15, #d32f2f05)' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={stats.urgent} color="error" sx={{ mr: 2 }}>
                    <AnnouncementIcon sx={{ fontSize: 40, color: '#d32f2f' }} />
                  </Badge>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                      {stats.urgent}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Acil Duyuru
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
            <Card sx={{ background: 'linear-gradient(135deg, #388e3c15, #388e3c05)' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={stats.general} color="success" sx={{ mr: 2 }}>
                    <InfoIcon sx={{ fontSize: 40, color: '#388e3c' }} />
                  </Badge>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                      {stats.general}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Genel Duyuru
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Duyurular Tablosu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                Duyuru Listesi
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ backgroundColor: '#1976d2' }}
              >
                Yeni Duyuru
              </Button>
            </Box>
            
            <TableContainer component={Paper} sx={{ maxHeight: 720, overflowX: 'hidden' }}>
              <Table stickyHeader sx={{ tableLayout: 'auto', width: '100%' }} size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Başlık</TableCell>
                    <TableCell>Kategori</TableCell>
                    <TableCell>Önem</TableCell>
                    <TableCell>Yazar</TableCell>
                    <TableCell>Tarih</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement.id} hover>
                      <TableCell sx={{ whiteSpace: 'normal', py: 1.25 }}>
                        <Box display="flex" alignItems="center">
                          {getCategoryIcon(announcement.category)}
                          <Typography variant="body2" sx={{ ml: 1, wordBreak: 'break-word' }}>
                            {announcement.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={announcement.category} 
                          size="small"
                          sx={{ 
                            backgroundColor: getCategoryColor(announcement.category),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {announcement.isImportant && (
                            <Chip label="Önemli" size="small" color="warning" />
                          )}
                          {announcement.isUrgent && (
                            <Chip label="Acil" size="small" color="error" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box display="flex" alignItems="center">
                          <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {announcement.authorName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box display="flex" alignItems="center">
                          <CalendarIcon sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(announcement)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            color="error"
                            disabled={processing}
                          >
                            <DeleteIcon />
                          </IconButton>
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

      {/* Duyuru Ekleme/Düzenleme Dialog'u */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AnnouncementIcon sx={{ mr: 1, color: '#1976d2' }} />
            {editingAnnouncement ? 'Duyuru Düzenle' : 'Yeni Duyuru Oluştur'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Duyuru Başlığı"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                variant="outlined"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tür</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Tür"
                >
                  {types.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      <Typography>{t.label}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2}>
                <Chip
                  label="Önemli"
                  color={formData.isImportant ? "warning" : "default"}
                  onClick={() => setFormData({ ...formData, isImportant: !formData.isImportant })}
                  clickable
                />
                <Chip
                  label="Acil"
                  color={formData.isUrgent ? "error" : "default"}
                  onClick={() => setFormData({ ...formData, isUrgent: !formData.isUrgent })}
                  clickable
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Duyuru İçeriği"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                variant="outlined"
                multiline
                rows={6}
                required
                placeholder="Duyuru içeriğini buraya yazın..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={processing}>
            İptal
          </Button>
          <Button 
            onClick={handleSaveAnnouncement} 
            variant="contained" 
            color="primary"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {processing ? 'Kaydediliyor...' : (editingAnnouncement ? 'Güncelle' : 'Oluştur')}
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

export default AnnouncementManagement; 