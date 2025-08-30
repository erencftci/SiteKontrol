// Ziyaretçi API servisleri
// Backend'deki /api/visitor endpoint'lerine istek atar

import authService from '../services/authService';

const API_BASE = "http://localhost:5223/api/visitor";

// Tüm ziyaretçileri getir
export async function getVisitors() {
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

// Belirli bir ziyaretçiyi getir
export async function getVisitor(id) {
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

// Yeni ziyaretçi/misafir kaydı oluştur
export async function createVisitor(data) {
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

// Ziyaretçi istatistikleri
export async function getVisitorStats() {
  const response = await fetch(`${API_BASE}/stats`, {
    method: "GET",
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function getVisitorDaily(days = 7) {
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

// Ziyaretçi giriş/çıkış işaretleme
export async function markVisitorEnter(id) {
  const response = await fetch(`${API_BASE}/${id}/enter`, {
    method: "PUT",
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
}

export async function markVisitorExit(id) {
  const response = await fetch(`${API_BASE}/${id}/exit`, {
    method: "PUT",
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
}

// Ziyaretçi durumunu güncelle
export async function updateVisitorStatus(id, status) {
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: "PUT",
    headers: authService.getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.text();
}

// Ziyaretçi kaydını sil
export async function deleteVisitor(id) {
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