import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import { getParcels, createParcel, updateParcelStatus, getParcelNotes } from '../api/parcelApi';
import { createRequest } from '../api/requestApi';

// Kargo yönetimi sayfası (Güvenlik için)
function Parcels() {
  const [openDialog, setOpenDialog] = useState(false);
  const [parcelForm, setParcelForm] = useState({
    recipientName: '',
    phone: '',
    company: '',
    trackingNumber: '',
    status: 'Beklemede',
    blogNumber: '',
    apartmentNumber: ''
  });
  const [selectedBlock, setSelectedBlock] = useState('');

  // Kargo listesi
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState(null);

  // Kargoları yükle
  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    try {
      setLoading(true);
      const data = await getParcels();
      setParcels(data);
      // Site Sakini ve Kapıcı için kargonun notlarını da çek
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.role === 'Site Sakini' || user?.role === 'Kapıcı') {
        const noteMap = {};
        for (const p of data) {
          try { noteMap[p.id] = await getParcelNotes(p.id); } catch {}
        }
        setNotes(noteMap);
      }
      setError(null);
    } catch (err) {
      setError('Kargolar yüklenirken hata oluştu: ' + err.message);
      console.error('Kargolar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setParcelForm({
      recipientName: '',
      phone: '',
      company: '',
      trackingNumber: '',
      status: 'Beklemede'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      await createParcel({
        recipientName: parcelForm.recipientName,
        phone: parcelForm.phone,
        company: parcelForm.company,
        trackingNumber: parcelForm.trackingNumber,
        blogNumber: selectedBlock || undefined,
        apartmentNumber: parcelForm.apartmentNumber || undefined
      });
      handleCloseDialog();
      loadParcels(); // Listeyi yenile
    } catch (err) {
      setError('Kargo kaydedilirken hata oluştu: ' + err.message);
      console.error('Kargo kaydedilirken hata:', err);
    }
  };

  const handleStatusChange = async (parcelId, newStatus, note) => {
    try {
      await updateParcelStatus(parcelId, newStatus, note);
      loadParcels(); // Listeyi yenile
    } catch (err) {
      setError('Durum güncellenirken hata oluştu: ' + err.message);
      console.error('Durum güncellenirken hata:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Beklemede': return 'warning';
      case 'Teslim Edildi': return 'success';
      default: return 'default';
    }
  };

  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Kargo Yönetimi</Typography>
        {user?.role === 'Güvenlik' && (
          <Button variant="contained" color="primary" onClick={handleOpenDialog}>
            Kargo Kaydı
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
          <Typography>Kargolar yükleniyor...</Typography>
        </Box>
      )}

      {/* Kargo listesi */}
      <Grid container spacing={2}>
        {parcels.map((parcel) => (
          <Grid item xs={12} md={6} key={parcel.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {parcel.recipientName}
                  </Typography>
                  <Chip 
                    label={parcel.status} 
                    color={getStatusColor(parcel.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Telefon: {parcel.phone}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Blok/Daire: {parcel.blogNumber || '-'} / {parcel.apartmentNumber || '-'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Tarih: {new Date(parcel.createdAt).toLocaleDateString('tr-TR')}
                </Typography>
                {(user?.role === 'Site Sakini' || user?.role === 'Kapıcı') && (notes[parcel.id]?.length > 0) && (
                  <Box sx={{ 
                    mt: 1, 
                    p: 1.5, 
                    bgcolor: user?.role === 'Kapıcı' ? '#fff3e0' : '#e8f5e8', 
                    borderRadius: 1,
                    border: `1px solid ${user?.role === 'Kapıcı' ? '#ffb74d' : '#81c784'}`
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: user?.role === 'Kapıcı' ? '#e65100' : '#2e7d32',
                      fontWeight: 'bold',
                      display: 'block',
                      mb: 0.5
                    }}>
                      {user?.role === 'Kapıcı' ? 'Sakin Notları' : 'Notlarım'}
                    </Typography>
                    {(notes[parcel.id]||[]).map(n => (
                      <Typography key={n.id} variant="body2" sx={{ 
                        color: user?.role === 'Kapıcı' ? '#bf360c' : '#1b5e20',
                        fontWeight: 500
                      }}>
                        - {n.content}
                      </Typography>
                    ))}
                  </Box>
                )}
              </CardContent>
              <CardActions>
                {parcel.status === 'Beklemede' && user?.role === 'Kapıcı' && (
                  <Button 
                    size="small" 
                    color="success" 
                    onClick={() => handleStatusChange(parcel.id, 'Teslim Edildi')}
                  >
                    Teslim Edildi
                  </Button>
                )}
                {parcel.status === 'Beklemede' && user?.role === 'Site Sakini' && (
                  <Button
                    size="small"
                    color="primary"
                    onClick={async ()=>{
                      const note = prompt('Kargoya not ekle (ör. Kapıya bırak):');
                      if (note && note.trim()) {
                        try{
                          await handleStatusChange(parcel.id, 'Beklemede', note.trim());
                          alert('Not gönderildi');
                        }catch(e){ setError('Not gönderilemedi: '+e.message); }
                      }
                    }}
                  >
                    Not Bırak
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Kargo ekleme dialog'u */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Kargo Kaydı</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Alıcı Adı"
            value={parcelForm.recipientName}
            onChange={(e) => setParcelForm({ ...parcelForm, recipientName: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Telefon"
            value={parcelForm.phone}
            onChange={(e) => setParcelForm({ ...parcelForm, phone: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Kargo Şirketi"
            value={parcelForm.company}
            onChange={(e) => setParcelForm({ ...parcelForm, company: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Takip Numarası"
            value={parcelForm.trackingNumber}
            onChange={(e) => setParcelForm({ ...parcelForm, trackingNumber: e.target.value })}
            margin="normal"
            required
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Blok</InputLabel>
                <Select label="Blok" value={selectedBlock} onChange={(e)=>{setSelectedBlock(e.target.value); setParcelForm({...parcelForm, apartmentNumber: ''});}}>
                  {['A','B','C','D','E','F','G','H','I','J'].map(b => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption">Daire Seçimi</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 0.5 }}>
                  {Array.from({ length: 80 }, (_, i) => (i + 1)).map(num => (
                    <Button key={num} size="small" variant={parcelForm.apartmentNumber===String(num)?'contained':'outlined'} onClick={()=> setParcelForm({...parcelForm, apartmentNumber: String(num)})} sx={{ minWidth: 0, p: 0.5, fontSize: 11 }}>
                      {num}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Parcels; 