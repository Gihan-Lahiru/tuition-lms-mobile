import apiClient from './apiClient';

export const messageService = {
  // Student API
  getMyMessages: () => apiClient.get('/messages/my-messages').then((r) => r.data),
  sendMessage: (message) => apiClient.post('/messages', { message }).then((r) => r.data),

  // Teacher / Admin API
  getAllMessages: () => apiClient.get('/messages').then((r) => r.data),
  replyMessage: (id, reply) => apiClient.put(`/messages/${id}/reply`, { reply }).then((r) => r.data),

  // Profile update
  updateProfile: (data) => apiClient.patch('/auth/profile', data).then((r) => r.data),
};
