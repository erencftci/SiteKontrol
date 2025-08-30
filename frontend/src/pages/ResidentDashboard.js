import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import PeopleIcon from '@mui/icons-material/People';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MessageIcon from '@mui/icons-material/Message';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ReportIcon from '@mui/icons-material/Report';
import PaymentIcon from '@mui/icons-material/Payment';
import { getRequests } from '../api/requestApi';
import { getParcelDaily } from '../api/parcelApi';
import { getMyDues } from '../api/dueApi';

// Site Sakini rolü için özel menü öğeleri
const residentMenuItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/resident-dashboard', roles: ['Site Sakini'] },
  { text: 'Taleplerim', icon: <AssignmentIcon />, path: '/requests', roles: ['Site Sakini'] },
  { text: 'Misafir Bildirimi', icon: <GroupAddIcon />, path: '/visitors', roles: ['Site Sakini'] },
  { text: 'Kargolarım', icon: <LocalShippingIcon />, path: '/parcels', roles: ['Site Sakini'] },
  { text: 'Şikayet/Öneri', icon: <ReportIcon />, path: '/complaints', roles: ['Site Sakini'] },
  { text: 'Aidat Ödemeleri', icon: <PaymentIcon />, path: '/payments', roles: ['Site Sakini'] },
  { text: 'Duyurular', icon: <AnnouncementIcon />, path: '/announcements', roles: ['Site Sakini'] },
  { text: 'Mesajlar', icon: <MessageIcon />, path: '/messages', roles: ['Site Sakini'] },
];

function ResidentDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  
  // Site Sakini rolü için yeşil tema
  const residentTheme = {
    primary: '#388e3c', // Yeşil
    secondary: '#2e7d32',
    background: '#fafafa'
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    // Çıkış işlemi
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Dinamik göstergeler (yükleme sonrası hesaplanır)
  const [residentStats, setResidentStats] = useState([
    { title: 'Aktif Taleplerim', value: 0, icon: <AssignmentIcon />, color: '#388e3c', desc: 'Yanıt bekleyen talepler' },
    { title: 'Bekleyen Kargo', value: 0, icon: <LocalShippingIcon />, color: '#f57c00', desc: 'Teslim edilecek kargo' },
    { title: 'Toplam Aidat', value: '₺0', icon: <PaymentIcon />, color: '#1976d2', desc: 'Toplam borç tutarı' },
    { title: 'Yeni Duyuru', value: 0, icon: <AnnouncementIcon />, color: '#d32f2f', desc: 'Okunmamış duyuru' },
  ]);

  // Grafik verileri state
  const [residentChartData, setResidentChartData] = useState([]);

  // Aidat ödemeleri pasta grafiği
  const [paymentData, setPaymentData] = useState([
    { name: 'Ödendi', value: 0, color: '#388e3c' },
    { name: 'Beklemede', value: 0, color: '#f57c00' },
    { name: 'Gecikmiş', value: 0, color: '#d32f2f' },
  ]);

  // Verileri yükle
  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    let isMounted = true;

    const buildLast7Days = () => {
      const days = [];
      const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days.push({ key, label: dayNames[d.getDay()] });
      }
      return days;
    };

    const load = async () => {
      try {
        const [allRequests, parcelDaily, dues] = await Promise.all([
          getRequests(),
          getParcelDaily(7),
          getMyDues(),
        ]);

        // Kullanıcının talepleri
        const myRequests = (allRequests || []).filter(r => r.requesterName === user?.name);
        const activeReqCount = myRequests.filter(r => r.status !== 'Tamamlandı').length;

        // Aidatlar: toplam ve ödenen/bekleyen sayıları + günlük oluşum sayısı
        const totalDue = dues.reduce((s, d) => s + Number(d.amount), 0);
        const paidCount = dues.filter(d => d.isPaid).length;
        const unpaidCount = dues.filter(d => !d.isPaid).length;

        // Haftalık dağılım
        const last7 = buildLast7Days();
        const reqByDay = new Map();
        last7.forEach(d => reqByDay.set(d.key, 0));
        myRequests.forEach(r => {
          const k = new Date(r.createdAt).toISOString().slice(0, 10);
          if (reqByDay.has(k)) reqByDay.set(k, (reqByDay.get(k) || 0) + 1);
        });

        const dueByDay = new Map();
        last7.forEach(d => dueByDay.set(d.key, 0));
        dues.forEach(d => {
          const k = new Date(d.createdAt).toISOString().slice(0, 10);
          if (dueByDay.has(k)) dueByDay.set(k, (dueByDay.get(k) || 0) + 1);
        });

        // Parcel daily zaten tarih/count içeriyor (site geneli)
        const parcelByDay = new Map();
        last7.forEach(d => parcelByDay.set(d.key, 0));
        (parcelDaily || []).forEach(p => {
          if (p?.date && typeof p.count === 'number' && parcelByDay.has(p.date)) {
            parcelByDay.set(p.date, p.count);
          }
        });

        const chart = last7.map(d => ({
          name: d.label,
          talep: reqByDay.get(d.key) || 0,
          kargo: parcelByDay.get(d.key) || 0,
          aidat: dueByDay.get(d.key) || 0,
        }));

        if (!isMounted) return;
        setResidentChartData(chart);
        setPaymentData([
          { name: 'Ödendi', value: paidCount, color: '#388e3c' },
          { name: 'Beklemede', value: unpaidCount, color: '#f57c00' },
          { name: 'Gecikmiş', value: 0, color: '#d32f2f' },
        ]);
        setResidentStats(prev => [
          { ...prev[0], value: activeReqCount },
          { ...prev[1], value: 0 },
          { ...prev[2], value: `₺${totalDue.toFixed(2)}` },
          { ...prev[3], value: 0 },
        ]);
      } catch (e) {
        // Sessiz geç
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: residentTheme.background }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: residentTheme.primary }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            SiteKontrol - Site Sakini Paneli
          </Typography>
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            backgroundColor: '#1a1a1a',
            color: 'white',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {residentMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(56, 142, 60, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Ana İçerik */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        
        {/* Hoşgeldin Mesajı */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" gutterBottom sx={{ color: residentTheme.primary, mb: 3 }}>
            Hoş Geldiniz!
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Site hizmetlerini takip etmek ve işlemlerinizi yönetmek için aşağıdaki araçları kullanabilirsiniz.
          </Typography>
        </motion.div>

        {/* İstatistik Kartları */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {residentStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card sx={{ 
                  height: '100%', 
                  background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`,
                  border: `1px solid ${stat.color}30`
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        backgroundColor: `${stat.color}20`,
                        color: stat.color,
                        mr: 2
                      }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h4" sx={{ color: stat.color, fontWeight: 'bold' }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {stat.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Hızlı Erişim Kartları */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, #388e3c15, #388e3c05)`,
                border: '1px solid #388e3c30'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: residentTheme.primary }}>
                    Yeni Talep Oluştur
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Bakım, temizlik veya diğer taleplerinizi iletebilirsiniz
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: residentTheme.primary,
                      '&:hover': { backgroundColor: residentTheme.secondary }
                    }}
                    onClick={() => navigate('/requests')}
                  >
                    Talep Oluştur
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, #1976d215, #1976d205)`,
                border: '1px solid #1976d230'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
                    Misafir Bildirimi
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Gelecek misafirlerinizi önceden bildirin
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: '#1976d2',
                      '&:hover': { backgroundColor: '#1565c0' }
                    }}
                    onClick={() => navigate('/visitors')}
                  >
                    Misafir Bildir
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Grafikler */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card sx={{ 
                background: `linear-gradient(135deg, #388e3c08, #388e3c03)`,
                border: '1px solid #388e3c20'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: residentTheme.primary }}>
                    Haftalık Aktivite
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={residentChartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="talep" fill="#388e3c" name="Talep" />
                      <Bar dataKey="kargo" fill="#f57c00" name="Kargo" />
                      <Bar dataKey="aidat" fill="#1976d2" name="Aidat" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card sx={{ 
                background: `linear-gradient(135deg, #388e3c08, #388e3c03)`,
                border: '1px solid #388e3c20',
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: residentTheme.primary }}>
                    Aidat Durumu
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    {paymentData.map((item, index) => (
                      <Typography key={index} variant="body2" sx={{ color: item.color }}>
                        {item.name}: {item.value}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default ResidentDashboard; 