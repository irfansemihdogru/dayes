
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Handle ESC key for application reset
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Reload the page to reset the application state
    window.location.href = '/';
  }
});

createRoot(document.getElementById("root")!).render(<App />);
