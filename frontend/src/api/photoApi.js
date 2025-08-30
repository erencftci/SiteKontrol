import authService from '../services/authService';

const API_BASE = 'http://localhost:5223/api/photo';

export async function uploadPhoto(file, description) {
	const form = new FormData();
	form.append('file', file);
	if (description) form.append('description', description);

	const token = authService.getToken();
	const response = await fetch(`${API_BASE}/upload`, {
		method: 'POST',
		headers: {
			Authorization: token ? `Bearer ${token}` : ''
		},
		body: form
	});
	if (!response.ok) {
		const error = await response.text();
		throw new Error(error || 'Fotoğraf yüklenemedi');
	}
	return await response.json();
}


