import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../api/announcementApi';

// Duyuru, şikayet ve öneri sayfası
function Announcements() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'Duyuru',
    targetBlogNumber: ''
  });

  // Kullanıcı bilgisini al
  const user = JSON.parse(localStorage.getItem('user'));

  // Duyuru/şikayet listesi
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');

  // Duyuruları yükle
  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
      setError(null);
    } catch (err) {
      setError('Duyurular yüklenirken hata oluştu: ' + err.message);
      console.error('Duyurular yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    const q = search.trim().toLowerCase();
    const matchesText = q === '' || [a.title, a.content, a.authorName].filter(Boolean).some(x => String(x).toLowerCase().includes(q));
    const matchesType = !typeFilter || a.type === typeFilter;
    const matchesBlock = !blockFilter || (a.targetBlogNumber || '').toLowerCase() === blockFilter.toLowerCase();
    return matchesText && matchesType && matchesBlock;
  });

  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setAnnouncementForm({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        targetBlogNumber: announcement.targetBlogNumber || ''
      });
    } else {
      setEditingAnnouncement(null);
      setAnnouncementForm({ title: '', content: '', type: 'Duyuru', targetBlogNumber: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAnnouncement(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingAnnouncement) {
        // Güncelleme işlemi
        await updateAnnouncement(editingAnnouncement.id, announcementForm);
      } else {
        // Yeni oluşturma
        await createAnnouncement(announcementForm);
      }
      handleCloseDialog();
      loadAnnouncements(); // Listeyi yenile
    } catch (err) {
      setError('Duyuru kaydedilirken hata oluştu: ' + err.message);
      console.error('Duyuru kaydedilirken hata:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
      try {
        await deleteAnnouncement(id);
        loadAnnouncements(); // Listeyi yenile
      } catch (err) {
        setError('Duyuru silinirken hata oluştu: ' + err.message);
        console.error('Duyuru silinirken hata:', err);
      }
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Duyuru': return 'primary';
      case 'Şikayet': return 'error';
      case 'Öneri': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Duyurular</Typography>
        {(user?.role === 'Site Yöneticisi' || user?.role === 'Kapıcı') && (
          <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
            Duyuru Yayınla
          </Button>
        )}
      </Box>

      {/* Hata mesajı */}
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
          <Typography>{error}</Typography>
        </Box>
      )}

      {/* Yükleniyor */}
      {loading && (
        <Box sx={{ mb: 2, p: 2, textAlign: 'center' }}>
          <Typography>Duyurular yükleniyor...</Typography>
        </Box>
      )}

      {/* Arama & Filtreler */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField value={search} onChange={(e)=>setSearch(e.target.value)} label="Ara (başlık/içerik/yazar)" size="small" sx={{ minWidth: 260 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Tür</InputLabel>
          <Select value={typeFilter} label="Tür" onChange={(e)=>setTypeFilter(e.target.value)}>
            <MenuItem value="">Hepsi</MenuItem>
            <MenuItem value="Duyuru">Duyuru</MenuItem>
            <MenuItem value="Şikayet">Şikayet</MenuItem>
            <MenuItem value="Öneri">Öneri</MenuItem>
          </Select>
        </FormControl>
        <TextField value={blockFilter} onChange={(e)=>setBlockFilter(e.target.value)} label="Blok" placeholder="Ör: H" size="small" sx={{ width: 100 }} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {announcement.title}
                </Typography>
                <Chip 
                  label={announcement.type} 
                  color={getTypeColor(announcement.type)}
                  size="small"
                />
              </Box>
              <Typography variant="body1" paragraph>
                {announcement.content}
              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Yazan: {announcement.authorName} ({announcement.authorRole})
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                  </Typography>
                </Box>
            </CardContent>
            {(user?.role === 'Site Yöneticisi' || (user?.role === 'Kapıcı' && announcement.targetBlogNumber && user?.blogNumber && announcement.targetBlogNumber === user.blogNumber)) && (
              <CardActions>
                <Button size="small" color="primary" onClick={() => handleOpenDialog(announcement)}>
                  Düzenle
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(announcement.id)}>
                  Sil
                </Button>
              </CardActions>
            )}
          </Card>
        ))}
      </Box>

      {/* Duyuru/şikayet/öneri ekleme dialog'u */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAnnouncement ? 'Duyuru Düzenle' : 'Duyuru Yayınla'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Başlık"
            value={announcementForm.title}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="İçerik"
            value={announcementForm.content}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Tür</InputLabel>
            <Select
              value={announcementForm.type}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
            >
              <MenuItem value="Duyuru">Duyuru</MenuItem>
            </Select>
          </FormControl>
          {user?.role === 'Kapıcı' && (
            <TextField
              fullWidth
              label="Hedef Blok (ör. A1)"
              value={announcementForm.targetBlogNumber}
              onChange={(e)=> setAnnouncementForm({ ...announcementForm, targetBlogNumber: e.target.value })}
              margin="normal"
              required
              helperText="Sadece görevli olduğunuz bloklara yayınlayabilirsiniz"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAnnouncement ? 'Güncelle' : 'Yayınla'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Announcements; 