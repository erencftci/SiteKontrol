// Duyuru API servisleri
// Backend'deki /api/announcement endpoint'lerine istek atar

import authService from '../services/authService';

const API_BASE = "http://localhost:5223/api/announcement";

// Tüm duyuruları getir
export async function getAnnouncements() {
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

// Belirli bir duyuruyu getir
export async function getAnnouncement(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

// Yeni duyuru oluştur
export async function createAnnouncement(data) {
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

// Duyuru güncelle
export async function updateAnnouncement(id, data) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: authService.getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.text();
}

// Duyuru sil
export async function deleteAnnouncement(id) {
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