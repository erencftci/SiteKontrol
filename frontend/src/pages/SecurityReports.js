import React, { useState, useEffect } from 'react';
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
import ReportIcon from '@mui/icons-material/Report';
import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Güvenlik raporları sayfası
function SecurityReports() {
  const [reports, setReports] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    incidentType: 'Genel',
    severity: 'Düşük',
    location: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Örnek rapor verileri
  const sampleReports = [
    {
      id: 1,
      title: 'Şüpheli Kişi Tespiti',
      description: 'Site girişinde şüpheli davranış sergileyen kişi tespit edildi.',
      incidentType: 'Güvenlik İhlali',
      severity: 'Yüksek',
      location: 'Ana Giriş',
      date: '2024-01-15',
      status: 'Çözüldü',
      reportedBy: 'Ahmet Güvenlik'
    },
    {
      id: 2,
      title: 'Kamera Arızası',
      description: 'B Blok kamera sistemi arızalı, teknik servis çağrıldı.',
      incidentType: 'Teknik Arıza',
      severity: 'Orta',
      location: 'B Blok',
      date: '2024-01-14',
      status: 'İşlemde',
      reportedBy: 'Mehmet Güvenlik'
    },
    {
      id: 3,
      title: 'Ziyaretçi Kayıt Hatası',
      description: 'Ziyaretçi kayıt sisteminde teknik sorun yaşandı.',
      incidentType: 'Sistem Hatası',
      severity: 'Düşük',
      location: 'Güvenlik Odası',
      date: '2024-01-13',
      status: 'Çözüldü',
      reportedBy: 'Ali Güvenlik'
    }
  ];

  useEffect(() => {
    setReports(sampleReports);
  }, []);

  const handleOpenDialog = (report = null) => {
    if (report) {
      setEditingReport(report);
      setReportForm({
        title: report.title,
        description: report.description,
        incidentType: report.incidentType,
        severity: report.severity,
        location: report.location,
        date: report.date
      });
    } else {
      setEditingReport(null);
      setReportForm({
        title: '',
        description: '',
        incidentType: 'Genel',
        severity: 'Düşük',
        location: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingReport(null);
  };

  const handleSubmit = () => {
    if (editingReport) {
      // Güncelleme
      setReports(reports.map(r => 
        r.id === editingReport.id 
          ? { ...r, ...reportForm }
          : r
      ));
    } else {
      // Yeni rapor
      const newReport = {
        id: Date.now(),
        ...reportForm,
        status: 'Yeni',
        reportedBy: 'Mevcut Güvenlik'
      };
      setReports([newReport, ...reports]);
    }
    handleCloseDialog();
  };

  const handleDelete = (reportId) => {
    if (window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      setReports(reports.filter(r => r.id !== reportId));
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Yüksek': return 'error';
      case 'Orta': return 'warning';
      case 'Düşük': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Çözüldü': return 'success';
      case 'İşlemde': return 'warning';
      case 'Yeni': return 'info';
      default: return 'default';
    }
  };

  // İstatistik verileri
  const severityStats = [
    { name: 'Yüksek', value: 3, color: '#f44336' },
    { name: 'Orta', value: 8, color: '#ff9800' },
    { name: 'Düşük', value: 15, color: '#4caf50' }
  ];

  const monthlyStats = [
    { month: 'Ocak', incidents: 12, resolved: 10 },
    { month: 'Şubat', incidents: 8, resolved: 7 },
    { month: 'Mart', incidents: 15, resolved: 12 },
    { month: 'Nisan', incidents: 10, resolved: 9 }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#d32f2f' }}>
          Güvenlik Raporları
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
          onClick={() => handleOpenDialog()}
        >
          Yeni Rapor
        </Button>
      </Box>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #d32f2f15, #d32f2f05)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#d32f2f' }}>
                {reports.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Toplam Rapor
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f57c0015, #f57c0005)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#f57c00' }}>
                {reports.filter(r => r.status === 'Yeni').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Yeni Raporlar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #388e3c15, #388e3c05)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#388e3c' }}>
                {reports.filter(r => r.status === 'Çözüldü').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Çözülen Raporlar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #1976d215, #1976d205)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#1976d2' }}>
                {reports.filter(r => r.severity === 'Yüksek').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Yüksek Öncelikli
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafikler */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Öncelik Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {severityStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aylık Olay İstatistikleri
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyStats}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="incidents" fill="#d32f2f" name="Olaylar" />
                  <Bar dataKey="resolved" fill="#388e3c" name="Çözülen" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Raporlar Tablosu */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Güvenlik Raporları Listesi
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Başlık</TableCell>
                  <TableCell>Tip</TableCell>
                  <TableCell>Öncelik</TableCell>
                  <TableCell>Konum</TableCell>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Rapor Eden</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{report.title}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {report.description.substring(0, 50)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.incidentType} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.severity} 
                        color={getSeverityColor(report.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{report.location}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>
                      <Chip 
                        label={report.status} 
                        color={getStatusColor(report.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{report.reportedBy}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(report)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(report.id)}>
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

      {/* Rapor Ekleme/Düzenleme Dialog'u */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingReport ? 'Rapor Düzenle' : 'Yeni Güvenlik Raporu'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Rapor Başlığı"
            value={reportForm.title}
            onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Açıklama"
            value={reportForm.description}
            onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Olay Tipi</InputLabel>
                <Select
                  value={reportForm.incidentType}
                  onChange={(e) => setReportForm({ ...reportForm, incidentType: e.target.value })}
                >
                  <MenuItem value="Genel">Genel</MenuItem>
                  <MenuItem value="Güvenlik İhlali">Güvenlik İhlali</MenuItem>
                  <MenuItem value="Teknik Arıza">Teknik Arıza</MenuItem>
                  <MenuItem value="Sistem Hatası">Sistem Hatası</MenuItem>
                  <MenuItem value="Ziyaretçi Sorunu">Ziyaretçi Sorunu</MenuItem>
                  <MenuItem value="Kargo Sorunu">Kargo Sorunu</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Öncelik</InputLabel>
                <Select
                  value={reportForm.severity}
                  onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                >
                  <MenuItem value="Düşük">Düşük</MenuItem>
                  <MenuItem value="Orta">Orta</MenuItem>
                  <MenuItem value="Yüksek">Yüksek</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Konum"
            value={reportForm.location}
            onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Tarih"
            type="date"
            value={reportForm.date}
            onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
          >
            {editingReport ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SecurityReports;
