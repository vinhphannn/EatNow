import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('driver@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigation.replace('Orders');
    } catch (e) {
      setError('Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <Text variant="titleLarge" style={{ marginBottom: 12 }}>Đăng nhập tài xế</Text>
      <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={{ marginBottom: 8 }} />
      <TextInput label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 16 }} />
      {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}
      <Button mode="contained" onPress={onSubmit} loading={loading}>Đăng nhập</Button>
    </View>
  );
}
