// MODO SIMULADO do Open Finance (sem conta no Pluggy).
// Gera transações no MESMO formato que a API do Pluggy devolve, para que elas passem
// pelas mesmas regras puras (mapTransaction) usadas pela Edge Function bank-sync.
// Nenhum banco real é acessado.
import type {
  AccountKind,
  PluggyTransaction,
} from '../../supabase/functions/_shared/openfinance';

export const SIMULATED_ITEM_ID = 'simulado-pluggy-bank';
export const SIMULATED_INSTITUTION = 'Pluggy Bank (simulado)';

export interface SimulatedAccount {
  name: string;
  kind: AccountKind;
  transactions: PluggyTransaction[];
}

type Seed = {
  day: number; // dias em relação à data da conexão (negativo = antes; positivo = depois)
  description: string;
  amount: number;
  category?: string;
  type?: 'CREDIT' | 'DEBIT';
  status?: 'PENDING';
  currencyCode?: string;
};

// Conta corrente: valores positivos entram, negativos saem.
const BANK: Seed[] = [
  { day: -58, description: 'SALARIO EMPRESA XYZ LTDA', amount: 4200, category: 'Salary' },
  { day: -55, description: 'PIX ENVIADO ALUGUEL', amount: -1350, category: 'Rent' },
  {
    day: -50,
    description: 'CONTA DE LUZ ENEL',
    amount: -187.42,
    category: 'Electricity',
  },
  { day: -44, description: 'PAGAMENTO FATURA CARTAO', amount: -912.3 },
  {
    day: -36,
    description: 'PIX RECEBIDO FREELANCE SITE',
    amount: 850,
    category: 'Transfer',
  },
  { day: -28, description: 'SALARIO EMPRESA XYZ LTDA', amount: 4200, category: 'Salary' },
  { day: -25, description: 'PIX ENVIADO ALUGUEL', amount: -1350, category: 'Rent' },
  { day: -19, description: 'SABESP CONTA DE AGUA', amount: -96.15 },
  {
    day: -12,
    description: 'RENDIMENTO POUPANCA',
    amount: 23.87,
    category: 'Investments',
  },
  { day: -6, description: 'PAGAMENTO FATURA CARTAO', amount: -1043.55 },
  { day: -1, description: 'PIX RECEBIDO PENDENTE', amount: 120, status: 'PENDING' },
  // Lançamentos "do futuro": só aparecem nas sincronizações feitas depois desses dias.
  { day: 2, description: 'PIX RECEBIDO PRESENTE ANIVERSARIO', amount: 150 },
  { day: 5, description: 'CONTA DE INTERNET VIVO', amount: -119.9 },
];

// Cartão de crédito: valores positivos são compras.
const CARD: Seed[] = [
  {
    day: -52,
    description: 'IFOOD *RESTAURANTE',
    amount: 58.9,
    category: 'Food delivery',
  },
  {
    day: -47,
    description: 'UBER *TRIP',
    amount: 23.45,
    category: 'Taxi and ride-hailing',
  },
  { day: -41, description: 'NETFLIX.COM', amount: 44.9, category: 'Video streaming' },
  { day: -38, description: 'SUPERMERCADO EXTRA', amount: 312.67, category: 'Groceries' },
  { day: -33, description: 'DROGARIA SAO PAULO', amount: 64.3, category: 'Pharmacy' },
  {
    day: -30,
    description: 'AMAZON MARKETPLACE',
    amount: 189.0,
    category: 'Online shopping',
  },
  { day: -27, description: 'PAGAMENTO RECEBIDO', amount: -912.3 },
  { day: -22, description: 'CINEMARK', amount: 72.0, category: 'Entertainment' },
  { day: -17, description: 'POSTO SHELL', amount: 210.5, category: 'Gas stations' },
  {
    day: -14,
    description: 'UDEMY CURSO REACT NATIVE',
    amount: 27.9,
    category: 'Education',
  },
  { day: -9, description: 'STEAM PURCHASE', amount: 15.99, currencyCode: 'USD' },
  { day: -4, description: 'IFOOD *PIZZARIA', amount: 79.9, category: 'Food delivery' },
  { day: 1, description: 'UBER *TRIP', amount: 18.7, category: 'Taxi and ride-hailing' },
  { day: 4, description: 'SUPERMERCADO EXTRA', amount: 245.12, category: 'Groceries' },
];

const DAY = 24 * 60 * 60 * 1000;

// Meio-dia UTC = mesmo dia em Brasília (evita trocar a data na conversão de fuso).
function isoAt(anchor: Date, days: number): string {
  const d = new Date(anchor.getTime() + days * DAY);
  return `${d.toISOString().slice(0, 10)}T12:00:00.000Z`;
}

function build(prefix: string, seeds: Seed[], anchor: Date, now: Date) {
  return seeds
    .map((s, i) => ({ seed: s, index: i, date: isoAt(anchor, s.day) }))
    .filter(({ date }) => new Date(date).getTime() <= now.getTime() + DAY / 2)
    .map(
      ({ seed, index, date }): PluggyTransaction => ({
        // id estável: a mesma transação tem sempre o mesmo id (sincronizar de novo não duplica)
        id: `${prefix}-${index + 1}`,
        description: seed.description,
        currencyCode: seed.currencyCode ?? 'BRL',
        amount: seed.amount,
        date,
        category: seed.category ?? null,
        type: seed.type,
        status: seed.status ?? 'POSTED',
      }),
    );
}

// anchor = data da conexão (fixa); now = momento da sincronização.
export function buildSimulatedAccounts(
  connectionId: string,
  anchor: Date,
  now: Date,
): SimulatedAccount[] {
  return [
    {
      name: 'Conta corrente (simulada)',
      kind: 'BANK',
      transactions: build(`sim-${connectionId}-cc`, BANK, anchor, now),
    },
    {
      name: 'Cartão de crédito (simulado)',
      kind: 'CREDIT',
      transactions: build(`sim-${connectionId}-cartao`, CARD, anchor, now),
    },
  ];
}
