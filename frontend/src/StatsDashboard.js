import React, { useState, useEffect } from 'react';
import { ticketAPI } from './api';

function StatsDashboard({ refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await ticketAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2>Stats Dashboard</h2>
        <div className="loading-indicator">Loading statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <h2>Stats Dashboard</h2>
        <div className="empty-state">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Stats Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Tickets</div>
          <div className="stat-value">{stats.total_tickets}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Open Tickets</div>
          <div className="stat-value">{stats.open_tickets}</div>
        </div>

        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-label">Avg Tickets Per Day</div>
          <div className="stat-value">{stats.avg_tickets_per_day}</div>
        </div>
      </div>

      <div className="breakdown">
        <h3>Priority Breakdown</h3>
        {Object.entries(stats.priority_breakdown).map(([priority, count]) => (
          <div key={priority} className="breakdown-item">
            <span className="breakdown-label">{priority}</span>
            <span className="breakdown-value">{count}</span>
          </div>
        ))}
      </div>

      <div className="breakdown">
        <h3>Category Breakdown</h3>
        {Object.entries(stats.category_breakdown).map(([category, count]) => (
          <div key={category} className="breakdown-item">
            <span className="breakdown-label">{category}</span>
            <span className="breakdown-value">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatsDashboard;
