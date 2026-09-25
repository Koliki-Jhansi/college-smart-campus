const rawApiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '') : '';
const API_BASE_URL = rawApiUrl ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`) : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('collegehub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('collegehub_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          if (res.data.success && res.data.token) {
            localStorage.setItem('collegehub_token', res.data.token);
            originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('collegehub_token');
          localStorage.removeItem('collegehub_refresh_token');
          localStorage.removeItem('collegehub_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// AUTH API
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  setupFirstAdmin: (data) => api.post('/auth/setup-admin', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// COLLEGE CONFIG API
export const collegeApi = {
  getPublicStructure: () => api.get('/college/public-structure'),
  getConfig: () => api.get('/college/config'),
  updateConfig: (data) => api.put('/college/config', data),
  completeSetup: (data) => api.post('/college/complete-setup', data),
  getDepartments: () => api.get('/college/departments'),
  createDepartment: (data) => api.post('/college/departments', data),
  updateDepartment: (id, data) => api.put(`/college/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/college/departments/${id}`),
  getCourses: () => api.get('/college/courses'),
  createCourse: (data) => api.post('/college/courses', data),
  updateCourse: (id, data) => api.put(`/college/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/college/courses/${id}`),
  getAcademicYears: () => api.get('/college/academic-years'),
  createAcademicYear: (data) => api.post('/college/academic-years', data),
  setCurrentAcademicYear: (id) => api.put(`/college/academic-years/${id}/set-current`),
  getSections: () => api.get('/college/sections'),
  createSection: (data) => api.post('/college/sections', data),
  deleteSection: (id) => api.delete(`/college/sections/${id}`),
  getCampusResources: () => api.get('/college/resources'),
  createCampusResource: (data) => api.post('/college/resources', data),
  updateCampusResource: (id, data) => api.put(`/college/resources/${id}`, data),
  deleteCampusResource: (id) => api.delete(`/college/resources/${id}`),
};

// USER & CAMPUSCONNECT API
export const userApi = {
  getProfile: (id) => api.get(`/users/profile/${id}`),
  updateStudentProfile: (data) => api.put('/users/student-profile', data),
  updateFacultyProfile: (data) => api.put('/users/faculty-profile', data),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  searchStudents: (params) => api.get('/users/students', { params }),
  sendConnectRequest: (recipientId, data) => api.post(`/users/connect/${recipientId}`, data),
  handleConnectResponse: (connectionId, data) => api.put(`/users/connect/${connectionId}`, data),
  getMyConnections: () => api.get('/users/connections'),
};

// PROJECT API
export const projectApi = {
  getProjects: (params) => api.get('/projects', { params }),
  getMyProjects: () => api.get('/projects/my'),
  getProjectById: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  applyToProject: (id, data) => api.post(`/projects/${id}/join-request`, data),
  handleJoinRequest: (requestId, data) => api.put(`/projects/requests/${requestId}`, data),
  addTask: (id, data) => api.post(`/projects/${id}/tasks`, data),
  updateTaskStatus: (taskId, data) => api.put(`/projects/tasks/${taskId}`, data),
};

// SKILLSWAP API
export const skillSwapApi = {
  getMatches: () => api.get('/skillswap/matches'),
  searchSkills: (params) => api.get('/skillswap/search', { params }),
  sendRequest: (data) => api.post('/skillswap/requests', data),
  getMyRequests: () => api.get('/skillswap/requests'),
  scheduleSession: (data) => api.post('/skillswap/sessions', data),
  completeSession: (id, data) => api.put(`/skillswap/sessions/${id}/complete`, data),
  getMySessions: () => api.get('/skillswap/my-sessions'),
};

// STUDYHUB API
export const studyGroupApi = {
  getGroups: (params) => api.get('/study-groups', { params }),
  getMyGroups: () => api.get('/study-groups/my'),
  createGroup: (data) => api.post('/study-groups', data),
  joinGroup: (id) => api.post(`/study-groups/${id}/join`),
  leaveGroup: (id) => api.post(`/study-groups/${id}/leave`),
  addResource: (id, data) => api.post(`/study-groups/${id}/resources`, data),
};

// RESOURCE SHARING API
export const resourceApi = {
  getResources: (params) => api.get('/resources', { params }),
  uploadResource: (formData) => api.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  recordDownload: (id) => api.get(`/resources/${id}/download`),
  toggleBookmark: (id) => api.post(`/resources/${id}/bookmark`),
  getMyBookmarks: () => api.get('/resources/my-bookmarks'),
  reportResource: (id, data) => api.post(`/resources/${id}/report`, data),
};

// CAMPUSSLOT (BOOKINGS) API
export const slotApi = {
  getResources: (params) => api.get('/bookings/resources', { params }),
  createResource: (formData) => api.post('/bookings/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  checkAvailability: (resourceId, date) => api.get(`/bookings/availability/${resourceId}`, { params: { date } }),
  requestBooking: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  getAllBookings: (params) => api.get('/bookings', { params }),
  updateBookingStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  checkIn: (data) => api.post('/bookings/check-in', data),
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
};

// CAMPUSFIX (COMPLAINTS) API
export const complaintApi = {
  createComplaint: (formData) => api.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyComplaints: () => api.get('/complaints/my'),
  getAllComplaints: (params) => api.get('/complaints', { params }),
  getComplaintById: (id) => api.get(`/complaints/${id}`),
  assignStaff: (id, data) => api.put(`/complaints/${id}/assign`, data),
  updateStatus: (id, formData) => api.put(`/complaints/${id}/status`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  confirmClosure: (id, data) => api.put(`/complaints/${id}/confirm-closure`, data),
  addComment: (id, formData) => api.post(`/complaints/${id}/comments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// CAMPUSLOST API
export const lostFoundApi = {
  getItems: (params) => api.get('/lost-found', { params }),
  reportItem: (formData) => api.post('/lost-found', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getItemById: (id) => api.get(`/lost-found/${id}`),
  submitClaim: (id, data) => api.post(`/lost-found/${id}/claim`, data),
  confirmReturn: (id, data) => api.put(`/lost-found/${id}/return`, data),
};

// EVENTHUB API
export const eventApi = {
  getEvents: (params) => api.get('/events', { params }),
  getMyRegistrations: () => api.get('/events/my'),
  getMyCertificates: () => api.get('/events/my-certificates'),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (formData) => api.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  register: (id) => api.post(`/events/${id}/register`),
  checkIn: (data) => api.post('/events/check-in', data),
  getCertificatePdfUrl: (certId) => `/api/events/certificates/${certId}/pdf`,
};

// CLUBS API
export const clubApi = {
  getClubs: (params) => api.get('/clubs', { params }),
  createClub: (formData) => api.post('/clubs', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getClubById: (id) => api.get(`/clubs/${id}`),
  requestJoin: (id, data) => api.post(`/clubs/${id}/join`, data),
  handleMember: (memberId, data) => api.put(`/clubs/members/${memberId}`, data),
  createAnnouncement: (id, data) => api.post(`/clubs/${id}/announcements`, data),
};

// CAMPUSRIDE API
export const transportApi = {
  getRoutes: (params) => api.get('/transport/routes', { params }),
  getBuses: () => api.get('/transport/buses'),
  createRoute: (data) => api.post('/transport/routes', data),
  createBus: (data) => api.post('/transport/buses', data),
  reportIssue: (data) => api.post('/transport/issues', data),
  getIssues: () => api.get('/transport/issues'),
};

// CAMPUSVOICE API
export const voiceApi = {
  getSuggestions: (params) => api.get('/voice', { params }),
  createSuggestion: (data) => api.post('/voice', data),
  toggleVote: (id) => api.post(`/voice/${id}/vote`),
  respond: (id, data) => api.put(`/voice/${id}/respond`, data),
};

// CHAT API
export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateDirect: (recipientId) => api.post('/chat/conversations/direct', { recipientId }),
  getMessages: (conversationId) => api.get(`/chat/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, formData) => api.post(`/chat/conversations/${conversationId}/messages`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// NOTIFICATIONS API
export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// ANALYTICS & DASHBOARDS API
export const analyticsApi = {
  getDashboardData: () => api.get('/analytics/dashboard'),
  getExportUrl: (type) => `/api/analytics/export/${type}`,
};

// GLOBAL SEARCH API
export const searchApi = {
  search: (q) => api.get('/search', { params: { q } }),
};

export { api };
export default api;
