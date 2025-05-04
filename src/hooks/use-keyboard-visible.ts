import { useEffect } from 'react';

/**
 * Hook que implementa a solução definitiva para o posicionamento do input
 * quando o teclado virtual está visível em dispositivos móveis.
 * 
 * Inspirado na solução usada pelo ChatGPT mobile.
 */
export function useKeyboardVisible() {
  useEffect(() => {
    // Verifica se é dispositivo móvel
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return;
    }

    // Elementos alvo
    let inputContainer: HTMLElement | null = null;
    let chatContainer: HTMLElement | null = null;
    const isMobile = window.innerWidth <= 768;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Função para obter os elementos - executamos após um delay para garantir que o DOM esteja pronto
    const getElements = () => {
      // Seletor específico para os containers de chat
      inputContainer = document.querySelector('.chat-container .flex-shrink-0.fixed');
      chatContainer = document.querySelector('.chat-container');
      
      // Adiciona class para identificar dispositivo
      if (isIOS) {
        document.documentElement.classList.add('ios-device');
        document.body.classList.add('ios-device');
      }
      
      if (inputContainer) {
        console.log('Input container encontrado!');
      }
    };

    // Chamamos após um pequeno delay para garantir que os elementos estejam presentes
    setTimeout(getElements, 500);

    // Função que será chamada quando um input ou textarea receber foco
    const handleFocus = (e: FocusEvent) => {
      if (!isMobile) return;
      
      // Verificar novamente se é o input do chat
      if (!inputContainer || !chatContainer) {
        getElements();
        if (!inputContainer) return;
      }

      // Somente processa se for elemento de input/textarea dentro do container
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        const isInChatContainer = chatContainer?.contains(e.target);
        if (!isInChatContainer) return;
        
        console.log('Input recebeu foco!');
        
        // Adiciona as classes para tratar o teclado visível
        document.body.classList.add('keyboard-visible');
        
        // Aplica estilo direto via JavaScript
        if (inputContainer) {
          // Estilo forçado via JavaScript 
          inputContainer.style.position = 'fixed';
          inputContainer.style.bottom = '0';
          inputContainer.style.left = '0';
          inputContainer.style.right = '0';
          inputContainer.style.zIndex = '9999';
          inputContainer.style.display = 'flex';
          inputContainer.style.opacity = '1';
          inputContainer.style.visibility = 'visible';
          inputContainer.style.backgroundColor = 'var(--background)';
          inputContainer.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.1)';
          
          // Tratamento específico para iOS
          if (isIOS) {
            document.body.classList.add('ios-keyboard-visible');
            setTimeout(() => {
              window.scrollTo(0, 0);
              inputContainer!.style.position = 'fixed';
            }, 100);
          }
        }
      }
    };

    // Função chamada quando o input perde o foco
    const handleBlur = (e: FocusEvent) => {
      if (!isMobile) return;
      
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        const isInChatContainer = chatContainer?.contains(e.target);
        if (!isInChatContainer) return;
        
        console.log('Input perdeu foco');
        
        // Remove classes apenas se o próximo elemento com foco não for um input/textarea
        if (!(e.relatedTarget instanceof HTMLInputElement || e.relatedTarget instanceof HTMLTextAreaElement)) {
          setTimeout(() => {
            document.body.classList.remove('keyboard-visible');
            
            if (isIOS) {
              document.body.classList.remove('ios-keyboard-visible');
            }
          }, 100);
        }
      }
    };

    // Adiciona ouvintes de evento
    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);

    // Detecta quando o teclado é fechado pelo botão do sistema (apenas para Android e alguns navegadores)
    window.addEventListener('resize', () => {
      if (!isMobile) return;
      
      // Se a altura da visualização voltar ao normal, assumimos que o teclado foi fechado
      if (window.visualViewport) {
        const isKeyboardClosed = window.visualViewport.height >= window.innerHeight * 0.85;
        
        if (isKeyboardClosed) {
          document.body.classList.remove('keyboard-visible');
          if (isIOS) {
            document.body.classList.remove('ios-keyboard-visible');
          }
        }
      }
    });

    // Limpeza ao desmontar
    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
      document.body.classList.remove('keyboard-visible');
      if (isIOS) {
        document.body.classList.remove('ios-keyboard-visible');
      }
    };
  }, []);
} 