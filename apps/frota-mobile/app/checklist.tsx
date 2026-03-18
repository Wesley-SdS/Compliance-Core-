import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Switch, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/stores/app-store';
import {
  useChecklistItems,
  useSaveDraft,
  useSubmitChecklist,
  ChecklistItem,
} from '../src/hooks/use-checklist';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Pneus: 'ellipse',
  Freios: 'hand-left',
  Luzes: 'bulb',
  Espelhos: 'eye',
  Extintor: 'flame',
  Triangulo: 'triangle',
  Macaco: 'construct',
  Documentacao: 'document-text',
};

export default function ChecklistScreen() {
  const selectedVeiculoId = useAppStore((s) => s.selectedVeiculoId);
  const { data: initialItems, isLoading } = useChecklistItems(selectedVeiculoId);
  const saveDraft = useSaveDraft(selectedVeiculoId);
  const submitChecklist = useSubmitChecklist();

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [expandedObs, setExpandedObs] = useState<string | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<'APROVADO' | 'REPROVADO' | 'PARCIAL' | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Load items from query and merge with draft on mount
  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
    }
  }, [initialItems]);

  // Check for draft existence
  useEffect(() => {
    if (!selectedVeiculoId) return;
    const checkDraft = async () => {
      const draftKey = `@frota:checklist-draft:${selectedVeiculoId}`;
      const raw = await AsyncStorage.getItem(draftKey);
      setHasDraft(!!raw);
    };
    checkDraft();
  }, [selectedVeiculoId, items]);

  const totalItems = items.length;
  const conformeCount = items.filter((i) => i.conforme === true).length;
  const naoConformeCount = items.filter((i) => i.conforme === false).length;
  const respondidoCount = items.filter((i) => i.conforme !== null).length;
  const progressPercent = totalItems > 0 ? (respondidoCount / totalItems) * 100 : 0;
  const scorePercent = totalItems > 0 ? Math.round((conformeCount / totalItems) * 100) : 0;

  const handleToggle = useCallback(
    (id: string, value: boolean) => {
      const updated = items.map((item) =>
        item.id === id ? { ...item, conforme: value } : item,
      );
      setItems(updated);
      saveDraft(updated);
      setHasDraft(true);
    },
    [items, saveDraft],
  );

  const handleObservacao = useCallback(
    (id: string, text: string) => {
      const updated = items.map((item) =>
        item.id === id ? { ...item, observacao: text } : item,
      );
      setItems(updated);
      saveDraft(updated);
      setHasDraft(true);
    },
    [items, saveDraft],
  );

  const handleSubmit = () => {
    if (!selectedVeiculoId) {
      Alert.alert('Erro', 'Selecione um veiculo primeiro');
      return;
    }
    const unanswered = items.filter((i) => i.conforme === null);
    if (unanswered.length > 0) {
      Alert.alert('Incompleto', `Ainda faltam ${unanswered.length} itens para responder`);
      return;
    }

    submitChecklist.mutate(
      { veiculoId: selectedVeiculoId, items },
      {
        onSuccess: (result) => {
          setSubmittedStatus(result.status);
          setHasDraft(false);
          const title =
            result.status === 'APROVADO'
              ? 'Aprovado!'
              : result.status === 'REPROVADO'
              ? 'Reprovado'
              : 'Parcial';
          Alert.alert(title, `Score: ${result.score}/${result.total}`);
        },
        onError: (err: any) => Alert.alert('Erro', err.message),
      },
    );
  };

  const handleReset = () => {
    const resetted = items.map((item) => ({
      ...item,
      conforme: null,
      observacao: '',
    }));
    setItems(resetted);
    setSubmittedStatus(null);
    saveDraft(resetted);
  };

  const getStatusColor = () => {
    if (submittedStatus === 'APROVADO') return '#22C55E';
    if (submittedStatus === 'REPROVADO') return '#EF4444';
    if (submittedStatus === 'PARCIAL') return '#F59E0B';
    return '#94A3B8';
  };

  const getStatusIcon = (): React.ComponentProps<typeof Ionicons>['name'] => {
    if (submittedStatus === 'APROVADO') return 'checkmark-circle';
    if (submittedStatus === 'REPROVADO') return 'close-circle';
    return 'alert-circle';
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  // Group by category
  const categories = [...new Set(items.map((i) => i.categoria))];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress Bar */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progresso</Text>
          <Text style={styles.progressCount}>
            {conformeCount}/{totalItems} itens conformes
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <View style={[styles.progressDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.progressStatText}>Conforme: {conformeCount}</Text>
          </View>
          <View style={styles.progressStat}>
            <View style={[styles.progressDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.progressStatText}>Nao conforme: {naoConformeCount}</Text>
          </View>
          <View style={styles.progressStat}>
            <View style={[styles.progressDot, { backgroundColor: '#94A3B8' }]} />
            <Text style={styles.progressStatText}>Pendente: {totalItems - respondidoCount}</Text>
          </View>
        </View>
      </View>

      {/* Status Badge (after submission) */}
      {submittedStatus && (
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Ionicons name={getStatusIcon()} size={24} color="#FFFFFF" />
          <Text style={styles.statusBadgeText}>{submittedStatus}</Text>
        </View>
      )}

      {/* Offline indicator */}
      {hasDraft && (
        <View style={styles.offlineIndicator}>
          <Ionicons name="cloud-offline" size={16} color="#64748B" />
          <Text style={styles.offlineText}>Salvo localmente</Text>
        </View>
      )}

      {/* Checklist Items by Category */}
      {categories.map((cat) => (
        <View key={cat} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Ionicons
              name={CATEGORY_ICONS[cat] || 'list'}
              size={20}
              color="#075985"
            />
            <Text style={styles.categoryTitle}>{cat}</Text>
          </View>
          {items
            .filter((i) => i.categoria === cat)
            .map((item) => (
              <View key={item.id} style={styles.checklistItem}>
                <View style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Ionicons
                      name={CATEGORY_ICONS[item.categoria] || 'list'}
                      size={16}
                      color="#64748B"
                    />
                    <Text style={styles.itemLabel} numberOfLines={2}>
                      {item.label}
                    </Text>
                  </View>
                  <Switch
                    value={item.conforme === true}
                    onValueChange={(val) => handleToggle(item.id, val)}
                    trackColor={{ false: '#FCA5A5', true: '#86EFAC' }}
                    thumbColor={
                      item.conforme === true
                        ? '#22C55E'
                        : item.conforme === false
                        ? '#EF4444'
                        : '#94A3B8'
                    }
                  />
                </View>
                {item.conforme === false && (
                  <TextInput
                    style={styles.obsInput}
                    placeholder="Descreva o problema..."
                    placeholderTextColor="#94A3B8"
                    value={item.observacao}
                    onChangeText={(text) => handleObservacao(item.id, text)}
                    multiline
                  />
                )}
              </View>
            ))}
        </View>
      ))}

      {/* Score Gauge Mini + Status */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreGauge}>
          <Text style={[styles.scoreGaugeValue, { color: getStatusColor() }]}>
            {scorePercent}%
          </Text>
          <Text style={styles.scoreGaugeLabel}>Score</Text>
        </View>
        {submittedStatus && (
          <View style={[styles.scoreStatusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.scoreStatusText}>{submittedStatus}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedVeiculoId || submitChecklist.isPending) && { opacity: 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={!selectedVeiculoId || submitChecklist.isPending}
        >
          {submitChecklist.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Enviar Checklist</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Ionicons name="refresh" size={20} color="#64748B" />
          <Text style={styles.resetButtonText}>Limpar Tudo</Text>
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
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  progressCount: { fontSize: 14, fontWeight: '600', color: '#0EA5E9' },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
    borderRadius: 5,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0EA5E9',
    textAlign: 'right',
    marginTop: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  progressStat: { flexDirection: 'row', alignItems: 'center' },
  progressDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  progressStatText: { fontSize: 12, color: '#64748B' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  offlineText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 6,
  },
  categorySection: { marginBottom: 16 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#075985',
    marginLeft: 8,
  },
  checklistItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    minHeight: 56,
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    marginLeft: 10,
    fontWeight: '500',
  },
  obsInput: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    fontSize: 14,
    color: '#0F172A',
    marginTop: 8,
    minHeight: 60,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
    paddingVertical: 12,
  },
  scoreGauge: { alignItems: 'center' },
  scoreGaugeValue: { fontSize: 28, fontWeight: '800' },
  scoreGaugeLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  scoreStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreStatusText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  actions: { marginTop: 8 },
  submitButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  resetButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
});
