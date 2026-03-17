import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useObras, useObraAlerts, useObraScore } from '@/src/hooks/use-obras';
import { useAppStore } from '@/src/stores/app-store';

function MiniScoreCircle({ score, size = 48 }: { score: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22C55E';
    if (s >= 60) return '#F59E0B';
    if (s >= 40) return '#F97316';
    return '#EF4444';
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#334155"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontSize: 12, fontWeight: '700', color: getScoreColor(score) }}>{score}</Text>
    </View>
  );
}

function ObraCard({ obra, onPress }: { obra: any; onPress: () => void }) {
  const { data: score } = useObraScore(obra.id);
  const { data: alerts } = useObraAlerts(obra.id);
  const alertCount = alerts?.length ?? 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_ANDAMENTO': return '#F59E0B';
      case 'CONCLUIDA': return '#22C55E';
      case 'PAUSADA': return '#94A3B8';
      case 'CANCELADA': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'CONCLUIDA': return 'Concluída';
      case 'PAUSADA': return 'Pausada';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.obraName} numberOfLines={1}>{obra.nome}</Text>
          <Text style={styles.obraAddress} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color="#94A3B8" /> {obra.endereco || 'Endereço não informado'}
          </Text>
        </View>
        <MiniScoreCircle score={score?.overall ?? 0} />
      </View>

      <View style={styles.cardBody}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(obra.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(obra.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(obra.status) }]}>
            {getStatusLabel(obra.status)}
          </Text>
        </View>

        {obra.etapaAtual && (
          <Text style={styles.etapaText} numberOfLines={1}>
            <Ionicons name="layers-outline" size={12} color="#64748B" /> {obra.etapaAtual}
          </Text>
        )}
      </View>

      {alertCount > 0 && (
        <View style={styles.alertBadge}>
          <Ionicons name="warning" size={12} color="#FFFFFF" />
          <Text style={styles.alertBadgeText}>{alertCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: obras, isLoading, refetch, isRefetching } = useObras();
  const setSelectedObraId = useAppStore((s) => s.setSelectedObraId);

  const handleObraPress = useCallback((obra: any) => {
    setSelectedObraId(obra.id);
  }, [setSelectedObraId]);

  const handleQuickAction = useCallback((route: string) => {
    router.push(route as any);
  }, [router]);

  const obraList = Array.isArray(obras) ? obras : [];

  return (
    <View style={styles.container}>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('/nota-fiscal')}
        >
          <Ionicons name="receipt" size={20} color="#F59E0B" />
          <Text style={styles.quickActionText}>Fotografar Nota</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('/camera')}
        >
          <Ionicons name="camera" size={20} color="#F59E0B" />
          <Text style={styles.quickActionText}>Registrar Foto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('/checklist')}
        >
          <Ionicons name="clipboard" size={20} color="#F59E0B" />
          <Text style={styles.quickActionText}>Checklist</Text>
        </TouchableOpacity>
      </View>

      {/* Obra List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Carregando obras...</Text>
        </View>
      ) : (
        <FlatList
          data={obraList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ObraCard obra={item} onPress={() => handleObraPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#F59E0B"
              colors={['#F59E0B']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={64} color="#475569" />
              <Text style={styles.emptyTitle}>Nenhuma obra encontrada</Text>
              <Text style={styles.emptySubtitle}>
                Obras cadastradas aparecerão aqui
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  quickActionText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  obraName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  obraAddress: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  etapaText: {
    fontSize: 12,
    color: '#64748B',
    maxWidth: '50%',
  },
  alertBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    color: '#CBD5E1',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
  },
});
