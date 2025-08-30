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
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import { getVisitors, createVisitor, updateVisitorStatus, markVisitorEnter, markVisitorExit } from '../api/visitorApi';
import { getResidents } from '../api/userApi';

// Ziyaretçi ve misafir yönetimi sayfası
function Visitors() {
  const [openDialog, setOpenDialog] = useState(false);
  const [visitorForm, setVisitorForm] = useState({
    name: '',
    phone: '',
    purpose: '',
    residentName: '',
    expectedTime: new Date().toISOString().slice(0,16), // datetime-local default
    status: 'Beklemede',
    type: '',
    hasVehicle: false,
    vehiclePlate: ''
  });

  // Kullanıcı bilgisini al
  const user = JSON.parse(localStorage.getItem('user'));

  // Ziyaretçi/misafir listesi
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');

  // Ziyaretçileri yükle
  useEffect(() => {
    loadVisitors();
    loadResidents();
  }, []);

  const filteredVisitors = visitors.filter(v => {
    const q = search.trim().toLowerCase();
    const matchesText = q === '' || [
      v.name,
      v.purpose,
      v.residentName,
      v.vehiclePlate
    ].filter(Boolean).some(x => String(x).toLowerCase().includes(q));
    const matchesStatus = !statusFilter || v.status === statusFilter;
    const matchesBlock = !blockFilter || (v.residentBlogNumber || '').toString().toLowerCase() === blockFilter.toLowerCase();
    return matchesText && matchesStatus && matchesBlock;
  });

  const loadVisitors = async () => {
    try {
      setLoading(true);
      const data = await getVisitors();
      setVisitors(data);
      setError(null);
    } catch (err) {
      setError('Ziyaretçiler yüklenirken hata oluştu: ' + err.message);
      console.error('Ziyaretçiler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadResidents = async () => {
    try {
      const data = await getResidents();
      setResidents(data);
    } catch (err) {
      // ignore
    }
  };

  const handleOpenDialog = () => {
    setVisitorForm({
      name: '',
      phone: '',
      purpose: '',
      residentName: '',
      expectedTime: new Date().toISOString().slice(0,16),
      status: 'Beklemede',
      type: user?.role === 'Güvenlik' ? 'Ziyaretçi Kaydı' : 'Misafir Bildirimi',
      hasVehicle: false,
      vehiclePlate: '',
      // Site sakini ise kendi id'sini otomatik bağla
      residentId: user?.role === 'Site Sakini' ? user?.id : undefined
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      // Backend DTO: { name, phone, purpose, residentId, type, expectedTime(DateTime) }
      const payload = {
        name: visitorForm.name,
        phone: visitorForm.phone,
        purpose: visitorForm.purpose,
        residentId: visitorForm.residentId || user?.id || 1,
        type: user?.role === 'Güvenlik' ? 'Ziyaretçi Kaydı' : 'Misafir Bildirimi',
        expectedTime: new Date(visitorForm.expectedTime).toISOString(),
        hasVehicle: !!visitorForm.hasVehicle,
        vehiclePlate: visitorForm.hasVehicle ? (visitorForm.vehiclePlate || '').toUpperCase() : null
      };

      await createVisitor(payload);
      handleCloseDialog();
      loadVisitors(); // Listeyi yenile
    } catch (err) {
      setError('Ziyaretçi kaydedilirken hata oluştu: ' + err.message);
      console.error('Ziyaretçi kaydedilirken hata:', err);
    }
  };

  const handleStatusChange = async (visitorId, newStatus) => {
    try {
      await updateVisitorStatus(visitorId, newStatus);
      loadVisitors(); // Listeyi yenile
    } catch (err) {
      setError('Durum güncellenirken hata oluştu: ' + err.message);
      console.error('Durum güncellenirken hata:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Onaylandı': return 'success';
      case 'Beklemede': return 'warning';
      case 'Tamamlandı': return 'info';
      case 'Reddedildi': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ziyaretçi ve Misafir Yönetimi</Typography>
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          {user?.role === 'Güvenlik' ? 'Ziyaretçi Kaydı' : 'Misafir Bildir'}
        </Button>
      </Box>

      {/* Arama & Filtreler */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField value={search} onChange={(e)=>setSearch(e.target.value)} label="Ara (isim/amaç/daire/plaka)" size="small" sx={{ minWidth: 260 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Durum</InputLabel>
          <Select value={statusFilter} label="Durum" onChange={(e)=>setStatusFilter(e.target.value)}>
            <MenuItem value="">Hepsi</MenuItem>
            <MenuItem value="Beklemede">Beklemede</MenuItem>
            <MenuItem value="Onaylandı">Onaylandı</MenuItem>
            <MenuItem value="Reddedildi">Reddedildi</MenuItem>
            <MenuItem value="Tamamlandı">Tamamlandı</MenuItem>
          </Select>
        </FormControl>
        <TextField value={blockFilter} onChange={(e)=>setBlockFilter(e.target.value)} label="Blok" placeholder="Ör: H" size="small" sx={{ width: 100 }} />
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
          <Typography>Ziyaretçiler yükleniyor...</Typography>
        </Box>
      )}

      {/* Ziyaretçi/misafir listesi */}
      <Grid container spacing={2}>
        {filteredVisitors.map((visitor) => (
          <Grid item xs={12} md={6} key={visitor.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {visitor.name}
                  </Typography>
                  <Chip 
                    label={visitor.status} 
                    color={getStatusColor(visitor.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Telefon: {visitor.phone}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Amaç: {visitor.purpose}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Ziyaret Edilecek: {visitor.residentName}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Beklenen Zaman: {new Date(visitor.expectedTime).toLocaleString('tr-TR')}
                </Typography>
                {visitor.hasVehicle && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Araç: {visitor.vehiclePlate}
                  </Typography>
                )}
                {visitor.entryTime && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Giriş: {new Date(visitor.entryTime).toLocaleString('tr-TR')}
                  </Typography>
                )}
                {visitor.exitTime && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Çıkış: {new Date(visitor.exitTime).toLocaleString('tr-TR')}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Chip label={visitor.type} size="small" variant="outlined" />
                                  <Typography variant="body2" color="textSecondary">
                  {new Date(visitor.createdAt).toLocaleDateString('tr-TR')}
                </Typography>
                </Box>
              </CardContent>
              {user?.role === 'Güvenlik' && (
                <CardActions>
                  {visitor.status === 'Beklemede' && (
                    <>
                      <Button 
                        size="small" 
                        color="success" 
                        onClick={() => handleStatusChange(visitor.id, 'Onaylandı')}
                      >
                        Onayla
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        onClick={() => handleStatusChange(visitor.id, 'Reddedildi')}
                      >
                        Reddet
                      </Button>
                    </>
                  )}
                  {visitor.status === 'Onaylandı' && !visitor.entryTime && (
                    <Button size="small" onClick={async ()=>{try{await markVisitorEnter(visitor.id); loadVisitors();}catch(e){setError('Giriş işaretlenirken hata: '+e.message);}}}>
                      Giriş İşaretle
                    </Button>
                  )}
                  {visitor.status === 'Onaylandı' && visitor.entryTime && !visitor.exitTime && (
                    <Button size="small" onClick={async ()=>{try{await markVisitorExit(visitor.id); loadVisitors();}catch(e){setError('Çıkış işaretlenirken hata: '+e.message);}}}>
                      Çıkış İşaretle
                    </Button>
                  )}
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Ziyaretçi/misafir ekleme dialog'u */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {user?.role === 'Güvenlik' ? 'Ziyaretçi Kaydı' : 'Misafir Bildirimi'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Ad Soyad"
            value={visitorForm.name}
            onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Telefon"
            value={visitorForm.phone}
            onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Amaç"
            value={visitorForm.purpose}
            onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
            margin="normal"
            required
          />
          {/* Ziyaret edilecek daire/sakin seçimi */}
          <Autocomplete
            options={residents}
            getOptionLabel={(option) => `${option.name} (Blok ${option.blogNumber || '-'}, Daire ${option.apartmentNumber || '-'})`}
            onChange={(e, val) => setVisitorForm({ ...visitorForm, residentId: val?.id || null })}
            renderInput={(params) => (
              <TextField {...params} label="Ziyaret Edilecek Daire/Sakin" margin="normal" required />
            )}
          />
          <TextField
            fullWidth
            label="Beklenen Saat"
            type="datetime-local"
            value={visitorForm.expectedTime}
            onChange={(e) => setVisitorForm({ ...visitorForm, expectedTime: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="has-vehicle-label">Araç</InputLabel>
            <Select
              labelId="has-vehicle-label"
              value={visitorForm.hasVehicle ? 'Var' : 'Yok'}
              label="Araç"
              onChange={(e) => setVisitorForm({ ...visitorForm, hasVehicle: e.target.value === 'Var' })}
            >
              <MenuItem value="Yok">Yok</MenuItem>
              <MenuItem value="Var">Var</MenuItem>
            </Select>
          </FormControl>
          {visitorForm.hasVehicle && (
            <TextField
              fullWidth
              label="Plaka"
              value={visitorForm.vehiclePlate}
              onChange={(e) => setVisitorForm({ ...visitorForm, vehiclePlate: e.target.value.toUpperCase() })}
              margin="normal"
              inputProps={{ maxLength: 15 }}
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {user?.role === 'Güvenlik' ? 'Kaydet' : 'Bildir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Visitors; 