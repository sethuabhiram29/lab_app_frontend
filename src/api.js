import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001/api'
    : 'https://lab-app-backend-e243.onrender.com/api');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user, set session expired flag
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.setItem('sessionExpired', '1');
      window.location = '/login';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = (credentials) => api.post('/auth/login', credentials).then(res => res.data);
export const register = (userData) => api.post('/auth/register', userData).then(res => res.data);

// Commission APIs
export const getCommissions = (params = {}) => api.get('/commissions', { params });
export const updateCommission = (patientId, commission) => api.post(`/commissions/${patientId}`, { commission });

// Updation Links API
export const saveUpdationLinks = (patientId, links) =>
  api.post(`/updation-links/${patientId}`, links).then(res => res.data);

export const getUpdationLinks = () => api.get('/updation-links').then(res => res.data);
export const getPatientUpdationLinks = (patientId) => api.get(`/updation-links/${patientId}`).then(res => res.data);

// Test APIs
export const getTests = () => api.get('/tests');
export const createTest = (testData) => {
  console.log('Creating test with data:', testData);
  return api.post('/tests', testData);
};
export const updateTest = (id, testData) => {
  console.log('Updating test:', id, testData);
  return api.put(`/tests/${id}`, testData);
};
export const deleteTest = (id) => {
  console.log('Deleting test:', id);
  return api.delete(`/tests/${id}`);
};

// Doctor APIs
export const getDoctors = () => api.get('/doctors');
export const createDoctor = (doctorData) => {
  console.log('Creating doctor with data:', doctorData);
  return api.post('/doctors', doctorData);
};
export const updateDoctor = (id, doctorData) => {
  console.log('Updating doctor:', id, doctorData);
  return api.put(`/doctors/${id}`, doctorData);
};
export const deleteDoctor = (id) => {
  console.log('Deleting doctor:', id);
  return api.delete(`/doctors/${id}`);
};

// Equipment APIs
export const getEquipment = () => api.get('/equipment');
export const getEquipmentAnalytics = (params = {}) => api.get('/equipment/analytics', { params });
export const createEquipment = (equipmentData) => {
  console.log('Creating equipment with data:', equipmentData);
  return api.post('/equipment', equipmentData);
};
export const updateEquipment = (id, equipmentData) => {
  console.log('Updating equipment:', id, equipmentData);
  return api.put(`/equipment/${id}`, equipmentData);
};
export const addStock = async (id, stockData) => {
  try {
    console.log('Adding stock for equipment:', id, stockData);
    const response = await api.put(`/equipment/${id}/add-stock`, stockData);
    console.log('Add stock response:', response.data);
    return response;
  } catch (error) {
    console.error('Add stock error:', error.response?.data || error.message);
    throw error;
  }
};
export const addStockToEquipment = addStock; // Alias for backward compatibility
export const useStock = (id, usageData) => {
  console.log('Using stock for equipment:', id, usageData);
  return api.post(`/equipment/${id}/use`, usageData);
};
export const markEquipmentUsed = useStock; // Alias for backward compatibility
export const deleteEquipment = (id) => {
  console.log('Deleting equipment:', id);
  return api.delete(`/equipment/${id}`);
};
export const getEquipmentById = (id) => api.get(`/equipment/${id}`);

// Patient functions
export const createPatient = async (patientData) => {
  try {
    console.log('Sending patient data:', JSON.stringify(patientData, null, 2));
    const response = await api.post('/patients', patientData);
    console.log('Server response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error details:', error);
    throw error.response || error;
  }
};

export const getPatients = async () => {
  try {
    const response = await api.get('/patients');
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const getPatient = (id) => api.get(`/patients/${id}`);
export const updatePatient = (id, patientData) => api.put(`/patients/${id}`, patientData);
export const deletePatient = (id) => api.delete(`/patients/${id}`);
export const getPendingPatients = () => api.get('/patients/pending-reports');

// Report functions
export const getReports = async (params = {}) => {
  try {
    const response = await api.get('/reports', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const createReport = async (reportData) => {
  try {
    const response = await api.post('/reports', reportData);
    return response.data;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

export const getReport = async (id) => {
  try {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

export const updateReport = async (id, reportData) => {
  try {
    console.log('Sending update to server:', { id, reportData });
    const response = await api.put(`/reports/${id}`, reportData);
    console.log('Server response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};
export const deleteReport = (id) => api.delete(`/reports/${id}`);

export const markReportPrinted = async (reportId) => {
  try {
    const response = await api.patch(`/reports/${reportId}/printed`);
    return response.data;
  } catch (error) {
    console.error('Error marking report as printed:', error);
    throw error;
  }
};

export const uploadPDFToGoogleDrive = async (reportId, pdfBuffer, fileName) => {
  try {
    const response = await api.post('/reports/upload-to-drive', {
      reportId,
      pdfBuffer,
      fileName
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
};

// SubTest APIs
export const getSubTests = () => api.get('/subtests');
export const createSubTest = (subTestData) => api.post('/subtests', subTestData);
export const updateSubTest = (id, subTestData) => api.put(`/subtests/${id}`, subTestData);
export const deleteSubTest = (id) => api.delete(`/subtests/${id}`);

// Agent functions
export const createAgent = async (agentData) => {
  try {
    const response = await api.post('/agents', agentData);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const getAgents = async () => {
  try {
    const response = await api.get('/agents');
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const updateAgent = (id, agentData) => api.put(`/agents/${id}`, agentData);
export const deleteAgent = (id) => api.delete(`/agents/${id}`);

export const getDoctorAnalysis = async (doctorId, startDate, endDate) => {
  try {
    console.log('Fetching doctor analysis:', { doctorId, startDate, endDate });
    const response = await api.get('/analysis/doctor', { 
      params: { doctorId, startDate, endDate }
    });
    console.log('Doctor analysis response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getDoctorAnalysis:', error);
    throw error;
  }
};

export const getAgentAnalysis = async (agentId, startDate, endDate) => {
  try {
    console.log('Fetching agent analysis:', { agentId, startDate, endDate });
    const response = await api.get('/analysis/agent', { 
      params: { agentId, startDate, endDate }
    });
    console.log('Agent analysis response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getAgentAnalysis:', error);
    throw error;
  }
};

export default api; 