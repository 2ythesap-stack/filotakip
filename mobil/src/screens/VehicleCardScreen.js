import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';

export default function VehicleCardScreen({ route, navigation }) {
  const { id, plate } = route.params;
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/api/vehicles/${id}/card`).then(res => {
      if (res.data.success) setData(res.data.data);
    });
  }, [id]);

  if (!data) return <Text style={styles.loading}>Yükleniyor...</Text>;

  const f = data.financials || {};

  return (
    <ScrollView>
      <Text style={styles.header}>🚗 {plate}</Text>

      <Card>
        <Text style={styles.sectionTitle}>📊 Finansal Özet</Text>
        <View style={styles.finRow}><Text>Toplam Gider:</Text><Text style={styles.finValue}>{f.totalExpense?.toLocaleString('tr-TR')} ₺</Text></View>
        <View style={styles.finRow}><Text>Bu Yıl:</Text><Text style={styles.finValue}>{f.yearExpense?.toLocaleString('tr-TR')} ₺</Text></View>
        <View style={styles.finRow}><Text>Bu Ay:</Text><Text style={styles.finValue}>{f.monthExpense?.toLocaleString('tr-TR')} ₺</Text></View>
        <View style={styles.finRow}><Text>Bakım:</Text><Text style={styles.finValue}>{f.maintenanceCost?.toLocaleString('tr-TR')} ₺</Text></View>
        <View style={styles.finRow}><Text>Tamir:</Text><Text style={styles.finValue}>{f.repairCost?.toLocaleString('tr-TR')} ₺</Text></View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>🔧 Son Bakımlar ({data.maintenances?.length || 0})</Text>
        {data.maintenances?.slice(0, 3).map(m => (
          <View key={m.id} style={styles.item}>
            <Text style={styles.itemTitle}>{m.maintenanceType}</Text>
            <Text style={styles.itemDate}>{new Date(m.maintenanceDate).toLocaleDateString('tr-TR')} - {m.totalAmount?.toLocaleString('tr-TR')} ₺</Text>
          </View>
        )) || <Text style={styles.empty}>Bakım kaydı yok</Text>}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>🛞 Lastikler ({data.tires?.length || 0})</Text>
        {data.tires?.map(t => (
          <View key={t.id} style={styles.item}>
            <Text style={styles.itemTitle}>{t.brand} {t.model}</Text>
            <Text style={styles.itemDate}>{t.size} | DOT: {t.dotInfo || '-'} | Diş: {t.treadDepth}mm</Text>
          </View>
        )) || <Text style={styles.empty}>Lastik kaydı yok</Text>}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>📋 Bekleyen İşler ({data.tasks?.length || 0})</Text>
        {data.tasks?.map(t => (
          <View key={t.id} style={styles.item}>
            <Text style={styles.itemTitle}>{t.title}</Text>
            <Text style={styles.itemDate}>Son tarih: {new Date(t.dueDate).toLocaleDateString('tr-TR')}</Text>
          </View>
        )) || <Text style={styles.empty}>Bekleyen iş yok</Text>}
      </Card>

      <View style={{ padding: 16 }}>
        <Button title="🔧 Bakım Ekle" onPress={() => navigation.navigate('AddMaintenance', { vehicleId: id, currentKm: data.currentKm })} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { textAlign: 'center', marginTop: 100, fontSize: 16, color: '#999' },
  header: { fontSize: 22, fontWeight: '800', margin: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#333' },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  finValue: { fontWeight: '700', color: '#007AFF' },
  item: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemTitle: { fontSize: 14, fontWeight: '600' },
  itemDate: { fontSize: 12, color: '#666', marginTop: 2 },
  empty: { color: '#999', fontStyle: 'italic', marginTop: 4 },
});
