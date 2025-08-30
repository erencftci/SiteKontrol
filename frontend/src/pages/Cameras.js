import React, { useState, useEffect, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { listCameras, createCamera, updateCamera, deleteCamera } from '../api/cameraApi';

// Kamera sistemi sayfası
function Cameras() {
  const [cameras, setCameras] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameraForm, setCameraForm] = useState({
    name: '',
    location: '',
    ipAddress: '',
    status: 'Aktif',
    recording: false,
    resolution: '1080p'
  });

  const load = async () => {
    try {
      const data = await listCameras();
      // Map storage percent to string for UI helper
      setCameras((data||[]).map(c => ({
        ...c,
        storageUsed: (c.storageUsed ?? 0) + '%',
        lastMaintenance: c.lastMaintenance ? String(c.lastMaintenance).slice(0,10) : ''
      })));
    } catch (e) {
      // sessiz, UI'da boş liste kalır
      setCameras([]);
    }
  };

  useEffect(() => { load(); }, []);

  // localStorage kullanımını kaldırdık; veriler backend'de.

  const handleOpenDialog = (camera = null) => {
    if (camera) {
      setEditingCamera(camera);
      setCameraForm({
        name: camera.name,
        location: camera.location,
        ipAddress: camera.ipAddress,
        status: camera.status,
        recording: camera.recording,
        resolution: camera.resolution,
        lastMaintenance: camera.lastMaintenance || '',
        storageUsed: camera.storageUsed || '0%'
      });
    } else {
      setEditingCamera(null);
      setCameraForm({
        name: '',
        location: '',
        ipAddress: '',
        status: 'Aktif',
        recording: false,
        resolution: '1080p',
        lastMaintenance: '',
        storageUsed: '0%'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCamera(null);
  };

  const handleSubmit = async () => {
    const payload = {
      name: cameraForm.name,
      location: cameraForm.location,
      ipAddress: cameraForm.ipAddress,
      status: cameraForm.status,
      recording: cameraForm.recording,
      resolution: cameraForm.resolution,
      lastMaintenance: cameraForm.lastMaintenance ? new Date(cameraForm.lastMaintenance).toISOString() : null,
      storageUsedPercent: Number(String(cameraForm.storageUsed||'0').replace('%','')) || 0
    };
    if (editingCamera) {
      await updateCamera(editingCamera.id, payload);
    } else {
      await createCamera(payload);
    }
    handleCloseDialog();
    await load();
  };

  const handleDelete = async (cameraId) => {
    if (window.confirm('Bu kamerayı silmek istediğinizden emin misiniz?')) {
      await deleteCamera(cameraId);
      await load();
    }
  };

  const toggleRecording = async (cameraId) => {
    const cam = cameras.find(c=>c.id===cameraId);
    if (!cam) return;
    const payload = {
      name: cam.name,
      location: cam.location,
      ipAddress: cam.ipAddress,
      status: cam.status,
      recording: !cam.recording,
      resolution: cam.resolution,
      lastMaintenance: cam.lastMaintenance ? new Date(cam.lastMaintenance).toISOString() : null,
      storageUsedPercent: Number(String(cam.storageUsed||'0').replace('%','')) || 0
    };
    await updateCamera(cameraId, payload);
    await load();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aktif': return 'success';
      case 'Arızalı': return 'error';
      case 'Bakım': return 'warning';
      default: return 'default';
    }
  };

  const getStorageColor = (storage) => {
    const percentage = parseInt(storage);
    if (percentage > 80) return 'error';
    if (percentage > 60) return 'warning';
    return 'success';
  };

  // İstatistik verileri (dinamik) — Aktif/Pasif (duruma göre)
  const cameraStats = useMemo(() => {
    const activeCount = cameras.filter(c => c.status === 'Aktif').length;
    const passiveCount = cameras.length - activeCount; // Arızalı + Bakım
    return [{ name: 'Şimdi', aktif: activeCount, pasif: passiveCount }];
  }, [cameras]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#d32f2f' }}>
          Kamera Sistemi
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
          onClick={() => handleOpenDialog()}
        >
          Yeni Kamera
        </Button>
      </Box>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #d32f2f15, #d32f2f05)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#d32f2f' }}>
                {cameras.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Toplam Kamera
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #388e3c15, #388e3c05)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#388e3c' }}>
                {cameras.filter(c => c.status === 'Aktif').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Aktif Kamera
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f57c0015, #f57c0005)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#f57c00' }}>
                {cameras.filter(c => c.recording).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Kayıt Yapan
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #1976d215, #1976d205)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#1976d2' }}>
                {cameras.filter(c => c.status === 'Arızalı').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Arızalı Kamera
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafik */}
      <Card sx={{ mb: 3, maxWidth: 720, mx: 'auto' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Kamera İstatistikleri
          </Typography>
          <Box sx={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cameraStats}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="aktif" fill="#388e3c" name="Aktif" />
                <Bar dataKey="pasif" fill="#d32f2f" name="Pasif" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Kamera Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cameras.map((camera) => (
          <Grid item xs={12} md={6} lg={4} key={camera.id}>
            <Card sx={{ 
              height: '100%',
              border: camera.status === 'Arızalı' ? '2px solid #f44336' : '1px solid #e0e0e0'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{camera.name}</Typography>
                  <Chip 
                    label={camera.status} 
                    color={getStatusColor(camera.status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Konum:</strong> {camera.location}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>IP:</strong> {camera.ipAddress}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Çözünürlük:</strong> {camera.resolution}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Chip 
                    label={`Depolama: ${camera.storageUsed}`}
                    color={getStorageColor(camera.storageUsed)}
                    size="small"
                  />
                  <Box>
                    <IconButton 
                      size="small" 
                      color={camera.recording ? 'error' : 'default'}
                      onClick={() => toggleRecording(camera.id)}
                    >
                      {camera.recording ? <FiberManualRecordIcon /> : <StopIcon />}
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(camera)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(camera.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Kamera Listesi Tablosu */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Kamera Detayları
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kamera Adı</TableCell>
                  <TableCell>Konum</TableCell>
                  <TableCell>IP Adresi</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Kayıt</TableCell>
                  <TableCell>Çözünürlük</TableCell>
                  <TableCell>Depolama</TableCell>
                  <TableCell>Son Bakım</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cameras.map((camera) => (
                  <TableRow key={camera.id}>
                    <TableCell>{camera.name}</TableCell>
                    <TableCell>{camera.location}</TableCell>
                    <TableCell>{camera.ipAddress}</TableCell>
                    <TableCell>
                      <Chip 
                        label={camera.status} 
                        color={getStatusColor(camera.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={camera.recording ? 'Aktif' : 'Pasif'}
                        color={camera.recording ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{camera.resolution}</TableCell>
                    <TableCell>
                      <Chip 
                        label={camera.storageUsed}
                        color={getStorageColor(camera.storageUsed)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{camera.lastMaintenance}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleRecording(camera.id)}>
                        {camera.recording ? <StopIcon /> : <PlayArrowIcon />}
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog(camera)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(camera.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Kamera Ekleme/Düzenleme Dialog'u */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCamera ? 'Kamera Düzenle' : 'Yeni Kamera Ekle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Kamera Adı"
            value={cameraForm.name}
            onChange={(e) => setCameraForm({ ...cameraForm, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Konum"
            value={cameraForm.location}
            onChange={(e) => setCameraForm({ ...cameraForm, location: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="IP Adresi"
            value={cameraForm.ipAddress}
            onChange={(e) => setCameraForm({ ...cameraForm, ipAddress: e.target.value })}
            margin="normal"
            required
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Durum</InputLabel>
                <Select
                  value={cameraForm.status}
                  onChange={(e) => setCameraForm({ ...cameraForm, status: e.target.value })}
                >
                  <MenuItem value="Aktif">Aktif</MenuItem>
                  <MenuItem value="Arızalı">Arızalı</MenuItem>
                  <MenuItem value="Bakım">Bakım</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Çözünürlük</InputLabel>
                <Select
                  value={cameraForm.resolution}
                  onChange={(e) => setCameraForm({ ...cameraForm, resolution: e.target.value })}
                >
                  <MenuItem value="720p">720p</MenuItem>
                  <MenuItem value="1080p">1080p</MenuItem>
                  <MenuItem value="4K">4K</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Son Bakım (YYYY-MM-DD)"
                value={cameraForm.lastMaintenance}
                onChange={(e) => setCameraForm({ ...cameraForm, lastMaintenance: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Depolama (%)"
                value={cameraForm.storageUsed}
                onChange={(e) => setCameraForm({ ...cameraForm, storageUsed: e.target.value })}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
          >
            {editingCamera ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Cameras;
