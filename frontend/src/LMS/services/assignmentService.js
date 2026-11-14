import apiClient from './apiClient';

export const assignmentService = {
  getMyAssignments: () => apiClient.get('/assignments/my-assignments').then((r) => r.data),
  createAssignment: (classId, payload) =>
    apiClient.post(`/assignments/${classId}`, payload).then((r) => r.data),
  submitAssignment: (assignmentId, { answerText, file }) => {
    const formData = new FormData();
    if (answerText) formData.append('answerText', answerText);
    if (file) formData.append('file', file);
    return apiClient
      .post(`/assignments/${assignmentId}/submissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  getAssignmentSubmissions: (assignmentId) =>
    apiClient.get(`/assignments/${assignmentId}/submissions`).then((r) => r.data),
  gradeSubmission: (submissionId, payload) =>
    apiClient.patch(`/submissions/${submissionId}/grade`, payload).then((r) => r.data),
  fetchSubmissionFileBlob: (submissionId) =>
    apiClient.get(`/submissions/${submissionId}/file`, { responseType: 'blob' }),
};

