import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from '../api/client';
import { AuthContext } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

export default function LoginScreen() {
  const { setUser } = useContext(AuthContext);
  const [email, setEmail] = useState('admin@filo.com');
  const [password, setPassword] = useState('admin123');
  const [baseUrl, setBaseUrl] = useState(BASE_URL);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      // Geçici olarak baseURL'i güncelle
      api.defaults.baseURL = baseUrl;
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(res.data.data));
        setUser(res.data.data);
      } else {
        Alert.alert('Hata', res.data.message || 'Giriş başarısız');
      }
    } catch (err) {
      Alert.alert('Bağlantı Hatası', err.message + '\n\nIP adresini doğru girdiğinden emin ol. Bilgisayarın ve telefonun aynı Wi-Fi ağında olmalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🚛 Filo Yönetim</Text>
        <Text style={styles.subtitle}>Mobil Uygulama</Text>

        <Card>
          <Text style={styles.hint}>💡 Bilgisayarının IP adresini gir\n(Örn: http://192.168.1.105:3000)</Text>
          <Input label="API URL" value={baseUrl} onChangeText={setBaseUrl} placeholder="http://192.168.1.105:3000" />
          <Input label="E-posta" value={email} onChangeText={setEmail} />
          <Input label="Şifre" value={password} onChangeText={setPassword} secureTextEntry />
          <Button title={loading ? 'Giriş yapılıyor...' : '🔐 Giriş Yap'} onPress={login} disabled={loading} />
        </Card>

        <Text style={styles.footer}>Backend çalışıyor mu kontrol et:
{baseUrl}/health</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  hint: { fontSize: 12, color: '#007AFF', marginBottom: 12, lineHeight: 18 },
  footer: { textAlign: 'center', color: '#999', marginTop: 20, fontSize: 12 },
});
