
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import ErrorBoundary from './components/ErrorBoundary';
import './input.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <ConfirmationProvider>
            <App />
          </ConfirmationProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);