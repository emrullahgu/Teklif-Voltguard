import React from 'react'
import ReactDOM from 'react-dom/client'
import SimpleAppWithAuth from './SimpleAppWithAuth.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SimpleAppWithAuth />
    </ErrorBoundary>
  </React.StrictMode>
)

