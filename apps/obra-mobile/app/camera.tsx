import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useObras, useObraEtapas, useUploadFoto } from '@/src/hooks/use-obras';
import { useAppStore } from '@/src/stores/app-store';

interface GpsCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<GpsCoords | null>(null);
  const [selectedEtapaId, setSelectedEtapaId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const selectedObraId = useAppStore((s) => s.selectedObraId);
  const setSelectedObraId = useAppStore((s) => s.setSelectedObraId);
  const { data: obras } = useObras();
  const { data: etapas } = useObraEtapas(selectedObraId);
  const uploadMutation = useUploadFoto(selectedObraId || '');

  const obraList = Array.isArray(obras) ? obras : [];
  const etapaList = Array.isArray(etapas) ? etapas : [];

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Precisamos da localização para geolocalizar as fotos.');
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setGpsCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível obter a localização');
    }
    setLocationLoading(false);
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        setPhotoUri(photo.uri);
        setShowCamera(false);
        // Refresh GPS on capture
        fetchLocation();
      }
    } catch {
      Alert.alert('Erro', 'Falha ao capturar foto');
    }
  };

  const handleUpload = async () => {
    if (!photoUri) {
      Alert.alert('Atenção', 'Capture uma foto primeiro');
      return;
    }
    if (!selectedObraId) {
      Alert.alert('Atenção', 'Selecione uma obra');
      return;
    }
    if (!selectedEtapaId) {
      Alert.alert('Atenção', 'Selecione uma etapa');
      return;
    }

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync({
        fileUri: photoUri,
        etapaId: selectedEtapaId,
        descricao,
        latitude: gpsCoords?.latitude,
        longitude: gpsCoords?.longitude,
      });
      Alert.alert('Sucesso', 'Foto registrada com sucesso!');
      resetState();
    } catch {
      Alert.alert('Erro', 'Falha ao enviar foto');
    }
    setIsUploading(false);
  };

  const resetState = () => {
    setPhotoUri(null);
    setDescricao('');
    setShowCamera(false);
  };

  // Camera permission
  if (showCamera && !permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredContent}>
          <Ionicons name="camera-outline" size={64} color="#F59E0B" />
          <Text style={styles.permissionTitle}>Permissão de Câmera</Text>
          <Text style={styles.permissionText}>
            Precisamos da câmera para registrar evidências fotográficas da obra
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
          {/* GPS Overlay */}
          {gpsCoords && (
            <View style={styles.gpsOverlay}>
              <Ionicons name="location" size={14} color="#22C55E" />
              <Text style={styles.gpsOverlayText}>
                {gpsCoords.latitude.toFixed(6)}, {gpsCoords.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cameraBackButton} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraBackButton} onPress={fetchLocation}>
              <Ionicons name="location" size={24} color={gpsCoords ? '#22C55E' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Obra Selector */}
      <Text style={styles.sectionLabel}>Obra</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
        {obraList.map((obra: any) => (
          <TouchableOpacity
            key={obra.id}
            style={[styles.chip, selectedObraId === obra.id && styles.chipSelected]}
            onPress={() => setSelectedObraId(obra.id)}
          >
            <Text
              style={[styles.chipText, selectedObraId === obra.id && styles.chipTextSelected]}
              numberOfLines={1}
            >
              {obra.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Etapa Selector */}
      <Text style={styles.sectionLabel}>Etapa</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
        {etapaList.map((etapa: any) => (
          <TouchableOpacity
            key={etapa.id}
            style={[styles.chip, selectedEtapaId === etapa.id && styles.chipSelected]}
            onPress={() => setSelectedEtapaId(etapa.id)}
          >
            <Text
              style={[styles.chipText, selectedEtapaId === etapa.id && styles.chipTextSelected]}
              numberOfLines={1}
            >
              {etapa.nome}
            </Text>
          </TouchableOpacity>
        ))}
        {etapaList.length === 0 && (
          <Text style={styles.emptyChipText}>
            {selectedObraId ? 'Nenhuma etapa encontrada' : 'Selecione uma obra primeiro'}
          </Text>
        )}
      </ScrollView>

      {/* Photo Preview with GPS Overlay */}
      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
          {gpsCoords && (
            <View style={styles.previewGpsOverlay}>
              <Ionicons name="location" size={14} color="#22C55E" />
              <Text style={styles.previewGpsText}>
                Lat: {gpsCoords.latitude.toFixed(6)}  Lng: {gpsCoords.longitude.toFixed(6)}
              </Text>
              {gpsCoords.accuracy !== null && (
                <Text style={styles.previewGpsAccuracy}>
                  Precisão: ~{Math.round(gpsCoords.accuracy)}m
                </Text>
              )}
            </View>
          )}
          <TouchableOpacity style={styles.retakeButton} onPress={() => setShowCamera(true)}>
            <Ionicons name="camera" size={16} color="#F59E0B" />
            <Text style={styles.retakeButtonText}>Refazer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.captureArea} onPress={() => setShowCamera(true)}>
          <Ionicons name="camera-outline" size={48} color="#475569" />
          <Text style={styles.captureAreaText}>Toque para capturar foto</Text>
          {gpsCoords && (
            <View style={styles.gpsIndicator}>
              <Ionicons name="location" size={12} color="#22C55E" />
              <Text style={styles.gpsIndicatorText}>GPS ativo</Text>
            </View>
          )}
          {locationLoading && (
            <View style={styles.gpsIndicator}>
              <ActivityIndicator size="small" color="#F59E0B" />
              <Text style={styles.gpsIndicatorText}>Obtendo localização...</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Description */}
      <Text style={styles.sectionLabel}>Descrição (opcional)</Text>
      <TextInput
        style={styles.textArea}
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Descreva o que a foto registra..."
        placeholderTextColor="#475569"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.primaryButton, (!photoUri || isUploading) && styles.buttonDisabled]}
        onPress={handleUpload}
        disabled={!photoUri || isUploading}
      >
        {isUploading ? (
          <>
            <ActivityIndicator color="#0F172A" />
            <Text style={styles.primaryButtonText}>Enviando...</Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload" size={24} color="#0F172A" />
            <Text style={styles.primaryButtonText}>Registrar Foto</Text>
          </>
        )}
      </TouchableOpacity>
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
  centeredContent: {
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
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  chipContainer: {
    marginBottom: 4,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#F59E0B20',
    borderColor: '#F59E0B',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#F59E0B',
  },
  emptyChipText: {
    color: '#475569',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  camera: {
    flex: 1,
  },
  gpsOverlay: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  gpsOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  captureArea: {
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  captureAreaText: {
    color: '#64748B',
    fontSize: 14,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  gpsIndicatorText: {
    color: '#64748B',
    fontSize: 12,
  },
  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#1E293B',
  },
  previewGpsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewGpsText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  previewGpsAccuracy: {
    color: '#64748B',
    fontSize: 10,
  },
  retakeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  retakeButtonText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#1E293B',
    color: '#F1F5F9',
    fontSize: 15,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 80,
    marginBottom: 20,
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
  buttonDisabled: {
    opacity: 0.5,
  },
});
