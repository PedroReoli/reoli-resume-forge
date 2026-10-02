import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import { App } from './app/App';
import './styles/app.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Elemento raiz não encontrado.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
