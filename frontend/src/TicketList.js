import React, { useState, useEffect } from 'react';
import { ticketAPI } from './api';

function TicketList({ refreshTrigger }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketAPI.getTickets(filters);
      setTickets(response.data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchTickets();
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await ticketAPI.updateTicket(ticketId, { status: newStatus });
      fetchTickets();
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="card">
      <h2>Ticket List</h2>

      <div className="filters">
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          <option value="billing">Billing</option>
          <option value="technical">Technical</option>
          <option value="account">Account</option>
          <option value="general">General</option>
        </select>

        <select name="priority" value={filters.priority} onChange={handleFilterChange}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search tickets..."
        />

        <button onClick={handleSearch} className="btn btn-primary">
          Search
        </button>
      </div>

      {loading ? (
        <div className="loading-indicator">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">No tickets found</div>
      ) : (
        <div className="ticket-list">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-item">
              <div className="ticket-header">
                <div>
                  <div className="ticket-title">{ticket.title}</div>
                  <div className="ticket-badges">
                    <span className="badge badge-category">{ticket.category}</span>
                    <span className={`badge badge-priority-${ticket.priority}`}>
                      {ticket.priority}
                    </span>
                    <span className={`badge badge-status-${ticket.status}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ticket-description">
                {truncateText(ticket.description)}
              </div>

              <div className="ticket-meta">
                Created: {formatDate(ticket.created_at)}
              </div>

              <div className="ticket-actions">
                <div className="form-group">
                  <label htmlFor={`status-${ticket.id}`}>Change Status:</label>
                  <select
                    id={`status-${ticket.id}`}
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TicketList;
