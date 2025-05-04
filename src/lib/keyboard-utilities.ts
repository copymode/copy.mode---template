/**
 * Utilitários para lidar com o teclado virtual em diferentes dispositivos e navegadores.
 * Implementa múltiplas estratégias para melhor compatibilidade.
 */

/**
 * Verifica se o dispositivo é um dispositivo móvel
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Verificar pelo tamanho da tela (abordagem mais confiável em 2023)
  const isMobileViewport = window.innerWidth <= 768;
  
  // Verificar pelo user agent (abordagem complementar)
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // Verificar pela existência de eventos de toque
  const hasTouchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Considerar mobile se o viewport for mobile OU se for um dispositivo de toque com user agent mobile
  return isMobileViewport || (isMobileUserAgent && hasTouchEvents);
}

/**
 * Verifica se o dispositivo está usando iOS
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Verificar especificamente por dispositivos iOS
  return /iPad|iPhone|iPod/i.test(navigator.userAgent) && 
         // @ts-ignore - MSStream é uma propriedade específica do IE
         !window.MSStream; // Exclui IE que pode se passar por iOS
}

/**
 * Verifica se a API VirtualKeyboard está disponível
 */
export function isVirtualKeyboardSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'virtualKeyboard' in navigator;
}

/**
 * Habilita a meta tag viewport com suporte a teclado virtual
 */
export function setupViewportMeta(): void {
  if (typeof window === 'undefined') return;
  
  // Verificar se já existe uma meta tag viewport
  const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  
  // Criar uma nova meta tag se não existir
  const metaTag = viewportMeta || document.createElement('meta') as HTMLMetaElement;
  if (!viewportMeta) {
    metaTag.setAttribute('name', 'viewport');
    document.head.appendChild(metaTag);
  }
  
  // Verificar se é iOS para tratamento específico
  const isIOS = isIOSDevice();
  
  // Configurar conteúdo apropriado
  if (isIOS) {
    // iOS: preferimos maximum-scale=1 para evitar zoom acidental
    metaTag.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no');
    
    // Adicionar meta tag para controle de teclado (iOS 12+)
    let viewportFitMeta = document.querySelector('meta[name="viewport-fit"]') as HTMLMetaElement | null;
    if (!viewportFitMeta) {
      viewportFitMeta = document.createElement('meta') as HTMLMetaElement;
      viewportFitMeta.setAttribute('name', 'viewport-fit');
      viewportFitMeta.setAttribute('content', 'cover');
      document.head.appendChild(viewportFitMeta);
    }
    
    // Adicionar meta tag específica para controle de teclado (moderno)
    let keyboardMeta = document.querySelector('meta[name="interactive-widget"]') as HTMLMetaElement | null;
    if (!keyboardMeta) {
      keyboardMeta = document.createElement('meta') as HTMLMetaElement;
      keyboardMeta.setAttribute('name', 'interactive-widget');
      keyboardMeta.setAttribute('content', 'resizes-content');
      document.head.appendChild(keyboardMeta);
    }
  } else {
    // Android: mais flexível com user-scalable
    metaTag.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
  }
}

/**
 * Configura o comportamento do teclado virtual usando a API
 */
export function setupVirtualKeyboard(overlaysContent: boolean = true): void {
  if (typeof window === 'undefined' || !isVirtualKeyboardSupported()) return;
  
  try {
    // @ts-ignore - API ainda experimental
    navigator.virtualKeyboard.overlaysContent = overlaysContent;
  } catch (error) {
    console.warn('Erro ao configurar API de teclado virtual:', error);
  }
}

/**
 * Adiciona listeners para eventos de teclado virtual
 * @param onKeyboardVisible Callback chamado quando o teclado fica visível
 * @param onKeyboardHidden Callback chamado quando o teclado é escondido
 * @returns Função para remover os listeners
 */
export function addKeyboardListeners(
  onKeyboardVisible?: () => void,
  onKeyboardHidden?: () => void
): () => void {
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
}

/**
 * Ajusta a altura do viewport em dispositivos móveis
 * Solução para o bug de "100vh" em navegadores móveis
 */
export function setViewportHeight(): void {
  if (typeof window === 'undefined') return;
  
  const updateViewportHeight = () => {
    // Obtém a altura real da viewport
    const vh = window.innerHeight * 0.01;
    
    // Define a variável CSS para uso em estilos
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  // Inicializar
  updateViewportHeight();
  
  // Atualizar em eventos relevantes
  window.addEventListener('resize', updateViewportHeight);
  window.addEventListener('orientationchange', updateViewportHeight);
  
  // Em dispositivos móveis, a barra de endereço pode aparecer/desaparecer
  if (isMobileDevice()) {
    window.addEventListener('scroll', updateViewportHeight);
  }
} 