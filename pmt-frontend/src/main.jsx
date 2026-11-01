import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/App.css';
import './styles/components/buttons.css';
import './styles/components/cards.css';
import './styles/components/common.css';
import './styles/components/forms.css';
import './styles/components/modals.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
