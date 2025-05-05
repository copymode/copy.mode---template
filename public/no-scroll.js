// Script para controlar scroll na página inicial
(function() {
  // Verificar se estamos na página inicial (sem chat ativo)
  function isHomePage() {
    // Verifica se estamos na rota inicial e se não tem chat ativo
    return (window.location.pathname === '/' || window.location.pathname === '/home') 
      && !document.querySelector('.chat-container');
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
      // Bloquear overflow em tudo
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';
      
      // Garantir que o root não tem scroll
      const root = document.getElementById('root');
      if (root) {
        root.style.overflow = 'hidden';
        root.style.height = '100vh';
      }
      
      // Bloquear todos eventos de mouse que possam causar scroll
      document.addEventListener('wheel', preventScroll, { passive: false, capture: true });
      document.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
      document.addEventListener('scroll', preventScroll, { passive: false, capture: true });
      
      // Aplica overflow:hidden a qualquer elemento que possa gerar scroll
      Array.from(document.querySelectorAll('*')).forEach(el => {
        if (window.getComputedStyle(el).overflow !== 'visible') {
          el.style.overflow = 'hidden';
        }
      });
    } else {
      // Remover todos os bloqueios quando não estamos na home
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.left = '';
      
      const root = document.getElementById('root');
      if (root) {
        root.style.overflow = '';
        root.style.height = '';
      }
      
      // Remover listeners
      document.removeEventListener('wheel', preventScroll, { capture: true });
      document.removeEventListener('touchmove', preventScroll, { capture: true });
      document.removeEventListener('scroll', preventScroll, { capture: true });
    }
  }
  
  // Adicionar listeners para todos possíveis eventos
  window.addEventListener('DOMContentLoaded', applyNoScroll);
  window.addEventListener('load', applyNoScroll);
  window.addEventListener('resize', applyNoScroll);
  window.addEventListener('popstate', applyNoScroll);
  
  // Monitorar mudanças na URL para detecção mais precisa
  let lastUrl = location.href; 
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      applyNoScroll();
    }
  }).observe(document, {subtree: true, childList: true});
  
  // Também monitorar mudanças na DOM inteira para reagir a qualquer mudança
  const observer = new MutationObserver(applyNoScroll);
  
  // Observar todo o documento
  observer.observe(document.documentElement, { 
    childList: true, 
    subtree: true,
    attributes: true
  });
  
  // Aplicar imediatamente
  applyNoScroll();
  
  // Aplicar novamente após um pequeno delay para garantir
  setTimeout(applyNoScroll, 500);
  setTimeout(applyNoScroll, 1000);
})(); 