import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { signIn, signUp } from '../src/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { Alert.alert('Erro', 'Preencha email e senha'); return; }
    if (isSignUp && !name) { Alert.alert('Erro', 'Preencha o nome'); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp({ name, email, password });
      } else {
        await signIn({ email, password });
      }
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha na autenticacao');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logo}><Text style={styles.logoText}>F</Text></View>
          <Text style={styles.title}>FrotaLeve</Text>
          <Text style={styles.subtitle}>Compliance de Frotas</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>{isSignUp ? 'Criar Conta' : 'Entrar'}</Text>

          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor="#94A3B8" autoCapitalize="words" />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Sua senha" placeholderTextColor="#94A3B8" secureTextEntry />
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>{isSignUp ? 'Criar Conta' : 'Entrar'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.toggleText}>{isSignUp ? 'Ja tem conta? Entrar' : 'Criar conta'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  title: { fontSize: 28, fontWeight: '800', color: '#075985' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  form: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1E293B', backgroundColor: '#F8FAFC' },
  btn: { backgroundColor: '#0EA5E9', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  toggleBtn: { alignItems: 'center', marginTop: 16 },
  toggleText: { fontSize: 14, color: '#0EA5E9', fontWeight: '600' },
});
