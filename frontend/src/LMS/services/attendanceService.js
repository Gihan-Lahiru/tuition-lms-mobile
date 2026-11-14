import apiClient from './apiClient';

export const attendanceService = {
  createSession: (payload) =>
    apiClient.post('/attendance/sessions', payload).then((r) => r.data),
  getClassSessions: (classId) =>
    apiClient.get(`/attendance/sessions/class/${classId}`).then((r) => r.data),
  saveSessionRecords: (sessionId, records) =>
    apiClient
      .put(`/attendance/sessions/${sessionId}/records`, { records })
      .then((r) => r.data),
  getMyAttendance: (month) =>
    apiClient
      .get('/attendance/me', { params: month ? { month } : {} })
      .then((r) => r.data),
};

