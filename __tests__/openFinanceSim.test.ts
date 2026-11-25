import { mapTransaction } from '../supabase/functions/_shared/openfinance';
import { buildSimulatedAccounts } from '@/utils/openFinanceSim';

const anchor = new Date('2026-11-24T15:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

function importable(now: Date) {
  return buildSimulatedAccounts('abc', anchor, now).flatMap((acc) =>
    acc.transactions.map((tx) => mapTransaction(tx, acc.kind)),
  );
}

describe('Open Finance simulado', () => {
  it('gera ids estáveis: duas sincronizações no mesmo dia devolvem os mesmos ids', () => {
    const a = buildSimulatedAccounts('abc', anchor, anchor);
    const b = buildSimulatedAccounts(
      'abc',
      anchor,
      new Date(anchor.getTime() + 3600_000),
    );
    const ids = (x: typeof a) => x.flatMap((acc) => acc.transactions.map((t) => t.id));
    expect(ids(b)).toEqual(ids(a));
  });

  it('não devolve transações com data no futuro', () => {
    const all = buildSimulatedAccounts('abc', anchor, anchor).flatMap(
      (a) => a.transactions,
    );
    expect(
      all.every((t) => new Date(t.date).getTime() <= anchor.getTime() + DAY / 2),
    ).toBe(true);
  });

  it('libera lançamentos novos em sincronizações posteriores', () => {
    const today = importable(anchor).filter((r) => 'row' in r).length;
    const later = importable(new Date(anchor.getTime() + 6 * DAY)).filter(
      (r) => 'row' in r,
    ).length;
    expect(later - today).toBe(4);
  });

  it('passa pelas mesmas regras do bank-sync (pula fatura, pendente e moeda estrangeira)', () => {
    const skips = importable(anchor)
      .filter((r): r is { skip: never } => 'skip' in r)
      .map((r) => r.skip as string)
      .sort();
    expect(skips).toEqual([
      'card_bill_payment',
      'card_bill_payment',
      'card_payment_received',
      'foreign_currency',
      'pending',
    ]);
  });

  it('sugere categorias do app para as transações simuladas', () => {
    const rows = importable(anchor).flatMap((r) => ('row' in r ? [r.row] : []));
    const byDesc = (d: string) => rows.find((r) => r.description.includes(d));
    expect(byDesc('SALARIO')).toMatchObject({ type: 'income', categoryName: 'Salário' });
    expect(byDesc('ALUGUEL')).toMatchObject({ type: 'expense', categoryName: 'Moradia' });
    expect(byDesc('IFOOD')).toMatchObject({
      type: 'expense',
      categoryName: 'Alimentação',
    });
    expect(byDesc('FREELANCE')).toMatchObject({
      type: 'income',
      categoryName: 'Freelance',
    });
  });
});
