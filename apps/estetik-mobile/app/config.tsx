import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../src/stores/app-store';
import { setApiUrl, clearAuthToken } from '../src/lib/api';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  rightComponent,
  destructive,
}: {
  icon: string;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  destructive?: boolean;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View
        style={[
          styles.settingsIcon,
          { backgroundColor: `${iconColor || '#2563EB'}15` },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={18}
          color={iconColor || '#2563EB'}
        />
      </View>
      <View style={styles.settingsInfo}>
        <Text
          style={[styles.settingsLabel, destructive && styles.destructiveText]}
        >
          {label}
        </Text>
        {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
      </View>
      {rightComponent ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        ) : null)}
    </Wrapper>
  );
}

export default function ConfigScreen() {
  const queryClient = useQueryClient();
  const {
    darkMode,
    setDarkMode,
    pushEnabled,
    setPushEnabled,
    apiUrl,
    setApiUrl: setStoreApiUrl,
  } = useAppStore();

  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(apiUrl);

  const handleSaveUrl = async () => {
    if (!urlInput.trim()) {
      Alert.alert('Erro', 'A URL da API não pode ser vazia.');
      return;
    }
    try {
      const cleanUrl = urlInput.trim().replace(/\/+$/, '');
      await setApiUrl(cleanUrl);
      setStoreApiUrl(cleanUrl);
      setEditingUrl(false);
      Alert.alert('Sucesso', 'URL da API atualizada com sucesso.');
      queryClient.invalidateQueries();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a URL.');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpar Cache',
      'Isso irá remover todos os dados em cache, incluindo rascunhos de checklists. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              queryClient.clear();
              Alert.alert('Sucesso', 'Cache limpo com sucesso.');
            } catch {
              Alert.alert('Erro', 'Não foi possível limpar o cache.');
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair? Você precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await clearAuthToken();
            await AsyncStorage.clear();
            queryClient.clear();
            useAppStore.getState().reset();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color="#2563EB" />
        </View>
        <Text style={styles.profileName}>EstetikComply</Text>
        <Text style={styles.profileEmail}>Compliance Management</Text>
      </View>

      {/* API Configuration */}
      <SettingsSection title="Conexão">
        {editingUrl ? (
          <View style={styles.urlEditContainer}>
            <TextInput
              style={styles.urlInput}
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://api.exemplo.com"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.urlActions}>
              <TouchableOpacity
                style={styles.urlCancelBtn}
                onPress={() => {
                  setEditingUrl(false);
                  setUrlInput(apiUrl);
                }}
              >
                <Text style={styles.urlCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.urlSaveBtn} onPress={handleSaveUrl}>
                <Text style={styles.urlSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <SettingsRow
            icon="server"
            label="URL da API"
            value={apiUrl}
            onPress={() => setEditingUrl(true)}
          />
        )}
      </SettingsSection>

      {/* Preferences */}
      <SettingsSection title="Preferências">
        <SettingsRow
          icon="notifications"
          iconColor="#EA580C"
          label="Notificações Push"
          rightComponent={
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={pushEnabled ? '#2563EB' : '#F1F5F9'}
            />
          }
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          icon="moon"
          iconColor="#6366F1"
          label="Modo Escuro"
          rightComponent={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={darkMode ? '#2563EB' : '#F1F5F9'}
            />
          }
        />
      </SettingsSection>

      {/* Data */}
      <SettingsSection title="Dados">
        <SettingsRow
          icon="trash"
          iconColor="#CA8A04"
          label="Limpar Cache"
          value="Rascunhos, cache de consultas"
          onPress={handleClearCache}
        />
      </SettingsSection>

      {/* About */}
      <SettingsSection title="Sobre">
        <SettingsRow
          icon="information-circle"
          label="Versão"
          value={`${APP_VERSION} (${BUILD_NUMBER})`}
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          icon="document-text"
          label="Termos de Uso"
          onPress={() => Linking.openURL('https://compliancecore.com/termos')}
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          icon="lock-closed"
          label="Política de Privacidade"
          onPress={() => Linking.openURL('https://compliancecore.com/privacidade')}
        />
      </SettingsSection>

      {/* Logout */}
      <SettingsSection title="">
        <SettingsRow
          icon="log-out"
          iconColor="#DC2626"
          label="Sair"
          onPress={handleLogout}
          destructive
        />
      </SettingsSection>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>ComplianceCore</Text>
        <Text style={styles.footerSubtext}>
          EstetikComply v{APP_VERSION}
        </Text>
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
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsInfo: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  settingsValue: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  destructiveText: {
    color: '#DC2626',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 64,
  },
  urlEditContainer: {
    padding: 16,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  urlActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  urlCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  urlCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  urlSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  urlSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
  },
});
