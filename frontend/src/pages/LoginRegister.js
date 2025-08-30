import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { getResidents } from '../api/userApi';
import authService from '../services/authService';
import { useNavigate, useLocation } from 'react-router-dom';

// Giriş ve Kayıt İsteği sayfası bileşeni
function LoginRegister() {
  const [tab, setTab] = useState(0);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    requestedRole: 'Site Sakini',
    blogNumber: '',
    apartmentNumber: '',
    password: '',
    description: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [occupiedFlats, setOccupiedFlats] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Eğer zaten giriş yapmışsa dashboard'a yönlendir
  React.useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setError('');
    setSuccess('');
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    if (e.target.name === 'blogNumber' && registerData.requestedRole === 'Site Sakini') {
      // Seçilen blok için dolu daireleri çek
      (async ()=>{
        try {
          const residents = await getResidents();
          const flats = (residents||[])
            .filter(u => u.blogNumber === e.target.value)
            .map(u => String(u.apartmentNumber||''))
            .filter(Boolean);
          setOccupiedFlats(flats);
        } catch { setOccupiedFlats([]); }
      })();
    }
  };

  // Giriş formu submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.login(loginData.email, loginData.password);
      // Başarılı girişte dashboard'a yönlendir
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Kayıt isteği formu submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await authService.submitRegistrationRequest(registerData);
      setSuccess('Kayıt isteğiniz başarıyla gönderildi! Yönetici onayından sonra giriş yapabilirsiniz.');
      // Formu temizle
      setRegisterData({ 
        name: '', 
        email: '', 
        phone: '', 
        requestedRole: 'Site Sakini',
        blogNumber: '',
        apartmentNumber: '',
        password: '',
        description: '' 
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom align="center">
        Giriş / Kayıt
      </Typography>
      <Tabs value={tab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
        <Tab label="Giriş Yap" />
        <Tab label="Kayıt İsteği" />
      </Tabs>
      
      {/* Hata mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Başarı mesajı */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      {tab === 0 && (
        <form onSubmit={handleLoginSubmit}>
          <TextField
            label="E-posta"
            name="email"
            type="email"
            value={loginData.email}
            onChange={handleLoginChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Şifre"
            name="password"
            type="password"
            value={loginData.password}
            onChange={handleLoginChange}
            fullWidth
            margin="normal"
            required
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>
      )}
      {tab === 1 && (
        <form onSubmit={handleRegisterSubmit}>
          <TextField
            label="Ad Soyad"
            name="name"
            value={registerData.name}
            onChange={handleRegisterChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="E-posta"
            name="email"
            type="email"
            value={registerData.email}
            onChange={handleRegisterChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Telefon"
            name="phone"
            value={registerData.phone}
            onChange={handleRegisterChange}
            fullWidth
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>İstenen Rol</InputLabel>
            <Select
              name="requestedRole"
              value={registerData.requestedRole}
              onChange={handleRegisterChange}
              label="İstenen Rol"
            >
              <MenuItem value="Site Sakini">Site Sakini</MenuItem>
              <MenuItem value="Güvenlik">Güvenlik</MenuItem>
              <MenuItem value="Kapıcı">Kapıcı</MenuItem>
            </Select>
          </FormControl>
            {(registerData.requestedRole !== 'Güvenlik') && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Blok</InputLabel>
              <Select
                label="Blok"
                name="blogNumber"
                value={registerData.blogNumber}
                onChange={handleRegisterChange}
                required={registerData.requestedRole !== 'Güvenlik'}
              >
                {['A','B','C','D','E','F','G','H','I','J'].map(b => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>
            )}
            {registerData.requestedRole === 'Site Sakini' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Daire Seçimi</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 1 }}>
                  {Array.from({ length: 80 }, (_, i) => (i + 1)).map(num => {
                    const val = String(num);
                    const isOccupied = (occupiedFlats || []).includes(val);
                    const selected = registerData.apartmentNumber === val;
                    return (
                      <Button key={num} variant={selected?'contained':'outlined'} size="small" onClick={()=> setRegisterData({...registerData, apartmentNumber: val})} disabled={isOccupied} sx={{ minWidth: 0, p: 0.5, fontSize: 12, opacity: isOccupied?0.5:1 }}>
                        {num}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            )}
          <TextField
            label="Şifre"
            name="password"
            type="password"
            value={registerData.password}
            onChange={handleRegisterChange}
            fullWidth
            margin="normal"
            required
            helperText="Giriş yapmak için kullanacağınız şifreyi belirleyin"
          />
          <TextField
            label="Açıklama"
            name="description"
            value={registerData.description}
            onChange={handleRegisterChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
            required
            helperText="Neden bu role ihtiyacınız var? (Örn: Site sakini olarak kayıt olmak istiyorum)"
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Gönderiliyor...' : 'Kayıt İsteği Gönder'}
          </Button>
        </form>
      )}
    </Box>
  );
}

export default LoginRegister;