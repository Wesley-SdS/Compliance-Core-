import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMeuLote, useInfraestruturaLoteamento } from '../src/hooks/use-comprador';

const INFRA_ICONS: Record<string, string> = {
  agua: '💧',
  esgoto: '🚰',
  energia: '⚡',
  pavimentacao: '🛣️',
  drenagem: '🌊',
  iluminacao: '💡',
};

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function getProgressColor(percent: number): string {
  if (percent >= 90) return '#22C55E';
  if (percent >= 60) return '#3B82F6';
  if (percent >= 30) return '#F59E0B';
  return '#EF4444';
}

export default function InfraestruturaScreen() {
  const { data: lote } = useMeuLote();
  const { data: infraestrutura, refetch, isLoading } = useInfraestruturaLoteamento(lote?.loteamentoId ?? '');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const items = infraestrutura ?? [];
  const overallProgress = items.length > 0
    ? Math.round(items.reduce((acc: number, item: any) => acc + (item.percentual ?? 0), 0) / items.length)
    : 0;
  const overallColor = getProgressColor(overallProgress);

  const renderItem = ({ item }: { item: any }) => {
    const percent = item.percentual ?? 0;
    const color = getProgressColor(percent);
    const icon = INFRA_ICONS[item.tipo?.toLowerCase()] ?? '🔧';

    return (
      <View style={styles.infraCard}>
        <View style={styles.infraHeader}>
          <Text style={styles.infraIcon}>{icon}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infraName}>{item.nome ?? item.tipo ?? 'Item'}</Text>
            {item.responsavel && (
              <Text style={styles.infraResponsavel}>Resp.: {item.responsavel}</Text>
            )}
          </View>
          <Text style={[styles.infraPercent, { color }]}>{percent}%</Text>
        </View>
        <ProgressBar percent={percent} color={color} />
        {item.prazo && (
          <Text style={styles.infraPrazo}>Prazo: {new Date(item.prazo).toLocaleDateString('pt-BR')}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Overall Progress */}
      <View style={styles.overallCard}>
        <Text style={styles.overallTitle}>Progresso Geral</Text>
        <View style={styles.overallRow}>
          <Text style={[styles.overallPercent, { color: overallColor }]}>{overallProgress}%</Text>
        </View>
        <ProgressBar percent={overallProgress} color={overallColor} />
        <Text style={styles.overallSub}>{items.length} itens de infraestrutura</Text>
      </View>

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id ?? item.tipo}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F43F5E" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Nenhuma infraestrutura cadastrada</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1F2' },
  overallCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECDD3' },
  overallTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  overallRow: { alignItems: 'center', marginBottom: 8 },
  overallPercent: { fontSize: 36, fontWeight: '800' },
  overallSub: { fontSize: 12, color: '#64748B', marginTop: 8, textAlign: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  infraCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#FECDD3' },
  infraHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infraIcon: { fontSize: 28 },
  infraName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  infraResponsavel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  infraPercent: { fontSize: 18, fontWeight: '800' },
  infraPrazo: { fontSize: 12, color: '#64748B', marginTop: 8 },
  progressTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 12 },
});
