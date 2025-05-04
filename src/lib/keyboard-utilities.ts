/**
 * Utilitários para lidar com o teclado virtual em diferentes dispositivos e navegadores.
 * Implementa múltiplas estratégias para melhor compatibilidade.
 */

/**
 * Verifica se o dispositivo é um dispositivo móvel
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Verificar com base no User Agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobileUserAgent = Boolean(
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  );
  
  // Verificar com base no tamanho da tela
  const isMobileScreen = window.innerWidth <= 768;
  
  return isMobileUserAgent || isMobileScreen;
};

/**
 * Verifica se o dispositivo está usando iOS
 */
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
};

/**
 * Verifica se a API VirtualKeyboard está disponível
 */
export const isVirtualKeyboardSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'virtualKeyboard' in navigator;
};

/**
 * Habilita a meta tag viewport com suporte a teclado virtual
 */
export const setupViewportMeta = (): void => {
  if (typeof window === 'undefined') return;
  
  // Obter ou criar meta tag de viewport
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.setAttribute('name', 'viewport');
    document.head.appendChild(viewportMeta);
  }
  
  // Adicionar opção interactive-widget para melhor suporte ao teclado virtual
  const content = viewportMeta.getAttribute('content') || '';
  if (!content.includes('interactive-widget')) {
    const newContent = content 
      ? `${content}, interactive-widget=resizes-content` 
      : 'width=device-width, initial-scale=1.0, interactive-widget=resizes-content';
    viewportMeta.setAttribute('content', newContent);
  }
};

/**
 * Configura o comportamento do teclado virtual usando a API
 */
export const setupVirtualKeyboard = (overlaysContent: boolean = true): void => {
  if (typeof window === 'undefined' || !isVirtualKeyboardSupported()) return;
  
  try {
    // @ts-ignore - API ainda experimental
    navigator.virtualKeyboard.overlaysContent = overlaysContent;
  } catch (error) {
    console.warn('Erro ao configurar API de teclado virtual:', error);
  }
};

/**
 * Adiciona listeners para eventos de teclado virtual
 * @param onKeyboardVisible Callback chamado quando o teclado fica visível
 * @param onKeyboardHidden Callback chamado quando o teclado é escondido
 * @returns Função para remover os listeners
 */
export const addKeyboardListeners = (
  onKeyboardVisible?: () => void,
  onKeyboardHidden?: () => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const cleanup: Array<() => void> = [];
  
  // Estratégia 1: API VirtualKeyboard
  if (isVirtualKeyboardSupported()) {
    // @ts-ignore
    const handleGeometryChange = (event: any) => {
      // @ts-ignore
      const { height } = navigator.virtualKeyboard.boundingRect;
      
      if (height > 0) {
        onKeyboardVisible?.();
      } else {
        onKeyboardHidden?.();
      }
    };
    
    try {
      // @ts-ignore
      navigator.virtualKeyboard.addEventListener('geometrychange', handleGeometryChange);
      cleanup.push(() => {
        // @ts-ignore
        navigator.virtualKeyboard.removeEventListener('geometrychange', handleGeometryChange);
      });
    } catch (error) {
      console.warn('Erro ao adicionar listener de teclado virtual:', error);
    }
  }
  
  // Estratégia 2: Eventos de foco em campos de texto
  const handleFocus = (e: FocusEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      if (isMobileDevice()) {
        setTimeout(() => {
          onKeyboardVisible?.();
        }, 300);
      }
    }
  };
  
  const handleBlur = (e: FocusEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      const nextFocus = e.relatedTarget;
      if (!(nextFocus instanceof HTMLInputElement || nextFocus instanceof HTMLTextAreaElement)) {
        setTimeout(() => {
          onKeyboardHidden?.();
        }, 300);
      }
    }
  };
  
  document.addEventListener('focusin', handleFocus);
  document.addEventListener('focusout', handleBlur);
  
  cleanup.push(() => {
    document.removeEventListener('focusin', handleFocus);
    document.removeEventListener('focusout', handleBlur);
  });
  
  // Estratégia 3: Monitorar alterações na altura do visualViewport
  if (window.visualViewport) {
    const initialHeight = window.visualViewport.height;
    
    const handleResize = () => {
      if (!window.visualViewport) return;
      
      const heightDiff = initialHeight - window.visualViewport.height;
      const heightDiffPercent = (heightDiff / initialHeight) * 100;
      
      // Considera o teclado aberto se a altura diminuir significativamente
      if (heightDiffPercent > 20) {
        onKeyboardVisible?.();
      } else {
        onKeyboardHidden?.();
      }
    };
    
    window.visualViewport.addEventListener('resize', handleResize);
    cleanup.push(() => {
      window.visualViewport.removeEventListener('resize', handleResize);
    });
  }
  
  // Retornar função para remover todos os listeners
  return () => {
    cleanup.forEach(fn => fn());
  };
}; 