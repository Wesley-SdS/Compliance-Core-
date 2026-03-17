import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useChecklists,
  useSubmitChecklist,
  useSaveDraft,
  calculateProgress,
  type Checklist,
  type ChecklistItem,
} from '../src/hooks/use-checklists';

type ResponseType = 'SIM' | 'NAO' | 'PARCIAL' | 'NA';

const RESPONSE_OPTIONS: { value: ResponseType; label: string; color: string; bg: string }[] = [
  { value: 'SIM', label: 'SIM', color: '#16A34A', bg: '#F0FDF4' },
  { value: 'NAO', label: 'NÃO', color: '#DC2626', bg: '#FEF2F2' },
  { value: 'PARCIAL', label: 'PARCIAL', color: '#CA8A04', bg: '#FEF9C3' },
  { value: 'NA', label: 'N/A', color: '#64748B', bg: '#F1F5F9' },
];

function ProgressBar({ progress }: { progress: number }) {
  const color = progress < 30 ? '#DC2626' : progress < 70 ? '#CA8A04' : '#16A34A';
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(progress, 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color }]}>{progress}%</Text>
    </View>
  );
}

function ChecklistCard({
  checklist,
  onPress,
}: {
  checklist: Checklist;
  onPress: () => void;
}) {
  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
  };
  const statusColors: Record<string, string> = {
    pendente: '#DC2626',
    em_andamento: '#CA8A04',
    concluido: '#16A34A',
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="clipboard-outline" size={20} color="#2563EB" />
          <Text style={styles.cardTitle} numberOfLines={1}>
            {checklist.title}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusColors[checklist.status]}15` },
          ]}
        >
          <Text
            style={[styles.statusText, { color: statusColors[checklist.status] }]}
          >
            {statusLabels[checklist.status]}
          </Text>
        </View>
      </View>

      {checklist.description ? (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {checklist.description}
        </Text>
      ) : null}

      <ProgressBar progress={checklist.progress} />

      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>
          <Ionicons name="list" size={12} color="#94A3B8" /> {checklist.items.length} itens
        </Text>
        {checklist.dueDate && (
          <Text style={styles.cardMeta}>
            <Ionicons name="calendar" size={12} color="#94A3B8" />{' '}
            {new Date(checklist.dueDate).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </View>

      <View style={styles.cardAction}>
        <Text style={styles.cardActionText}>
          {checklist.status === 'concluido' ? 'Ver Resultado' : 'Continuar'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#2563EB" />
      </View>
    </TouchableOpacity>
  );
}

function ChecklistFormModal({
  visible,
  checklist,
  onClose,
}: {
  visible: boolean;
  checklist: Checklist | null;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ChecklistItem[]>(checklist?.items ?? []);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const saveDraft = useSaveDraft();
  const submitChecklist = useSubmitChecklist();

  React.useEffect(() => {
    if (checklist) {
      setItems(checklist.items);
      const categories = [...new Set(checklist.items.map((i) => i.category))];
      setCurrentCategory(categories[0] || null);
    }
  }, [checklist]);

  const categories = [...new Set(items.map((i) => i.category))];
  const filteredItems = currentCategory
    ? items.filter((i) => i.category === currentCategory)
    : items;
  const progress = calculateProgress(items);

  const updateItemResponse = (itemId: string, response: ResponseType) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, response } : item,
    );
    setItems(updated);
    if (checklist) {
      saveDraft.mutate({ checklistId: checklist.id, items: updated });
    }
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, notes } : item,
    );
    setItems(updated);
  };

  const handleSubmit = () => {
    const unanswered = items.filter((i) => i.response === null).length;
    if (unanswered > 0) {
      Alert.alert(
        'Itens Pendentes',
        `Ainda há ${unanswered} itens sem resposta. Deseja enviar mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Enviar',
            onPress: () => {
              if (checklist) {
                submitChecklist.mutate(
                  { checklistId: checklist.id, items },
                  { onSuccess: onClose },
                );
              }
            },
          },
        ],
      );
    } else if (checklist) {
      submitChecklist.mutate(
        { checklistId: checklist.id, items },
        { onSuccess: onClose },
      );
    }
  };

  if (!checklist) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.modalHeaderInfo}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {checklist.title}
            </Text>
            <Text style={styles.modalSubtitle}>
              {items.filter((i) => i.response !== null).length}/{items.length} respondidos
            </Text>
          </View>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.modalProgress}>
          <ProgressBar progress={progress} />
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryTab,
                currentCategory === cat && styles.categoryTabActive,
              ]}
              onPress={() => setCurrentCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  currentCategory === cat && styles.categoryTabTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Checklist Items */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.itemsList}
          renderItem={({ item, index }) => (
            <View style={styles.checklistItem}>
              <View style={styles.itemQuestionRow}>
                <Text style={styles.itemNumber}>{index + 1}.</Text>
                <Text style={styles.itemQuestion}>{item.question}</Text>
              </View>

              {/* Response Buttons */}
              <View style={styles.responseRow}>
                {RESPONSE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.responseBtn,
                      {
                        backgroundColor:
                          item.response === opt.value ? opt.bg : '#F8FAFC',
                        borderColor:
                          item.response === opt.value ? opt.color : '#E2E8F0',
                      },
                    ]}
                    onPress={() => updateItemResponse(item.id, opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.responseBtnText,
                        {
                          color:
                            item.response === opt.value ? opt.color : '#94A3B8',
                          fontWeight:
                            item.response === opt.value ? '700' : '500',
                        },
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
                placeholder="Observações (opcional)..."
                placeholderTextColor="#94A3B8"
                value={item.notes}
                onChangeText={(text) => updateItemNotes(item.id, text)}
                multiline
                numberOfLines={2}
              />

              {/* Photo Button */}
              <TouchableOpacity style={styles.photoBtn}>
                <Ionicons name="camera-outline" size={18} color="#2563EB" />
                <Text style={styles.photoBtnText}>
                  {item.photoUri ? 'Foto Anexada' : 'Tirar Foto'}
                </Text>
                {item.photoUri && (
                  <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ChecklistsScreen() {
  const { data: checklists, isLoading, refetch, isRefetching } = useChecklists();
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const openChecklist = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setModalVisible(true);
  };

  const closeChecklist = () => {
    setModalVisible(false);
    setSelectedChecklist(null);
    refetch();
  };

  const pendingCount = checklists?.filter((c) => c.status !== 'concluido').length ?? 0;

  return (
    <View style={styles.container}>
      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{checklists?.length ?? 0}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#CA8A04' }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pendentes</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#16A34A' }]}>
            {(checklists?.length ?? 0) - pendingCount}
          </Text>
          <Text style={styles.summaryLabel}>Concluídos</Text>
        </View>
      </View>

      <FlatList
        data={checklists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChecklistCard checklist={item} onPress={() => openChecklist(item)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={56} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Nenhum checklist encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Seus checklists de inspeção aparecerão aqui
            </Text>
          </View>
        }
      />

      <ChecklistFormModal
        visible={modalVisible}
        checklist={selectedChecklist}
        onClose={closeChecklist}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cardMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  cardActionText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalProgress: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryTabs: {
    backgroundColor: '#FFFFFF',
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryTabsContent: {
    paddingHorizontal: 12,
    gap: 6,
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  categoryTabActive: {
    backgroundColor: '#2563EB',
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  itemsList: {
    padding: 16,
    paddingBottom: 40,
  },
  checklistItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemQuestionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  itemNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
    minWidth: 22,
  },
  itemQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
    lineHeight: 22,
  },
  responseRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  responseBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseBtnText: {
    fontSize: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
  },
  photoBtnText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
});
