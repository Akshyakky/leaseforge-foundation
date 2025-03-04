
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add theme detection
const setInitialTheme = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.add('light');
  }
};

// Run theme detection before rendering
setInitialTheme();

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
