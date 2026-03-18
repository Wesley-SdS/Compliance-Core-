import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Switch, TextInput, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/stores/app-store';
import {
  useVeiculos,
  useDocumentos,
  useManutencoes,
  useVeiculoAlertas,
} from '../src/hooks/use-veiculo';
import { signOut } from '../src/lib/auth';
import { getApiUrl, setApiUrl } from '../src/lib/api';

export default function ConfigScreen() {
  const router = useRouter();
  const selectedVeiculoId = useAppStore((s) => s.selectedVeiculoId);
  const setSelectedVeiculoId = useAppStore((s) => s.setSelectedVeiculoId);
  const darkMode = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const pushEnabled = useAppStore((s) => s.pushEnabled);
  const setPushEnabled = useAppStore((s) => s.setPushEnabled);
  const storeSetApiUrl = useAppStore((s) => s.setApiUrl);
  const reset = useAppStore((s) => s.reset);

  const { data: veiculos } = useVeiculos();
  const { data: documentos } = useDocumentos(selectedVeiculoId);
  const { data: manutencoes } = useManutencoes(selectedVeiculoId);
  const { data: alertas, refetch: refetchAlertas } = useVeiculoAlertas(selectedVeiculoId);

  const [apiUrlValue, setApiUrlValue] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [showVeiculoModal, setShowVeiculoModal] = useState(false);

  useEffect(() => {
    getApiUrl().then(setApiUrlValue);
  }, []);

  const handleSaveUrl = async () => {
    if (!apiUrlValue.trim()) {
      Alert.alert('Erro', 'Informe a URL da API');
      return;
    }
    setSavingUrl(true);
    try {
      await setApiUrl(apiUrlValue.trim());
      storeSetApiUrl(apiUrlValue.trim());
      Alert.alert('Sucesso', 'URL da API atualizada');
    } catch {
      Alert.alert('Erro', 'Falha ao salvar URL');
    }
    setSavingUrl(false);
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          reset();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleReconhecerAlerta = (alertaId: string) => {
    Alert.alert('Alerta reconhecido', `Alerta ${alertaId} marcado como lido`);
    refetchAlertas();
  };

  const getDocStatusStyle = (status: string) => {
    if (status === 'VALIDO') return { bg: '#DCFCE7', text: '#166534', label: 'Valido' };
    if (status === 'VENCENDO') return { bg: '#FEF3C7', text: '#92400E', label: 'Vencendo' };
    return { bg: '#FEE2E2', text: '#991B1B', label: 'Vencido' };
  };

  const getManutStatusStyle = (status: string) => {
    if (status === 'REALIZADA') return { icon: 'checkmark-circle' as const, color: '#22C55E', label: 'Realizada' };
    if (status === 'AGENDADA') return { icon: 'calendar' as const, color: '#0EA5E9', label: 'Agendada' };
    return { icon: 'time' as const, color: '#F59E0B', label: 'Pendente' };
  };

  const selectedVeiculo = veiculos?.find((v) => v.id === selectedVeiculoId);

  type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Veiculo Ativo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veiculo Ativo</Text>
        <TouchableOpacity
          style={styles.vehicleSelector}
          onPress={() => setShowVeiculoModal(true)}
        >
          <Ionicons name="car" size={22} color="#0EA5E9" />
          <View style={styles.vehicleSelectorText}>
            {selectedVeiculo ? (
              <>
                <Text style={styles.vehicleSelectorPlaca}>{selectedVeiculo.placa}</Text>
                <Text style={styles.vehicleSelectorModelo}>
                  {selectedVeiculo.modelo} - {selectedVeiculo.ano}
                </Text>
              </>
            ) : (
              <Text style={styles.vehicleSelectorPlaceholder}>Selecionar veiculo</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Vehicle Selection Modal */}
      <Modal visible={showVeiculoModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVeiculoModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Veiculo</Text>
            <FlatList
              data={veiculos || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.vehicleOption,
                    item.id === selectedVeiculoId && styles.vehicleOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedVeiculoId(item.id);
                    setShowVeiculoModal(false);
                  }}
                >
                  <Ionicons
                    name="car"
                    size={20}
                    color={item.id === selectedVeiculoId ? '#0EA5E9' : '#64748B'}
                  />
                  <View style={styles.vehicleOptionText}>
                    <Text style={styles.vehicleOptionPlaca}>{item.placa}</Text>
                    <Text style={styles.vehicleOptionModelo}>
                      {item.modelo} - {item.ano}
                    </Text>
                  </View>
                  {item.id === selectedVeiculoId && (
                    <Ionicons name="checkmark-circle" size={22} color="#0EA5E9" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. URL da API */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>URL da API</Text>
        <View style={styles.apiRow}>
          <TextInput
            style={styles.apiInput}
            placeholder="https://api.example.com"
            placeholderTextColor="#94A3B8"
            value={apiUrlValue}
            onChangeText={setApiUrlValue}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.apiSaveBtn, savingUrl && { opacity: 0.7 }]}
            onPress={handleSaveUrl}
            disabled={savingUrl}
          >
            {savingUrl ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.apiSaveBtnText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Preferencias */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>
        <View style={styles.prefRow}>
          <View style={styles.prefLeft}>
            <Ionicons name="moon" size={20} color="#64748B" />
            <Text style={styles.prefLabel}>Modo Escuro</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#E2E8F0', true: '#7DD3FC' }}
            thumbColor={darkMode ? '#0EA5E9' : '#94A3B8'}
          />
        </View>
        <View style={[styles.prefRow, { borderBottomWidth: 0 }]}>
          <View style={styles.prefLeft}>
            <Ionicons name="notifications" size={20} color="#64748B" />
            <Text style={styles.prefLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#E2E8F0', true: '#7DD3FC' }}
            thumbColor={pushEnabled ? '#0EA5E9' : '#94A3B8'}
          />
        </View>
      </View>

      {/* 4. Documentos */}
      {documentos && documentos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          {documentos.map((doc) => {
            const st = getDocStatusStyle(doc.status);
            return (
              <View key={doc.id} style={styles.docRow}>
                <Ionicons name="document-text" size={20} color="#64748B" />
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doc.nome}</Text>
                  <Text style={styles.docType}>{doc.tipo}</Text>
                  <Text style={styles.docExpiry}>
                    Validade: {new Date(doc.dataValidade).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <View style={[styles.docBadge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.docBadgeText, { color: st.text }]}>{st.label}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 5. Manutencoes */}
      {manutencoes && manutencoes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manutencoes</Text>
          {manutencoes.map((m) => {
            const mst = getManutStatusStyle(m.status);
            return (
              <View key={m.id} style={styles.manutRow}>
                <Ionicons name={mst.icon} size={22} color={mst.color} />
                <View style={styles.manutInfo}>
                  <Text style={styles.manutDesc}>{m.descricao}</Text>
                  <Text style={styles.manutDate}>
                    {m.dataRealizada
                      ? `Realizada: ${new Date(m.dataRealizada).toLocaleDateString('pt-BR')}`
                      : m.dataAgendada
                      ? `Agendada: ${new Date(m.dataAgendada).toLocaleDateString('pt-BR')}`
                      : 'Pendente'}
                  </Text>
                </View>
                <View style={[styles.manutBadge, { borderColor: mst.color }]}>
                  <Text style={[styles.manutBadgeText, { color: mst.color }]}>{mst.label}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 6. Alertas */}
      {alertas && alertas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertas</Text>
          {alertas.map((alerta) => {
            const iconName: IoniconsName =
              alerta.tipo === 'DOCUMENTO'
                ? 'document-text'
                : alerta.tipo === 'MANUTENCAO'
                ? 'build'
                : alerta.tipo === 'CONDUCAO'
                ? 'time'
                : 'warning';
            const sevColor =
              alerta.severidade === 'ALTA'
                ? '#EF4444'
                : alerta.severidade === 'MEDIA'
                ? '#F59E0B'
                : '#0EA5E9';
            return (
              <View
                key={alerta.id}
                style={[styles.alertRow, alerta.lido && styles.alertRowRead]}
              >
                <Ionicons name={iconName} size={20} color={sevColor} />
                <View style={styles.alertInfo}>
                  <Text
                    style={[styles.alertTitle, alerta.lido && styles.alertTitleRead]}
                  >
                    {alerta.titulo}
                  </Text>
                  <Text style={styles.alertDate}>
                    {new Date(alerta.criadoEm).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                {!alerta.lido && (
                  <TouchableOpacity
                    style={styles.alertAckButton}
                    onPress={() => handleReconhecerAlerta(alerta.id)}
                  >
                    <Text style={styles.alertAckText}>Reconhecer</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* 7. Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={22} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </TouchableOpacity>

      {/* 8. App Version */}
      <Text style={styles.version}>FrotaLeve v0.1.0 | ComplianceCore</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  content: { padding: 16, paddingBottom: 48 },
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  vehicleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehicleSelectorText: { flex: 1, marginLeft: 12 },
  vehicleSelectorPlaca: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  vehicleSelectorModelo: { fontSize: 13, color: '#64748B' },
  vehicleSelectorPlaceholder: { fontSize: 15, color: '#94A3B8' },
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
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  vehicleOptionSelected: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  vehicleOptionText: { flex: 1, marginLeft: 12 },
  vehicleOptionPlaca: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  vehicleOptionModelo: { fontSize: 13, color: '#64748B' },
  apiRow: { flexDirection: 'row', gap: 8 },
  apiInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  apiSaveBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apiSaveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  prefLeft: { flexDirection: 'row', alignItems: 'center' },
  prefLabel: {
    fontSize: 15,
    color: '#1E293B',
    marginLeft: 12,
    fontWeight: '500',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  docInfo: { flex: 1, marginLeft: 12 },
  docName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  docType: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  docExpiry: { fontSize: 12, color: '#64748B', marginTop: 2 },
  docBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  docBadgeText: { fontSize: 12, fontWeight: '700' },
  manutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  manutInfo: { flex: 1, marginLeft: 12 },
  manutDesc: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  manutDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  manutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  manutBadgeText: { fontSize: 11, fontWeight: '700' },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  alertRowRead: { opacity: 0.6 },
  alertInfo: { flex: 1, marginLeft: 12 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  alertTitleRead: { fontWeight: '400' },
  alertDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  alertAckButton: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#0EA5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  alertAckText: { fontSize: 12, fontWeight: '600', color: '#0EA5E9' },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 24,
  },
});
