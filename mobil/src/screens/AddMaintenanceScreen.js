import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import api from '../api/client';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

export default function AddMaintenanceScreen({ route, navigation }) {
  const { vehicleId, currentKm } = route.params || {};
  const [km, setKm] = useState(currentKm ? String(currentKm) : '');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!vehicleId) {
      Alert.alert('Hata', 'Araç ID eksik. Araç kartından bakım ekle butonuna basın.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/api/maintenance', {
        vehicleId,
        maintenanceDate: new Date().toISOString().split('T')[0],
        km: parseInt(km),
        maintenanceType,
        description,
        serviceId: parseInt(serviceId),
        totalAmount: parseFloat(totalAmount),
      });
      if (res.data.success) {
        Alert.alert('Başarılı', 'Bakım kaydedildi! Gider otomatik oluşturuldu.');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Hata', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <Text style={styles.header}>🔧 Bakım Kaydı</Text>
      <Card>
        <Text style={styles.info}>Araç ID: {vehicleId}</Text>
        <Input label="KM *" value={km} onChangeText={setKm} placeholder="185500" keyboardType="number-pad" />
        <Text style={styles.hint}>💡 Son KM'den küçük değer giremezsin</Text>
        <Input label="Bakım Tipi *" value={maintenanceType} onChangeText={setMaintenanceType} placeholder="Periyodik Bakım" />
        <Input label="Açıklama *" value={description} onChangeText={setDescription} placeholder="Yağ ve filtre değişimi" />
        <Input label="Servis ID *" value={serviceId} onChangeText={setServiceId} placeholder="1" keyboardType="number-pad" />
        <Input label="Toplam Tutar (TL) *" value={totalAmount} onChangeText={setTotalAmount} placeholder="12500" keyboardType="decimal-pad" />
        <Button title={loading ? 'Kaydediliyor...' : '💾 Kaydet'} onPress={submit} disabled={loading} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: '800', margin: 16, marginBottom: 8 },
  info: { fontSize: 13, color: '#666', marginBottom: 8 },
  hint: { fontSize: 12, color: '#007AFF', marginBottom: 8 },
});
