import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';        // ✅ correct import

const OrderDetailScreen = ({ navigation, route }) => {
  const order = route.params?.order;
  const [loading, setLoading] = useState(false);

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const groupStatus = order.groupStatus || order.packingStatus || 'packing';
  const groupIndex = order.groupIndex;
  const orderId = order.fullOrderId || order._id;
  const isReady = groupStatus === 'ready_for_pickup';

  const handleStatusUpdate = async (newStatus) => {
    if (groupIndex === undefined || groupIndex === null) {
      Alert.alert('Error', 'Could not identify the group for this order.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/orders/group-status', {
        orderId,
        groupIndex,
        status: newStatus,
      });
      Alert.alert('Success', `Status updated to ${newStatus.replace(/_/g, ' ')}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order._id?.slice(-6)}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status Badge */}
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status:</Text>
        <View style={[styles.statusBadge, isReady ? styles.readyBadge : styles.packingBadge]}>
          <Text style={[styles.statusText, isReady ? styles.readyText : styles.packingText]}>
            {isReady ? 'Ready for Pickup' : 'Packing'}
          </Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items in this order</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Item</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Price</Text>
        </View>

        {order.items?.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>
              {item.product?.name || 'Product'}
            </Text>
            <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>
              x{item.quantity}
            </Text>
            <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>
              Rs. {(item.price * item.quantity).toFixed(0)}
            </Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            Rs. {order.payment?.amount?.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {!isReady ? (
          <TouchableOpacity
            style={[styles.updateButton, loading && styles.updateButtonDisabled]}
            onPress={() => handleStatusUpdate('ready_for_pickup')}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.updateButtonText}>📦 Mark as Ready for Pickup</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.readyMessage}>
            <Text style={styles.readyMessageText}>✅ This order is ready for pickup</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: { fontSize: 20, color: '#1e293b', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', letterSpacing: -0.4 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  statusLabel: { fontSize: 15, fontWeight: '600', color: '#475569', marginRight: 10 },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  packingBadge: { backgroundColor: '#fef3c7' },
  readyBadge: { backgroundColor: '#dcfce7' },
  statusText: { fontSize: 13, fontWeight: '700' },
  packingText: { color: '#92400e' },
  readyText: { color: '#166534' },
  card: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eef2f6',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  th: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
  },
  td: { fontSize: 14, fontWeight: '500', color: '#374151' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#1e40af' },
  actionContainer: { marginHorizontal: 20, marginTop: 24 },
  updateButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonDisabled: { opacity: 0.6 },
  updateButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  readyMessage: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  readyMessageText: { color: '#16a34a', fontWeight: '600', fontSize: 15 },
});

export default OrderDetailScreen;