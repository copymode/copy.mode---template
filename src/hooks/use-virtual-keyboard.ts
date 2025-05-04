import { useEffect } from 'react';

interface VirtualKeyboardOptions {
  /**
   * Indica se o conteúdo da página deve permanecer visível mesmo quando o teclado virtual está aberto
   */
  overlaysContent?: boolean;
}

/**
 * Hook que integra com a API VirtualKeyboard para melhor experiência
 * em dispositivos móveis que suportam esta API (principalmente Chrome para Android)
 * 
 * @param options Opções de configuração do teclado virtual
 */
export function useVirtualKeyboard(options: VirtualKeyboardOptions = { overlaysContent: true }) {
  useEffect(() => {
    // Verificar se o dispositivo é móvel
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return;
    }
    
    // Verificar se a API VirtualKeyboard está disponível
    if ('virtualKeyboard' in navigator) {
      try {
        // Definir que o teclado virtual deve se sobrepor ao conteúdo (não redimensionar)
        // @ts-ignore - Ignorando erro de tipagem pois a API ainda é experimental
        navigator.virtualKeyboard.overlaysContent = options.overlaysContent;
        
        // Adicionar classe ao body para estilização específica
        document.body.classList.add('virtual-keyboard-supported');
        
        // Escutar eventos de geometria do teclado
        // @ts-ignore
        const handleGeometryChange = (event: any) => {
          // Obter a geometria atual do teclado
          // @ts-ignore
          const { x, y, width, height } = navigator.virtualKeyboard.boundingRect;
          
          // Atualizar variáveis CSS com as dimensões do teclado virtual
          document.documentElement.style.setProperty('--keyboard-height', `${height}px`);
          document.documentElement.style.setProperty('--keyboard-width', `${width}px`);
          document.documentElement.style.setProperty('--keyboard-x', `${x}px`);
          document.documentElement.style.setProperty('--keyboard-y', `${y}px`);
          
          // Adicionar/remover classe baseado na visibilidade do teclado
          if (height > 0) {
            document.body.classList.add('keyboard-visible');
            document.body.classList.add('virtual-keyboard-visible');
          } else {
            document.body.classList.remove('keyboard-visible');
            document.body.classList.remove('virtual-keyboard-visible');
          }
        };
        
        // @ts-ignore
        navigator.virtualKeyboard.addEventListener('geometrychange', handleGeometryChange);
        
        return () => {
          // @ts-ignore
          navigator.virtualKeyboard.removeEventListener('geometrychange', handleGeometryChange);
          document.body.classList.remove('virtual-keyboard-supported');
          document.body.classList.remove('virtual-keyboard-visible');
        };
      } catch (error) {
        console.warn('Erro ao configurar VirtualKeyboard API:', error);
      }
    } else {
      // Adicionar classe para indicar que a API não é suportada
      document.body.classList.add('virtual-keyboard-not-supported');
    }
  }, [options.overlaysContent]);
} 