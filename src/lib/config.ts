// "false" desliga o modo de testes. Em qualquer outro caso, o widget mostra também os
// bancos de teste (Pluggy Bank), que não devem aparecer em produção.
export const OPEN_FINANCE_SANDBOX =
  process.env.EXPO_PUBLIC_OPEN_FINANCE_SANDBOX !== 'false';

// MODO SIMULADO (padrão): o Open Finance roda sem conta no Pluggy. O app gera um
// extrato fictício e o importa com as mesmas regras da Edge Function bank-sync.
// Para usar o Pluggy de verdade: EXPO_PUBLIC_OPEN_FINANCE_MODE=pluggy no .env e
// publique as funções com o 5-publicar-funcoes-open-finance.bat.
export const OPEN_FINANCE_SIMULATED =
  process.env.EXPO_PUBLIC_OPEN_FINANCE_MODE !== 'pluggy';
