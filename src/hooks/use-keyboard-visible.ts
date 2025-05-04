import { useState, useEffect } from 'react';

/**
 * Hook aprimorado para detectar quando o teclado virtual está visível em dispositivos móveis
 * Utiliza múltiplas estratégias para melhor compatibilidade entre dispositivos
 * @returns {boolean} Verdadeiro quando o teclado está visível
 */
export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Somente em dispositivos móveis
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return;
    }

    // Guarda valores iniciais para referência
    const initialWindowHeight = window.innerHeight;
    const initialVisualHeight = window.visualViewport?.height || initialWindowHeight;
    
    let lastKnownHeight = initialVisualHeight;
    let timeoutId: number | null = null;
    
    const handleResize = () => {
      if (!window.visualViewport) return;
      
      // Calculamos a diferença de altura do viewport em porcentagem
      const currentHeight = window.visualViewport.height;
      const heightDiff = initialVisualHeight - currentHeight;
      const heightDiffPercent = (heightDiff / initialVisualHeight) * 100;
      
      // Detectar se foi um movimento significativo (mais de 20% do viewport)
      // Este valor é mais confiável entre diferentes dispositivos
      const significant = heightDiffPercent > 20;
      
      // Detectar direção da mudança (para cima = teclado aberto)
      const isOpeningKeyboard = currentHeight < lastKnownHeight;
      
      // Atualizar o estado apenas se a mudança for significativa e na direção correta
      // ou se estiver fechando o teclado
      if ((significant && isOpeningKeyboard) || (!isOpeningKeyboard && isKeyboardVisible)) {
        // Cancelar qualquer timeout anterior para evitar piscar
        if (timeoutId) window.clearTimeout(timeoutId);
        
        // Adicionar uma pequena espera para evitar alterações durante animações
        timeoutId = window.setTimeout(() => {
          const newKeyboardState = significant && isOpeningKeyboard;
          
          // Atualizar o estado e a classe do body
          setIsKeyboardVisible(newKeyboardState);
          if (newKeyboardState) {
            document.body.classList.add('keyboard-visible');
          } else {
            document.body.classList.remove('keyboard-visible');
          }
          
          timeoutId = null;
        }, 100);
      }
      
      // Atualizar última altura conhecida para a próxima comparação
      lastKnownHeight = currentHeight;
    };

    // Adicionar detecção para foco em elementos de input/textarea
    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Em iOS, o foco em campos geralmente significa que o teclado será aberto
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          // Pequeno delay para permitir que o teclado abra antes de aplicar classes
          window.setTimeout(() => {
            setIsKeyboardVisible(true);
            document.body.classList.add('keyboard-visible');
          }, 300);
        }
      }
    };

    // Identificar quando o foco sai de um campo de input/textarea
    const handleBlur = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Verificar se o próximo elemento com foco também é um campo
        // Se não for, provavelmente o teclado está fechando
        const nextFocus = e.relatedTarget;
        if (!(nextFocus instanceof HTMLInputElement || nextFocus instanceof HTMLTextAreaElement)) {
          window.setTimeout(() => {
            setIsKeyboardVisible(false);
            document.body.classList.remove('keyboard-visible');
          }, 300);
        }
      }
    };

    // Inscrever nos eventos relevantes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    
    // Eventos de foco são importantes especialmente para iOS
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    // Limpar eventos ao desmontar o componente
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      document.body.classList.remove('keyboard-visible');
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isKeyboardVisible]);

  return isKeyboardVisible;
} 