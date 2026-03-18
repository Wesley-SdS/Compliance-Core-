import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useAppStore } from '../src/stores/app-store';
import { useVeiculoAtivo, useVeiculoScore, useVeiculoAlertas, useVeiculos, useManutencoes } from '../src/hooks/use-veiculo';
import { useViagemAtiva } from '../src/hooks/use-viagem';

// ScoreGauge component using SVG circles (same pattern as estetik-mobile)
function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 85 ? '#22C55E' : score >= 70 ? '#3B82F6' : score >= 50 ? '#F59E0B' : '#EF4444';
  const level = score >= 85 ? 'EXCELENTE' : score >= 70 ? 'BOM' : score >= 50 ? 'ATENCAO' : 'CRITICO';

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${progress} ${circumference - progress}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <View style={{ position: 'absolute', top: size / 2 - 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: '800', color }}>{score}</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color, marginTop: -2 }}>{level}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { selectedVeiculoId, setSelectedVeiculoId, viagemAtiva } = useAppStore();
  const [showVeiculoModal, setShowVeiculoModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: veiculos } = useVeiculos();
  const { data: veiculo } = useVeiculoAtivo(selectedVeiculoId);
  const { data: scoreData, refetch: refetchScore } = useVeiculoScore(selectedVeiculoId);
  const { data: alertas } = useVeiculoAlertas(selectedVeiculoId);
  const { data: viagemData } = useViagemAtiva(viagemAtiva);

  const score = scoreData?.score ?? 0;
  const urgentAlertas = (alertas ?? []).filter((a: any) => !a.lido && (a.severidade === 'ALTA'));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchScore();
    setRefreshing(false);
  }, [refetchScore]);

  // Quick action buttons
  const actions = [
    { label: 'Abastecer', icon: 'camera' as const, route: '/abastecer', color: '#0EA5E9' },
    { label: 'Viagem', icon: 'navigate' as const, route: '/viagem', color: '#8B5CF6' },
    { label: 'Checklist', icon: 'clipboard' as const, route: '/checklist', color: '#F59E0B' },
    { label: 'Docs', icon: 'document-text' as const, route: '/documentos', color: '#10B981' },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />}>
      {/* Vehicle Selector */}
      <TouchableOpacity style={styles.veiculoSelector} onPress={() => setShowVeiculoModal(true)}>
        <Ionicons name="car-sport" size={20} color="#0EA5E9" />
        <Text style={styles.veiculoText}>{veiculo ? `${veiculo.placa} - ${veiculo.modelo}` : 'Selecionar veiculo'}</Text>
        <Ionicons name="chevron-down" size={16} color="#94A3B8" />
      </TouchableOpacity>

      {/* Score Gauge */}
      <View style={styles.scoreCard}>
        <ScoreGauge score={score} size={180} />
        <Text style={styles.scoreLabel}>Score de Compliance</Text>
      </View>

      {/* Urgent Alerts */}
      {urgentAlertas.length > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={20} color="#DC2626" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.alertTitle}>{urgentAlertas.length} alerta(s) urgente(s)</Text>
            <Text style={styles.alertDesc}>{urgentAlertas[0]?.titulo}</Text>
          </View>
        </View>
      )}

      {/* Active Trip Card */}
      {viagemData && (
        <TouchableOpacity style={styles.tripCard} onPress={() => router.push('/viagem')}>
          <View style={styles.tripHeader}>
            <Ionicons name="navigate" size={18} color="#FFFFFF" />
            <Text style={styles.tripTitle}>Viagem em andamento</Text>
          </View>
          <Text style={styles.tripRoute}>{viagemData.origem} → {viagemData.destino}</Text>
          <Text style={styles.tripInfo}>Horas: {viagemData.horasConducao ?? 0}h | KM: {viagemData.kmInicio}</Text>
        </TouchableOpacity>
      )}

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

      {/* Vehicle Info */}
      {veiculo && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Veiculo Ativo</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Placa</Text><Text style={styles.infoValue}>{veiculo.placa}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Modelo</Text><Text style={styles.infoValue}>{veiculo.modelo}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>KM</Text><Text style={styles.infoValue}>{veiculo.km?.toLocaleString('pt-BR')}</Text></View>
        </View>
      )}

      <View style={{ height: 32 }} />

      {/* Vehicle Selection Modal */}
      <Modal visible={showVeiculoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Veiculo</Text>
            {(veiculos ?? []).map((v: any) => (
              <TouchableOpacity key={v.id} style={styles.modalItem} onPress={() => { setSelectedVeiculoId(v.id); setShowVeiculoModal(false); }}>
                <Ionicons name="car-sport" size={20} color="#0EA5E9" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalItemTitle}>{v.placa}</Text>
                  <Text style={styles.modalItemSub}>{v.modelo} | {v.km?.toLocaleString('pt-BR')} km</Text>
                </View>
                {selectedVeiculoId === v.id && <Ionicons name="checkmark-circle" size={22} color="#0EA5E9" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowVeiculoModal(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  veiculoSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  veiculoText: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#1E293B' },
  scoreCard: { alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, paddingVertical: 28, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  scoreLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 8 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  alertDesc: { fontSize: 12, color: '#991B1B', marginTop: 2 },
  tripCard: { backgroundColor: '#0EA5E9', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12 },
  tripHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tripTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  tripRoute: { fontSize: 13, color: '#E0F2FE', marginTop: 6 },
  tripInfo: { fontSize: 12, color: '#BAE6FD', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  actionCard: { width: '23%', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
  infoCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#64748B' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  modalItemSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalClose: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  modalCloseText: { fontSize: 15, fontWeight: '600', color: '#0EA5E9' },
});
