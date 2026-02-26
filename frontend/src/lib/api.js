import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({ baseURL: API, timeout: 15000 });

// Dashboard
export const fetchDashboardStats = () => api.get('/dashboard/stats').then(r => r.data);

// Lookups
export const fetchLookup = (key) => api.get(`/lookups/${key}`).then(r => r.data);
export const createLookup = (key, data) => api.post(`/lookups/${key}`, data).then(r => r.data);
export const deleteLookup = (key, id) => api.delete(`/lookups/${key}/${id}`).then(r => r.data);

// Products
export const fetchProducts = () => api.get('/products').then(r => r.data);
export const createProduct = (data) => api.post('/products', data).then(r => r.data);
export const previewSKU = (data) => api.post('/sku/preview', data).then(r => r.data);

// Users
export const fetchUsers = () => api.get('/users').then(r => r.data);

// Dices
export const fetchDices = () => api.get('/dices').then(r => r.data);
export const createDice = (data) => api.post('/dices', data).then(r => r.data);

// Dice Mappings
export const fetchDiceMotifMappings = () => api.get('/dice-mappings/motif').then(r => r.data);
export const createDiceMotifMapping = (data) => api.post('/dice-mappings/motif', data).then(r => r.data);
export const fetchDiceLockingMappings = () => api.get('/dice-mappings/locking').then(r => r.data);
export const createDiceLockingMapping = (data) => api.post('/dice-mappings/locking', data).then(r => r.data);

// Job Cards
export const fetchJobCards = () => api.get('/job-cards').then(r => r.data);
export const createJobCard = (data) => api.post('/job-cards', data).then(r => r.data);
export const updateJobCardStatus = (id, status) => api.patch(`/job-cards/${id}/status?status=${status}`).then(r => r.data);

// QC Logs
export const fetchQCLogs = () => api.get('/qc-logs').then(r => r.data);
export const createQCLog = (data) => api.post('/qc-logs', data).then(r => r.data);

// Inventory
export const fetchInventory = () => api.get('/inventory').then(r => r.data);
export const createInventory = (data) => api.post('/inventory', data).then(r => r.data);

// Production
export const fetchProduction = () => api.get('/production').then(r => r.data);
export const createProduction = (data) => api.post('/production', data).then(r => r.data);

// Migrations
export const fetchMigrations = () => api.get('/migrations').then(r => r.data);

// Schema
export const fetchSchema = () => api.get('/schema').then(r => r.data);

export default api;
