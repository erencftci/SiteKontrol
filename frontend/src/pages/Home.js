import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon from '@mui/icons-material/Home';
import BuildIcon from '@mui/icons-material/Build';
import authService from '../services/authService';

// Ana sayfa bileşeni
function Home() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isLoggedIn = authService.isAuthenticated();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: `radial-gradient(1200px 600px at 50% -20%, ${theme.palette.primary.main}22, transparent 60%)`,
          borderRadius: 2,
          pt: 8,
        }}
      >
        <Chip label="Site Yönetim Platformu" color="primary" variant="outlined" sx={{ mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: '800', mb: 2 }}>
          SiteKontrol
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 780, mb: 4 }}>
          Site Yöneticisi, Güvenlik, Kapıcı ve Site Sakini rollerine özel modern ve hızlı bir yönetim deneyimi.
        </Typography>
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
          <Button
            size="large"
            variant="contained"
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
          >
            {isLoggedIn ? 'Panelime Git' : 'Giriş Yap / Kayıt Ol'}
          </Button>
          {isLoggedIn && (
            <Button size="large" variant="outlined" onClick={() => authService.logout()}>Çıkış Yap</Button>
          )}
        </Stack>
      </Box>

      {/* Özellikler / Roller */}
      <Box sx={{ mt: 8 }}>
        <Grid container spacing={3}>
          {[
            { title: 'Site Yöneticisi', desc: 'Kullanıcılar, duyurular ve raporlar.', icon: <AdminPanelSettingsIcon /> },
            { title: 'Güvenlik', desc: 'Ziyaretçi ve kargo yönetimi.', icon: <SecurityIcon /> },
            { title: 'Kapıcı', desc: 'Günlük görev ve aylık gereklilikler.', icon: <BuildIcon /> },
            { title: 'Site Sakini', desc: 'Aidat ve taleplerinizi yönetin.', icon: <HomeIcon /> },
          ].map((f, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card sx={{ height: '100%', background: `${theme.palette.primary.main}06`, border: `1px solid ${theme.palette.primary.main}22` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: theme.palette.primary.main }}>
                    <Box sx={{ mr: 1 }}>{f.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{f.title}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

export default Home;