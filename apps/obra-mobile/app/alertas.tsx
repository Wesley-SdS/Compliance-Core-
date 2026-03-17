import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useObras, useObraAlerts, useAcknowledgeAlert } from '@/src/hooks/use-obras';
import { useAppStore } from '@/src/stores/app-store';
import { registerForPushNotifications } from '@/src/lib/notifications';

type FilterTab = 'TODOS' | 'CRITICO' | 'AVISO' | 'INFO';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'CRITICO', label: 'Criticos' },
  { value: 'AVISO', label: 'Avisos' },
  { value: 'INFO', label: 'Info' },
];

function getSeverityConfig(severity: string) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
    case 'CRITICO':
      return { color: '#EF4444', bgColor: '#EF444415', icon: 'alert-circle' as const, label: 'Critico' };
    case 'HIGH':
    case 'ALTO':
      return { color: '#F97316', bgColor: '#F9731615', icon: 'warning' as const, label: 'Alto' };
    case 'MEDIUM':
    case 'MEDIO':
      return { color: '#F59E0B', bgColor: '#F59E0B15', icon: 'information-circle' as const, label: 'Medio' };
    case 'LOW':
    case 'BAIXO':
    case 'INFO':
      return { color: '#3B82F6', bgColor: '#3B82F615', icon: 'information' as const, label: 'Info' };
    default:
      return { color: '#64748B', bgColor: '#64748B15', icon: 'help-circle' as const, label: severity };
  }
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min atras`;
  if (diffHrs < 24) return `${diffHrs}h atras`;
  if (diffDays < 7) return `${diffDays}d atras`;
  return date.toLocaleDateString('pt-BR');
}

function AlertCard({
  alert,
  onAcknowledge,
}: {
  alert: any;
  onAcknowledge: (id: string) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const config = getSeverityConfig(alert.severity || alert.severidade);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onAcknowledge(alert.id);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.alertCardWrapper}>
      {/* Background action */}
      <View style={styles.swipeBackground}>
        <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
        <Text style={styles.swipeBackgroundText}>Reconhecer</Text>
      </View>

      <Animated.View
        style={[
          styles.alertCard,
          { borderLeftColor: config.color },
          { transform: [{ translateX }], opacity },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.severityBadge, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon} size={14} color={config.color} />
            <Text style={[styles.severityText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.alertTime}>
            {getRelativeTime(alert.createdAt || alert.criadoEm || new Date().toISOString())}
          </Text>
        </View>

        <Text style={styles.alertTitle} numberOfLines={2}>
          {alert.title || alert.titulo || 'Alerta'}
        </Text>
        <Text style={styles.alertMessage} numberOfLines={3}>
          {alert.message || alert.mensagem || ''}
        </Text>

        {(alert.etapa || alert.source) && (
          <View style={styles.alertMeta}>
            <Ionicons name="layers-outline" size={12} color="#64748B" />
            <Text style={styles.alertMetaText}>{alert.etapa || alert.source}</Text>
          </View>
        )}

        <Text style={styles.swipeHint}>
          <Ionicons name="arrow-back" size={10} color="#475569" /> Deslize para reconhecer
        </Text>
      </Animated.View>
    </View>
  );
}

export default function AlertasScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('TODOS');
  const selectedObraId = useAppStore((s) => s.selectedObraId);
  const setSelectedObraId = useAppStore((s) => s.setSelectedObraId);
  const { data: obras } = useObras();
  const { data: alerts, isLoading, refetch, isRefetching } = useObraAlerts(selectedObraId);
  const acknowledgeMutation = useAcknowledgeAlert(selectedObraId);

  const obraList = Array.isArray(obras) ? obras : [];
  const alertList = Array.isArray(alerts) ? alerts : [];

  // Register push notifications on mount
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const handleAcknowledge = useCallback((alertId: string) => {
    acknowledgeMutation.mutate(alertId);
  }, [acknowledgeMutation]);

  const filteredAlerts = alertList.filter((alert: any) => {
    if (activeFilter === 'TODOS') return true;
    const severity = (alert.severity || alert.severidade || '').toUpperCase();
    switch (activeFilter) {
      case 'CRITICO':
        return severity === 'CRITICAL' || severity === 'CRITICO';
      case 'AVISO':
        return severity === 'HIGH' || severity === 'ALTO' || severity === 'MEDIUM' || severity === 'MEDIO';
      case 'INFO':
        return severity === 'LOW' || severity === 'BAIXO' || severity === 'INFO';
      default:
        return true;
    }
  });

  const criticalCount = alertList.filter((a: any) => {
    const sev = (a.severity || a.severidade || '').toUpperCase();
    return sev === 'CRITICAL' || sev === 'CRITICO';
  }).length;

  return (
    <View style={styles.container}>
      {/* Obra Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.obraSelector}>
        {obraList.map((obra: any) => (
          <TouchableOpacity
            key={obra.id}
            style={[styles.obraChip, selectedObraId === obra.id && styles.obraChipSelected]}
            onPress={() => setSelectedObraId(obra.id)}
          >
            <Text
              style={[styles.obraChipText, selectedObraId === obra.id && styles.obraChipTextSelected]}
              numberOfLines={1}
            >
              {obra.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.filterTab, activeFilter === tab.value && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.value)}
          >
            <Text
              style={[styles.filterTabText, activeFilter === tab.value && styles.filterTabTextActive]}
            >
              {tab.label}
            </Text>
            {tab.value === 'CRITICO' && criticalCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{criticalCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Alert List */}
      {isLoading ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Carregando alertas...</Text>
        </View>
      ) : !selectedObraId ? (
        <View style={styles.centeredContent}>
          <Ionicons name="notifications-outline" size={64} color="#475569" />
          <Text style={styles.emptyTitle}>Selecione uma obra</Text>
          <Text style={styles.emptySubtitle}>para visualizar seus alertas</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard alert={item} onAcknowledge={handleAcknowledge} />
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
            <View style={styles.centeredContent}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#22C55E" />
              <Text style={styles.emptyTitle}>Nenhum alerta</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter !== 'TODOS'
                  ? 'Nenhum alerta encontrado com este filtro'
                  : 'Tudo em ordem nesta obra!'}
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
  obraSelector: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    maxHeight: 52,
  },
  obraChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  obraChipSelected: {
    backgroundColor: '#F59E0B20',
    borderColor: '#F59E0B',
  },
  obraChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  obraChipTextSelected: {
    color: '#F59E0B',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#F59E0B20',
    borderColor: '#F59E0B',
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#F59E0B',
  },
  filterBadge: {
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  alertCardWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  swipeBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 24,
    borderRadius: 12,
    gap: 8,
  },
  swipeBackgroundText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    gap: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertTime: {
    color: '#64748B',
    fontSize: 11,
  },
  alertTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  alertMessage: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertMetaText: {
    color: '#64748B',
    fontSize: 11,
  },
  swipeHint: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
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
});
