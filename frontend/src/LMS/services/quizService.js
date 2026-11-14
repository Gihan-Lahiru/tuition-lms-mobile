import apiClient from './apiClient';

export const quizService = {
  listQuizzes: () => apiClient.get('/quizzes').then((r) => r.data),
  getQuiz: (id) => apiClient.get(`/quizzes/${id}`).then((r) => r.data),
  createQuiz: (payload) => apiClient.post('/quizzes', payload).then((r) => r.data),
  parseQuestionsText: (text) =>
    apiClient.post('/quizzes/parse-text', { text }).then((r) => r.data),
  generateQuizWithAi: (formDataOrJson) => {
    if (formDataOrJson instanceof FormData) {
      return apiClient
        .post('/quizzes/generate-ai', formDataOrJson, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    }
    return apiClient.post('/quizzes/generate-ai', formDataOrJson).then((r) => r.data);
  },
  updateAnswerKey: (quizId, payload) =>
    apiClient.patch(`/quizzes/${quizId}/answer-key`, payload).then((r) => r.data),
  updateQuizSettings: (id, payload) =>
    apiClient.patch(`/quizzes/${id}`, payload).then((r) => r.data),
  startOrResumeAttempt: (quizId) =>
    apiClient.post(`/quizzes/${quizId}/attempts`).then((r) => r.data),
  saveAnswers: (attemptId, payload) =>
    apiClient.patch(`/quiz-attempts/${attemptId}/answers`, payload).then((r) => r.data),
  submitAttempt: (attemptId) =>
    apiClient.post(`/quiz-attempts/${attemptId}/submit`).then((r) => r.data),
  getAttemptResult: (attemptId) =>
    apiClient.get(`/quiz-attempts/${attemptId}/result`).then((r) => r.data),
  listQuizAttemptsForTeacher: (quizId) =>
    apiClient.get(`/quizzes/${quizId}/attempts`).then((r) => r.data),
  regradeAttempt: (attemptId, score) =>
    apiClient.patch(`/quiz-attempts/${attemptId}/regrade`, { score }).then((r) => r.data),
};

