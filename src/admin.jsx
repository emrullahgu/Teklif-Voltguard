import React from 'react';
import ReactDOM from 'react-dom/client';
import SimpleAdminPanel from './SimpleAdminPanel.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SimpleAdminPanel />
    </ErrorBoundary>
  </React.StrictMode>,
);
