import { useEffect } from 'react';

export const useFavicon = (theme: 'light' | 'dark') => {
  useEffect(() => {
    // Remove favicon existente
    const existingFavicon = document.querySelector('link[rel="icon"]');
    if (existingFavicon) {
      existingFavicon.remove();
    }

    // Cria novo favicon baseado no tema
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = theme === 'light' ? '/iconblack.png' : '/iconwhite.png';
    
    // Adiciona o novo favicon ao head
    document.head.appendChild(favicon);
  }, [theme]);
}; 