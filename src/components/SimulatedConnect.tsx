import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useConnectSimulated } from '@/hooks/useBanks';
import { colors, radius, spacing } from '@/theme';
import { friendlyError } from '@/utils/errors';
import { SIMULATED_INSTITUTION } from '@/utils/openFinanceSim';

// Substitui o widget do Pluggy quando o app está no modo simulado.
export function SimulatedConnect() {
  const router = useRouter();
  const connect = useConnectSimulated();

  function authorize() {
    connect.mutate(undefined, {
      onSuccess: (result) => {
        Alert.alert(
          'Banco conectado (simulado)',
          result.imported > 0
            ? `${result.imported} lançamentos importados.`
            : 'Nenhum lançamento novo no período.',
        );
        router.replace('/banks');
      },
      onError: (e) => Alert.alert('Não foi possível conectar', friendlyError(e)),
    });
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Conectar um banco</Text>
        <View style={styles.banner}>
          <Ionicons name="flask" size={16} color="#B45309" />
          <Text style={styles.bannerText}>
            Modo simulado: nenhum banco real é acessado. O extrato abaixo é fictício e
            passa pelas mesmas regras de importação do Open Finance.
          </Text>
        </View>

        <Card>
          <View style={styles.bankRow}>
            <View style={styles.logo}>
              <Ionicons name="business" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankName}>{SIMULATED_INSTITUTION}</Text>
              <Text style={styles.bankInfo}>Conta corrente e cartão de crédito</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>O FinTrack poderá ler:</Text>
          {[
            'Saldos e dados das contas',
            'Extrato dos últimos 90 dias',
            'Faturas do cartão',
          ].map((item) => (
            <View key={item} style={styles.permission}>
              <Ionicons name="checkmark-circle" size={18} color={colors.income} />
              <Text style={styles.permissionText}>{item}</Text>
            </View>
          ))}
          <View style={styles.permission}>
            <Ionicons name="close-circle" size={18} color={colors.danger} />
            <Text style={styles.permissionText}>Fazer pagamentos ou transferências</Text>
          </View>
        </Card>

        <Button
          title={
            connect.isPending
              ? 'Conectando e importando...'
              : 'Autorizar compartilhamento'
          }
          onPress={authorize}
          loading={connect.isPending}
        />
        <Button
          title="Cancelar"
          variant="ghost"
          onPress={() => router.back()}
          disabled={connect.isPending}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  banner: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  bannerText: { fontSize: 13, color: '#B45309', flex: 1, lineHeight: 18 },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankName: { fontSize: 16, fontWeight: '700', color: colors.text },
  bankInfo: { fontSize: 13, color: colors.muted },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  permission: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  permissionText: { fontSize: 14, color: colors.text },
});
