import { useState, useEffect } from 'react';

// Um threshold para considerar que o teclado está aberto (evita pequenos resizes)
const KEYBOARD_HEIGHT_THRESHOLD = 100; // Ajustável

/**
 * Hook para detectar a visibilidade, altura e deslocamento do teclado virtual 
 * em dispositivos móveis usando a API visualViewport.
 * @returns {{isKeyboardVisible: boolean, keyboardHeight: number, visualViewportOffsetTop: number}}
 */
export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(0);

  useEffect(() => {
    // Executa apenas no lado do cliente e em dispositivos "móveis" (pela largura)
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !window.visualViewport) {
      return;
    }

    // Considera mobile uma tela <= 768px. Não adiciona listeners no desktop.
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
        // Garante estado inicial correto se redimensionar de mobile para desktop
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        setVisualViewportOffsetTop(0);
      return;
    }

    const visualViewport = window.visualViewport;

    const handleResize = () => {
      if (!visualViewport) return;

      // Calcula a altura estimada do teclado
      // window.innerHeight é a altura da layout viewport
      // visualViewport.height é a altura da visual viewport (o que é visível)
      // A diferença é o espaço ocupado por barras de UI E/OU o teclado
      const heightDiff = window.innerHeight - visualViewport.height;
      
      // Consideramos o teclado visível se a diferença for maior que o threshold
      // e a altura do visualViewport for significativamente menor que a altura inicial da janela
      // (para evitar ser enganado por barras de ferramentas do navegador aparecendo/sumindo)
      const currentKeyboardHeight = Math.max(0, heightDiff);
      const keyboardIsLikelyVisible = currentKeyboardHeight > KEYBOARD_HEIGHT_THRESHOLD;
      const currentOffsetTop = visualViewport.offsetTop; // Captura o offset

      setKeyboardHeight(currentKeyboardHeight);
      setIsKeyboardVisible(keyboardIsLikelyVisible);
      setVisualViewportOffsetTop(currentOffsetTop); // Atualiza o estado do offset
    };

    // Chama handleResize inicialmente para definir o estado correto
    handleResize(); 

    visualViewport.addEventListener('resize', handleResize);
    
    // Adiciona também um listener de scroll, pois o offsetTop pode mudar com scroll em alguns cenários
    visualViewport.addEventListener('scroll', handleResize); 

    // Limpa o listener ao desmontar
    return () => {
      if (visualViewport) { // Verifica se visualViewport ainda existe
      visualViewport.removeEventListener('resize', handleResize);
          visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  // Dependência vazia para rodar apenas na montagem/desmontagem
  // A lógica de resize dentro do handler pega os valores mais recentes
  }, []);

  return { isKeyboardVisible, keyboardHeight, visualViewportOffsetTop };
} 