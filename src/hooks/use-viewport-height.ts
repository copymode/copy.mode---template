import { useEffect } from 'react';

/**
 * Hook para configurar uma altura de viewport consistente em dispositivos móveis,
 * especialmente quando o teclado virtual é aberto.
 * 
 * Implementa a técnica de CSS custom property para viewport height dinâmica
 * que funciona melhor que vh em dispositivos móveis.
 */
export function useViewportHeight() {
  useEffect(() => {
    // Só é necessário em dispositivos móveis
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return;
    }

    // Detectar se estamos no iOS para tratamentos específicos
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Função para atualizar a altura real do viewport e definir variável CSS
    const updateViewportHeight = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
      
      // Para debug
      console.log(`Viewport atualizado: ${vh}px`);
    };
    
    // Atualizar altura inicial
    updateViewportHeight();
    
    // Configurar observadores de eventos que podem afetar a altura
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      // Fallback para dispositivos sem suporte a visualViewport
      window.addEventListener('resize', updateViewportHeight);
    }
    
    // Eventos adicionais específicos para iOS
    if (isIOS) {
      // No iOS, precisamos de eventos adicionais para capturar mudanças de orientação
      window.addEventListener('orientationchange', updateViewportHeight);
      
      // No iOS, o scroll também pode indicar que o teclado foi aberto/fechado
      window.addEventListener('scroll', () => {
        // Adicionar atraso para garantir que a altura seja medida após a animação
        setTimeout(updateViewportHeight, 100);
      });
    }
    
    // Limpar eventos ao desmontar o componente
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
      
      if (isIOS) {
        window.removeEventListener('orientationchange', updateViewportHeight);
        window.removeEventListener('scroll', updateViewportHeight);
      }
    };
  }, []);
} 