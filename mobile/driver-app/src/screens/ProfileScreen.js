import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="titleLarge">Tài khoản</Text>
      <Text>Email: {user?.email || 'N/A'}</Text>
      <Text>Role: driver</Text>
      <Text>API: {apiUrl}</Text>
      <View style={{ height: 12 }} />
      <Button mode="contained" onPress={async () => { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }}>Đăng xuất</Button>
    </View>
  );
}
