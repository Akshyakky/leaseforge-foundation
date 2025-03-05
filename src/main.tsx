
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Validate essential environment variables
const validateEnv = () => {
  const requiredVars = ['VITE_APP_NAME', 'VITE_APP_VERSION'];
  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Set defaults if needed
  if (!import.meta.env.VITE_API_TIMEOUT) {
    import.meta.env.VITE_API_TIMEOUT = '30000';
  }
};

// Add theme detection
const setInitialTheme = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');
  
  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.add('light');
  }
};

// Run initialization steps before rendering
validateEnv();
setInitialTheme();

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
