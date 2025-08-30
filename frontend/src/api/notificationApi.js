const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5223/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getUnreadNotifications() {
  const res = await fetch(`${API_URL}/notifications/unread`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!res.ok) throw new Error('Bildirimler alınamadı');
  return res.json();
}

export async function markNotificationsSeen(items) {
  const res = await fetch(`${API_URL}/notifications/mark-seen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Bildirimler işaretlenemedi');
  return res.json().catch(() => ({}));
}


