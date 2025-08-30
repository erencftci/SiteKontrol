import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
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
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { listCaretakersByBlock } from '../api/caretakerApi';
import { getUsers, createUser, updateUser, deleteUser } from '../api/userApi';

// Kullanıcı yönetimi sayfası (Site Yöneticisi için)
function Users() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Site Sakini'
  });

  // Kullanıcı listesi
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockCaretakers, setBlockCaretakers] = useState([]);
  const [search, setSearch] = useState('');

  // Kullanıcıları yükle
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Kullanıcılar yüklenirken hata oluştu: ' + err.message);
      console.error('Kullanıcılar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => (u.name||'').toLowerCase().includes(search.trim().toLowerCase()));

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ name: user.name, email: user.email, password: '', role: user.role });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'Site Sakini' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        // Güncelleme işlemi
        await updateUser(editingUser.id, userForm);
      } else {
        // Yeni oluşturma
        await createUser(userForm);
      }
      handleCloseDialog();
      loadUsers(); // Listeyi yenile
    } catch (err) {
      setError('Kullanıcı kaydedilirken hata oluştu: ' + err.message);
      console.error('Kullanıcı kaydedilirken hata:', err);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        await deleteUser(userId);
        loadUsers(); // Listeyi yenile
      } catch (err) {
        setError('Kullanıcı silinirken hata oluştu: ' + err.message);
        console.error('Kullanıcı silinirken hata:', err);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Kullanıcı Yönetimi</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Yeni Kullanıcı Ekle
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField value={search} onChange={(e)=>setSearch(e.target.value)} label="İsme göre ara" size="small" sx={{ width: 260 }} />
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
          <Typography>Kullanıcılar yükleniyor...</Typography>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ad Soyad</TableCell>
              <TableCell>E-posta</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleOpenDialog(user)}>
                    Düzenle
                  </Button>
                  <Button size="small" color="error" onClick={() => handleDelete(user.id)}>
                    Sil
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Kullanıcı Ekleme/Düzenleme Dialog'u */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Ad Soyad"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="E-posta"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Şifre"
            type="password"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            margin="normal"
            required={!editingUser}
            helperText={editingUser ? "Değiştirmek istemiyorsanız boş bırakın" : ""}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rol</InputLabel>
            <Select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              <MenuItem value="Site Sakini">Site Sakini</MenuItem>
              <MenuItem value="Güvenlik">Güvenlik</MenuItem>
              <MenuItem value="Kapıcı">Kapıcı</MenuItem>
            </Select>
          </FormControl>

          {/* Blok seçimi (Site Sakini ve Kapıcı için) */}
          {(userForm.role === 'Site Sakini' || userForm.role === 'Kapıcı') && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Blok</InputLabel>
              <Select
                label="Blok"
                value={userForm.blogNumber||''}
                onChange={async (e)=> {
                  const val = e.target.value;
                  setUserForm({ ...userForm, blogNumber: val });
                  // Yönetici kapıcı eklerken bloktaki mevcut kapıcıları göster
                  if (userForm.role === 'Kapıcı' && val) {
                    try { const list = await listCaretakersByBlock(val); setBlockCaretakers(list); } catch { setBlockCaretakers([]); }
                  } else { setBlockCaretakers([]); }
                }}
                required
              >
                {['A','B','C','D','E','F','G','H','I','J'].map(b => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Daire seçimi sadece Site Sakini için */}
          {userForm.role === 'Site Sakini' && (
            <TextField
              fullWidth
              label="Daire No"
              value={userForm.apartmentNumber||''}
              onChange={(e)=> setUserForm({ ...userForm, apartmentNumber: e.target.value })}
              margin="normal"
            />
          )}

          {userForm.role === 'Kapıcı' && userForm.blogNumber && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">Seçilen bloktaki mevcut kapıcılar</Typography>
              <List dense sx={{ maxHeight: 120, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                {(blockCaretakers||[]).length === 0 ? (
                  <ListItem><ListItemText primary="Kayıtlı kapıcı yok" /></ListItem>
                ) : (
                  blockCaretakers.map(c => (
                    <React.Fragment key={c.id}>
                      <ListItem><ListItemText primary={c.name} secondary={c.email} /></ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Users; 