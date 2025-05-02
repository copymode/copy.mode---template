// Script para verificar espaço em disco disponível

import { execSync } from 'child_process';
import os from 'os';

// Função para formatar bytes em unidades legíveis por humanos
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Função para obter informações do sistema
function getSystemInfo() {
  console.log('=== Informações do Sistema ===');
  console.log(`Sistema Operacional: ${os.type()} ${os.release()}`);
  console.log(`Hostname: ${os.hostname()}`);
  console.log(`Memória Total: ${formatBytes(os.totalmem())}`);
  console.log(`Memória Livre: ${formatBytes(os.freemem())}`);
  console.log(`CPU Cores: ${os.cpus().length}`);
  console.log(`Tempo Ligado: ${Math.floor(os.uptime() / 3600)} horas`);
  console.log('===========================');
}

// Função para verificar espaço em disco no macOS
function checkDiskSpaceMac() {
  try {
    console.log('=== Espaço em Disco (df -h) ===');
    const dfOutput = execSync('df -h').toString();
    console.log(dfOutput);
    
    console.log('\n=== Diretórios de Uso Mais Pesado ===');
    const duOutput = execSync('du -h -d 1 $HOME | sort -hr | head -10').toString();
    console.log(duOutput);
    
    console.log('\n=== Processo Docker (se instalado) ===');
    try {
      const dockerPsOutput = execSync('docker ps').toString();
      console.log(dockerPsOutput);
      
      const dockerDiskOutput = execSync('docker system df').toString();
      console.log(dockerDiskOutput);
    } catch (error) {
      console.log('Docker não está disponível ou não está em execução');
    }
  } catch (error) {
    console.error('Erro ao verificar espaço em disco:', error.message);
  }
}

// Função principal
function main() {
  getSystemInfo();
  
  // Verificar espaço em disco com base no SO
  if (os.type() === 'Darwin') { // macOS
    checkDiskSpaceMac();
  } else if (os.type() === 'Linux') {
    // Implementar para Linux se necessário
    console.log('Sistema operacional Linux detectado. Por favor, execute "df -h" manualmente.');
  } else if (os.type() === 'Windows_NT') {
    // Implementar para Windows se necessário
    console.log('Sistema operacional Windows detectado. Por favor, verifique o espaço em disco manualmente.');
  }
}

// Executar
main(); 