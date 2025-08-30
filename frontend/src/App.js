import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Typography from '@mui/material/Typography';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import LoginRegister from './pages/LoginRegister';
import Dashboard from './pages/Dashboard';
import CaretakerDashboard from './pages/CaretakerDashboard';
import ResidentDashboard from './pages/ResidentDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import RegistrationRequests from './pages/RegistrationRequests';
import AnnouncementManagement from './pages/AnnouncementManagement';
import Users from './pages/Users';
import Announcements from './pages/Announcements';
import Visitors from './pages/Visitors';
import Requests from './pages/Requests';
import Parcels from './pages/Parcels';
import Messages from './pages/Messages';
import Payments from './pages/Payments';
import SecurityReports from './pages/SecurityReports';
import Cameras from './pages/Cameras';
import AdminMonthlyRequirements from './pages/AdminMonthlyRequirements';
import CaretakerTasks from './pages/CaretakerTasks';
import ProtectedRoute from './components/ProtectedRoute';
import authService from './services/authService';

// Rol bazlı ana renkler
const roleColors = {
  "Site Yöneticisi": "#1976d2", // Mavi
  "Güvenlik": "#d32f2f",      // Kırmızı
  // Kapıcı turuncu tema. Eski isimlendirme "Danışma" ile aynı rengi kullanır
  "Kapıcı": "#f57c00",
  "Danışma": "#f57c00",        // Turuncu
  "Site Sakini": "#388e3c"     // Yeşil
};

// Sayfa wrapper bileşeni
function PageWrapper({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboardPage = location.pathname.includes('dashboard') || 
                         location.pathname.includes('users') || 
                         location.pathname.includes('announcements') || 
                         location.pathname.includes('announcement-management') || 
                         location.pathname.includes('monthly-requirements') || 
                         location.pathname.includes('caretaker-tasks') || 
                         location.pathname.includes('visitors') || 
                         location.pathname.includes('requests') || 
                         location.pathname.includes('parcels') || 
                         location.pathname.includes('messages') ||
                         location.pathname.includes('cameras') ||
                         location.pathname.includes('payments');
  const isHomePage = location.pathname === '/';
  const isRootDashboard = ['/dashboard','/resident-dashboard','/caretaker-dashboard','/security-dashboard'].includes(location.pathname);
  const showBack = location.pathname !== '/' && location.pathname !== '/login' && !isRootDashboard;
  const handleBack = () => {
    try {
      if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/dashboard');
      }
    } catch {
      navigate('/dashboard');
    }
  };

  if (isDashboardPage) {
    return (
      <>
        {showBack && (
          <IconButton
            onClick={handleBack}
            color="inherit"
            aria-label="geri"
            sx={{ position: 'fixed', top: 16, left: 16, zIndex: 1500, bgcolor: 'rgba(255,255,255,0.08)' }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Box sx={{ pt: showBack ? 6 : 0 }}>
          {children}
        </Box>
      </>
    ); // Dashboard benzeri sayfalar: üstte geri + içerik için üst boşluk
  }

  // Ana sayfa ve login için container
  return (
    <Container
      maxWidth={isHomePage ? 'lg' : 'sm'}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isHomePage ? 'flex-start' : 'center',
        alignItems: 'stretch',
        paddingTop: isHomePage ? 0 : undefined,
      }}
    >
      {showBack && (
        <Box sx={{ mb: 2 }}>
          <IconButton onClick={handleBack} color="inherit" aria-label="geri">
            <ArrowBackIcon />
          </IconButton>
        </Box>
      )}
      {children}
    </Container>
  );
}

function App() {
  const userRole = authService.getUserRole();
  
  // Kullanıcı rolüne göre tema rengini belirle
  const primaryColor = userRole && roleColors[userRole] ? roleColors[userRole] : "#1976d2";
  
  // Dinamik tema oluştur
  const dynamicTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: primaryColor,
      },
      secondary: {
        main: '#f48fb1',
      },
      text: {
        primary: '#e3e3e3',
        secondary: '#b0b0b0',
      },
    },
    shape: {
      borderRadius: 8
    }
  });

  return (
    <ThemeProvider theme={dynamicTheme}>
      {/* CssBaseline ile temel stiller */}
      <CssBaseline />
      {/* Router ile sayfa geçişleri */}
      <Router>
        <PageWrapper>
          {/* Basit bir menü - sadece ana sayfa ve login için */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginRegister />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            {/* Rol bazlı özel paneller */}
            <Route path="/caretaker-dashboard" element={
              <ProtectedRoute requiredRole="Kapıcı">
                <CaretakerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/resident-dashboard" element={
              <ProtectedRoute requiredRole="Site Sakini">
                <ResidentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/security-dashboard" element={
              <ProtectedRoute requiredRole="Güvenlik">
                <SecurityDashboard />
              </ProtectedRoute>
            } />
            <Route path="/registration-requests" element={
              <ProtectedRoute requiredRole="Site Yöneticisi">
                <RegistrationRequests />
              </ProtectedRoute>
            } />
            <Route path="/announcement-management" element={
              <ProtectedRoute requiredRole="Site Yöneticisi">
                <AnnouncementManagement />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute requiredRole="Site Yöneticisi">
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/monthly-requirements" element={
              <ProtectedRoute requiredRole="Site Yöneticisi">
                <AdminMonthlyRequirements />
              </ProtectedRoute>
            } />
            <Route path="/announcements" element={
              <ProtectedRoute>
                <Announcements />
              </ProtectedRoute>
            } />
            <Route path="/visitors" element={
              <ProtectedRoute>
                <Visitors />
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute allowedRoles={["Site Yöneticisi","Kapıcı","Danışma","Site Sakini"]}>
                <Requests />
              </ProtectedRoute>
            } />
            <Route path="/parcels" element={
              <ProtectedRoute>
                <Parcels />
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute requiredRole="Site Sakini">
                <Payments />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/security-reports" element={
              <ProtectedRoute requiredRole="Güvenlik">
                <SecurityReports />
              </ProtectedRoute>
            } />
            <Route path="/cameras" element={
              <ProtectedRoute requiredRole="Güvenlik">
                <Cameras />
              </ProtectedRoute>
            } />
            <Route path="/caretaker-tasks" element={
              <ProtectedRoute requiredRole="Kapıcı">
                <CaretakerTasks />
              </ProtectedRoute>
            } />
          </Routes>
        </PageWrapper>
      </Router>
    </ThemeProvider>
  );
}

export default App;
