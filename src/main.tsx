import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from "@/integrations/supabase/client";

// Teste de variável de ambiente
console.log("[Main.tsx] VITE_TEST_VARIABLE:", import.meta.env.VITE_TEST_VARIABLE);
console.log("[Main.tsx] VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);

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

createRoot(document.getElementById("root")!).render(<App />);
