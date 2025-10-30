import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

export default function OrderCard({ order, onAccept, onReject, onComplete, onPress }) {
  const status = order?.status || 'pending';
  return (
    <Card style={{ marginBottom: 12 }} onPress={onPress}>
      <Card.Title title={`Đơn #${order?.orderCode || order?._id?.slice(-6)}`} subtitle={status} />
      <Card.Content>
        <Text>{order?.restaurant?.name || 'Nhà hàng'}</Text>
        <Text>Tổng: {order?.finalTotal || order?.totalAmount}₫</Text>
      </Card.Content>
      <Card.Actions>
        {status === 'assigned' && (
          <>
            <Button onPress={onReject}>Từ chối</Button>
            <Button mode="contained" onPress={onAccept}>Nhận đơn</Button>
          </>
        )}
        {status === 'picked_up' && (
          <Button mode="contained" onPress={onComplete}>Hoàn thành</Button>
        )}
      </Card.Actions>
    </Card>
  );
}
