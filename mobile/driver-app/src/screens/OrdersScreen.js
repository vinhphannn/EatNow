import React, { useEffect, useState } from 'react';
import { View, RefreshControl, ScrollView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import driverApi from '../api/driverApi';
import OrderCard from '../components/OrderCard';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await driverApi.getActiveOrders();
      setOrders(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAccept = async (orderId) => {
    await driverApi.acceptOrder(orderId);
    load();
  };
  const onReject = async (orderId) => {
    await driverApi.rejectOrder(orderId);
    load();
  };
  const onComplete = async (orderId) => {
    await driverApi.completeOrder(orderId);
    load();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text variant="titleLarge">Đơn đang xử lý</Text>
        <Button onPress={() => navigation.navigate('Profile')}>Tài khoản</Button>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        {orders?.length === 0 ? (
          <Text>Không có đơn</Text>
        ) : (
          orders.map((o) => (
            <OrderCard
              key={o._id}
              order={o}
              onPress={() => navigation.navigate('OrderDetail', { orderId: o._id })}
              onAccept={() => onAccept(o._id)}
              onReject={() => onReject(o._id)}
              onComplete={() => onComplete(o._id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
