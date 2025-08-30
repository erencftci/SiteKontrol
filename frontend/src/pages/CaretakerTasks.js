import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer, Chip } from '@mui/material';
import { getMyRequirements, completeRequirement, getMyCompletions } from '../api/caretakerApi';

function CaretakerTasks() {
  const [requirements, setRequirements] = useState([]);
  const [completions, setCompletions] = useState([]);

  const load = async () => {
    try {
      const [reqs, comps] = await Promise.all([getMyRequirements(), getMyCompletions()]);
      setRequirements(reqs);
      setCompletions(comps);
    } catch {}
  };
  useEffect(()=>{ load(); }, []);

  const handleComplete = async (id) => {
    await completeRequirement(id);
    load();
  };

  const isCompleted = (id) => completions.some(c => c.requirementId === id);

  const completedSet = useMemo(() => new Set((completions||[]).map(c=>c.requirementId)), [completions]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Görevlerim (Aylık)</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Görev</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell>Blok</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell align="right">İşlem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requirements.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.title}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell>{r.blogNumber}</TableCell>
                <TableCell>
                  {completedSet.has(r.id)
                    ? <Chip label="Tamamlandı" color="success" size="small"/>
                    : <Chip label="Bekliyor" color="warning" size="small"/>}
                </TableCell>
                <TableCell align="right">
                  {completedSet.has(r.id)
                    ? <Button disabled variant="contained">Tamamlandı</Button>
                    : <Button variant="contained" onClick={() => handleComplete(r.id)}>Tamamla</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default CaretakerTasks;


