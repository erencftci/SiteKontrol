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
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MessageIcon from '@mui/icons-material/Message';
import SecurityIcon from '@mui/icons-material/Security';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect } from 'react';
import { getVisitorStats, getVisitorDaily } from '../api/visitorApi';
import { getParcelDaily } from '../api/parcelApi';
import { motion } from 'framer-motion';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ReportIcon from '@mui/icons-material/Report';

// Güvenlik rolü için özel menü öğeleri
const securityMenuItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/security-dashboard', roles: ['Güvenlik'] },
  { text: 'Ziyaretçi Kayıtları', icon: <GroupAddIcon />, path: '/visitors', roles: ['Güvenlik'] },
  { text: 'Kargo Takibi', icon: <LocalShippingIcon />, path: '/parcels', roles: ['Güvenlik'] },
  { text: 'Güvenlik Raporları', icon: <ReportIcon />, path: '/security-reports', roles: ['Güvenlik'] },
  { text: 'Kamera Sistemi', icon: <CameraAltIcon />, path: '/cameras', roles: ['Güvenlik'] },
  { text: 'Duyurular', icon: <AnnouncementIcon />, path: '/announcements', roles: ['Güvenlik'] },
  { text: 'Mesajlar', icon: <MessageIcon />, path: '/messages', roles: ['Güvenlik'] },
];

function SecurityDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  
  // Güvenlik rolü için kırmızı tema
  const securityTheme = {
    primary: '#d32f2f', // Kırmızı
    secondary: '#f44336',
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

  // Güvenlik odaklı istatistikler
  const [stats, setStats] = useState({ activeVisitors: 0, pendingVisitors: 0, parking: { capacity: 80, occupied: 0 } });

  const securityStats = [
    { title: 'Aktif Ziyaretçi', value: stats.activeVisitors, icon: <GroupAddIcon />, color: '#d32f2f', desc: 'Şu an sitede bulunan ziyaretçi' },
    { title: 'Bekleyen Kargo', value: 5, icon: <LocalShippingIcon />, color: '#f57c00', desc: 'Teslim edilmeyi bekleyen kargo' },
    { title: 'Kamera Aktif', value: 16, icon: <CameraAltIcon />, color: '#388e3c', desc: 'Aktif kamera sayısı' },
    { title: 'Misafir Otoparkı', value: `${stats.parking?.capacity ?? 80}/${stats.parking?.occupied ?? 0}`, icon: <LocalShippingIcon />, color: '#1976d2', desc: 'Kapasite/Dolu' },
  ];

  // Güvenlik odaklı grafik verileri
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, visitorsDaily, parcelsDaily] = await Promise.all([
          getVisitorStats(),
          getVisitorDaily(7),
          getParcelDaily(7)
        ]);
        setStats(s);

        // Gün adları için yardımcı
        const dayMap = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
        const merge = {};
        visitorsDaily.forEach(v => { merge[v.date] = { date: v.date, ziyaretci: v.count, kargo: 0 }; });
        parcelsDaily.forEach(p => { merge[p.date] = { ...(merge[p.date]||{date:p.date, ziyaretci:0}), kargo: p.count }; });
        const merged = Object.values(merge)
          .sort((a,b)=> a.date.localeCompare(b.date))
          .map(x => ({ name: dayMap[new Date(x.date+'T00:00:00').getDay()-1>=0?new Date(x.date+'T00:00:00').getDay()-1:6], ziyaretci: x.ziyaretci, kargo: x.kargo }));
        setChartData(merged);
      } catch (e) {
        // ignore for now
      }
    })();
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: securityTheme.background }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: securityTheme.primary }}>
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
            SiteKontrol - Güvenlik Paneli
          </Typography>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
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
            {securityMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
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
          <Typography variant="h4" gutterBottom sx={{ color: securityTheme.primary, mb: 3 }}>
            Güvenlik Paneli
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Site güvenliğini yönetmek için aşağıdaki araçları kullanabilirsiniz.
          </Typography>
        </motion.div>

        {/* İstatistik Kartları */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {securityStats.map((stat, index) => (
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
                background: `linear-gradient(135deg, #d32f2f15, #d32f2f05)`,
                border: '1px solid #d32f2f30'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: securityTheme.primary }}>
                    Ziyaretçi Yönetimi
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Yeni ziyaretçi kaydı oluşturun ve mevcut ziyaretçileri takip edin
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: securityTheme.primary,
                      '&:hover': { backgroundColor: securityTheme.secondary }
                    }}
                    onClick={() => navigate('/visitors')}
                  >
                    Ziyaretçi Kaydı
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
                background: `linear-gradient(135deg, #f57c0015, #f57c0005)`,
                border: '1px solid #f57c0030'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#f57c00' }}>
                    Kargo Takibi
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Gelen kargoları kaydedin ve teslim durumlarını güncelleyin
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: '#f57c00',
                      '&:hover': { backgroundColor: '#e65100' }
                    }}
                    onClick={() => navigate('/parcels')}
                  >
                    Kargo Kaydı
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Grafik */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card sx={{ 
            background: `linear-gradient(135deg, #d32f2f08, #d32f2f03)`,
            border: '1px solid #d32f2f20'
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: securityTheme.primary }}>
                Haftalık Güvenlik İstatistikleri
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ziyaretci" fill="#d32f2f" name="Ziyaretçi" />
                  <Bar dataKey="kargo" fill="#f57c00" name="Kargo" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
}

export default SecurityDashboard; 