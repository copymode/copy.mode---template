import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from "@/integrations/supabase/client";

// Expor globalmente APENAS PARA TESTE no console
(window as any).supabase = supabase;

// Impedir zoom no mobile
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  }, { passive: false });
}

// Também podemos definir overflow no <html> e <body> diretamente pelo JS
document.documentElement.style.overflow = 'hidden';
document.body.style.overflow = 'hidden';

createRoot(document.getElementById("root")!).render(<App />);
