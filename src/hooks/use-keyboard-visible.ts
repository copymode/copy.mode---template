import { useState, useEffect } from 'react';

/**
 * Hook para detectar quando o teclado virtual está visível em dispositivos móveis
 * @returns {boolean} Verdadeiro quando o teclado está visível
 */
export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Somente em dispositivos móveis
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return;
    }

    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    // Altura original do viewport (sem o teclado)
    const originalHeight = visualViewport.height;

    const handleResize = () => {
      // Quando o teclado abre, a altura do viewport diminui significativamente
      const heightDiff = originalHeight - visualViewport.height;
      
      // Consideramos que o teclado está aberto se a diferença for maior que 150px
      // (um valor que funciona bem para a maioria dos dispositivos móveis)
      setIsKeyboardVisible(heightDiff > 150);
      
      // Adiciona uma classe ao body para estilos específicos
      if (heightDiff > 150) {
        document.body.classList.add('keyboard-visible');
      } else {
        document.body.classList.remove('keyboard-visible');
      }
    };

    // Escuta eventos de resize do visualViewport
    visualViewport.addEventListener('resize', handleResize);

    // Limpa evento ao desmontar o componente
    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      document.body.classList.remove('keyboard-visible');
    };
  }, []);

  return isKeyboardVisible;
} 