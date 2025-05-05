import { useEffect } from 'react';

/**
 * Hook para bloquear/desbloquear o scroll da página
 * @param shouldLock - Se deve bloquear o scroll
 * @param onlyDesktop - Se o bloqueio deve ocorrer apenas em desktop
 */
export function useScrollLock(shouldLock: boolean, onlyDesktop: boolean = false) {
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    
    // Se for para travar apenas em desktop e não for desktop, não faz nada
    if (onlyDesktop && !isDesktop) return;
    
    const html = document.documentElement;
    
    if (shouldLock) {
      html.classList.add('no-scroll');
    } else {
      html.classList.remove('no-scroll');
    }
    
    // Limpeza ao desmontar
    return () => {
      html.classList.remove('no-scroll');
    };
  }, [shouldLock, onlyDesktop]);
} 