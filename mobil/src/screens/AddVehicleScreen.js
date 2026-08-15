import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import api from '../api/client';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

export default function AddVehicleScreen({ navigation }) {
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!plate || !brand || !model) {
      Alert.alert('Eksik Bilgi', 'Plaka, marka ve model zorunludur.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/api/vehicles', {
        plate: plate.toUpperCase().trim(),
        brand,
        model,
        modelYear: modelYear ? parseInt(modelYear) : undefined,
        vehicleType,
        fuelType,
        currentKm: currentKm ? parseInt(currentKm) : 0,
        status: 'active',
      });
      if (res.data.success) {
        Alert.alert('Başarılı', `Araç eklendi: ${res.data.data.plate}`);
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
      <Text style={styles.header}>➕ Yeni Araç Ekle</Text>
      <Card>
        <Input label="Plaka *" value={plate} onChangeText={setPlate} placeholder="35 DC 2468" />
        <Input label="Marka *" value={brand} onChangeText={setBrand} placeholder="Mercedes" />
        <Input label="Model *" value={model} onChangeText={setModel} placeholder="Actros" />
        <Input label="Model Yılı" value={modelYear} onChangeText={setModelYear} placeholder="2024" keyboardType="number-pad" />
        <Input label="Araç Tipi" value={vehicleType} onChangeText={setVehicleType} placeholder="Çekici" />
        <Input label="Yakıt Tipi" value={fuelType} onChangeText={setFuelType} placeholder="Dizel" />
        <Input label="Güncel KM" value={currentKm} onChangeText={setCurrentKm} placeholder="185420" keyboardType="number-pad" />
        <Button title={loading ? 'Kaydediliyor...' : '💾 Kaydet'} onPress={submit} disabled={loading} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: '800', margin: 16, marginBottom: 8 },
});
