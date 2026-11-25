// Versão SIMULADA de bank-sync / bank-disconnect, executada no próprio app.
// As tabelas, o RLS, a chave única (user_id, external_id) e as regras de importação
// são exatamente os mesmos do modo real; só a origem dos dados é fictícia.
import { supabase } from '@/lib/supabase';
import type { BankConnection, SyncResult } from '@/types';
import {
  SIMULATED_INSTITUTION,
  SIMULATED_ITEM_ID,
  buildSimulatedAccounts,
} from '@/utils/openFinanceSim';
import {
  buildRange,
  mapTransaction,
  type SkipReason,
} from '../../supabase/functions/_shared/openfinance';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Equivale a concluir o widget do Pluggy: cria (ou reaproveita) a conexão.
export async function connectSimulatedBank(): Promise<string> {
  await wait(1200); // dá tempo de ver o "Conectando..."
  const { error } = await supabase.from('bank_connections').upsert(
    {
      pluggy_item_id: SIMULATED_ITEM_ID,
      institution_name: SIMULATED_INSTITUTION,
      institution_image_url: null,
      status: 'connected',
      last_error: null,
    },
    { onConflict: 'user_id,pluggy_item_id' },
  );
  if (error) throw error;
  return SIMULATED_ITEM_ID;
}

export async function syncSimulatedBank(itemId: string): Promise<SyncResult> {
  const { data: connection, error: connError } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('pluggy_item_id', itemId)
    .single();
  if (connError || !connection) throw connError ?? new Error('Conexão não encontrada.');
  const conn = connection as BankConnection;

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, type');
  if (catError) throw catError;
  const categoryId = new Map(
    (categories ?? []).map((c) => [`${c.type}:${c.name}`, c.id as string]),
  );

  const now = new Date();
  const range = buildRange(conn.last_synced_at, now); // mesma janela do modo real
  const skipped: Partial<Record<SkipReason, number>> = {};
  const rows: Record<string, unknown>[] = [];

  for (const account of buildSimulatedAccounts(conn.id, new Date(conn.created_at), now)) {
    for (const tx of account.transactions) {
      if (tx.date.slice(0, 10) < range.from) continue;
      const result = mapTransaction(tx, account.kind);
      if ('skip' in result) {
        skipped[result.skip] = (skipped[result.skip] ?? 0) + 1;
        continue;
      }
      const id = categoryId.get(`${result.row.type}:${result.row.categoryName}`);
      if (!id) continue;
      rows.push({
        category_id: id,
        type: result.row.type,
        description: result.row.description,
        amount: result.row.amount,
        date: result.row.date,
        source: 'open_finance',
        connection_id: conn.id,
        external_id: result.row.external_id,
        account_name: account.name,
      });
    }
  }

  await wait(800);
  let imported = 0;
  if (rows.length > 0) {
    const { data, error } = await supabase
      .from('transactions')
      .upsert(rows, { onConflict: 'user_id,external_id', ignoreDuplicates: true })
      .select('id');
    if (error) throw error;
    imported = data?.length ?? 0;
  }

  const { error: updError } = await supabase
    .from('bank_connections')
    .update({ last_synced_at: now.toISOString(), status: 'connected', last_error: null })
    .eq('id', conn.id);
  if (updError) throw updError;

  return { connection_id: conn.id, imported, fetched: rows.length };
}

// Apagar a conexão apaga os lançamentos importados (on delete cascade).
export async function disconnectSimulatedBank(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('bank_connections')
    .delete()
    .eq('id', connectionId);
  if (error) throw error;
}
