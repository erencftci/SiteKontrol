import authService from '../services/authService';

const API_BASE = 'http://localhost:5223/api/message';

export async function getChatMessages(otherUserId) {
	const res = await fetch(`${API_BASE}/thread/${otherUserId}`, {
		headers: authService.getAuthHeaders()
	});
	if (!res.ok) throw new Error(await res.text());
	return await res.json();
}

export async function sendMessage(payload) {
	const res = await fetch(`${API_BASE}`, {
		method: 'POST',
		headers: authService.getAuthHeaders(),
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error(await res.text());
	return await res.json();
}

export async function markThreadRead(otherUserId) {
	const res = await fetch(`${API_BASE}/thread/${otherUserId}/read`, {
		method: 'POST',
		headers: authService.getAuthHeaders()
	});
	if (!res.ok && res.status !== 204) throw new Error(await res.text());
} 

export async function getChats() {
	const res = await fetch(`${API_BASE}/chats`, {
		headers: authService.getAuthHeaders()
	});
	if (!res.ok) throw new Error(await res.text());
	return await res.json();
}

export async function getContacts() {
	const res = await fetch(`${API_BASE}/contacts`, {
		headers: authService.getAuthHeaders()
	});
	if (!res.ok) throw new Error(await res.text());
	return await res.json();
}