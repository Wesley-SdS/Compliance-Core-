import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMinhasParcelas } from '../src/hooks/use-comprador';

type FilterType = 'TODAS' | 'PAGA' | 'PENDENTE' | 'ATRASADA';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getStatusStyle(status: string) {
  if (status === 'PAGA') return { bg: '#DCFCE7', text: '#166534', label: 'Paga' };
  if (status === 'ATRASADA') return { bg: '#FEE2E2', text: '#991B1B', label: 'Atrasada' };
  return { bg: '#FEF3C7', text: '#92400E', label: 'Pendente' };
}

export default function ParcelasScreen() {
  const { data: parcelas, refetch, isLoading } = useMinhasParcelas();
  const [filter, setFilter] = useState<FilterType>('TODAS');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const allParcelas = parcelas ?? [];

  const filtered = useMemo(() => {
    if (filter === 'TODAS') return allParcelas;
    return allParcelas.filter((p: any) => p.status === filter);
  }, [allParcelas, filter]);

  const pagas = allParcelas.filter((p: any) => p.status === 'PAGA').length;
  const pendentes = allParcelas.filter((p: any) => p.status === 'PENDENTE').length;
  const atrasadas = allParcelas.filter((p: any) => p.status === 'ATRASADA').length;
  const totalPago = allParcelas
    .filter((p: any) => p.status === 'PAGA')
    .reduce((acc: number, p: any) => acc + (p.valor ?? 0), 0);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'TODAS', label: 'Todas' },
    { key: 'PAGA', label: 'Pagas' },
    { key: 'PENDENTE', label: 'Pendentes' },
    { key: 'ATRASADA', label: 'Atrasadas' },
  ];

  const handleBoleto = (parcela: any) => {
    Alert.alert('2a Via Boleto', `Gerando boleto para parcela #${parcela.numero}...`);
  };

  const renderParcela = ({ item }: { item: any }) => {
    const st = getStatusStyle(item.status);
    return (
      <View style={styles.parcelaCard}>
        <View style={styles.parcelaHeader}>
          <Text style={styles.parcelaNumero}>#{item.numero ?? item.id}</Text>
          <View style={[styles.parcelaBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.parcelaBadgeText, { color: st.text }]}>{st.label}</Text>
          </View>
        </View>
        <View style={styles.parcelaBody}>
          <View>
            <Text style={styles.parcelaValor}>{formatCurrency(item.valor ?? 0)}</Text>
            <Text style={styles.parcelaDate}>Venc.: {formatDate(item.dataVencimento)}</Text>
            {item.dataPagamento && (
              <Text style={styles.parcelaPaid}>Pago em: {formatDate(item.dataPagamento)}</Text>
            )}
          </View>
          {item.status !== 'PAGA' && (
            <TouchableOpacity style={styles.boletoBtn} onPress={() => handleBoleto(item)}>
              <Ionicons name="download-outline" size={16} color="#F43F5E" />
              <Text style={styles.boletoBtnText}>2a Via</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{pagas}</Text>
            <Text style={styles.summaryLabel}>Pagas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#D97706' }]}>{pendentes}</Text>
            <Text style={styles.summaryLabel}>Pendentes</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#DC2626' }]}>{atrasadas}</Text>
            <Text style={styles.summaryLabel}>Atrasadas</Text>
          </View>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total pago:</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalPago)}</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterBtnText, filter === f.key && styles.filterBtnTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id ?? String(item.numero)}
        renderItem={renderParcela}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F43F5E" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Nenhuma parcela encontrada</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1F2' },
  summaryCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECDD3' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  summaryItem: { alignItems: 'center' },
  summaryNumber: { fontSize: 22, fontWeight: '800', color: '#22C55E' },
  summaryLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
  totalLabel: { fontSize: 13, color: '#64748B' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FECDD3' },
  filterBtnActive: { backgroundColor: '#F43F5E', borderColor: '#F43F5E' },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterBtnTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 32 },
  parcelaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#FECDD3' },
  parcelaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  parcelaNumero: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  parcelaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  parcelaBadgeText: { fontSize: 12, fontWeight: '700' },
  parcelaBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  parcelaValor: { fontSize: 18, fontWeight: '800', color: '#BE123C' },
  parcelaDate: { fontSize: 12, color: '#64748B', marginTop: 4 },
  parcelaPaid: { fontSize: 12, color: '#22C55E', marginTop: 2 },
  boletoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#F43F5E', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  boletoBtnText: { fontSize: 12, fontWeight: '700', color: '#F43F5E' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 12 },
});
