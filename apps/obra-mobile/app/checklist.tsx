import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useObras, useObraEtapas, useSubmitChecklist } from '@/src/hooks/use-obras';
import { useAppStore } from '@/src/stores/app-store';

type ResponseValue = 'SIM' | 'NAO' | 'PARCIAL' | 'NA' | null;

interface ChecklistResponse {
  itemId: string;
  value: ResponseValue;
  notes: string;
}

const RESPONSE_OPTIONS: { value: ResponseValue; label: string; color: string; bgColor: string }[] = [
  { value: 'SIM', label: 'SIM', color: '#22C55E', bgColor: '#22C55E20' },
  { value: 'NAO', label: 'NAO', color: '#EF4444', bgColor: '#EF444420' },
  { value: 'PARCIAL', label: 'PARCIAL', color: '#F59E0B', bgColor: '#F59E0B20' },
  { value: 'NA', label: 'N/A', color: '#64748B', bgColor: '#64748B20' },
];

const DRAFT_KEY_PREFIX = 'checklist_draft_';

export default function ChecklistScreen() {
  const selectedObraId = useAppStore((s) => s.selectedObraId);
  const setSelectedObraId = useAppStore((s) => s.setSelectedObraId);
  const { data: obras } = useObras();
  const { data: etapas, isLoading: etapasLoading } = useObraEtapas(selectedObraId);
  const submitMutation = useSubmitChecklist(selectedObraId || '');

  const [selectedEtapaId, setSelectedEtapaId] = useState<string | null>(null);
  const [responses, setResponses] = useState<ChecklistResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const obraList = Array.isArray(obras) ? obras : [];
  const etapaList = Array.isArray(etapas) ? etapas : [];

  const selectedEtapa = etapaList.find((e: any) => e.id === selectedEtapaId);
  const checklistItems: any[] = selectedEtapa?.checklist || selectedEtapa?.checklistItems || [];

  // Load draft from AsyncStorage
  useEffect(() => {
    if (!selectedObraId || !selectedEtapaId) return;
    const loadDraft = async () => {
      try {
        const key = `${DRAFT_KEY_PREFIX}${selectedObraId}_${selectedEtapaId}`;
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          setResponses(JSON.parse(saved));
          return;
        }
      } catch {}
      // Initialize empty responses
      setResponses(
        checklistItems.map((item: any) => ({
          itemId: item.id,
          value: null,
          notes: '',
        }))
      );
    };
    loadDraft();
  }, [selectedObraId, selectedEtapaId, checklistItems.length]);

  // Save draft to AsyncStorage
  const saveDraft = useCallback(async (data: ChecklistResponse[]) => {
    if (!selectedObraId || !selectedEtapaId) return;
    try {
      const key = `${DRAFT_KEY_PREFIX}${selectedObraId}_${selectedEtapaId}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }, [selectedObraId, selectedEtapaId]);

  const handleResponseChange = useCallback((itemId: string, value: ResponseValue) => {
    setResponses((prev) => {
      const updated = prev.map((r) =>
        r.itemId === itemId ? { ...r, value } : r
      );
      saveDraft(updated);
      return updated;
    });
  }, [saveDraft]);

  const handleNotesChange = useCallback((itemId: string, notes: string) => {
    setResponses((prev) => {
      const updated = prev.map((r) =>
        r.itemId === itemId ? { ...r, notes } : r
      );
      saveDraft(updated);
      return updated;
    });
  }, [saveDraft]);

  // Real-time score calculation
  const score = useMemo(() => {
    const answered = responses.filter((r) => r.value !== null && r.value !== 'NA');
    if (answered.length === 0) return 0;
    const points = answered.reduce((sum, r) => {
      if (r.value === 'SIM') return sum + 100;
      if (r.value === 'PARCIAL') return sum + 50;
      return sum; // NAO = 0
    }, 0);
    return Math.round(points / answered.length);
  }, [responses]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22C55E';
    if (s >= 60) return '#F59E0B';
    if (s >= 40) return '#F97316';
    return '#EF4444';
  };

  const answeredCount = responses.filter((r) => r.value !== null).length;
  const totalCount = responses.length;
  const allAnswered = totalCount > 0 && answeredCount === totalCount;

  const handleSubmit = async () => {
    if (!allAnswered) {
      Alert.alert('Atenção', 'Responda todos os itens do checklist antes de enviar');
      return;
    }
    if (!selectedObraId || !selectedEtapaId) return;

    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        etapaId: selectedEtapaId,
        responses: responses.map((r) => ({
          itemId: r.itemId,
          answer: r.value,
          notes: r.notes,
        })),
      });
      // Clear draft
      const key = `${DRAFT_KEY_PREFIX}${selectedObraId}_${selectedEtapaId}`;
      await AsyncStorage.removeItem(key);
      Alert.alert('Sucesso', 'Checklist enviado com sucesso!');
      setResponses(
        checklistItems.map((item: any) => ({ itemId: item.id, value: null, notes: '' }))
      );
    } catch {
      Alert.alert('Erro', 'Falha ao enviar checklist');
    }
    setIsSubmitting(false);
  };

  const renderChecklistItem = ({ item, index }: { item: any; index: number }) => {
    const response = responses.find((r) => r.itemId === item.id);

    return (
      <View style={styles.checklistItem}>
        <View style={styles.itemHeader}>
          <View style={styles.itemNumber}>
            <Text style={styles.itemNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.itemTitle}>{item.pergunta || item.title || item.descricao}</Text>
        </View>

        {item.categoria && (
          <Text style={styles.itemCategory}>{item.categoria}</Text>
        )}

        {/* Response Buttons */}
        <View style={styles.responseButtons}>
          {RESPONSE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.responseButton,
                response?.value === opt.value && {
                  backgroundColor: opt.bgColor,
                  borderColor: opt.color,
                },
              ]}
              onPress={() => handleResponseChange(item.id, opt.value)}
            >
              <Text
                style={[
                  styles.responseButtonText,
                  response?.value === opt.value && { color: opt.color },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <TextInput
          style={styles.notesInput}
          value={response?.notes || ''}
          onChangeText={(text) => handleNotesChange(item.id, text)}
          placeholder="Observações..."
          placeholderTextColor="#475569"
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selectors */}
      <View style={styles.selectorsContainer}>
        <Text style={styles.sectionLabel}>Obra</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {obraList.map((obra: any) => (
            <TouchableOpacity
              key={obra.id}
              style={[styles.chip, selectedObraId === obra.id && styles.chipSelected]}
              onPress={() => {
                setSelectedObraId(obra.id);
                setSelectedEtapaId(null);
              }}
            >
              <Text
                style={[styles.chipText, selectedObraId === obra.id && styles.chipTextSelected]}
                numberOfLines={1}
              >
                {obra.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Etapa</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {etapaList.map((etapa: any) => (
            <TouchableOpacity
              key={etapa.id}
              style={[styles.chip, selectedEtapaId === etapa.id && styles.chipSelected]}
              onPress={() => setSelectedEtapaId(etapa.id)}
            >
              <Text
                style={[styles.chipText, selectedEtapaId === etapa.id && styles.chipTextSelected]}
                numberOfLines={1}
              >
                {etapa.nome}
              </Text>
            </TouchableOpacity>
          ))}
          {etapaList.length === 0 && !etapasLoading && (
            <Text style={styles.emptyText}>
              {selectedObraId ? 'Nenhuma etapa encontrada' : 'Selecione uma obra'}
            </Text>
          )}
        </ScrollView>
      </View>

      {/* Score Bar */}
      {selectedEtapaId && totalCount > 0 && (
        <View style={styles.scoreBar}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>{score}%</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Score em Tempo Real</Text>
            <Text style={styles.scoreProgress}>
              {answeredCount}/{totalCount} respondidos
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${(answeredCount / totalCount) * 100}%`,
                    backgroundColor: getScoreColor(score),
                  },
                ]}
              />
            </View>
          </View>
        </View>
      )}

      {/* Checklist Items */}
      {etapasLoading ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Carregando checklist...</Text>
        </View>
      ) : !selectedEtapaId ? (
        <View style={styles.centeredContent}>
          <Ionicons name="clipboard-outline" size={64} color="#475569" />
          <Text style={styles.emptyTitle}>Selecione uma obra e etapa</Text>
          <Text style={styles.emptySubtitle}>para preencher o checklist de segurança</Text>
        </View>
      ) : checklistItems.length === 0 ? (
        <View style={styles.centeredContent}>
          <Ionicons name="document-text-outline" size={64} color="#475569" />
          <Text style={styles.emptyTitle}>Nenhum item no checklist</Text>
          <Text style={styles.emptySubtitle}>Esta etapa não possui checklist configurado</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={checklistItems}
            keyExtractor={(item) => item.id}
            renderItem={renderChecklistItem}
            contentContainerStyle={styles.listContent}
          />
          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, (!allAnswered || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!allAnswered || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Ionicons name="send" size={20} color="#0F172A" />
              )}
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Enviando...' : 'Enviar Checklist'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  selectorsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  chipScroll: {
    marginBottom: 4,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#F59E0B20',
    borderColor: '#F59E0B',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#F59E0B',
  },
  emptyText: {
    color: '#475569',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 16,
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#334155',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  scoreInfo: {
    flex: 1,
    gap: 4,
  },
  scoreLabel: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreProgress: {
    color: '#64748B',
    fontSize: 12,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginTop: 4,
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  checklistItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumberText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  itemTitle: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  itemCategory: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 38,
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  responseButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  responseButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#0F172A',
    color: '#CBD5E1',
    fontSize: 13,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 40,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  emptyTitle: {
    color: '#CBD5E1',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
});
