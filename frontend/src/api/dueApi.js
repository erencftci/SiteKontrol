import authService from '../services/authService';

const API_BASE = 'http://localhost:5223/api/due';

export async function getMyDues() {
  const res = await fetch(`${API_BASE}`, {
    method: 'GET',
    headers: authService.getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function payDue(id) {
  const res = await fetch(`${API_BASE}/${id}/pay`, {
    method: 'PUT',
    headers: authService.getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}


