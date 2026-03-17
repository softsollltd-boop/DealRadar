import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for better debugging of production crashes
window.onerror = function(message, source, lineno, colno, error) {
  // Use a safe way to log errors that might contain circular references
  const safeError = error ? {
    message: error.message,
    stack: error.stack,
    name: error.name
  } : null;

  console.error('GLOBAL ERROR CAUGHT:', {
    message,
    source,
    lineno,
    colno,
    error: safeError
  });
  return false;
};

window.onunhandledrejection = function(event) {
  const reason = event.reason;
  const message = reason?.message || (typeof reason === 'object' ? JSON.stringify(reason) : String(reason || ''));
  
  // Ignore Vite WebSocket errors which are benign in this environment
  if (!message || message === '{}' || message.includes('WebSocket') || message.includes('vite') || message.includes('HMR') || message.includes('WebSocket closed')) {
    event.preventDefault();
    return;
  }

  console.warn('UNHANDLED PROMISE REJECTION:', reason);
  // Prevent the browser from also logging it to the console as an error
  event.preventDefault();
};

// Monkey-patch console methods to prevent circular structure errors during platform serialization
const sanitizeForLogging = (obj: any, cache = new Set()): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  // Handle DOM elements which often cause circular issues in React
  if (obj instanceof HTMLElement || (obj && typeof obj === 'object' && 'nodeType' in obj)) {
    return `[HTMLElement: ${obj.nodeName || 'unknown'}]`;
  }

  if (cache.has(obj)) return '[Circular]';
  cache.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item, cache));
  }

  const sanitized: any = {};
  try {
    for (const key in obj) {
      if (key.startsWith('__react') || key.startsWith('__fiber')) continue;
      sanitized[key] = sanitizeForLogging(obj[key], cache);
    }
  } catch (e) {
    return '[Unserializable Object]';
  }
  return sanitized;
};

const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args: any[]) => {
  const sanitizedArgs = args.map(arg => sanitizeForLogging(arg));
  originalWarn.apply(console, sanitizedArgs);
};

console.error = (...args: any[]) => {
  // Don't sanitize if it's our own "GLOBAL ERROR CAUGHT" to avoid recursion
  if (args[0] === 'GLOBAL ERROR CAUGHT:' || args[0] === 'UNHANDLED PROMISE REJECTION:') {
    originalError.apply(console, args);
    return;
  }
  const sanitizedArgs = args.map(arg => sanitizeForLogging(arg));
  originalError.apply(console, sanitizedArgs);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
