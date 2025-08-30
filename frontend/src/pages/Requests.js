import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Autocomplete from '@mui/material/Autocomplete';
import { listCaretakersByBlock } from '../api/caretakerApi';
import { uploadPhoto } from '../api/photoApi';
import { getProfile } from '../api/userApi';
import { getRequests, respondToRequest, completeRequest, createRequest, updateRequestStatus } from '../api/requestApi';

// İstek yönetimi sayfası (Kapıcı için)
function Requests() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', content: '', target: 'Yönetici', targetCaretakerId: '', photoUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [search, setSearch] = useState('');

  // Kullanıcı bilgisini al
  const user = JSON.parse(localStorage.getItem('user'));

  // İstek listesi
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [caretakers, setCaretakers] = useState([]);

  // İstekleri yükle
  useEffect(() => {
    loadRequests();
    // Site sakini için sadece kendi bloğundaki kapıcıları getir
    (async () => {
      try {
        if (user?.role === 'Site Sakini') {
          let blog = user?.blogNumber;
          if (!blog) {
            // Eski oturumlarda blogNumber localStorage'da yoksa profilden çek
            try {
              const profile = await getProfile();
              if (profile?.blogNumber) {
                blog = profile.blogNumber;
                // user objesini güncelle
                const updated = { ...user, blogNumber: profile.blogNumber, apartmentNumber: profile.apartmentNumber };
                localStorage.setItem('user', JSON.stringify(updated));
              }
            } catch {}
          }
          if (blog) {
            const list = await listCaretakersByBlock(blog);
            setCaretakers(list || []);
            return;
          }
        }
        setCaretakers([]);
      } catch {
        setCaretakers([]);
      }
    })();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getRequests();
      setRequests(data);
      setError(null);
    } catch (err) {
      setError('İstekler yüklenirken hata oluştu: ' + err.message);
      console.error('İstekler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
    setResponseText(request.response || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
    setResponseText('');
  };

  const handleSubmitResponse = async () => {
    try {
      await respondToRequest(selectedRequest.id, responseText);
      handleCloseDialog();
      loadRequests(); // Listeyi yenile
    } catch (err) {
      setError('Yanıt gönderilirken hata oluştu: ' + err.message);
      console.error('Yanıt gönderilirken hata:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Beklemede': return 'warning';
      case 'Yanıtlandı': return 'info';
      case 'Tamamlandı': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>İstek Yönetimi</Typography>
        {user?.role === 'Site Sakini' && (
          <Button variant="contained" onClick={()=>setOpenCreateDialog(true)}>Yeni Talep</Button>
        )}
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField value={search} onChange={(e)=>setSearch(e.target.value)} label="İsme göre ara (istek sahibi)" size="small" sx={{ width: 300 }} />
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
          <Typography>İstekler yükleniyor...</Typography>
        </Box>
      )}

      {/* İstek listesi */}
      <Grid container spacing={2}>
        {requests.filter(r => (r.requesterName||'').toLowerCase().includes(search.trim().toLowerCase()) || (r.title||'').toLowerCase().includes(search.trim().toLowerCase()) || (r.content||'').toLowerCase().includes(search.trim().toLowerCase())).map((request) => (
          <Grid item xs={12} md={6} key={request.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {request.title}
                  </Typography>
                  <Chip 
                    label={request.status} 
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="textSecondary" gutterBottom>
                  Hedef: {request.target}{request.target === 'Kapıcı' && request.targetCaretakerId ? ` (#${request.targetCaretakerId})` : ''}
                </Typography>
                <Typography variant="body1" paragraph>
                  {request.content}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  İsteyen: {request.requesterName} ({request.requesterRole})
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Tarih: {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                </Typography>
                {Array.isArray(request.photos) && request.photos.length > 0 ? (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {request.photos.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`talep-${idx}`}
                        style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                        onClick={()=>{setViewerSrc(url); setViewerOpen(true);}}
                      />
                    ))}
                  </Box>
                ) : (
                  request.photoUrl && (
                    <Box sx={{ mt: 1 }}>
                      <img
                        src={request.photoUrl}
                        alt="talep"
                        style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                        onClick={()=>{setViewerSrc(request.photoUrl); setViewerOpen(true);}}
                      />
                    </Box>
                  )
                )}
                {request.response && (
                  <Box sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: '#e8f5e9',
                    borderRadius: 1,
                    border: '1px solid #81c784'
                  }}>
                    <Typography
                      variant="body2"
                      sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 0.5 }}
                    >
                      Yanıt:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1b5e20' }}>
                      {request.response}
                    </Typography>
                  </Box>
                )}
              </CardContent>
               {((user?.role === 'Kapıcı' && request.target === 'Kapıcı') || (user?.role === 'Site Yöneticisi' && request.target === 'Yönetici')) && request.status === 'Beklemede' && (
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary" 
                    onClick={() => handleOpenDialog(request)}
                  >
                    Yanıtla
                  </Button>
                </CardActions>
              )}
              {((user?.role === 'Kapıcı' && request.target === 'Kapıcı') || (user?.role === 'Site Yöneticisi' && request.target === 'Yönetici')) && request.status !== 'Tamamlandı' && (
                <CardActions>
                  {user?.role === 'Kapıcı' ? (
                    <Button size="small" color="success" onClick={async ()=>{const cost=prompt('Ücret (₺):','0'); if(cost!==null){try{await completeRequest(request.id, parseFloat(cost||'0')); loadRequests();}catch(e){setError('Tamamlarken hata: '+e.message);}}}}>Tamamlandı + Aidat</Button>
                  ) : (
                    <Button size="small" color="success" onClick={async ()=>{try{await updateRequestStatus(request.id, 'Tamamlandı'); loadRequests();}catch(e){setError('Durum güncellenemedi: '+e.message);}}}>Tamamlandı</Button>
                  )}
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Yanıt verme dialog'u */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          İstek Yanıtla: {selectedRequest?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            <strong>İstek:</strong> {selectedRequest?.content}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            İsteyen: {selectedRequest?.requesterName} ({selectedRequest?.requesterRole})
          </Typography>
          <TextField
            fullWidth
            label="Yanıtınız"
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmitResponse} variant="contained">
            Yanıtla
          </Button>
        </DialogActions>
      </Dialog>

      {/* Yeni talep oluştur dialog'u */}
      <Dialog open={openCreateDialog} onClose={()=>setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
         <DialogTitle>Yeni Talep</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Başlık"
            value={createForm.title}
            onChange={(e)=>setCreateForm({...createForm, title: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Açıklama"
            value={createForm.content}
            onChange={(e)=>setCreateForm({...createForm, content: e.target.value})}
            margin="normal"
            required
            multiline
            rows={4}
          />
          <Box sx={{ mt: 1 }}>
            <Button component="label" variant="outlined" disabled={uploading}>
              {uploading ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
              <input type="file" accept="image/*" multiple hidden onChange={async (e)=>{
                const files = Array.from(e.target.files||[]);
                if (files.length === 0) return;
                try {
                  setUploading(true);
                  const uploaded = [];
                  for (const f of files) {
                    const res = await uploadPhoto(f, 'request');
                    const url = res?.url || res?.Url;
                    if (url) uploaded.push(url);
                  }
                  if (uploaded.length > 0) {
                    setCreateForm(prev => ({ ...prev, photos: [...(prev.photos||[]), ...uploaded] }));
                  }
                } catch (err) {
                  setError('Fotoğraf yüklenemedi: ' + (err.message||''));
                } finally {
                  setUploading(false);
                  if (e.target) e.target.value = '';
                }
              }} />
            </Button>
            {Array.isArray(createForm.photos) && createForm.photos.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {createForm.photos.map((url, idx) => (
                  <img key={idx} src={url} alt={`yüklenen-${idx}`} style={{ maxWidth: '48%', borderRadius: 8 }} />
                ))}
              </Box>
            )}
          </Box>
           <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
             <Button variant={createForm.target==='Yönetici'?'contained':'outlined'} onClick={()=>setCreateForm({...createForm, target:'Yönetici'})}>Yönetici</Button>
             <Button variant={createForm.target==='Kapıcı'?'contained':'outlined'} onClick={()=>setCreateForm({...createForm, target:'Kapıcı'})}>Kapıcı</Button>
           </Box>
           {createForm.target==='Kapıcı' && (
             <Autocomplete
               options={caretakers}
               getOptionLabel={(o)=> (o && o.name) ? o.name : ''}
               onChange={(_, val)=> setCreateForm({...createForm, targetCaretakerId: val ? val.id : ''})}
               renderInput={(params)=>(<TextField {...params} label="Kapıcı" margin="normal" required />)}
             />
           )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenCreateDialog(false)}>İptal</Button>
           <Button onClick={async()=>{try{const payload = {...createForm, targetCaretakerId: createForm.target==='Kapıcı'?Number(createForm.targetCaretakerId):undefined, photoUrl: (createForm.photos && createForm.photos[0]) || createForm.photoUrl}; await createRequest(payload); setOpenCreateDialog(false); setCreateForm({title:'',content:'',target:'Yönetici', targetCaretakerId:'', photoUrl: '', photos: []}); loadRequests();}catch(e){setError('Talep oluşturulamadı: '+e.message);}}} variant="contained">Oluştur</Button>
        </DialogActions>
      </Dialog>

      {/* Fotoğraf görüntüleyici */}
      <Dialog open={viewerOpen} onClose={()=>setViewerOpen(false)} maxWidth="lg">
        <Box sx={{ p: 0 }}>
          {viewerSrc && (
            <img src={viewerSrc} alt="full" style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block' }} />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}

export default Requests; 