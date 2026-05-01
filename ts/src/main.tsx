import '@fontsource/inter/400.css';   // Inter Regular (UI body, slider labels)
import '@fontsource/inter/500.css';   // Inter Medium (replaces Avenir-Medium 12)
import '@fontsource/inter/700.css';   // Inter Bold (replaces Avenir-Heavy 24)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
