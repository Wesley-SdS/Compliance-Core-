import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAppStore } from '../src/stores/app-store';
import { useManutencoes, Manutencao } from '../src/hooks/use-veiculo';
import { api } from '../src/lib/api';

export default function ManutencaoScreen() {
  const router = useRouter();
  const selectedVeiculoId = useAppStore((s) => s.selectedVeiculoId);
  const { data: manutencoes, isLoading, refetch } = useManutencoes(selectedVeiculoId);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [tipo, setTipo] = useState('PREVENTIVA');
  const [km, setKm] = useState('');
  const [custo, setCusto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fornecedor, setFornecedor] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusStyle = (status: string) => {
    if (status === 'REALIZADA') return { icon: 'checkmark-circle' as const, color: '#22C55E', label: 'Realizada' };
    if (status === 'AGENDADA') return { icon: 'calendar' as const, color: '#0EA5E9', label: 'Agendada' };
    return { icon: 'time' as const, color: '#F59E0B', label: 'Pendente' };
  };

  const handleSubmit = async () => {
    if (!selectedVeiculoId) {
      Alert.alert('Erro', 'Selecione um veiculo primeiro');
      return;
    }
    if (!descricao.trim()) {
      Alert.alert('Erro', 'Informe a descricao da manutencao');
      return;
    }

    setSubmitting(true);
    try {
      await api('/api/manutencoes', {
        method: 'POST',
        body: JSON.stringify({
          veiculoId: selectedVeiculoId,
          tipo,
          km: km ? parseInt(km, 10) : undefined,
          custo: custo ? parseFloat(custo) : undefined,
          descricao: descricao.trim(),
          fornecedor: fornecedor.trim() || undefined,
        }),
      });
      Alert.alert('Sucesso', 'Manutencao registrada com sucesso');
      setShowForm(false);
      setTipo('PREVENTIVA');
      setKm('');
      setCusto('');
      setDescricao('');
      setFornecedor('');
      await refetch();
    } catch {
      Alert.alert('Erro', 'Falha ao registrar manutencao');
    }
    setSubmitting(false);
  };

  // Separate scheduled from completed
  const scheduled = (manutencoes ?? []).filter((m: Manutencao) => m.status === 'AGENDADA');
  const recent = (manutencoes ?? []).filter((m: Manutencao) => m.status !== 'AGENDADA');

  if (!selectedVeiculoId) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="build" size={48} color="#94A3B8" />
        <Text style={styles.emptyText}>Selecione um veiculo nas configuracoes</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/config')}>
          <Text style={styles.emptyButtonText}>Ir para Configuracoes</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Manutencao</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color="#0EA5E9" />
        </TouchableOpacity>
      </View>

      {/* Registration Form */}
      {showForm && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nova Manutencao</Text>

          <Text style={styles.fieldLabel}>Tipo</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipo}
              onValueChange={setTipo}
              style={styles.picker}
            >
              <Picker.Item label="Preventiva" value="PREVENTIVA" />
              <Picker.Item label="Corretiva" value="CORRETIVA" />
              <Picker.Item label="Pneus" value="PNEUS" />
              <Picker.Item label="Eletrica" value="ELETRICA" />
              <Picker.Item label="Outra" value="OUTRA" />
            </Picker>
          </View>

          <Text style={styles.fieldLabel}>Descricao *</Text>
          <TextInput
            style={styles.input}
            placeholder="Descreva a manutencao"
            placeholderTextColor="#94A3B8"
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>KM</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                value={km}
                onChangeText={setKm}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Custo (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                placeholderTextColor="#94A3B8"
                value={custo}
                onChangeText={setCusto}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Fornecedor</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do fornecedor"
            placeholderTextColor="#94A3B8"
            value={fornecedor}
            onChangeText={setFornecedor}
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Registrar Manutencao</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Next Scheduled */}
      {scheduled.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proximas Agendadas</Text>
          {scheduled.map((m: Manutencao) => {
            const mst = getStatusStyle(m.status);
            return (
              <View key={m.id} style={styles.manutRow}>
                <Ionicons name={mst.icon} size={22} color={mst.color} />
                <View style={styles.manutInfo}>
                  <Text style={styles.manutDesc}>{m.descricao}</Text>
                  <Text style={styles.manutMeta}>
                    {m.tipo} {m.km ? `| ${m.km.toLocaleString('pt-BR')} km` : ''}
                  </Text>
                  <Text style={styles.manutDate}>
                    {m.dataAgendada
                      ? `Agendada: ${new Date(m.dataAgendada).toLocaleDateString('pt-BR')}`
                      : 'Data a definir'}
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

      {/* Recent Maintenance */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 40 }} />
      ) : recent.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historico</Text>
          {recent.map((m: Manutencao) => {
            const mst = getStatusStyle(m.status);
            return (
              <View key={m.id} style={styles.manutRow}>
                <Ionicons name={mst.icon} size={22} color={mst.color} />
                <View style={styles.manutInfo}>
                  <Text style={styles.manutDesc}>{m.descricao}</Text>
                  <Text style={styles.manutMeta}>
                    {m.tipo} {m.km ? `| ${m.km.toLocaleString('pt-BR')} km` : ''}
                  </Text>
                  <Text style={styles.manutDate}>
                    {m.dataRealizada
                      ? `Realizada: ${new Date(m.dataRealizada).toLocaleDateString('pt-BR')}`
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
      ) : !showForm ? (
        <View style={styles.emptyState}>
          <Ionicons name="build-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyStateText}>Nenhuma manutencao registrada</Text>
          <Text style={styles.emptyStateSubtext}>Toque no + para registrar</Text>
        </View>
      ) : null}
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  picker: { height: 50, color: '#1E293B' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  submitButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  manutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  manutInfo: { flex: 1, marginLeft: 12 },
  manutDesc: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  manutMeta: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  manutDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  manutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  manutBadgeText: { fontSize: 11, fontWeight: '700' },
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
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});
