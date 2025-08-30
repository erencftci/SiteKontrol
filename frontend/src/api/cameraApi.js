import authService from '../services/authService';

const API_BASE = 'http://localhost:5223/api/camera';

export async function listCameras() {
  const res = await fetch(`${API_BASE}`, {
    headers: authService.getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function createCamera(payload) {
  const res = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: authService.getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function updateCamera(id, payload) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: authService.getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function deleteCamera(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: authService.getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function getActiveCameraCount() {
  const res = await fetch(`${API_BASE}/active-count`, {
    headers: authService.getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}


