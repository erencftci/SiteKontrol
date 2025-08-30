// Kullanıcı API servisleri
// Backend'deki /api/user/ endpoint'lerine istek atar

import authService from '../services/authService';

const API_BASE = "http://localhost:5223/api/user";

// Kullanıcı kaydı (sadece Site Yöneticisi yapabilir)
export async function registerUser(data) {
  const response = await fetch(`${API_BASE}/register`, {
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

// Profil bilgilerini getir
export async function getProfile() {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "GET",
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

// Şifre değiştir
export async function changePassword(currentPassword, newPassword) {
  const response = await fetch(`${API_BASE}/change-password`, {
    method: "PUT",
    headers: authService.getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

// Tüm kullanıcıları getir (sadece Site Yöneticisi)
export async function getUsers() {
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

// Site sakinlerini getir (id, ad, blok, daire)
export async function getResidents() {
  const API_BASE = "http://localhost:5223/api/user";
  const response = await fetch(`${API_BASE}/residents`, {
    method: "GET",
    headers: authService.getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

// Yeni kullanıcı oluştur (sadece Site Yöneticisi)
export async function createUser(data) {
  const response = await fetch(`${API_BASE}/register`, {
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

// Kullanıcı güncelle (sadece Site Yöneticisi)
export async function updateUser(id, data) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: authService.getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

// Kullanıcı sil (sadece Site Yöneticisi)
export async function deleteUser(id) {
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

// Kullanıcı istatistiklerini getir (sadece Site Yöneticisi)
export async function getUserStats() {
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