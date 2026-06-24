import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packing', label: 'Packing' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  packing: '#8b5cf6',
  ready_for_pickup: '#6366f1',
  out_for_delivery: '#f97316',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const OrdersScreen = ({ navigation }) => {
  const { wholesaler } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const socketRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders'); // automatically scoped to wholesaler, returns expanded groups
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ---------- Socket.IO connection for real-time updates ----------
  useEffect(() => {
    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('wholesalerToken');
      if (!token || !wholesaler?._id) return;

      const baseUrl = Constants.appOwnership === 'expo'
        ? 'http://10.0.2.2:5000'          // Android emulator (adjust for physical device)
        : 'http://localhost:5000';        // Web development

      const socket = io(baseUrl, {
        query: { userId: wholesaler._id },
        auth: { token },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Orders screen socket connected');
      });

      socket.on('orderUpdated', (order) => {
        // If the order affects this wholesaler, refresh the list
        if (order.wholesalerGroups?.some(g => g.wholesaler?.toString() === wholesaler._id) ||
            order.wholesaler?.toString() === wholesaler._id) {
          fetchOrders();
        }
      });

      socket.on('disconnect', () => {
        console.log('Orders screen socket disconnected');
      });
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [wholesaler?._id, fetchOrders]);

  // Filter orders by group status
  const filteredOrders =
    activeFilter === 'all'
      ? orders
      : orders.filter((o) => {
          const status = o.groupStatus || o.packingStatus || o.status;
          return status === activeFilter;
        });

  // Update the group status
  const handleGroupStatusUpdate = async (order) => {
    const orderId = order.fullOrderId || order._id;
    const groupIndex = order.groupIndex;

    if (groupIndex === undefined || groupIndex === null) {
      Alert.alert('Error', 'Could not identify the group for this order.');
      return;
    }

    try {
      await api.put('/orders/group-status', {
        orderId,
        groupIndex,
        status: 'ready_for_pickup',
      });
      fetchOrders(); // refresh the list
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Update failed');
    }
  };

  // Action button based on group status
  const renderActionButton = (order) => {
    const groupStatus = order.groupStatus || order.packingStatus;

    if (groupStatus === 'packing') {
      return (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#6366f1' }]}
          onPress={() => handleGroupStatusUpdate(order)}
        >
          <Text style={styles.actionBtnText}>Mark Ready</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderOrder = ({ item }) => {
    const groupStatus = item.groupStatus || item.packingStatus || item.status;
    const statusColor = STATUS_COLORS[groupStatus] || '#94a3b8';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetail', { order: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {groupStatus.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Text style={styles.label}>Items:</Text>
            <Text style={styles.value}>{item.items?.length || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total:</Text>
            <Text style={styles.totalAmount}>
              Rs. {item.payment?.amount?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        {renderActionButton(item) && (
          <View style={styles.actionContainer}>
            {renderActionButton(item)}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {STATUS_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtext}>
                {activeFilter === 'all'
                  ? 'No orders yet'
                  : `No orders with status "${activeFilter}"`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
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
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  filterContent: { paddingHorizontal: 20 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  filterTextActive: { color: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingBottom: 30 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eef2f6',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: { fontSize: 16, fontWeight: '700', color: '#0f172a', letterSpacing: -0.3 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  cardBody: { marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  value: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  totalAmount: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  actionContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  actionBtn: { paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});

export default OrdersScreen;