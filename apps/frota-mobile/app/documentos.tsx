import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../src/stores/app-store';
import { useDocumentos, Documento } from '../src/hooks/use-veiculo';
import { uploadFile } from '../src/lib/api';

export default function DocumentosScreen() {
  const router = useRouter();
  const selectedVeiculoId = useAppStore((s) => s.selectedVeiculoId);
  const { data: documentos, isLoading, refetch } = useDocumentos(selectedVeiculoId);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusStyle = (status: string) => {
    if (status === 'VALIDO') return { bg: '#DCFCE7', text: '#166534', label: 'Valido' };
    if (status === 'VENCENDO') return { bg: '#FEF3C7', text: '#92400E', label: 'Vencendo' };
    return { bg: '#FEE2E2', text: '#991B1B', label: 'Vencido' };
  };

  const handleUpload = async () => {
    if (!selectedVeiculoId) {
      Alert.alert('Erro', 'Selecione um veiculo primeiro');
      return;
    }

    Alert.alert('Enviar Documento', 'Escolha a origem', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            await doUpload(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            await doUpload(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const doUpload = async (uri: string) => {
    setUploading(true);
    try {
      await uploadFile(`/api/veiculos/${selectedVeiculoId}/documentos`, uri);
      Alert.alert('Sucesso', 'Documento enviado com sucesso');
      await refetch();
    } catch {
      Alert.alert('Erro', 'Falha ao enviar documento');
    }
    setUploading(false);
  };

  if (!selectedVeiculoId) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="car" size={48} color="#94A3B8" />
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
        <Text style={styles.headerTitle}>Documentos</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, uploading && { opacity: 0.7 }]}
        onPress={handleUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>Enviar Documento</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Documents List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 40 }} />
      ) : documentos && documentos.length > 0 ? (
        <View style={styles.section}>
          {documentos.map((doc: Documento) => {
            const st = getStatusStyle(doc.status);
            return (
              <View key={doc.id} style={styles.docRow}>
                <Ionicons name="document-text" size={22} color="#64748B" />
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
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyStateText}>Nenhum documento encontrado</Text>
          <Text style={styles.emptyStateSubtext}>Envie documentos usando o botao acima</Text>
        </View>
      )}
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
  uploadButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
