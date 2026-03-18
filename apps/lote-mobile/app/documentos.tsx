import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMeusDocumentos } from '../src/hooks/use-comprador';

function getDocStatusStyle(status: string) {
  if (status === 'VALIDO') return { bg: '#DCFCE7', text: '#166534', label: 'Valido' };
  if (status === 'VENCIDO') return { bg: '#FEE2E2', text: '#991B1B', label: 'Vencido' };
  return { bg: '#FEF3C7', text: '#92400E', label: 'Pendente' };
}

function getDocIcon(categoria: string): keyof typeof Ionicons.glyphMap {
  if (categoria === 'CONTRATO') return 'reader';
  if (categoria === 'ESCRITURA') return 'document';
  if (categoria === 'COMPROVANTE') return 'receipt';
  return 'document-text';
}

export default function DocumentosScreen() {
  const { data: documentos, refetch, isLoading } = useMeusDocumentos();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDownload = (doc: any) => {
    Alert.alert('Download', `Baixando "${doc.nome}"...`);
  };

  const renderDoc = ({ item }: { item: any }) => {
    const st = getDocStatusStyle(item.status ?? 'PENDENTE');
    const iconName = getDocIcon(item.categoria);

    return (
      <View style={styles.docCard}>
        <View style={styles.docHeader}>
          <Ionicons name={iconName} size={22} color="#BE123C" />
          <View style={styles.docInfo}>
            <Text style={styles.docName}>{item.nome}</Text>
            <Text style={styles.docCategory}>{item.categoria ?? 'Documento'}</Text>
            {item.dataEmissao && (
              <Text style={styles.docDate}>Emissao: {new Date(item.dataEmissao).toLocaleDateString('pt-BR')}</Text>
            )}
          </View>
          <View style={[styles.docBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.docBadgeText, { color: st.text }]}>{st.label}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item)}>
          <Ionicons name="download-outline" size={18} color="#F43F5E" />
          <Text style={styles.downloadBtnText}>Baixar documento</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={documentos ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderDoc}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F43F5E" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Nenhum documento disponivel</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1F2' },
  list: { padding: 16, paddingBottom: 32 },
  docCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#FECDD3' },
  docHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  docInfo: { flex: 1, marginLeft: 12 },
  docName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  docCategory: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  docDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  docBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  docBadgeText: { fontSize: 12, fontWeight: '700' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#F43F5E', gap: 6 },
  downloadBtnText: { fontSize: 13, fontWeight: '700', color: '#F43F5E' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 12 },
});
