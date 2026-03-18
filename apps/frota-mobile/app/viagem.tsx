import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/stores/app-store';
import {
  useViagemAtiva,
  useIniciarViagem,
  useFinalizarViagem,
  useRegistrarParada,
  useHorasConducao,
  Parada,
} from '../src/hooks/use-viagem';

const PARADA_TYPES = [
  { value: 'DESCANSO', label: 'Descanso', icon: 'bed' as const },
  { value: 'REFEICAO', label: 'Refeicao', icon: 'restaurant' as const },
  { value: 'CARGA', label: 'Carga', icon: 'cube' as const },
  { value: 'DESCARGA', label: 'Descarga', icon: 'arrow-down-circle' as const },
];

export default function ViagemScreen() {
  const selectedVeiculoId = useAppStore((s) => s.selectedVeiculoId);
  const viagemAtivaId = useAppStore((s) => s.viagemAtiva);
  const setViagemAtiva = useAppStore((s) => s.setViagemAtiva);

  const { data: viagemAtiva, isLoading } = useViagemAtiva(viagemAtivaId);
  const { data: horasConducao } = useHorasConducao(selectedVeiculoId);
  const iniciarViagem = useIniciarViagem();
  const finalizarViagem = useFinalizarViagem();
  const registrarParada = useRegistrarParada();

  const [kmInicial, setKmInicial] = useState('');
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [kmFinal, setKmFinal] = useState('');

  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [tripSummary, setTripSummary] = useState<{
    kmTotal: number;
    duracao: string;
    custoEstimado: string;
  } | null>(null);

  const [elapsed, setElapsed] = useState('00:00:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer for active trip
  useEffect(() => {
    if (viagemAtiva?.iniciadaEm) {
      const update = () => {
        const start = new Date(viagemAtiva.iniciadaEm).getTime();
        const diff = Math.floor((Date.now() - start) / 1000);
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        setElapsed(`${h}:${m}:${s}`);
      };
      update();
      intervalRef.current = setInterval(update, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [viagemAtiva?.iniciadaEm]);

  const handleIniciar = () => {
    if (!selectedVeiculoId) {
      Alert.alert('Erro', 'Selecione um veiculo primeiro');
      return;
    }
    if (!kmInicial || !origem.trim() || !destino.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    iniciarViagem.mutate(
      {
        veiculoId: selectedVeiculoId,
        kmInicial: parseInt(kmInicial, 10),
        origem: origem.trim(),
        destino: destino.trim(),
      },
      {
        onSuccess: (result) => {
          setViagemAtiva(result.id);
          setKmInicial('');
          setOrigem('');
          setDestino('');
        },
        onError: (err: any) => Alert.alert('Erro', err.message),
      },
    );
  };

  const handleFinalizar = () => {
    if (!viagemAtiva?.id || !kmFinal) {
      Alert.alert('Erro', 'Informe o KM final');
      return;
    }
    const kmFinalNum = parseInt(kmFinal, 10);
    const kmTotal = kmFinalNum - viagemAtiva.kmInicial;
    const startTime = new Date(viagemAtiva.iniciadaEm).getTime();
    const durationMs = Date.now() - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationH = Math.floor(durationHours);
    const durationM = Math.floor((durationHours - durationH) * 60);
    const custoEstimado = (kmTotal * 1.2).toFixed(2);

    finalizarViagem.mutate(
      { viagemId: viagemAtiva.id, kmFinal: kmFinalNum },
      {
        onSuccess: () => {
          setShowFinalizarModal(false);
          setKmFinal('');
          setViagemAtiva(null);
          setTripSummary({
            kmTotal,
            duracao: `${durationH}h ${durationM}min`,
            custoEstimado: `R$ ${custoEstimado}`,
          });
        },
        onError: (err: any) => Alert.alert('Erro', err.message),
      },
    );
  };

  const handleRegistrarParada = (tipo: string) => {
    if (!viagemAtiva?.id) return;
    registrarParada.mutate(
      { viagemId: viagemAtiva.id, tipo },
      {
        onSuccess: () => Alert.alert('Parada registrada'),
        onError: (err: any) => Alert.alert('Erro', err.message),
      },
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  // Trip summary after finalization
  if (tripSummary) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconCircle}>
            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
          </View>
          <Text style={styles.summaryTitle}>Viagem Finalizada</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="speedometer" size={24} color="#0EA5E9" />
              <Text style={styles.summaryValue}>{tripSummary.kmTotal} km</Text>
              <Text style={styles.summaryLabel}>Distancia Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="time" size={24} color="#F59E0B" />
              <Text style={styles.summaryValue}>{tripSummary.duracao}</Text>
              <Text style={styles.summaryLabel}>Duracao</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="cash" size={24} color="#22C55E" />
              <Text style={styles.summaryValue}>{tripSummary.custoEstimado}</Text>
              <Text style={styles.summaryLabel}>Custo Est.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.newTripButton}
            onPress={() => setTripSummary(null)}
          >
            <Ionicons name="add-circle" size={22} color="#FFFFFF" />
            <Text style={styles.newTripButtonText}>Nova Viagem</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Active trip view
  if (viagemAtiva || viagemAtivaId) {
    const alertaContinuo = horasConducao && horasConducao.horasContinuas >= 5.5;
    const alertaTotal = horasConducao && horasConducao.horasTotal24h > 11;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Driving Hour Alerts */}
        {alertaContinuo && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={24} color="#FFFFFF" />
            <Text style={styles.alertBannerText}>
              ATENCAO: Proximo do limite de 5.5h continuas (Lei 13.103/2015)
            </Text>
          </View>
        )}
        {alertaTotal && (
          <View style={[styles.alertBanner, { backgroundColor: '#DC2626' }]}>
            <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
            <Text style={styles.alertBannerText}>
              LIMITE: Mais de 11h de conducao em 24h atingido!
            </Text>
          </View>
        )}

        {/* Timer Card */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Tempo de Viagem</Text>
          <Text style={styles.timerValue}>{elapsed}</Text>
          {viagemAtiva && (
            <View style={styles.timerRoute}>
              <Text style={styles.timerRouteText}>
                {viagemAtiva.origem} {'\u2192'} {viagemAtiva.destino}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="speedometer" size={24} color="#0EA5E9" />
            <Text style={styles.statValue}>{viagemAtiva?.kmInicial || '-'}</Text>
            <Text style={styles.statLabel}>KM Estimado</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>
              {horasConducao ? `${horasConducao.horasContinuas.toFixed(1)}h` : '-'}
            </Text>
            <Text style={styles.statLabel}>Horas Conducao</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flag" size={24} color="#22C55E" />
            <Text style={styles.statValue}>
              {viagemAtiva?.paradas?.length ?? 0}
            </Text>
            <Text style={styles.statLabel}>Paradas</Text>
          </View>
        </View>

        {/* Registrar Parada - 4 type buttons */}
        <Text style={styles.sectionTitle}>Registrar Parada</Text>
        <View style={styles.paradaTypeRow}>
          {PARADA_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={styles.paradaTypeButton}
              onPress={() => handleRegistrarParada(type.value)}
              disabled={registrarParada.isPending}
            >
              <View style={styles.paradaTypeIconCircle}>
                <Ionicons name={type.icon} size={22} color="#0EA5E9" />
              </View>
              <Text style={styles.paradaTypeLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Paradas List */}
        {viagemAtiva?.paradas && viagemAtiva.paradas.length > 0 && (
          <View style={styles.paradasSection}>
            <Text style={styles.sectionTitle}>Paradas Registradas</Text>
            {viagemAtiva.paradas.map((p: Parada, idx: number) => {
              const typeInfo = PARADA_TYPES.find((t) => t.value === p.tipo) || PARADA_TYPES[0];
              return (
                <View key={p.id || idx} style={styles.paradaCard}>
                  <View style={styles.paradaIcon}>
                    <Ionicons name={typeInfo.icon} size={20} color="#22C55E" />
                  </View>
                  <View style={styles.paradaInfo}>
                    <Text style={styles.paradaType}>{typeInfo.label}</Text>
                    <Text style={styles.paradaTime}>
                      {new Date(p.iniciadaEm).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Finalizar Viagem Button */}
        <TouchableOpacity
          style={styles.finalizarMainButton}
          onPress={() => setShowFinalizarModal(true)}
        >
          <Ionicons name="flag" size={22} color="#FFFFFF" />
          <Text style={styles.finalizarMainButtonText}>Finalizar Viagem</Text>
        </TouchableOpacity>

        {/* Finalizar Modal */}
        <Modal visible={showFinalizarModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFinalizarModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Finalizar Viagem</Text>
              <Text style={styles.fieldLabel}>KM Final</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Informe o KM final"
                placeholderTextColor="#94A3B8"
                value={kmFinal}
                onChangeText={setKmFinal}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={[styles.confirmButton, finalizarViagem.isPending && { opacity: 0.7 }]}
                onPress={handleFinalizar}
                disabled={finalizarViagem.isPending}
              >
                {finalizarViagem.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar Finalizacao</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    );
  }

  // Start trip form
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.startCard}>
        <View style={styles.startIconCircle}>
          <Ionicons name="navigate" size={40} color="#0EA5E9" />
        </View>
        <Text style={styles.startTitle}>Iniciar Nova Viagem</Text>
        <Text style={styles.startSubtitle}>Preencha os dados para comecar</Text>

        <Text style={styles.fieldLabel}>KM Inicial</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="Quilometragem atual"
          placeholderTextColor="#94A3B8"
          value={kmInicial}
          onChangeText={setKmInicial}
          keyboardType="number-pad"
        />

        <Text style={styles.fieldLabel}>Origem</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="Cidade / local de saida"
          placeholderTextColor="#94A3B8"
          value={origem}
          onChangeText={setOrigem}
        />

        <Text style={styles.fieldLabel}>Destino</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="Cidade / local de destino"
          placeholderTextColor="#94A3B8"
          value={destino}
          onChangeText={setDestino}
        />

        <TouchableOpacity
          style={[styles.iniciarButton, iniciarViagem.isPending && { opacity: 0.7 }]}
          onPress={handleIniciar}
          disabled={iniciarViagem.isPending}
        >
          {iniciarViagem.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="play-circle" size={22} color="#FFFFFF" />
              <Text style={styles.iniciarButtonText}>Iniciar Viagem</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  content: { padding: 16, paddingBottom: 32 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
  },
  alertBanner: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1,
  },
  timerCard: {
    backgroundColor: '#075985',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: { color: '#BAE6FD', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerRoute: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  timerRouteText: { color: '#E0F2FE', fontSize: 14, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  paradaTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  paradaTypeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  paradaTypeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  paradaTypeLabel: { fontSize: 11, fontWeight: '600', color: '#0F172A', textAlign: 'center' },
  paradasSection: { marginTop: 8 },
  paradaCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    alignItems: 'center',
  },
  paradaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paradaInfo: { flex: 1 },
  paradaType: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  paradaTime: { fontSize: 13, color: '#64748B', marginTop: 2 },
  finalizarMainButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  finalizarMainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 16,
    color: '#0F172A',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  startCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  startIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  startTitle: { fontSize: 22, fontWeight: '800', color: '#075985', marginBottom: 4 },
  startSubtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 20 },
  iniciarButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iniciarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIconCircle: { marginBottom: 12 },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  newTripButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  newTripButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
