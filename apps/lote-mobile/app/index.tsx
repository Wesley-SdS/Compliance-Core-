import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useMeuLote, useMinhasParcelas, useInfraestruturaLoteamento } from '../src/hooks/use-comprador';

function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 85 ? '#22C55E' : score >= 70 ? '#3B82F6' : score >= 50 ? '#F59E0B' : '#EF4444';
  const level = score >= 85 ? 'COMPLETO' : score >= 70 ? 'AVANCADO' : score >= 50 ? 'EM OBRA' : 'INICIAL';

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${progress} ${circumference - progress}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <View style={{ position: 'absolute', top: size / 2 - 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: '800', color }}>{score}%</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color, marginTop: -2 }}>{level}</Text>
      </View>
    </View>
  );
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: lote, refetch: refetchLote } = useMeuLote();
  const { data: parcelas, refetch: refetchParcelas } = useMinhasParcelas();
  const { data: infraestrutura } = useInfraestruturaLoteamento(lote?.loteamentoId ?? '');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchLote(), refetchParcelas()]);
    setRefreshing(false);
  }, [refetchLote, refetchParcelas]);

  // Next unpaid installment
  const proximaParcela = (parcelas ?? []).find(
    (p: any) => p.status === 'PENDENTE' || p.status === 'ATRASADA'
  );

  // Infrastructure overall progress
  const infraItems = infraestrutura ?? [];
  const infraProgress = infraItems.length > 0
    ? Math.round(infraItems.reduce((acc: number, item: any) => acc + (item.percentual ?? 0), 0) / infraItems.length)
    : 0;

  // Count overdue parcelas
  const atrasadas = (parcelas ?? []).filter((p: any) => p.status === 'ATRASADA').length;

  // Quick actions
  const actions = [
    { label: 'Parcelas', icon: 'card' as const, route: '/parcelas', color: '#F43F5E' },
    { label: 'Infra', icon: 'construct' as const, route: '/infraestrutura', color: '#8B5CF6' },
    { label: 'Docs', icon: 'document-text' as const, route: '/documentos', color: '#10B981' },
    { label: 'Config', icon: 'settings-sharp' as const, route: '/config', color: '#F59E0B' },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F43F5E" />}>
      {/* Buyer Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#F43F5E" />
          </View>
          <View>
            <Text style={styles.greeting}>Ola, {lote?.compradorNome ?? 'Comprador'}</Text>
            <Text style={styles.greetingSub}>Portal do Comprador</Text>
          </View>
        </View>
      </View>

      {/* Lote Card */}
      {lote && (
        <View style={styles.loteCard}>
          <View style={styles.loteHeader}>
            <Ionicons name="location" size={18} color="#BE123C" />
            <Text style={styles.loteTitle}>{lote.loteamentoNome ?? 'Loteamento'}</Text>
          </View>
          <View style={styles.loteGrid}>
            <View style={styles.loteItem}>
              <Text style={styles.loteLabel}>Quadra</Text>
              <Text style={styles.loteValue}>{lote.quadra ?? '-'}</Text>
            </View>
            <View style={styles.loteItem}>
              <Text style={styles.loteLabel}>Lote</Text>
              <Text style={styles.loteValue}>{lote.lote ?? '-'}</Text>
            </View>
            <View style={styles.loteItem}>
              <Text style={styles.loteLabel}>Area</Text>
              <Text style={styles.loteValue}>{lote.area ? `${lote.area} m2` : '-'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Alert: Overdue Parcelas */}
      {atrasadas > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={20} color="#DC2626" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.alertTitle}>{atrasadas} parcela(s) atrasada(s)</Text>
            <Text style={styles.alertDesc}>Regularize para evitar juros e multas</Text>
          </View>
        </View>
      )}

      {/* Next Payment Card */}
      {proximaParcela && (
        <View style={styles.paymentCard}>
          <Text style={styles.paymentHeader}>Proxima Parcela</Text>
          <View style={styles.paymentBody}>
            <View>
              <Text style={styles.paymentValue}>{formatCurrency(proximaParcela.valor ?? 0)}</Text>
              <Text style={styles.paymentDue}>Vencimento: {formatDate(proximaParcela.dataVencimento)}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: proximaParcela.status === 'ATRASADA' ? '#FEE2E2' : '#FEF3C7' },
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: proximaParcela.status === 'ATRASADA' ? '#DC2626' : '#D97706' },
              ]}>
                {proximaParcela.status === 'ATRASADA' ? 'Atrasada' : 'Pendente'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Infrastructure Progress */}
      <View style={styles.infraCard}>
        <Text style={styles.infraHeader}>Infraestrutura</Text>
        <ScoreGauge score={infraProgress} size={140} />
        <Text style={styles.infraLabel}>Progresso Geral</Text>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Acoes Rapidas</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity key={action.label} style={styles.actionCard} onPress={() => router.push(action.route as any)} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1F2' },
  headerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECDD3' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFE4E6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  greeting: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  greetingSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  loteCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECDD3' },
  loteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  loteTitle: { fontSize: 15, fontWeight: '700', color: '#BE123C', marginLeft: 8 },
  loteGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  loteItem: { alignItems: 'center' },
  loteLabel: { fontSize: 12, color: '#64748B' },
  loteValue: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  alertDesc: { fontSize: 12, color: '#991B1B', marginTop: 2 },
  paymentCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECDD3' },
  paymentHeader: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  paymentBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentValue: { fontSize: 22, fontWeight: '800', color: '#BE123C' },
  paymentDue: { fontSize: 12, color: '#64748B', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  infraCard: { alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, paddingVertical: 24, borderRadius: 16, borderWidth: 1, borderColor: '#FECDD3' },
  infraHeader: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  infraLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  actionCard: { width: '23%', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECDD3' },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
});
