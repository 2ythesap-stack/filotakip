import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import api from '../api/client';
import Card from '../components/Card';

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/dashboard/summary');
      if (res.data.success) setData(res.data.data);
    } catch (e) { console.log(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!data) return <Text style={styles.loading}>Yükleniyor...</Text>;

  const stats = [
    { label: 'Toplam Araç', value: data.totalVehicles, color: '#007AFF' },
    { label: 'Aktif', value: data.activeVehicles, color: '#34C759' },
    { label: 'Serviste', value: data.inServiceVehicles, color: '#FF9500' },
    { label: 'Bekleyen İş', value: data.pendingTasks, color: '#5856D6' },
    { label: 'Geciken', value: data.delayedTasks, color: '#FF3B30' },
    { label: 'Bu Ay Gider', value: data.monthTotalExpense.toLocaleString('tr-TR') + ' ₺', color: '#AF52DE' },
  ];

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.header}>📊 Dashboard</Text>
      <View style={styles.grid}>
        {stats.map((s, i) => (
          <Card key={i} style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: s.color }]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { textAlign: 'center', marginTop: 100, fontSize: 16, color: '#999' },
  header: { fontSize: 24, fontWeight: '700', margin: 16, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  statCard: { width: '46%', margin: '2%', padding: 16 },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666' },
});
