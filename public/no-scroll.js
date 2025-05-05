// Script para controlar scroll na página inicial
(function() {
  // Verificar se estamos na página inicial (sem chat ativo)
  function isHomePage() {
    // Verifica se estamos na rota inicial e se não tem chat ativo
    // Adicionamos uma verificação muito específica pelo atributo data-page
    return (window.location.pathname === '/' || window.location.pathname === '/home') 
      && !document.querySelector('.chat-container') 
      && document.querySelector('.home-container[data-page="home-initial-state"]');
  }
  
  // Lista estendida de todos os elementos que podem causar scroll
  const scrollableElements = [
    window,
    document,
    document.documentElement,
    document.body,
    document.getElementById('root')
  ];
  
  // Função para prevenir scroll
  function preventScroll(e) {
    if (isHomePage() && window.innerWidth >= 768) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
  
  // Função para aplicar "overflow: hidden" a todos elementos scrolláveis
  function applyNoScroll() {
    if (isHomePage() && window.innerWidth >= 768) {
      // Apenas aplicar no elemento home-container e seus pais diretos
      const homeContainer = document.querySelector('.home-container');
      if (homeContainer) {
        homeContainer.style.overflow = 'hidden';
        
        // Aplicar no corpo e html apenas se realmente estamos na home
        document.documentElement.classList.add('home-page-no-scroll');
        document.body.classList.add('home-page-no-scroll');
        
        // Adicionar listeners só na home
        document.addEventListener('wheel', preventScroll, { passive: false, capture: true });
      }
    } else {
      // Remover todos os bloqueios quando não estamos na home
      document.documentElement.classList.remove('home-page-no-scroll');
      document.body.classList.remove('home-page-no-scroll');
      
      // Remover listeners
      document.removeEventListener('wheel', preventScroll, { capture: true });
    }
  }
  
  // Verificar se a URL mudou (SPA navigation)
  function checkURLChange() {
    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath === '/home') {
      // Estamos na home, verificar se temos um container de home
      setTimeout(() => {
        if (document.querySelector('.home-container')) {
          applyNoScroll();
        } else {
          // Se não encontramos o container, remover bloqueios
          document.documentElement.classList.remove('home-page-no-scroll');
          document.body.classList.remove('home-page-no-scroll');
        }
      }, 50);
    } else {
      // Não estamos na home, remover bloqueios
      document.documentElement.classList.remove('home-page-no-scroll');
      document.body.classList.remove('home-page-no-scroll');
    }
  }
  
  // Adicionar listeners para eventos importantes
  window.addEventListener('DOMContentLoaded', applyNoScroll);
  window.addEventListener('load', applyNoScroll);
  window.addEventListener('resize', applyNoScroll);
  window.addEventListener('popstate', checkURLChange);
  
  // Monitorar mudanças na URL para detecção mais precisa
  let lastUrl = location.href; 
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      checkURLChange();
    }
  }).observe(document, {subtree: true, childList: true});
  
  // Aplicar imediatamente
  applyNoScroll();
  
  // Aplicar novamente após um pequeno delay para garantir
  setTimeout(applyNoScroll, 100);
  setTimeout(checkURLChange, 300);
})(); 