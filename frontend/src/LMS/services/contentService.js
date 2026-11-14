import apiClient from './apiClient';

export const contentService = {
  getMyClasses: () => apiClient.get('/classes/my-classes').then((r) => r.data),
  createClass: (payload) => apiClient.post('/classes', payload).then((r) => r.data),
  getClassRoster: (classId) =>
    apiClient.get(`/classes/${classId}/roster`).then((r) => r.data),
  getAnnouncements: (classId) =>
    apiClient
      .get('/classes/announcements/list', { params: classId ? { classId } : {} })
      .then((r) => r.data),
  createAnnouncement: (payload) =>
    apiClient.post('/classes/announcements', payload).then((r) => r.data),

  listPapers: (grade) =>
    apiClient.get('/papers', { params: grade ? { grade } : {} }).then((r) => r.data),
  uploadPaper: (formData) =>
    apiClient
      .post('/papers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  downloadPaperBlob: (id, inline = false) =>
    apiClient.get(`/papers/${id}/download`, {
      params: inline ? { inline: 'true' } : {},
      responseType: 'blob',
    }),
  deletePaper: (id) => apiClient.delete(`/papers/${id}`).then((r) => r.data),

  listNotes: (grade) =>
    apiClient.get('/notes', { params: grade ? { grade } : {} }).then((r) => r.data),
  uploadNote: (formData) =>
    apiClient
      .post('/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  downloadNoteBlob: (id, inline = false) =>
    apiClient.get(`/notes/${id}/download`, {
      params: inline ? { inline: 'true' } : {},
      responseType: 'blob',
    }),

  listVideos: (grade) =>
    apiClient.get('/videos', { params: grade ? { grade } : {} }).then((r) => r.data),
  createVideo: (payload) => apiClient.post('/videos', payload).then((r) => r.data),
  deleteVideo: (id) => apiClient.delete(`/videos/${id}`).then((r) => r.data),

  getMyPayments: () => apiClient.get('/payments/my-payments').then((r) => r.data),
  uploadReceipt: (formData) =>
    apiClient
      .post('/payments/upload-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  listAllReceipts: () => apiClient.get('/payments/receipts/all').then((r) => r.data),
  approveReceipt: (id, reviewNotes) =>
    apiClient.put(`/payments/${id}/approve`, { reviewNotes }).then((r) => r.data),
  rejectReceipt: (id, reviewNotes) =>
    apiClient.put(`/payments/${id}/reject`, { reviewNotes }).then((r) => r.data),
  fetchReceiptBlob: (id) =>
    apiClient.get(`/payments/${id}/receipt`, { responseType: 'blob' }),

  listNotifications: () => apiClient.get('/notifications').then((r) => r.data),
  markAllNotificationsRead: () =>
    apiClient.patch('/notifications/read-all').then((r) => r.data),
  markNotificationRead: (id) =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  listStudents: () => apiClient.get('/students').then((r) => r.data),
  updateStudentApproval: (id, approvalStatus) =>
    apiClient.patch(`/students/${id}/approval`, { approvalStatus }).then((r) => r.data),
};

