// İstek API servisleri
// Backend'deki /api/request endpoint'lerine istek atar

import authService from '../services/authService';

const API_BASE = "http://localhost:5223/api/request";

// Tüm istekleri getir
export async function getRequests() {
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

// Belirli bir isteği getir
export async function getRequest(id) {
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

// Yeni istek oluştur
export async function createRequest(data) {
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

// İsteğe yanıt ver
export async function respondToRequest(id, response) {
  const responseData = await fetch(`${API_BASE}/${id}/respond`, {
    method: "PUT",
    headers: authService.getAuthHeaders(),
    body: JSON.stringify({ response }),
  });
  if (!responseData.ok) {
    const error = await responseData.text();
    throw new Error(error);
  }
  return await responseData.text();
}

// İstek durumunu güncelle
export async function updateRequestStatus(id, status) {
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: "PUT",
    headers: authService.getAuthHeaders(),
    body: JSON.stringify(status),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.text();
}

// İsteği tamamla ve bedeli ekle
export async function completeRequest(id, cost) {
  const response = await fetch(`${API_BASE}/${id}/complete`, {
    method: "PUT",
    headers: authService.getAuthHeaders(),
    body: JSON.stringify(cost),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.text();
}

// İsteği sil
export async function deleteRequest(id) {
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