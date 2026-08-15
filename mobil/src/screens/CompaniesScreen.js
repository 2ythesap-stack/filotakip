import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import api from '../api/client';
import Card from '../components/Card';

const typeMap = {
  mechanic: 'Tamirci', service: 'Servis', tire_shop: 'Lastikçi',
  insurance_agency: 'Sigorta Acentesi', casco_agency: 'Kasko Acentesi',
  tow_truck: 'Çekici', parts_supplier: 'Parça Tedarikçisi', other: 'Diğer',
};

export default function CompaniesScreen() {
  const [companies, setCompanies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const res = await api.get('/api/companies'); if (res.data.success) setCompanies(res.data.data); }
    catch (e) { console.log(e); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }) => (
    <Card>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.type}>{typeMap[item.companyType] || item.companyType}</Text>
      {item.phone && <Text style={styles.phone}>📞 {item.phone}</Text>}
      {item.authorizedPerson && <Text style={styles.person}>👤 {item.authorizedPerson}</Text>}
      {item.address && <Text style={styles.address}>📍 {item.address}</Text>}
    </Card>
  );

  return (
    <FlatList
      data={companies}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text style={styles.empty}>Firma bulunamadı</Text>}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontWeight: '700', color: '#007AFF' },
  type: { fontSize: 12, color: '#666', marginTop: 2, marginBottom: 6 },
  phone: { fontSize: 13, color: '#333', marginTop: 2 },
  person: { fontSize: 13, color: '#333', marginTop: 2 },
  address: { fontSize: 12, color: '#999', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 60, color: '#999', fontSize: 16 },
});
