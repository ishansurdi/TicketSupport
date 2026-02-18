import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ticketAPI = {
  // Get all tickets with optional filters
  getTickets: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    return api.get(`/tickets/?${params.toString()}`);
  },

  // Create a new ticket
  createTicket: (ticketData) => {
    return api.post('/tickets/', ticketData);
  },

  // Update a ticket
  updateTicket: (id, ticketData) => {
    return api.patch(`/tickets/${id}/`, ticketData);
  },

  // Get ticket statistics
  getStats: () => {
    return api.get('/tickets/stats/');
  },

  // Classify ticket description using LLM
  classifyTicket: (description) => {
    return api.post('/tickets/classify/', { description });
  },
};

export default api;
