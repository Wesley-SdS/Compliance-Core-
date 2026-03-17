import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadFile } from '../src/lib/api';

type DocumentCategory =
  | 'alvara'
  | 'licenca_sanitaria'
  | 'certificado_anvisa'
  | 'contrato_social'
  | 'receituario'
  | 'prontuario'
  | 'laudo_tecnico'
  | 'outros';

const CATEGORIES: { value: DocumentCategory; label: string; icon: string }[] = [
  { value: 'alvara', label: 'Alvará', icon: 'document' },
  { value: 'licenca_sanitaria', label: 'Licença Sanitária', icon: 'medical' },
  { value: 'certificado_anvisa', label: 'Certificado ANVISA', icon: 'shield-checkmark' },
  { value: 'contrato_social', label: 'Contrato Social', icon: 'briefcase' },
  { value: 'receituario', label: 'Receituário', icon: 'document-text' },
  { value: 'prontuario', label: 'Prontuário', icon: 'person' },
  { value: 'laudo_tecnico', label: 'Laudo Técnico', icon: 'clipboard' },
  { value: 'outros', label: 'Outros', icon: 'ellipsis-horizontal' },
];

function PermissionRequest({ onRequest }: { onRequest: () => void }) {
  return (
    <View style={styles.permissionContainer}>
      <Ionicons name="camera-outline" size={64} color="#CBD5E1" />
      <Text style={styles.permissionTitle}>Acesso à Câmera</Text>
      <Text style={styles.permissionText}>
        Precisamos acessar sua câmera para fotografar documentos de compliance.
      </Text>
      <TouchableOpacity style={styles.permissionBtn} onPress={onRequest}>
        <Ionicons name="camera" size={20} color="#FFFFFF" />
        <Text style={styles.permissionBtnText}>Permitir Acesso</Text>
      </TouchableOpacity>
    </View>
  );
}

function CategorySelector({
  selected,
  onSelect,
}: {
  selected: DocumentCategory | null;
  onSelect: (cat: DocumentCategory) => void;
}) {
  return (
    <View style={styles.categoryGrid}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.value}
          style={[
            styles.categoryItem,
            selected === cat.value && styles.categoryItemActive,
          ]}
          onPress={() => onSelect(cat.value)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.categoryIcon,
              {
                backgroundColor: selected === cat.value ? '#2563EB' : '#F1F5F9',
              },
            ]}
          >
            <Ionicons
              name={cat.icon as any}
              size={20}
              color={selected === cat.value ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.categoryLabel,
              selected === cat.value && styles.categoryLabelActive,
            ]}
            numberOfLines={2}
          >
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });
      if (photo) {
        setCapturedUri(photo.uri);
        setShowCamera(false);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível capturar a foto. Tente novamente.');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setCapturedUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!capturedUri) {
      Alert.alert('Erro', 'Nenhuma foto selecionada.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Erro', 'Selecione a categoria do documento.');
      return;
    }

    setUploading(true);
    try {
      await uploadFile('/documents/upload', capturedUri, {
        category: selectedCategory,
      });
      Alert.alert('Sucesso', 'Documento enviado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            setCapturedUri(null);
            setSelectedCategory(null);
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Erro no Envio',
        'Não foi possível enviar o documento. Verifique sua conexão e tente novamente.',
      );
    } finally {
      setUploading(false);
    }
  };

  const resetCapture = () => {
    setCapturedUri(null);
    setSelectedCategory(null);
  };

  // Camera permission not granted yet
  if (!permission?.granted && !showCamera) {
    if (capturedUri) {
      // Show preview if we have a photo from gallery
    } else {
      // Show initial screen
      return (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.initialContent}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Ionicons name="camera" size={48} color="#2563EB" />
            </View>
            <Text style={styles.heroTitle}>Captura de Documentos</Text>
            <Text style={styles.heroSubtitle}>
              Fotografe ou selecione documentos para manter seu compliance atualizado
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={async () => {
                const { granted } = await requestPermission();
                if (granted) setShowCamera(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="camera" size={28} color="#2563EB" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Tirar Foto</Text>
                <Text style={styles.optionDesc}>
                  Use a câmera para fotografar o documento
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="images" size={28} color="#16A34A" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Galeria</Text>
                <Text style={styles.optionDesc}>
                  Selecione uma foto da galeria
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Dicas para uma boa foto</Text>
            <View style={styles.tipRow}>
              <Ionicons name="sunny-outline" size={18} color="#CA8A04" />
              <Text style={styles.tipText}>Garanta boa iluminação</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="scan-outline" size={18} color="#CA8A04" />
              <Text style={styles.tipText}>Enquadre todo o documento</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="hand-left-outline" size={18} color="#CA8A04" />
              <Text style={styles.tipText}>Mantenha o aparelho firme</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="resize-outline" size={18} color="#CA8A04" />
              <Text style={styles.tipText}>Evite sombras e reflexos</Text>
            </View>
          </View>
        </ScrollView>
      );
    }
  }

  // Camera view
  if (showCamera && permission?.granted) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          {/* Document frame overlay */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.documentFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <Text style={styles.frameText}>Enquadre o documento aqui</Text>
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom} />
          </View>
        </CameraView>

        {/* Camera controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => setShowCamera(false)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => {
              setShowCamera(false);
              pickImage();
            }}
          >
            <Ionicons name="images" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Preview and upload
  if (capturedUri) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.previewContent}>
        {/* Preview */}
        <View style={styles.previewSection}>
          <Image source={{ uri: capturedUri }} style={styles.previewImage} />
          <TouchableOpacity style={styles.retakeBtn} onPress={resetCapture}>
            <Ionicons name="refresh" size={18} color="#2563EB" />
            <Text style={styles.retakeBtnText}>Tirar Outra</Text>
          </TouchableOpacity>
        </View>

        {/* Category Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Categoria do Documento</Text>
          <CategorySelector
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>

        {/* Upload Button */}
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={[
              styles.uploadBtn,
              (!selectedCategory || uploading) && styles.uploadBtnDisabled,
            ]}
            onPress={handleUpload}
            disabled={!selectedCategory || uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={22} color="#FFFFFF" />
                <Text style={styles.uploadBtnText}>Enviar Documento</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Fallback — should not normally reach here
  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  initialContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 3,
  },
  optionDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  tipsSection: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#78350F',
  },
  // Permission
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F8FAFC',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    width: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  documentFrame: {
    flex: 1,
    aspectRatio: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
    backgroundColor: '#000000',
  },
  cameraBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  // Preview
  previewContent: {
    paddingBottom: 40,
  },
  previewSection: {
    backgroundColor: '#000000',
    alignItems: 'center',
    paddingBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 320,
    resizeMode: 'contain',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  retakeBtnText: {
    fontSize: 14,
    color: '#93C5FD',
    fontWeight: '500',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  categoryItemActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  categoryLabelActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  uploadSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
  },
  uploadBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  uploadBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
