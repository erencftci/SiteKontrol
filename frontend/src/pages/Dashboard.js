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
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import PaymentIcon from '@mui/icons-material/Payment';
import styles from './Dashboard.module.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import VideocamIcon from '@mui/icons-material/Videocam';
import { getUserStats } from '../api/userApi';
import { getVisitorStats, getVisitorDaily } from '../api/visitorApi';
import { getActiveCameraCount } from '../api/cameraApi';
import { getParcelDaily } from '../api/parcelApi';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { HubConnectionBuilder } from '@microsoft/signalr';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import { getUnreadNotifications, markNotificationsSeen } from '../api/notificationApi';

// Rol bazlı ana renkler (AppBar ve Drawer için)
const roleColors = {
  "Site Yöneticisi": "#1976d2",
  "Güvenlik": "#d32f2f",
  // Kapıcı turuncu tema. Eski projelerde "Danışma" olarak geçen rolü de koruyoruz
  "Kapıcı": "#f57c00",
  "Danışma": "#f57c00",
  "Site Sakini": "#388e3c"
};

const menuItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard', roles: ['all'] },
  { text: 'Kullanıcılar', icon: <PeopleIcon />, path: '/users', roles: ['Site Yöneticisi'] },
  { text: 'Kayıt İstekleri', icon: <GroupAddIcon />, path: '/registration-requests', roles: ['Site Yöneticisi'] },
  { text: 'Duyurular', icon: <AnnouncementIcon />, path: '/announcement-management', roles: ['Site Yöneticisi'] },
  { text: 'Aylık Gereklilikler', icon: <AssignmentIcon />, path: '/monthly-requirements', roles: ['Site Yöneticisi'] },
  { text: 'Duyurular', icon: <AnnouncementIcon />, path: '/announcements', roles: ['Güvenlik', 'Kapıcı', 'Danışma', 'Site Sakini'] },
  { text: 'Ziyaretçiler', icon: <AssignmentIcon />, path: '/visitors', roles: ['Site Yöneticisi', 'Güvenlik', 'Kapıcı', 'Danışma', 'Site Sakini'] },
  { text: 'Kargolar', icon: <LocalShippingIcon />, path: '/parcels', roles: ['Güvenlik', 'Kapıcı', 'Danışma', 'Site Sakini'] },
  { text: 'Kameralar', icon: <VideocamIcon />, path: '/cameras', roles: ['Güvenlik'] },
  { text: 'Talepler', icon: <AssignmentIcon />, path: '/requests', roles: ['Site Yöneticisi', 'Kapıcı', 'Danışma', 'Site Sakini'] },
  { text: 'Aidat Ödemeleri', icon: <PaymentIcon />, path: '/payments', roles: ['Site Sakini'] },
  { text: 'Görevler', icon: <AssignmentIcon />, path: '/caretaker-tasks', roles: ['Kapıcı'] },
  { text: 'Mesajlar', icon: <MessageIcon />, path: '/messages', roles: ['Site Yöneticisi', 'Güvenlik', 'Kapıcı', 'Danışma', 'Site Sakini'] },
  // Fotoğraflar kaldırıldı
];

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userStats, setUserStats] = useState(null);
  // Güvenlik rolü için canlı veriler
  const [secStats, setSecStats] = useState({ activeVisitors: 0, pendingVisitors: 0, cameras: 0, parking: { capacity: 80, occupied: 0 } });
  const [secChartData, setSecChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const roleColor = roleColors[user?.role] || '#1976d2';
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('dashboard.compactMode') === '1');
  const [showWeeklyChart, setShowWeeklyChart] = useState(() => localStorage.getItem('dashboard.showWeeklyChart') !== '0');
  const [showGreeting, setShowGreeting] = useState(() => localStorage.getItem('dashboard.showGreeting') !== '0');
  const [notifications, setNotifications] = useState({ count: 0, items: [] });
  const [adminActiveCameras, setAdminActiveCameras] = useState(0);
  const [parking, setParking] = useState({ capacity: 80, occupied: 0 });

  // Site Sakini kullanıcılar da bu modern dashboard'u kullanır; ekstra yönlendirme yapılmaz

  // Drawer menüde gösterilecekler (rol bazlı)
  const filteredMenu = menuItems.filter(item => item.roles.includes('all') || item.roles.includes(user?.role));

  // Drawer aç/kapat
  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);

  // Menüden sayfa değiştir
  const handleMenuClick = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  // Çıkış işlemi
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // İstatistikleri yükle (role göre)
  React.useEffect(() => {
    let isMounted = true;
    
    const loadUserStats = async () => {
      if (user?.role === 'Site Yöneticisi' && isMounted) {
        try {
          setLoading(true);
          console.log('API isteği gönderiliyor...');
          const stats = await getUserStats();
          console.log('API yanıtı:', stats);
          
          if (isMounted) {
            // Grafik verilerini düzenle
            const formattedStats = {
              ...stats,
              roleStats: stats.roleStats?.map(item => ({
                name: item.role,
                value: item.count
              })) || [],
              weeklyStats: stats.weeklyStats?.map(item => ({
                date: new Date(item.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
                count: item.count
              })) || []
            };
            
            console.log('Formatlanmış veriler:', formattedStats);
            setUserStats(formattedStats);
          }
          // Admin için ayrıca ziyaretçi ve kargo günlük verileri + aktif kamera sayısı
          try {
            const [vDaily, pDaily, activeCam] = await Promise.all([
              getVisitorDaily(7),
              getParcelDaily(7),
              getActiveCameraCount().catch(()=>({ active: 0 }))
            ]);
            const dayMap = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
            const merge = {};
            vDaily.forEach(v => { merge[v.date] = { date: v.date, ziyaretci: v.count, kargo: 0 }; });
            pDaily.forEach(p => { merge[p.date] = { ...(merge[p.date]||{date:p.date, ziyaretci:0}), kargo: p.count }; });
            const merged = Object.values(merge)
              .sort((a,b)=> a.date.localeCompare(b.date))
              .map(x => ({ name: dayMap[new Date(x.date+'T00:00:00').getDay()-1>=0?new Date(x.date+'T00:00:00').getDay()-1:6], ziyaret: x.ziyaretci, kargo: x.kargo }));
            if (isMounted) setSecChartData(merged);
            if (isMounted) setAdminActiveCameras(activeCam.active || 0);
            // Park bilgisi (tüm roller görsün)
            try {
              const vs = await getVisitorStats();
              if (isMounted) setParking(vs.parking || { capacity: 80, occupied: 0 });
            } catch {}
          } catch {}
        } catch (error) {
          console.error('Kullanıcı istatistikleri yüklenirken hata:', error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      } else if (user?.role === 'Güvenlik' && isMounted) {
        try {
          setLoading(true);
          const [vStats, vDaily, pDaily] = await Promise.all([
            getVisitorStats(),
            getVisitorDaily(7),
            getParcelDaily(7)
          ]);
          if (!isMounted) return;
          setSecStats({ activeVisitors: vStats.activeVisitors || 0, pendingVisitors: vStats.pendingVisitors || 0, cameras: 0, parking: vStats.parking || { capacity: 80, occupied: 0 } });
          setParking(vStats.parking || { capacity: 80, occupied: 0 });

          const dayMap = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
          const merge = {};
          vDaily.forEach(v => { merge[v.date] = { date: v.date, ziyaretci: v.count, kargo: 0 }; });
          pDaily.forEach(p => { merge[p.date] = { ...(merge[p.date]||{date:p.date, ziyaretci:0}), kargo: p.count }; });
          const merged = Object.values(merge)
            .sort((a,b)=> a.date.localeCompare(b.date))
            .map(x => ({ name: dayMap[new Date(x.date+'T00:00:00').getDay()-1>=0?new Date(x.date+'T00:00:00').getDay()-1:6], ziyaret: x.ziyaretci, kargo: x.kargo }));
          setSecChartData(merged);
        } catch (e) {
          console.error('Güvenlik istatistikleri yüklenirken hata:', e);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else if (user?.role === 'Kapıcı' && isMounted) {
        try {
          setLoading(true);
          const [vStats, vDaily, pDaily] = await Promise.all([
            getVisitorStats(),
            getVisitorDaily(7),
            getParcelDaily(7)
          ]);
          if (!isMounted) return;
          setParking(vStats.parking || { capacity: 80, occupied: 0 });

          const dayMap = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
          const visitMap = new Map();
          const parcelMap = new Map();
          (vDaily||[]).forEach(v => visitMap.set(v.date, v.count||0));
          (pDaily||[]).forEach(p => parcelMap.set(p.date, p.count||0));
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
          setSecChartData(merged);
        } catch {}
        finally {
          if (isMounted) setLoading(false);
        }
      } else if (isMounted) {
        setLoading(false);
        // Diğer roller de otoparkı görebilsin diye bir kez çek
        try {
          const vstats = await getVisitorStats();
          if (isMounted) setParking(vstats.parking || { capacity: 80, occupied: 0 });
        } catch {}
      }
    };

    // Sadece bir kez çalıştır
    if (user?.role) {
      loadUserStats();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.role]); // Sadece role değiştiğinde çalıştır

  // Rol bazlı dashboard içeriği (örnek kartlar)
  const renderRoleBasedContent = () => {
    if (!user) return null;
    if (user.role === 'Site Yöneticisi') {
      // Yönetici için bu alanda grafikler kaldırıldı; içerik daha sonra eklenecek
      return null;
    }
    // Diğer roller için de benzer şekilde kartlar eklenebilir
    return null;
  };

  // Dashboard üst kartları
  const stats = user?.role === 'Güvenlik'
    ? [
        { title: 'Aktif Ziyaretçi', value: secStats.activeVisitors, icon: <AssignmentIcon />, color: '#f57c00', desc: 'Şu an sitede bulunan ziyaretçi' },
        { title: 'Bekleyen Ziyaretçi', value: secStats.pendingVisitors, icon: <AssignmentIcon />, color: '#ff9800', desc: 'Onay bekleyen kayıt' },
        { title: 'Misafir Otoparkı', value: `${parking.capacity}/${parking.occupied}`, icon: <LocalShippingIcon />, color: '#1976d2', desc: 'Kapasite/Dolu' },
      ]
    : user?.role === 'Site Yöneticisi'
      ? [
          { title: 'Toplam Kullanıcı', value: loading ? '...' : (userStats?.totalUsers || 0), icon: <PeopleIcon />, color: '#1976d2', desc: 'Sistemde kayıtlı kullanıcı' },
          { title: 'Son 30 Gün', value: loading ? '...' : (userStats?.recentUsers || 0), icon: <GroupAddIcon />, color: '#388e3c', desc: 'Son 30 günde eklenen' },
          { title: 'Bu Ay', value: loading ? '...' : (userStats?.thisMonthUsers || 0), icon: <NotificationsIcon />, color: '#f57c00', desc: 'Bu ay eklenen' },
          { title: 'Duyuru Sayısı', value: userStats?.announcements ?? 0, icon: <AnnouncementIcon />, color: '#d32f2f', desc: 'Toplam duyuru' },
          { title: 'Aktif Kamera', value: adminActiveCameras, icon: <SettingsIcon />, color: '#388e3c', desc: 'Aktif kamera sayısı' },
        ]
      : [
          { title: 'Misafir Otoparkı', value: `${parking.capacity}/${parking.occupied}`, icon: <LocalShippingIcon />, color: '#1976d2', desc: 'Kapasite/Dolu' },
        ];

  // Grafik verisi
  const chartData = user?.role === 'Güvenlik' ? secChartData : secChartData;

  // Bildirimleri yükle ve realtime dinle
  React.useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      try {
        const data = await getUnreadNotifications();
        if (isMounted) setNotifications(data);
      } catch {}
    };
    loadNotifications();

    // SignalR ile canlı bildirim dinle
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5223/hubs/chat', { accessTokenFactory: ()=> localStorage.getItem('token')||'' })
      .withAutomaticReconnect()
      .build();
    connection.start().catch(()=>{});
    connection.on('Notification', async ()=>{ await loadNotifications(); });
    return () => { isMounted = false; connection.stop().catch(()=>{}); };
  }, []);

  const notificationCount = notifications.count || 0;

  return (
    <>
    <div className={styles.dashboardRoot}>
      {/* Modern AppBar */}
      <AppBar position="sticky" className={styles.dashboardAppBar} elevation={0}>
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 0.5 }}>
            SiteKontrol Yönetim Paneli
          </Typography>
          <IconButton color="inherit" sx={{ mr: 1 }} onClick={async (e)=>{
            setNotificationsAnchor(e.currentTarget);
          }}>
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton color="inherit" sx={{ mr: 1 }} onClick={()=>setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: roleColor }}>{user.name?.[0]}</Avatar>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.name}</Typography>
              <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                Çıkış
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      {/* Drawer (yan menü) */}
      <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
        <Box sx={{ width: 260, background: '#1a2130', height: '100%', color: '#e6eefc' }} role="presentation">
          <Toolbar />
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
          <List>
             {filteredMenu.map((item) => (
               <ListItem key={item.text} onClick={() => handleMenuClick(item.path)} sx={{ cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.06)' } }}>
                 <ListItemIcon sx={{ color: roleColor }}>{item.icon}</ListItemIcon>
                 <ListItemText primary={item.text} />
               </ListItem>
             ))}
          </List>
        </Box>
      </Drawer>
      {/* Ana içerik */}
      <Box className={styles.dashboardContent}>
        <Container maxWidth="xl">
        {user ? (
          <>
            {/* Hoş geldin kutusu */}
            {showGreeting && (
              <div className={styles.greetingBox}>
                <div className={styles.greetingText}>Hoş geldin, {user.name}!</div>
                <div className={styles.greetingSub}>Rol: {user.role} &nbsp;|&nbsp; E-posta: {user.email}</div>
              </div>
            )}
            {/* Modern istatistik kutuları */}
            <div className={styles.statsGrid} style={compactMode ? { gridGap: '12px' } : undefined}>
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.title}
                  className={styles.statCard}
                  style={{ '--stat-color': stat.color }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={styles.statIcon} style={{ color: stat.color }}>{stat.icon}</div>
                  <div className={styles.statTitle}>{stat.title}</div>
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statDesc}>{stat.desc}</div>
                </motion.div>
              ))}
            </div>
            {/* Haftalık Ziyaretçi & Kargo Grafiği (geri getirildi) */}
            {showWeeklyChart && (
              <Box sx={{ width: '100%', height: 320, background: 'rgba(255,255,255,0.02)', borderRadius: 3, boxShadow: 2, mb: 4 }}>
                <Typography variant="subtitle1" sx={{ color: '#fff', p: 2 }}>
                  Haftalık Ziyaretçi & Kargo Grafiği
                </Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#b0b8c1" />
                    <YAxis stroke="#b0b8c1" />
                    <Tooltip wrapperStyle={{ background: '#23272f', color: '#fff', borderRadius: 8 }} />
                    <Bar dataKey="ziyaret" fill="#1976d2" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="kargo" fill="#388e3c" radius={[6, 6, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
            {/* Rol bazlı içerik ve kartlar */}
            <Box sx={{ mt: 2, width: '100%' }}>{renderRoleBasedContent()}</Box>
          </>
        ) : (
          <Typography color="error">Kullanıcı bilgisi bulunamadı. Lütfen giriş yapın.</Typography>
        )}
        </Container>
      </Box>
    </div>
    {/* Bildirim menüsü */}
    <Menu
      anchorEl={notificationsAnchor}
      open={Boolean(notificationsAnchor)}
      onClose={()=>setNotificationsAnchor(null)}
    >
      <MenuItem disabled>Son Bildirimler</MenuItem>
      {(notifications.items||[]).length > 0 && (
        <MenuItem onClick={async()=>{
          try {
            await markNotificationsSeen((notifications.items||[]).map(n => ({ type: n.type, id: n.id })));
            setNotifications({ count: 0, items: [] });
          } catch {}
        }}>Bildirimleri temizle</MenuItem>
      )}
      {(notifications.items||[]).length === 0 ? (
        <MenuItem disabled>Okunmamış bildiriminiz yok</MenuItem>
      ) : (
        (notifications.items||[]).slice(0,6).map(n => (
          <MenuItem key={`${n.type}-${n.id}`} onClick={async()=>{
            setNotificationsAnchor(null);
            try {
              await markNotificationsSeen([{ type: n.type, id: n.id }]);
              setNotifications(prev => ({ count: Math.max(0, (prev.count||0)-1), items: (prev.items||[]).filter(x => !(x.type===n.type && x.id===n.id)) }));
            } catch {}
            if (n.type === 'announcement') navigate('/announcements');
            else if (n.type === 'request') navigate('/requests');
            else if (n.type === 'visitor') navigate('/visitors');
            else if (n.type === 'message') navigate('/messages');
            else if (n.type === 'parcel-note') navigate('/parcels');
          }}>
            {n.type === 'announcement' ? 'Duyuru: ' : n.type === 'request' ? 'Talep: ' : n.type === 'visitor' ? 'Ziyaretçi: ' : n.type === 'message' ? 'Mesaj: ' : 'Kargo: '} {n.title || ''}
          </MenuItem>
        ))
      )}
    </Menu>
    {/* Ayarlar diyalogu */}
    <Dialog open={settingsOpen} onClose={()=>setSettingsOpen(false)}>
      <DialogTitle>Ayarlar</DialogTitle>
      <DialogContent>
        <FormControlLabel control={<Switch checked={compactMode} onChange={(e)=>{setCompactMode(e.target.checked); localStorage.setItem('dashboard.compactMode', e.target.checked ? '1' : '0');}} />} label="Yoğun düzen (kart aralıklarını daralt)" />
        <FormControlLabel control={<Switch checked={showWeeklyChart} onChange={(e)=>{setShowWeeklyChart(e.target.checked); localStorage.setItem('dashboard.showWeeklyChart', e.target.checked ? '1' : '0');}} />} label="Haftalık grafiği göster" />
        <FormControlLabel control={<Switch checked={showGreeting} onChange={(e)=>{setShowGreeting(e.target.checked); localStorage.setItem('dashboard.showGreeting', e.target.checked ? '1' : '0');}} />} label="Karşılama kutusunu göster" />
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>setSettingsOpen(false)}>Kapat</Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

export default Dashboard;