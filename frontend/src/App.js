import React, { useState } from 'react';
import TicketForm from './TicketForm';
import TicketList from './TicketList';
import StatsDashboard from './StatsDashboard';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTicketCreated = () => {
    // Trigger refresh for both TicketList and StatsDashboard
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Support Ticket System</h1>
        <p>AI-Powered Ticket Management</p>
      </header>

      <div className="container">
        <TicketForm onTicketCreated={handleTicketCreated} />
        <StatsDashboard refreshTrigger={refreshTrigger} />
      </div>

      <TicketList refreshTrigger={refreshTrigger} />
    </div>
  );
}

export default App;
