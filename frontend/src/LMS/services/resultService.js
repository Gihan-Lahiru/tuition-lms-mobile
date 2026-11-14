import apiClient from './apiClient';

export const resultService = {
  listTerms: () => apiClient.get('/academic-terms').then((r) => r.data),
  createTerm: (payload) => apiClient.post('/academic-terms', payload).then((r) => r.data),
  saveResults: (payload) => apiClient.post('/results', payload).then((r) => r.data),
  publishResults: (payload) =>
    apiClient.patch('/results/publish', payload).then((r) => r.data),
  getClassSheet: (classId, termId) =>
    apiClient
      .get(`/results/class/${classId}`, { params: termId ? { termId } : {} })
      .then((r) => r.data),
  getMyResults: () => apiClient.get('/results/me').then((r) => r.data),
};

