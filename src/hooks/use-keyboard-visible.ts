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
    const windowHeight = window.innerHeight;

    const handleResize = () => {
      // Quando o teclado abre, a altura do viewport diminui significativamente
      const heightDiff = originalHeight - visualViewport.height;
      
      // Detecta a diferença de altura com a tela original
      const viewportChanged = heightDiff > 150;
      
      // Para iOS, também verifica se o elemento ativo é um input/textarea
      const isInputFocused = 
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA';
      
      // Combina os dois métodos de detecção
      const keyboardIsVisible = viewportChanged || 
        (isInputFocused && (window.innerHeight < windowHeight * 0.85));
      
      setIsKeyboardVisible(keyboardIsVisible);
      
      // Adiciona uma classe ao body para estilos específicos
      if (keyboardIsVisible) {
        document.body.classList.add('keyboard-visible');
      } else {
        document.body.classList.remove('keyboard-visible');
      }
    };

    // Escuta eventos de resize do visualViewport
    visualViewport.addEventListener('resize', handleResize);
    
    // Escuta eventos de foco para detectar quando um input é focado
    document.addEventListener('focusin', handleResize);
    document.addEventListener('focusout', handleResize);

    // Limpa evento ao desmontar o componente
    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleResize);
      document.removeEventListener('focusout', handleResize);
      document.body.classList.remove('keyboard-visible');
    };
  }, []);

  return isKeyboardVisible;
} 