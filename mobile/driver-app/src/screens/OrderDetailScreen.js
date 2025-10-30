import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import driverApi from '../api/driverApi';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);

  const load = async () => {
    if (!orderId) return;
    const data = await driverApi.getOrderById(orderId);
    setOrder(data?.order || data);
  };

  useEffect(() => {
    load();
  }, [orderId]);

  if (!order) return <View style={{ flex: 1, padding: 16 }}><Text>Đang tải...</Text></View>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="titleLarge">Đơn #{order?.orderCode || order?._id?.slice(-6)}</Text>
      <Text>Nhà hàng: {order?.restaurant?.name || 'N/A'}</Text>
      <Text>Khách: {order?.recipientName || order?.customerName || 'N/A'}</Text>
      <Text>Tổng: {order?.finalTotal || order?.totalAmount}₫</Text>
      <View style={{ height: 12 }} />
      <Button mode="contained" onPress={async () => { await driverApi.updateLocation({ latitude: 10.77, longitude: 106.7 }); }}>Cập nhật vị trí</Button>
      <View style={{ height: 8 }} />
      <Button onPress={() => navigation.goBack()}>Quay lại</Button>
    </View>
  );
}
