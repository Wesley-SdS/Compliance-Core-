import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/stores/app-store';
import { useVeiculoAlertas, Alerta } from '../src/hooks/use-veiculo';
import { api } from '../src/lib/api';

export default function AlertasScreen() {
  const router = useRouter();
  const selectedVeiculoId = useAppStore((s) => s.selectedVeiculoId);
  const { data: alertas, isLoading, refetch } = useVeiculoAlertas(selectedVeiculoId);
  const [refreshing, setRefreshing] = useState(false);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

  const getIconByType = (tipo: string): IoniconsName => {
    if (tipo === 'DOCUMENTO') return 'document-text';
    if (tipo === 'MANUTENCAO') return 'build';
    if (tipo === 'CONDUCAO') return 'time';
    if (tipo === 'CHECKLIST') return 'clipboard';
    return 'warning';
  };

  const getSeverityStyle = (severidade: string) => {
    if (severidade === 'ALTA') return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', label: 'Alta' };
    if (severidade === 'MEDIA') return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', label: 'Media' };
    return { bg: '#E0F2FE', text: '#075985', border: '#BAE6FD', label: 'Baixa' };
  };

  const getSeverityColor = (severidade: string) => {
    if (severidade === 'ALTA') return '#EF4444';
    if (severidade === 'MEDIA') return '#F59E0B';
    return '#0EA5E9';
  };

  const handleAcknowledge = async (alertaId: string) => {
    setAcknowledging(alertaId);
    try {
      await api(`/api/alertas/${alertaId}/acknowledge`, { method: 'POST' });
      await refetch();
    } catch {
      Alert.alert('Erro', 'Falha ao reconhecer alerta');
    }
    setAcknowledging(null);
  };

  // Sort: ALTA first, then MEDIA, then BAIXA
  const sortedAlertas = [...(alertas ?? [])].sort((a: Alerta, b: Alerta) => {
    const order = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
    return (order[a.severidade] ?? 3) - (order[b.severidade] ?? 3);
  });

  // Group by severity
  const grouped = {
    ALTA: sortedAlertas.filter((a: Alerta) => a.severidade === 'ALTA'),
    MEDIA: sortedAlertas.filter((a: Alerta) => a.severidade === 'MEDIA'),
    BAIXA: sortedAlertas.filter((a: Alerta) => a.severidade === 'BAIXA'),
  };

  if (!selectedVeiculoId) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications" size={48} color="#94A3B8" />
        <Text style={styles.emptyText}>Selecione um veiculo nas configuracoes</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/config')}>
          <Text style={styles.emptyButtonText}>Ir para Configuracoes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderGroup = (severidade: 'ALTA' | 'MEDIA' | 'BAIXA', items: Alerta[]) => {
    if (items.length === 0) return null;
    const sevStyle = getSeverityStyle(severidade);

    return (
      <View key={severidade} style={styles.section}>
        <View style={styles.groupHeader}>
          <View style={[styles.groupBadge, { backgroundColor: sevStyle.bg, borderColor: sevStyle.border }]}>
            <Text style={[styles.groupBadgeText, { color: sevStyle.text }]}>
              {sevStyle.label} ({items.length})
            </Text>
          </View>
        </View>
        {items.map((alerta: Alerta) => {
          const iconName = getIconByType(alerta.tipo);
          const sevColor = getSeverityColor(alerta.severidade);
          const isAcking = acknowledging === alerta.id;

          return (
            <View
              key={alerta.id}
              style={[styles.alertRow, alerta.lido && styles.alertRowRead]}
            >
              <View style={[styles.iconContainer, { backgroundColor: sevColor + '15' }]}>
                <Ionicons name={iconName} size={20} color={sevColor} />
              </View>
              <View style={styles.alertInfo}>
                <Text style={[styles.alertTitle, alerta.lido && styles.alertTitleRead]}>
                  {alerta.titulo}
                </Text>
                {alerta.descricao ? (
                  <Text style={styles.alertDesc} numberOfLines={2}>{alerta.descricao}</Text>
                ) : null}
                <Text style={styles.alertDate}>
                  {new Date(alerta.criadoEm).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              {!alerta.lido && (
                <TouchableOpacity
                  style={[styles.ackButton, isAcking && { opacity: 0.7 }]}
                  onPress={() => handleAcknowledge(alerta.id)}
                  disabled={isAcking}
                >
                  {isAcking ? (
                    <ActivityIndicator size="small" color="#0EA5E9" />
                  ) : (
                    <Text style={styles.ackText}>Reconhecer</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#075985" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alertas</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 40 }} />
      ) : sortedAlertas.length > 0 ? (
        <>
          {renderGroup('ALTA', grouped.ALTA)}
          {renderGroup('MEDIA', grouped.MEDIA)}
          {renderGroup('BAIXA', grouped.BAIXA)}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
          <Text style={styles.emptyStateText}>Tudo certo!</Text>
          <Text style={styles.emptyStateSubtext}>Nenhum alerta pendente para este veiculo</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  content: { padding: 16, paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#075985',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  groupHeader: {
    marginBottom: 12,
  },
  groupBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  groupBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  alertRowRead: { opacity: 0.6 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertInfo: { flex: 1, marginLeft: 12 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  alertTitleRead: { fontWeight: '400' },
  alertDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  alertDate: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  ackButton: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#0EA5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ackText: { fontSize: 12, fontWeight: '600', color: '#0EA5E9' },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});
