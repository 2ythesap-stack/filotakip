import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import api from '../api/client';
import Card from '../components/Card';

const statusMap = {
  active: { text: 'Aktif', color: '#34C759' },
  in_service: { text: 'Serviste', color: '#FF9500' },
  out_of_use: { text: 'Kullanım Dışı', color: '#999' },
  sold: { text: 'Satıldı', color: '#666' },
};

export default function VehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/vehicles');
      if (res.data.success) setVehicles(res.data.data);
    } catch (e) { console.log(e); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const unsub = navigation.addListener('focus', load); return unsub; }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }) => {
    const s = statusMap[item.status] || statusMap.out_of_use;
    return (
      <TouchableOpacity onPress={() => navigation.navigate('VehicleCard', { id: item.id, plate: item.plate })}>
        <Card>
          <View style={styles.row}>
            <View>
              <Text style={styles.plate}>{item.plate}</Text>
              <Text style={styles.model}>{item.brand} {item.model} ({item.modelYear || '-'})</Text>
              <Text style={styles.km}>🛣️ {item.currentKm?.toLocaleString('tr-TR')} km</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: s.color + '20' }]}>
              <Text style={[styles.badgeText, { color: s.color }]}>{s.text}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddVehicle')}>
        <Text style={styles.fabText}>➕</Text>
      </TouchableOpacity>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.empty}>Araç bulunamadı</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plate: { fontSize: 18, fontWeight: '800', color: '#007AFF' },
  model: { fontSize: 14, color: '#333', marginTop: 2 },
  km: { fontSize: 13, color: '#666', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#007AFF', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  fabText: { fontSize: 24, color: '#fff' },
  empty: { textAlign: 'center', marginTop: 60, color: '#999', fontSize: 16 },
});
