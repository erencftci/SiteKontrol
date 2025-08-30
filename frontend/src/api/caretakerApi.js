import authService from '../services/authService';

const API_BASE = 'http://localhost:5223/api/caretaker';

export async function assignCaretaker(caretakerId, blogNumber) {
  const res = await fetch(`${API_BASE}/assign`, {
    method: 'POST',
    headers: authService.getAuthHeaders(),
    body: JSON.stringify({ caretakerId, blogNumber })
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function markDaily(task) {
  const res = await fetch(`${API_BASE}/daily`, {
    method: 'POST',
    headers: authService.getAuthHeaders(),
    body: JSON.stringify(task)
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function createRequirement(data) {
  const res = await fetch(`${API_BASE}/monthly/requirement`, {
    method: 'POST',
    headers: authService.getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function completeRequirement(requirementId) {
  const res = await fetch(`${API_BASE}/monthly/complete/${requirementId}`, {
    method: 'POST',
    headers: authService.getAuthHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function getCaretakerStats() {
  const res = await fetch(`${API_BASE}/stats`, {
    method: 'GET',
    headers: authService.getAuthHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function listCaretakersByBlock(blog) {
  const res = await fetch(`${API_BASE}/block/${blog}/caretakers`, {
    method: 'GET',
    headers: authService.getAuthHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function listRequirements() {
  const res = await fetch(`${API_BASE}/monthly/requirements`, {
    method: 'GET',
    headers: authService.getAuthHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function deleteRequirement(id) {
  const res = await fetch(`${API_BASE}/monthly/requirement/${id}`, {
    method: 'DELETE',
    headers: authService.getAuthHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function getMyRequirements() {
  const res = await fetch(`${API_BASE}/monthly/my-requirements`, {
    method: 'GET',
    headers: authService.getAuthHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function getMyCompletions() {
  const res = await fetch(`${API_BASE}/monthly/my-completions`, {
    method: 'GET',
    headers: authService.getAuthHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function getMonthlyOverview() {
  const res = await fetch(`${API_BASE}/monthly/overview`, {
    method: 'GET',
    headers: authService.getAuthHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}


