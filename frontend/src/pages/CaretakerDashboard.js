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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import TextField from '@mui/material/TextField';
import { getCaretakerStats, markDaily } from '../api/caretakerApi';
import { getUnreadNotifications, markNotificationsSeen } from '../api/notificationApi';
import { getVisitorStats, getVisitorDaily } from '../api/visitorApi';
import { getParcelDaily } from '../api/parcelApi';

// Kapıcı rolü için özel menü öğeleri
const caretakerMenuItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/caretaker-dashboard', roles: ['Kapıcı'] },
  { text: 'Görevler', icon: <AssignmentIcon />, path: '/caretaker-tasks', roles: ['Kapıcı'] },
  { text: 'Talepler', icon: <AssignmentIcon />, path: '/requests', roles: ['Kapıcı'] },
  { text: 'Kargo Teslimi', icon: <LocalShippingIcon />, path: '/parcels', roles: ['Kapıcı'] },
  { text: 'Duyurular', icon: <AnnouncementIcon />, path: '/announcements', roles: ['Kapıcı'] },
  { text: 'Mesajlar', icon: <MessageIcon />, path: '/messages', roles: ['Kapıcı'] },
];

function CaretakerDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  
  // Kapıcı rolü için turuncu tema
  const caretakerTheme = {
    primary: '#f57c00', // Turuncu
    secondary: '#e65100',
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

  // Kapıcı odaklı istatistikler
  const [caretakerStats, setCaretakerStats] = useState([
    { title: 'Bekleyen Talep', value: 0, icon: <AssignmentIcon />, color: '#f57c00', desc: 'Yanıt bekleyen talep' },
    { title: 'Misafir Otoparkı', value: '80/0', icon: <LocalShippingIcon />, color: '#1976d2', desc: 'Kapasite/Dolu' },
    { title: 'Günlük Görev', value: 0, icon: <CleaningServicesIcon />, color: '#388e3c', desc: 'Bu hafta tamamlanan' },
    { title: 'Kargo Teslim', value: 0, icon: <LocalShippingIcon />, color: '#d32f2f', desc: 'Teslim edilecek kargo' },
  ]);

  // Kapıcı odaklı grafik verileri
  const [caretakerChartData, setCaretakerChartData] = useState([]);
  const [notifications, setNotifications] = useState({ count: 0, items: [] });

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Kapıcı için: Misafir otoparkı ve haftalık ziyaretçi/kargo grafiği
        const [vStats, vDaily, pDaily] = await Promise.all([
          getVisitorStats(),
          getVisitorDaily(7),
          getParcelDaily(7)
        ]);
        if (!isMounted) return;
        // Misafir otoparkı kartı
        const capacity = vStats?.parking?.capacity ?? 80;
        const occupied = vStats?.parking?.occupied ?? 0;
        setCaretakerStats(prev => prev.map(s => s.title === 'Misafir Otoparkı' ? { ...s, value: `${capacity}/${occupied}` } : s));

        // Haftalık ziyaretçi & kargo birleşik seri
        const dayMap = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
        const visitMap = new Map();
        const parcelMap = new Map();
        (vDaily||[]).forEach(v => visitMap.set(v.date, v.count||0));
        (pDaily||[]).forEach(p => parcelMap.set(p.date, p.count||0));

        // Son 7 günü sıfırlarla doldur ve mevcut verilerle birleştir
        const toYmd = (d) => {
          const y = d.getFullYear();
          const m = String(d.getMonth()+1).padStart(2,'0');
          const dd = String(d.getDate()).padStart(2,'0');
          return `${y}-${m}-${dd}`;
        };
        const merged = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate()-i);
          const key = toYmd(d);
          const name = dayMap[(d.getDay()+6)%7];
          merged.push({ name, ziyaret: visitMap.get(key)||0, kargo: parcelMap.get(key)||0 });
        }
        setCaretakerChartData(merged);

        // Günlük görev toplamını da koru
        try {
          const cStats = await getCaretakerStats();
          if (!isMounted) return;
          const weeklyDaily = cStats?.weeklyDailyTasks || [];
          const total = weeklyDaily.reduce((a,b)=> a + (b.count||0), 0);
          setCaretakerStats(prev => prev.map(s => s.title === 'Günlük Görev' ? { ...s, value: total } : s));
        } catch {}

        // Bildirimleri (kargo notları dahil) getir
        try {
          const n = await getUnreadNotifications();
          if (!isMounted) return;
          setNotifications(n);
        } catch {}
      } catch (e) {
        // ignore
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: caretakerTheme.background }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: caretakerTheme.primary }}>
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
            SiteKontrol - Kapıcı Paneli
          </Typography>
          <IconButton color="inherit" onClick={async ()=>{
            try {
              if ((notifications.items||[]).length > 0) {
                await markNotificationsSeen((notifications.items||[]).map(n => ({ type: n.type, id: n.id })));
                setNotifications({ count: 0, items: [] });
              }
            } catch {}
          }}>
            <Badge badgeContent={notifications.count || 0} color="error">
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
            {caretakerMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(245, 124, 0, 0.1)',
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
          <Typography variant="h4" gutterBottom sx={{ color: caretakerTheme.primary, mb: 3 }}>
            Kapıcı Paneli
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Site hizmetlerini yönetmek için aşağıdaki araçları kullanabilirsiniz.
          </Typography>
        </motion.div>

        {/* İstatistik Kartları */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {caretakerStats.map((stat, index) => (
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
                background: `linear-gradient(135deg, #f57c0015, #f57c0005)`,
                border: '1px solid #f57c0030'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: caretakerTheme.primary }}>
                    Talep Yönetimi
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Site sakinlerinden gelen talepleri yanıtlayın ve takip edin
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: caretakerTheme.primary,
                      '&:hover': { backgroundColor: caretakerTheme.secondary }
                    }}
                    onClick={() => navigate('/requests')}
                  >
                    Talepleri Görüntüle
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
                    Bakım İşleri
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Devam eden ve planlanan bakım işlerini yönetin
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: '#1976d2',
                      '&:hover': { backgroundColor: '#1565c0' }
                    }}
                    onClick={() => navigate('/maintenance')}
                  >
                    Bakım İşleri
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Günlük Görev (Çöp) hızlı aksiyon */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography sx={{ mr: 2 }}>Bugünün çöp durumu:</Typography>
                  <TextField size="small" label="Blok" placeholder="A1" id="daily-block" />
                  <Button startIcon={<CheckCircleIcon />} variant="contained" onClick={async ()=>{
                    const block = document.getElementById('daily-block').value || '';
                    try { await markDaily({ taskType: 'Çöp', blogNumber: block, isDone: true, taskDate: new Date().toISOString() }); alert('İşaretlendi'); } catch(e){ alert('Hata: '+e.message); }
                  }}>Atıldı</Button>
                  <Button startIcon={<DeleteIcon />} variant="outlined" onClick={async ()=>{
                    const block = document.getElementById('daily-block').value || '';
                    try { await markDaily({ taskType: 'Çöp', blogNumber: block, isDone: false, taskDate: new Date().toISOString() }); alert('Kaydedildi'); } catch(e){ alert('Hata: '+e.message); }
                  }}>Atılmadı</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Grafik */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card sx={{ 
            background: `linear-gradient(135deg, #f57c0008, #f57c0003)`,
            border: '1px solid #f57c0020'
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: caretakerTheme.primary }}>
                Haftalık Ziyaretçi & Kargo
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={caretakerChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ziyaret" fill="#1976d2" name="Ziyaretçi" />
                  <Bar dataKey="kargo" fill="#388e3c" name="Kargo" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
}

export default CaretakerDashboard; 