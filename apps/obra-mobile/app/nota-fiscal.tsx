import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useObras, useUploadNota } from '@/src/hooks/use-obras';
import { useAppStore } from '@/src/stores/app-store';

type OcrStatus = 'IDLE' | 'PREVIEW' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';

interface OcrResult {
  fornecedor: string;
  cnpj: string;
  numero: string;
  dataEmissao: string;
  valorTotal: string;
  items: Array<{ descricao: string; quantidade: string; valorUnit: string; valorTotal: string }>;
}

export default function NotaFiscalScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>('IDLE');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const selectedObraId = useAppStore((s) => s.selectedObraId);
  const setSelectedObraId = useAppStore((s) => s.setSelectedObraId);
  const { data: obras } = useObras();
  const obraList = Array.isArray(obras) ? obras : [];

  const uploadMutation = useUploadNota(selectedObraId || '');

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        setPhotoUri(photo.uri);
        setShowCamera(false);
        setOcrStatus('PREVIEW');
      }
    } catch (err) {
      Alert.alert('Erro', 'Falha ao capturar foto');
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setOcrStatus('PREVIEW');
    }
  };

  const handleSendOcr = async () => {
    if (!photoUri || !selectedObraId) {
      Alert.alert('Atenção', 'Selecione uma obra antes de enviar');
      return;
    }
    setOcrStatus('PROCESSANDO');
    try {
      const result = await uploadMutation.mutateAsync(photoUri);
      setOcrResult({
        fornecedor: result?.fornecedor || '',
        cnpj: result?.cnpj || '',
        numero: result?.numero || '',
        dataEmissao: result?.dataEmissao || '',
        valorTotal: result?.valorTotal || '',
        items: result?.items || [],
      });
      setOcrStatus('CONCLUIDO');
    } catch {
      setOcrStatus('ERRO');
      Alert.alert('Erro', 'Falha ao processar nota fiscal');
    }
  };

  const handleConfirmSave = () => {
    Alert.alert('Sucesso', 'Nota fiscal salva com sucesso!');
    resetState();
  };

  const resetState = () => {
    setPhotoUri(null);
    setOcrStatus('IDLE');
    setOcrResult(null);
    setShowCamera(false);
  };

  const updateOcrField = (field: keyof OcrResult, value: string) => {
    if (ocrResult) {
      setOcrResult({ ...ocrResult, [field]: value });
    }
  };

  // Camera permission screen
  if (showCamera && !permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#F59E0B" />
          <Text style={styles.permissionTitle}>Permissão de Câmera</Text>
          <Text style={styles.permissionText}>
            Precisamos da câmera para fotografar notas fiscais
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Permitir Câmera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera view
  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraGuide}>
              <Text style={styles.cameraGuideText}>Posicione a nota fiscal dentro do quadro</Text>
            </View>
          </View>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cameraBackButton} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <View style={{ width: 48 }} />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Obra Selector */}
      <Text style={styles.sectionLabel}>Obra</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.obraSelector}>
        {obraList.map((obra: any) => (
          <TouchableOpacity
            key={obra.id}
            style={[
              styles.obraChip,
              selectedObraId === obra.id && styles.obraChipSelected,
            ]}
            onPress={() => setSelectedObraId(obra.id)}
          >
            <Text
              style={[
                styles.obraChipText,
                selectedObraId === obra.id && styles.obraChipTextSelected,
              ]}
              numberOfLines={1}
            >
              {obra.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Status Indicator */}
      {ocrStatus !== 'IDLE' && (
        <View style={styles.statusBar}>
          <View style={[styles.statusStep, ocrStatus !== 'IDLE' && styles.statusStepActive]}>
            <Ionicons name="camera" size={16} color={ocrStatus !== 'IDLE' ? '#F59E0B' : '#475569'} />
            <Text style={[styles.statusStepText, ocrStatus !== 'IDLE' && styles.statusStepTextActive]}>Captura</Text>
          </View>
          <View style={[styles.statusDivider, ocrStatus === 'PROCESSANDO' || ocrStatus === 'CONCLUIDO' ? styles.statusDividerActive : null]} />
          <View style={[styles.statusStep, (ocrStatus === 'PROCESSANDO' || ocrStatus === 'CONCLUIDO') && styles.statusStepActive]}>
            <Ionicons name="scan" size={16} color={ocrStatus === 'PROCESSANDO' || ocrStatus === 'CONCLUIDO' ? '#F59E0B' : '#475569'} />
            <Text style={[styles.statusStepText, (ocrStatus === 'PROCESSANDO' || ocrStatus === 'CONCLUIDO') && styles.statusStepTextActive]}>OCR</Text>
          </View>
          <View style={[styles.statusDivider, ocrStatus === 'CONCLUIDO' ? styles.statusDividerActive : null]} />
          <View style={[styles.statusStep, ocrStatus === 'CONCLUIDO' && styles.statusStepActive]}>
            <Ionicons name="checkmark-circle" size={16} color={ocrStatus === 'CONCLUIDO' ? '#22C55E' : '#475569'} />
            <Text style={[styles.statusStepText, ocrStatus === 'CONCLUIDO' && styles.statusStepTextActive]}>Concluído</Text>
          </View>
        </View>
      )}

      {/* Photo Preview */}
      {photoUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="contain" />
        </View>
      )}

      {/* Action Buttons - IDLE State */}
      {ocrStatus === 'IDLE' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowCamera(true)}>
            <Ionicons name="camera" size={24} color="#0F172A" />
            <Text style={styles.primaryButtonText}>Fotografar Nota Fiscal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
            <Ionicons name="images" size={24} color="#F59E0B" />
            <Text style={styles.secondaryButtonText}>Escolher da Galeria</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Preview Actions */}
      {ocrStatus === 'PREVIEW' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSendOcr}>
            <Ionicons name="scan" size={24} color="#0F172A" />
            <Text style={styles.primaryButtonText}>Enviar para OCR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetState}>
            <Ionicons name="refresh" size={24} color="#F59E0B" />
            <Text style={styles.secondaryButtonText}>Refazer Captura</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Processing State */}
      {ocrStatus === 'PROCESSANDO' && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.processingText}>Processando nota fiscal...</Text>
          <Text style={styles.processingSubtext}>Extraindo dados via OCR</Text>
        </View>
      )}

      {/* OCR Results - Editable */}
      {ocrStatus === 'CONCLUIDO' && ocrResult && (
        <View style={styles.ocrResultsContainer}>
          <Text style={styles.ocrResultsTitle}>Dados Extraídos</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Fornecedor</Text>
            <TextInput
              style={styles.fieldInput}
              value={ocrResult.fornecedor}
              onChangeText={(v) => updateOcrField('fornecedor', v)}
              placeholderTextColor="#475569"
              placeholder="Nome do fornecedor"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CNPJ</Text>
            <TextInput
              style={styles.fieldInput}
              value={ocrResult.cnpj}
              onChangeText={(v) => updateOcrField('cnpj', v)}
              placeholderTextColor="#475569"
              placeholder="00.000.000/0000-00"
            />
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Número NF</Text>
              <TextInput
                style={styles.fieldInput}
                value={ocrResult.numero}
                onChangeText={(v) => updateOcrField('numero', v)}
                placeholderTextColor="#475569"
                placeholder="000000"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Data Emissão</Text>
              <TextInput
                style={styles.fieldInput}
                value={ocrResult.dataEmissao}
                onChangeText={(v) => updateOcrField('dataEmissao', v)}
                placeholderTextColor="#475569"
                placeholder="DD/MM/AAAA"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Valor Total</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputHighlight]}
              value={ocrResult.valorTotal}
              onChangeText={(v) => updateOcrField('valorTotal', v)}
              placeholderTextColor="#475569"
              placeholder="R$ 0,00"
              keyboardType="numeric"
            />
          </View>

          {/* Items */}
          {ocrResult.items.length > 0 && (
            <View style={styles.itemsContainer}>
              <Text style={styles.itemsTitle}>Itens ({ocrResult.items.length})</Text>
              {ocrResult.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.descricao}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemQty}>Qtd: {item.quantidade}</Text>
                    <Text style={styles.itemValue}>R$ {item.valorTotal}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmSave}>
              <Ionicons name="checkmark-circle" size={24} color="#0F172A" />
              <Text style={styles.primaryButtonText}>Confirmar e Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetState}>
              <Text style={styles.secondaryButtonText}>Descartar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Error State */}
      {ocrStatus === 'ERRO' && (
        <View style={styles.processingContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={[styles.processingText, { color: '#EF4444' }]}>Erro no processamento</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetState}>
            <Text style={styles.secondaryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  obraSelector: {
    marginBottom: 20,
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
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  statusStep: {
    alignItems: 'center',
    gap: 4,
  },
  statusStepActive: {},
  statusStepText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  statusStepTextActive: {
    color: '#F59E0B',
  },
  statusDivider: {
    width: 40,
    height: 2,
    backgroundColor: '#334155',
    marginHorizontal: 8,
  },
  statusDividerActive: {
    backgroundColor: '#F59E0B',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraGuide: {
    width: '85%',
    aspectRatio: 1.5,
    borderWidth: 2,
    borderColor: '#F59E0B80',
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  cameraGuideText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  cameraBackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
  },
  previewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#1E293B',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '600',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  processingText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
  processingSubtext: {
    color: '#64748B',
    fontSize: 13,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '700',
  },
  permissionText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  ocrResultsContainer: {
    gap: 16,
  },
  ocrResultsTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: '#1E293B',
    color: '#F1F5F9',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fieldInputHighlight: {
    borderColor: '#F59E0B',
    fontSize: 18,
    fontWeight: '700',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  itemsContainer: {
    gap: 8,
  },
  itemsTitle: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  itemRow: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  itemDesc: {
    color: '#F1F5F9',
    fontSize: 13,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemQty: {
    color: '#64748B',
    fontSize: 12,
  },
  itemValue: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
});
