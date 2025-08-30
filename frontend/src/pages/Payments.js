import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { getMyDues, payDue } from '../api/dueApi';

function Payments() {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getMyDues();
      setDues(data);
      setError(null);
    } catch (e) {
      setError(e.message || 'Aidatlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const paid = dues.filter(d => d.isPaid).reduce((s, d) => s + Number(d.amount), 0);
    const unpaid = dues.filter(d => !d.isPaid).reduce((s, d) => s + Number(d.amount), 0);
    return { paid, unpaid, all: paid + unpaid };
  }, [dues]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Aidat ve Ödemelerim</Typography>
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
          <Typography>{error}</Typography>
        </Box>
      )}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <Typography>Yükleniyor...</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip label={`Toplam: ₺${totals.all.toFixed(2)}`} color="primary" />
        <Chip label={`Ödenen: ₺${totals.paid.toFixed(2)}`} color="success" variant="outlined" />
        <Chip label={`Bekleyen: ₺${totals.unpaid.toFixed(2)}`} color="warning" variant="outlined" />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {dues.map(due => (
          <Grid item xs={12} md={6} key={due.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6">₺{Number(due.amount).toFixed(2)}</Typography>
                  <Chip label={due.isPaid ? 'Ödendi' : 'Beklemede'} color={due.isPaid ? 'success' : 'warning'} size="small" />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>{due.description || 'Aidat'}</Typography>
                <Typography variant="caption" color="textSecondary">{new Date(due.createdAt).toLocaleDateString('tr-TR')}</Typography>
              </CardContent>
              {!due.isPaid && (
                <CardActions>
                  <Button onClick={async ()=>{try{await payDue(due.id); await load();}catch(e){setError(e.message);}}} variant="contained" color="primary">
                    Ödendi Olarak İşaretle
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Payments;


