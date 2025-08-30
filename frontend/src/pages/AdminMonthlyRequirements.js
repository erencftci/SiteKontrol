import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Button, TextField, Grid, Card, CardContent, CardActions, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { createRequirement, listRequirements, deleteRequirement, getMyCompletions, getMonthlyOverview } from '../api/caretakerApi';
import authService from '../services/authService';

function AdminMonthlyRequirements() {
  const [items, setItems] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [overview, setOverview] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', blogNumber: '' });

  const load = async () => {
    try { setItems(await listRequirements()); } catch { /* noop */ }
    try { setCompletions(await getMyCompletions()); } catch { /* noop */ }
    try { setOverview(await getMonthlyOverview()); } catch { /* noop */ }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.title.trim()) return;
    await createRequirement(form);
    setForm({ title: '', description: '', blogNumber: '' });
    load();
  };

  const handleDelete = async (id) => {
    await deleteRequirement(id);
    load();
  };

  const isAdmin = useMemo(() => authService.getUserRole() === 'Site Yöneticisi', []);

  // Bu ay tamamlanan requirementId set'i (kapıcı bakışı için kendi tamamlama verisi)
  const completedSet = useMemo(() => new Set((completions||[]).map(c=>c.requirementId)), [completions]);
  const overviewMap = useMemo(() => {
    const m = new Map();
    (overview||[]).forEach(r => { m.set(r.id, r.caretakers || []); });
    return m;
  }, [overview]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Aylık Gereklilikler</Typography>
      {isAdmin && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Başlık" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Açıklama" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button fullWidth variant="contained" onClick={handleCreate}>Ekle</Button>
        </Grid>
        </Grid>
      )}

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Görev</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell>Durum (Bu Ay)</TableCell>
              <TableCell>Kapıcı Durumları</TableCell>
              {isAdmin && <TableCell>İşlem</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(x => (
              <TableRow key={x.id}>
                <TableCell>{x.title}</TableCell>
                <TableCell>{x.description}</TableCell>
                <TableCell>
                  {completedSet.has(x.id)
                    ? <Chip label="Tamamlandı" color="success" size="small"/>
                    : <Chip label="Bekliyor" color="warning" size="small"/>}
                </TableCell>
                <TableCell>
                  {(overviewMap.get(x.id) || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  ) : (
                    (overviewMap.get(x.id) || []).map(c => (
                      <Chip key={c.caretakerId}
                        label={`${c.caretakerName} - ${c.completed ? 'Tamamlandı' : 'Bekliyor'}`}
                        color={c.completed ? 'success' : 'warning'} size="small" sx={{ mr: 1, mb: 1 }} />
                    ))
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <IconButton onClick={()=>handleDelete(x.id)}><DeleteIcon/></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default AdminMonthlyRequirements;


