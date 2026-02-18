import React, { useState } from 'react';
import { ticketAPI } from './api';

function TicketForm({ onTicketCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [llmSuggestion, setLlmSuggestion] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDescriptionBlur = async () => {
    if (!formData.description.trim()) {
      return;
    }

    setIsClassifying(true);
    setError('');

    try {
      const response = await ticketAPI.classifyTicket(formData.description);
      setLlmSuggestion(response.data);
      
      // Auto-fill the category and priority
      setFormData(prev => ({
        ...prev,
        category: response.data.suggested_category,
        priority: response.data.suggested_priority,
      }));
    } catch (err) {
      console.error('Classification failed:', err);
      // Don't show error to user, just log it
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await ticketAPI.createTicket(formData);
      
      // Clear form
      setFormData({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
      });
      setLlmSuggestion(null);
      
      // Notify parent component
      if (onTicketCreated) {
        onTicketCreated(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2>Submit a Ticket</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            maxLength={200}
            required
            placeholder="Brief description of your issue"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            onBlur={handleDescriptionBlur}
            required
            placeholder="Detailed description of your issue"
          />
        </div>

        {isClassifying && (
          <div className="loading-indicator">
            Analyzing description...
          </div>
        )}

        {llmSuggestion && !isClassifying && (
          <div className="llm-suggestion">
            <p><strong>AI Suggestion:</strong></p>
            <p>Category: {llmSuggestion.suggested_category}</p>
            <p>Priority: {llmSuggestion.suggested_priority}</p>
            <p style={{ fontSize: '11px', marginTop: '5px', fontStyle: 'italic' }}>
              You can change these before submitting
            </p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="account">Account</option>
            <option value="general">General</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority *</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={isSubmitting || isClassifying}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}

export default TicketForm;
