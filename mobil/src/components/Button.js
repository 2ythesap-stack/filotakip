import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function Button({ title, onPress, variant = 'primary', disabled }) {
  const bg = variant === 'primary' ? '#007AFF' : variant === 'danger' ? '#FF3B30' : '#34C759';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 14, borderRadius: 12, alignItems: 'center', marginVertical: 6 },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
