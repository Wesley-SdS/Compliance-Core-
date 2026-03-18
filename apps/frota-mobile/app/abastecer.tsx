import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Image, Alert, ActivityIndicator, FlatList } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/stores/app-store';
import { useAbastecimentos, useRegistrarAbastecimento } from '../src/hooks/use-viagem';
import { uploadFile } from '../src/lib/api';

export default function AbastecerScreen() {
  const { selectedVeiculoId } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<'IDLE' | 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO'>('IDLE');
  const cameraRef = useRef<any>(null);

  // Form fields
  const [litros, setLitros] = useState('');
  const [valorLitro, setValorLitro] = useState('');
  const [total, setTotal] = useState('');
  const [posto, setPosto] = useState('');
  const [km, setKm] = useState('');

  const [saving, setSaving] = useState(false);
  const registrar = useRegistrarAbastecimento();
  const { data: abastecimentos, refetch } = useAbastecimentos(selectedVeiculoId);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setPhotoUri(photo.uri);
      setShowCamera(false);
      setOcrStatus('PENDENTE');
    } catch (err) {
      Alert.alert('Erro', 'Nao foi possivel capturar a foto');
    }
  };

  const handleSave = async () => {
    if (!selectedVeiculoId) { Alert.alert('Erro', 'Selecione um veiculo primeiro'); return; }
    if (!litros || !valorLitro || !total || !km) { Alert.alert('Erro', 'Preencha todos os campos obrigatorios'); return; }

    setSaving(true);
    try {
      const fields = {
        veiculoId: selectedVeiculoId,
        litros: litros,
        valorLitro: valorLitro,
        total: total,
        posto: posto,
        km: km,
      };

      let responseOcrStatus: string | undefined;

      if (photoUri) {
        // Use FormData upload when there's a photo
        const res = await uploadFile('/api/abastecimentos', photoUri, fields);
        responseOcrStatus = (res as any)?.statusOcr;
      } else {
        // No photo - use regular JSON mutation
        await registrar.mutateAsync({
          veiculoId: selectedVeiculoId,
          litros: parseFloat(litros),
          valorLitro: parseFloat(valorLitro),
          total: parseFloat(total),
          posto: posto,
          km: parseInt(km),
        });
      }

      Alert.alert('Sucesso', 'Abastecimento registrado!');
      setPhotoUri(null);
      setLitros(''); setValorLitro(''); setTotal(''); setPosto(''); setKm('');
      setOcrStatus(responseOcrStatus === 'CONCLUIDO' ? 'CONCLUIDO' : 'IDLE');
      refetch();
    } catch {
      Alert.alert('Erro', 'Falha ao registrar abastecimento');
    } finally {
      setSaving(false);
    }
  };

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <View style={styles.centered}>
          <Text style={styles.permText}>Precisamos de acesso a camera</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Permitir Camera</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
              <Ionicons name="camera" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Capture / Preview Section */}
      {!photoUri ? (
        <TouchableOpacity style={styles.captureCard} onPress={() => setShowCamera(true)} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={48} color="#0EA5E9" />
          <Text style={styles.captureTitle}>Fotografar Cupom</Text>
          <Text style={styles.captureDesc}>Tire uma foto do cupom de combustivel para OCR automatico</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.previewCard}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.ocrStatus}>
            <Ionicons name={ocrStatus === 'CONCLUIDO' ? 'checkmark-circle' : 'sync'} size={18}
              color={ocrStatus === 'CONCLUIDO' ? '#22C55E' : '#F59E0B'} />
            <Text style={[styles.ocrText, { color: ocrStatus === 'CONCLUIDO' ? '#22C55E' : '#F59E0B' }]}>
              OCR: {ocrStatus}
            </Text>
          </View>
          <TouchableOpacity onPress={() => { setPhotoUri(null); setOcrStatus('IDLE'); }}>
            <Text style={styles.retakeText}>Tirar outra foto</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Form Fields */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Dados do Abastecimento</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Litros *</Text>
          <TextInput style={styles.input} value={litros} onChangeText={setLitros} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94A3B8" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Valor/Litro (R$) *</Text>
          <TextInput style={styles.input} value={valorLitro} onChangeText={setValorLitro} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94A3B8" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total (R$) *</Text>
          <TextInput style={styles.input} value={total} onChangeText={setTotal} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94A3B8" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Posto</Text>
          <TextInput style={styles.input} value={posto} onChangeText={setPosto} placeholder="Nome do posto" placeholderTextColor="#94A3B8" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>KM Atual *</Text>
          <TextInput style={styles.input} value={km} onChangeText={setKm} keyboardType="number-pad" placeholder="0" placeholderTextColor="#94A3B8" />
        </View>

        <TouchableOpacity style={[styles.saveBtn, (saving || registrar.isPending) && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving || registrar.isPending}>
          {(saving || registrar.isPending) ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Confirmar e Salvar</Text>}
        </TouchableOpacity>
      </View>

      {/* Recent Fuel Entries */}
      <Text style={styles.sectionTitle}>Abastecimentos Recentes</Text>
      {(abastecimentos ?? []).length > 0 ? (
        (abastecimentos ?? []).slice(0, 10).map((ab: any) => (
          <View key={ab.id} style={styles.historyItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>{ab.posto || 'Posto'} - {ab.litros}L</Text>
              <Text style={styles.historySub}>{ab.data} | {ab.km?.toLocaleString('pt-BR')} km</Text>
            </View>
            <Text style={styles.historyValue}>R$ {ab.total?.toFixed(2)}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>Nenhum abastecimento registrado</Text>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F9FF', padding: 24 },
  permText: { fontSize: 16, color: '#1E293B', fontWeight: '600', marginBottom: 16 },
  permBtn: { backgroundColor: '#0EA5E9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 48 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 24 },
  cancelText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  captureCard: { alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 32, borderRadius: 16, borderWidth: 2, borderColor: '#BAE6FD', borderStyle: 'dashed' },
  captureTitle: { fontSize: 16, fontWeight: '700', color: '#0EA5E9', marginTop: 12 },
  captureDesc: { fontSize: 13, color: '#64748B', marginTop: 6, textAlign: 'center' },
  previewCard: { alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  previewImage: { width: '100%', height: 200, borderRadius: 10 },
  ocrStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  ocrText: { fontSize: 13, fontWeight: '600' },
  retakeText: { fontSize: 13, color: '#0EA5E9', fontWeight: '600', marginTop: 8 },
  formCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  formTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 14 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1E293B', backgroundColor: '#F8FAFC' },
  saveBtn: { backgroundColor: '#0EA5E9', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  historyTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  historySub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  historyValue: { fontSize: 14, fontWeight: '700', color: '#0EA5E9' },
  emptyText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8, marginBottom: 16 },
});
