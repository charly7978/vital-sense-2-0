
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { VitalsProvider } from './contexts/VitalsContext';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <VitalsProvider>
      <App />
    </VitalsProvider>
  </React.StrictMode>
);
