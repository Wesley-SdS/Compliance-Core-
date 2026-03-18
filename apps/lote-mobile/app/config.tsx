import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Switch, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/stores/app-store';
import { signOut, getSession } from '../src/lib/auth';
import { getApiUrl, setApiUrl } from '../src/lib/api';

export default function ConfigScreen() {
  const router = useRouter();
  const darkMode = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const pushEnabled = useAppStore((s) => s.pushEnabled);
  const setPushEnabled = useAppStore((s) => s.setPushEnabled);
  const storeSetApiUrl = useAppStore((s) => s.setApiUrl);
  const reset = useAppStore((s) => s.reset);

  const [apiUrlValue, setApiUrlValue] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userCpf, setUserCpf] = useState('');

  useEffect(() => {
    getApiUrl().then(setApiUrlValue);
    getSession().then((session) => {
      if (session?.user) {
        setUserName(session.user.name ?? '');
        setUserEmail(session.user.email ?? '');
        setUserCpf((session.user as any).cpf ?? '');
      }
    });
  }, []);

  const handleSaveUrl = async () => {
    if (!apiUrlValue.trim()) {
      Alert.alert('Erro', 'Informe a URL da API');
      return;
    }
    setSavingUrl(true);
    try {
      await setApiUrl(apiUrlValue.trim());
      storeSetApiUrl(apiUrlValue.trim());
      Alert.alert('Sucesso', 'URL da API atualizada');
    } catch {
      Alert.alert('Erro', 'Falha ao salvar URL');
    }
    setSavingUrl(false);
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          reset();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. User Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meus Dados</Text>
        <View style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={28} color="#F43F5E" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName || 'Comprador'}</Text>
            <Text style={styles.userEmail}>{userEmail || '-'}</Text>
            {userCpf ? <Text style={styles.userCpf}>CPF: {userCpf}</Text> : null}
          </View>
        </View>
      </View>

      {/* 2. Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>
        <View style={styles.prefRow}>
          <View style={styles.prefLeft}>
            <Ionicons name="notifications" size={20} color="#64748B" />
            <Text style={styles.prefLabel}>Notificacoes Push</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#E2E8F0', true: '#FDA4AF' }}
            thumbColor={pushEnabled ? '#F43F5E' : '#94A3B8'}
          />
        </View>
        <View style={[styles.prefRow, { borderBottomWidth: 0 }]}>
          <View style={styles.prefLeft}>
            <Ionicons name="moon" size={20} color="#64748B" />
            <Text style={styles.prefLabel}>Modo Escuro</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#E2E8F0', true: '#FDA4AF' }}
            thumbColor={darkMode ? '#F43F5E' : '#94A3B8'}
          />
        </View>
      </View>

      {/* 3. API URL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>URL da API</Text>
        <View style={styles.apiRow}>
          <TextInput
            style={styles.apiInput}
            placeholder="http://localhost:3006"
            placeholderTextColor="#94A3B8"
            value={apiUrlValue}
            onChangeText={setApiUrlValue}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.apiSaveBtn, savingUrl && { opacity: 0.7 }]}
            onPress={handleSaveUrl}
            disabled={savingUrl}
          >
            {savingUrl ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.apiSaveBtnText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={22} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </TouchableOpacity>

      {/* 5. App Version */}
      <Text style={styles.version}>LotePro v0.1.0 | ComplianceCore</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1F2' },
  content: { padding: 16, paddingBottom: 48 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFE4E6', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  userEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  userCpf: { fontSize: 13, color: '#64748B', marginTop: 2 },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  prefLeft: { flexDirection: 'row', alignItems: 'center' },
  prefLabel: {
    fontSize: 15,
    color: '#1E293B',
    marginLeft: 12,
    fontWeight: '500',
  },
  apiRow: { flexDirection: 'row', gap: 8 },
  apiInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  apiSaveBtn: {
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apiSaveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 24,
  },
});
