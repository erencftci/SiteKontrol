// Kargo API servisleri
// Backend'deki /api/parcel endpoint'lerine istek atar

import authService from '../services/authService';

const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:5223/api';
const API_BASE = `${API_ROOT}/parcel`;

// Tüm kargoları getir
export async function getParcels() {
  const response = await fetch(`${API_BASE}`, {
    method: "GET",
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

// Belirli bir kargoyu getir
export async function getParcel(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "GET",
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

// Yeni kargo kaydı oluştur
export async function createParcel(data) {
  const response = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: authService.getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function getParcelDaily(days = 7) {
  const response = await fetch(`${API_BASE}/daily?days=${days}`, {
    method: "GET",
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function getParcelNotes(parcelId) {
  const response = await fetch(`${API_BASE}/${parcelId}/notes`, {
    method: "GET",
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

// Kargo durumunu güncelle
export async function updateParcelStatus(id, status, noteFromResident) {
  const payload = { status };
  if (noteFromResident) payload.noteFromResident = noteFromResident;
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: "PUT",
    headers: authService.getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.text();
}

// Kargo kaydını sil
export async function deleteParcel(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.text();
} 