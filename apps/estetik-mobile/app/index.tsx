import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useScore, getScoreColor, getScoreLabel } from '../src/hooks/use-score';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.52;
const STROKE_WIDTH = 14;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreCircle({ score }: { score: number }) {
  const color = getScoreColor(score);
  const progress = (score / 100) * CIRCUMFERENCE;
  const offset = CIRCUMFERENCE - progress;

  return (
    <View style={styles.circleContainer}>
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
        {/* Background circle */}
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          stroke="#E2E8F0"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90, ${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2})`}
        />
        <SvgText
          x={CIRCLE_SIZE / 2}
          y={CIRCLE_SIZE / 2 - 8}
          textAnchor="middle"
          fontSize={48}
          fontWeight="bold"
          fill={color}
        >
          {score}
        </SvgText>
        <SvgText
          x={CIRCLE_SIZE / 2}
          y={CIRCLE_SIZE / 2 + 24}
          textAnchor="middle"
          fontSize={14}
          fill="#64748B"
        >
          de 100
        </SvgText>
      </Svg>
    </View>
  );
}

function TrendIndicator({ trend, delta }: { trend: 'up' | 'down' | 'stable'; delta: number }) {
  const icon =
    trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove-outline';
  const color = trend === 'up' ? '#16A34A' : trend === 'down' ? '#DC2626' : '#64748B';
  const label =
    trend === 'up'
      ? `+${delta} pts`
      : trend === 'down'
        ? `-${Math.abs(delta)} pts`
        : 'Estável';

  return (
    <View style={[styles.trendBadge, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[styles.trendText, { color }]}>{label}</Text>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  subColor,
}: {
  icon: string;
  label: string;
  value: number;
  subValue: string;
  subColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <Ionicons name={icon as any} size={20} color="#2563EB" />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statSub, { color: subColor }]}>{subValue}</Text>
    </View>
  );
}

function AlertItem({
  title,
  severity,
  message,
}: {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
}) {
  const severityColors: Record<string, string> = {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#CA8A04',
    low: '#2563EB',
  };
  const severityLabels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Médio',
    low: 'Baixo',
  };
  const color = severityColors[severity] || '#64748B';

  return (
    <View style={styles.alertItem}>
      <View style={[styles.alertSeverityDot, { backgroundColor: color }]} />
      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.alertSeverityLabel, { color }]}>{severityLabels[severity]}</Text>
        </View>
        <Text style={styles.alertMessage} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </View>
  );
}

export default function ScoreScreen() {
  const { data, isLoading, refetch, isRefetching } = useScore();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const score = data?.score ?? 0;
  const label = getScoreLabel(score);
  const color = getScoreColor(score);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '--';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor="#2563EB"
          colors={['#2563EB']}
        />
      }
    >
      {/* Score Section */}
      <View style={styles.scoreSection}>
        <ScoreCircle score={score} />
        <Text style={[styles.levelText, { color }]}>{label}</Text>
        <TrendIndicator trend={data?.trend ?? 'stable'} delta={data?.trendDelta ?? 0} />
        <Text style={styles.lastUpdated}>
          Atualizado em {formatDate(data?.lastUpdated ?? '')}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="document-text"
          label="Documentos"
          value={data?.stats.documentos.total ?? 0}
          subValue={`${data?.stats.documentos.vencidos ?? 0} vencidos`}
          subColor={
            (data?.stats.documentos.vencidos ?? 0) > 0 ? '#DC2626' : '#16A34A'
          }
        />
        <StatCard
          icon="notifications"
          label="Alertas"
          value={data?.stats.alertas.total ?? 0}
          subValue={`${data?.stats.alertas.criticos ?? 0} críticos`}
          subColor={
            (data?.stats.alertas.criticos ?? 0) > 0 ? '#DC2626' : '#16A34A'
          }
        />
        <StatCard
          icon="clipboard"
          label="Checklists"
          value={data?.stats.checklists.total ?? 0}
          subValue={`${data?.stats.checklists.pendentes ?? 0} pendentes`}
          subColor={
            (data?.stats.checklists.pendentes ?? 0) > 0 ? '#CA8A04' : '#16A34A'
          }
        />
      </View>

      {/* Urgent Alerts */}
      <View style={styles.alertsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alertas Urgentes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {(data?.urgentAlerts?.length ?? 0) === 0 ? (
          <View style={styles.emptyAlerts}>
            <Ionicons name="checkmark-circle" size={40} color="#16A34A" />
            <Text style={styles.emptyText}>Nenhum alerta urgente</Text>
            <Text style={styles.emptySubtext}>Tudo em conformidade!</Text>
          </View>
        ) : (
          data?.urgentAlerts?.slice(0, 3).map((alert) => (
            <AlertItem
              key={alert.id}
              title={alert.title}
              severity={alert.severity}
              message={alert.message}
            />
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="camera" size={24} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Fotografar{'\n'}Documento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="clipboard" size={24} color="#16A34A" />
            </View>
            <Text style={styles.actionLabel}>Novo{'\n'}Checklist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="document-attach" size={24} color="#CA8A04" />
            </View>
            <Text style={styles.actionLabel}>Enviar{'\n'}Relatório</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingBottom: 32,
  },
  scoreSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  circleContainer: {
    marginBottom: 8,
  },
  levelText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
  },
  statSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  alertsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  seeAll: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  alertSeverityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  alertSeverityLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  emptyAlerts: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  quickActions: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
});
