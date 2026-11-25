import { OPEN_FINANCE_SIMULATED } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import type { BankConnection, SyncResult } from '@/types';
import { invokeFunction } from './functions';
import {
  connectSimulatedBank,
  disconnectSimulatedBank,
  syncSimulatedBank,
} from './openFinanceSim';

export async function listConnections(): Promise<BankConnection[]> {
  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as BankConnection[];
}

// Pede ao servidor um Connect Token (o segredo do Pluggy nunca fica no app).
export async function requestConnectToken(redirectUri: string): Promise<string> {
  const data = await invokeFunction<{ connect_token: string }>('bank-connect-token', {
    redirect_uri: redirectUri,
  });
  return data.connect_token;
}

// Modo simulado: substitui o widget do Pluggy.
export function connectSimulated(): Promise<string> {
  return connectSimulatedBank();
}

export function syncConnection(itemId: string): Promise<SyncResult> {
  if (OPEN_FINANCE_SIMULATED) return syncSimulatedBank(itemId);
  return invokeFunction<SyncResult>('bank-sync', { item_id: itemId });
}

export async function disconnectBank(connectionId: string): Promise<void> {
  if (OPEN_FINANCE_SIMULATED) return disconnectSimulatedBank(connectionId);
  await invokeFunction('bank-disconnect', { connection_id: connectionId });
}
