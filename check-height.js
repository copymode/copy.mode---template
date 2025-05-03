const puppeteer = require('puppeteer');

async function getHeight() {
  console.log('Iniciando navegador...');
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  
  try {
    console.log('Acessando aplicação...');
    await page.goto('http://localhost:8082/', {waitUntil: 'networkidle2'});
    
    // Esperar carregamento completo da página
    await page.waitForSelector('aside', {timeout: 5000});
    
    // Extrair altura da div do rodapé
    const height = await page.evaluate(() => {
      const footerDiv = document.querySelector('.flex-shrink-0.border-t.border-sidebar-border.bg-sidebar.sticky.bottom-0');
      if (!footerDiv) return 'Elemento não encontrado';
      
      return window.getComputedStyle(footerDiv).height;
    });
    
    console.log('Altura da div fixada no canto inferior do sidebar:', height);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await browser.close();
  }
}

getHeight();
