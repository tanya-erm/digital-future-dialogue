import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Day1 from './Day1Page';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Day1 />
  </StrictMode>,
);
