import { useEffect } from 'react';

/**
 * Hook para bloquear/desbloquear o scroll da página
 * @param shouldLock - Se deve bloquear o scroll
 * @param onlyDesktop - Se o bloqueio deve ocorrer apenas em desktop
 * @param isHomePage - Se está na página Home (importante para especificidade)
 */
export function useScrollLock(shouldLock: boolean, onlyDesktop: boolean = false, isHomePage: boolean = true) {
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    
    // Se for para travar apenas em desktop e não for desktop, não faz nada
    if (onlyDesktop && !isDesktop) return;
    
    // Se não for a página home, não devemos bloquear o scroll
    if (!isHomePage) return;
    
    const html = document.documentElement;
    const body = document.body;
    
    if (shouldLock && isHomePage) {
      html.classList.add('home-page-no-scroll');
      body.classList.add('home-page-no-scroll');
      
      // Importante: selecionar especificamente o container home
      const homeContainer = document.querySelector('.home-container');
      if (homeContainer) {
        (homeContainer as HTMLElement).style.overflow = 'hidden';
      }
    } else {
      html.classList.remove('home-page-no-scroll');
      body.classList.remove('home-page-no-scroll');
    }
    
    // Limpeza ao desmontar
    return () => {
      html.classList.remove('home-page-no-scroll');
      body.classList.remove('home-page-no-scroll');
    };
  }, [shouldLock, onlyDesktop, isHomePage]);
} 