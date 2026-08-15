import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import api from '../api/client';
import Card from '../components/Card';

const statusConfig = {
  pending: { label: 'Bekliyor', color: '#FF9500' },
  in_progress: { label: 'Devam Ediyor', color: '#007AFF' },
  on_hold: { label: 'Beklemede', color: '#FF9500' },
  completed: { label: 'Tamamlandı', color: '#34C759' },
  delayed: { label: 'Gecikti', color: '#FF3B30' },
  cancelled: { label: 'İptal', color: '#999' },
};

const priorityConfig = {
  low: { label: 'Düşük', bg: '#F0F0F0', color: '#666' },
  medium: { label: 'Orta', bg: '#FFF4E5', color: '#FF9500' },
  high: { label: 'Yüksek', bg: '#FFE5E5', color: '#FF3B30' },
  urgent: { label: 'Acil', bg: '#FFE5E5', color: '#C00' },
};

const FILTERS = ['all', 'pending', 'in_progress', 'delayed', 'completed'];

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/tasks');
      if (res.data.success) setTasks(res.data.data);
    } catch (e) { console.log(e); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const markCompleted = async (id) => {
    try {
      await api.put(`/api/tasks/${id}/status`, { status: 'completed', completedDate: new Date().toISOString() });
      load();
    } catch (e) { console.log(e); }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const renderItem = ({ item }) => {
    const s = statusConfig[item.status] || statusConfig.pending;
    const p = priorityConfig[item.priority] || priorityConfig.medium;
    return (
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: p.bg }]}>
            <Text style={[styles.badgeText, { color: p.color }]}>{p.label}</Text>
          </View>
        </View>
        {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
        <View style={styles.metaRow}>
          {item.vehicle && <Text style={styles.meta}>🚗 {item.vehicle.plate}</Text>}
          {item.dueDate && <Text style={styles.meta}>📅 {new Date(item.dueDate).toLocaleDateString('tr-TR')}</Text>}
        </View>
        <View style={styles.footerRow}>
          <View style={[styles.statusPill, { backgroundColor: s.color + '20' }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
          {item.status !== 'completed' && (
            <TouchableOpacity onPress={() => markCompleted(item.id)} style={styles.completeBtn}>
              <Text style={styles.completeBtnText}>✓ Tamamla</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f === 'all' ? 'Tümü' : statusConfig[f]?.label || f}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>İş bulunamadı</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { paddingVertical: 10, backgroundColor: '#fff' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterChipTextActive: { color: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  desc: { fontSize: 13, color: '#666', marginTop: 6 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  meta: { fontSize: 12, color: '#999', marginRight: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  completeBtn: { backgroundColor: '#34C759', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  completeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 60, color: '#999', fontSize: 16 },
});
