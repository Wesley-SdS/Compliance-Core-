import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../src/lib/api';
import {
  registerForPushNotifications,
  addNotificationListener,
  clearBadgeCount,
} from '../src/lib/notifications';
import { useAppStore } from '../src/stores/app-store';

interface AlertData {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  read: boolean;
  acknowledged: boolean;
  createdAt: string;
}

const SEVERITY_CONFIG: Record<
  string,
  { color: string; bg: string; icon: string; label: string }
> = {
  critical: {
    color: '#DC2626',
    bg: '#FEF2F2',
    icon: 'alert-circle',
    label: 'Crítico',
  },
  high: {
    color: '#EA580C',
    bg: '#FFF7ED',
    icon: 'warning',
    label: 'Alto',
  },
  medium: {
    color: '#CA8A04',
    bg: '#FEF9C3',
    icon: 'information-circle',
    label: 'Médio',
  },
  low: {
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: 'chatbubble-ellipses',
    label: 'Baixo',
  },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function SwipeableAlertItem({
  alert,
  onAcknowledge,
}: {
  alert: AlertData;
  onAcknowledge: (id: string) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && !alert.acknowledged,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -120));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -80) {
          Animated.spring(translateX, {
            toValue: -120,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const handleAcknowledge = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onAcknowledge(alert.id));
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMin < 1) return 'Agora';
      if (diffMin < 60) return `${diffMin}min`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '--';
    }
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Swipe action background */}
      <View style={styles.swipeAction}>
        <TouchableOpacity style={styles.acknowledgeBtn} onPress={handleAcknowledge}>
          <Ionicons name="checkmark-done" size={22} color="#FFFFFF" />
          <Text style={styles.acknowledgeBtnText}>Ciente</Text>
        </TouchableOpacity>
      </View>

      {/* Alert card */}
      <Animated.View
        style={[styles.alertCard, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View
          style={[styles.severityStripe, { backgroundColor: config.color }]}
        />
        <View style={styles.alertBody}>
          <View style={styles.alertTopRow}>
            <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon as any} size={14} color={config.color} />
              <Text style={[styles.severityText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
            <Text style={styles.alertTime}>{formatTime(alert.createdAt)}</Text>
          </View>

          <Text
            style={[styles.alertTitle, !alert.read && styles.alertTitleUnread]}
            numberOfLines={2}
          >
            {alert.title}
          </Text>
          <Text style={styles.alertMessage} numberOfLines={3}>
            {alert.message}
          </Text>

          <View style={styles.alertFooter}>
            <Text style={styles.alertCategory}>{alert.category}</Text>
            {!alert.read && <View style={styles.unreadDot} />}
            {alert.acknowledged && (
              <View style={styles.acknowledgedBadge}>
                <Ionicons name="checkmark" size={12} color="#16A34A" />
                <Text style={styles.acknowledgedText}>Ciente</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

type FilterType = 'todos' | 'critical' | 'high' | 'medium' | 'low';

export default function AlertasScreen() {
  const pushEnabled = useAppStore((s) => s.pushEnabled);
  const [filter, setFilter] = useState<FilterType>('todos');
  const queryClient = useQueryClient();

  const { data: alerts, refetch, isRefetching } = useQuery<AlertData[]>({
    queryKey: ['alerts'],
    queryFn: () => api<AlertData[]>('/alerts'),
    refetchInterval: 1000 * 60 * 2,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) =>
      api(`/alerts/${alertId}/acknowledge`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['score'] });
    },
  });

  useEffect(() => {
    if (pushEnabled) {
      registerForPushNotifications();
    }

    const subscription = addNotificationListener(() => {
      refetch();
    });

    clearBadgeCount();

    return () => {
      subscription.remove();
    };
  }, [pushEnabled, refetch]);

  const onRefresh = useCallback(() => {
    refetch();
    clearBadgeCount();
  }, [refetch]);

  const handleAcknowledge = (alertId: string) => {
    acknowledgeMutation.mutate(alertId);
  };

  const filteredAlerts = alerts?.filter((a) => {
    if (filter === 'todos') return true;
    return a.severity === filter;
  });

  const unreadCount = alerts?.filter((a) => !a.read).length ?? 0;
  const criticalCount = alerts?.filter((a) => a.severity === 'critical').length ?? 0;

  const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: 'todos', label: `Todos (${alerts?.length ?? 0})` },
    { value: 'critical', label: `Críticos (${criticalCount})` },
    { value: 'high', label: 'Alto' },
    { value: 'medium', label: 'Médio' },
    { value: 'low', label: 'Baixo' },
  ];

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.headerStatItem}>
          <Ionicons name="notifications" size={20} color="#2563EB" />
          <Text style={styles.headerStatValue}>{unreadCount}</Text>
          <Text style={styles.headerStatLabel}>Não lidos</Text>
        </View>
        <View style={styles.headerStatDivider} />
        <View style={styles.headerStatItem}>
          <Ionicons name="alert-circle" size={20} color="#DC2626" />
          <Text style={[styles.headerStatValue, { color: '#DC2626' }]}>
            {criticalCount}
          </Text>
          <Text style={styles.headerStatLabel}>Críticos</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === item.value && styles.filterTabActive,
              ]}
              onPress={() => setFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === item.value && styles.filterTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Alert List */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeableAlertItem alert={item} onAcknowledge={handleAcknowledge} />
        )}
        contentContainerStyle={styles.alertList}
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
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={52} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Nenhum alerta</Text>
            <Text style={styles.emptySubtitle}>
              {filter !== 'todos'
                ? 'Nenhum alerta nesta categoria'
                : 'Você está em dia! Sem alertas pendentes.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerStatLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  alertList: {
    padding: 16,
    paddingBottom: 32,
  },
  swipeContainer: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  swipeAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  acknowledgeBtn: {
    alignItems: 'center',
    gap: 4,
  },
  acknowledgeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  severityStripe: {
    width: 4,
  },
  alertBody: {
    flex: 1,
    padding: 14,
  },
  alertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 21,
  },
  alertTitleUnread: {
    fontWeight: '700',
  },
  alertMessage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 10,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertCategory: {
    fontSize: 11,
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  acknowledgedText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
