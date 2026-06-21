import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useLocationTracking from '../hooks/useLocationTracking';
import api from '../services/api';

// Color palette for stat cards
const STAT_STYLES = [
  { card: 'statCardGreen', iconBox: 'iconBoxGreen', icon: '📦' },
  { card: 'statCardBlue', iconBox: 'iconBoxBlue', icon: '📋' },
  { card: 'statCardAmber', iconBox: 'iconBoxAmber', icon: '💰' },
  { card: 'statCardPurple', iconBox: 'iconBoxPurple', icon: '📈' },
];

// Quick Actions
const QUICK_ACTIONS = [
  { label: 'Products', icon: '📦', screen: 'Products', color: '#22c55e' },
  { label: 'Orders', icon: '📋', screen: 'Orders', color: '#3b82f6' },
  { label: 'Map', icon: '🗺️', screen: 'Map', color: '#f59e0b' },
  { label: 'Add', icon: '➕', screen: 'AddProduct', color: '#8b5cf6' },
  { label: 'Earnings', icon: '💰', screen: 'Earnings', color: '#f59e0b' },
  { label: 'Profile', icon: '👤', screen: 'Profile', color: '#6366f1' },
  { label: 'Settings', icon: '⚙️', screen: 'Settings', color: '#94a3b8' },
];

const DashboardScreen = ({ navigation }) => {
  const { wholesaler } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    pendingOrders: 0,
    monthlyRevenue: 0,
    avgOrderValue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  // Fetch all data on mount
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch products and orders in parallel
      const [productsRes, ordersRes] = await Promise.all([
        api.get('/products/my'),
        api.get('/orders'),   // or /orders?wholesaler=me if your backend supports it
      ]);

      // --- Products ---
      const products = productsRes.data.products || [];
      const totalProducts = products.length;

      // --- Orders ---
      const allOrders = ordersRes.data.orders || ordersRes.data; // adjust based on response shape
      const pendingOrders = allOrders.filter(o => o.status === 'pending').length;

      // Delivered orders for revenue & average
      const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
      const now = new Date();
      const thisMonthOrders = deliveredOrders.filter(o => {
        const orderDate = new Date(o.createdAt || o.date);
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      });

      const monthlyRevenue = thisMonthOrders.reduce(
        (sum, o) => sum + (o.payment?.amount || 0),
        0
      );

      const avgOrderValue =
        deliveredOrders.length > 0
          ? deliveredOrders.reduce((sum, o) => sum + (o.payment?.amount || 0), 0) /
            deliveredOrders.length
          : 0;

      // Recent delivered orders (last 3)
      const recent = [...deliveredOrders]
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, 3)
        .map(o => ({
          id: o._id.slice(-6),
          retailer: o.customer?.name || 'Customer',
          items: o.items?.length || 1,
          total: o.payment?.amount || 0,
          status: o.status,
        }));

      setStats({
        products: totalProducts,
        pendingOrders,
        monthlyRevenue,
        avgOrderValue,
      });
      setRecentOrders(recent);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const statsData = [
    { label: 'Products', value: stats.products },
    { label: 'Pending', value: stats.pendingOrders },
    { label: 'Revenue', value: `Rs. ${stats.monthlyRevenue.toFixed(0)}` },
    { label: 'Avg Order', value: `Rs. ${stats.avgOrderValue.toFixed(0)}` },
  ];

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(wholesaler?.name || 'W').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.greeting}>
              Welcome, {wholesaler?.name?.split(' ')[0] || 'Wholesaler'}
            </Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
            {wholesaler?.storeName && (
              <Text style={styles.storeName}>🏪 {wholesaler.storeName}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsContent}
        >
          {QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIconBox, { backgroundColor: action.color + '18' }]}>
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Grid – with loading indicator inside */}
      {loading ? (
        <View style={styles.loadingStats}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : (
        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => {
            const colors = STAT_STYLES[index];
            return (
              <View key={index} style={[styles.statCardBase, styles[colors.card]]}>
                <View style={[styles.iconBoxBase, styles[colors.iconBox]]}>
                  <Text style={styles.iconText}>{colors.icon}</Text>
                </View>
                <View style={styles.statTextGroup}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Recent Orders */}
      <View style={styles.ordersHeader}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.ordersContainer}>
        {loading ? null : recentOrders.length > 0 ? (
          recentOrders.map((order, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>#{order.id}</Text>
                <View style={styles.statusDelivered}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>
              <Text style={styles.orderRetailer}>
                {order.retailer} · {order.items} items
              </Text>
              <Text style={styles.orderTotal}>Rs. {order.total.toFixed(2)}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyOrders}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No completed orders yet</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ---------- Styles (unchanged from your previous fit-screen design) ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerTextGroup: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  storeName: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  quickActionsContainer: {
    marginBottom: 12,
  },
  quickActionsContent: {
    paddingVertical: 4,
  },
  quickActionButton: {
    alignItems: 'center',
    marginRight: 14,
    width: 60,
  },
  quickActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  loadingStats: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCardBase: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eef2f6',
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardGreen: { borderLeftWidth: 4, borderLeftColor: '#22c55e' },
  statCardBlue: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  statCardAmber: { borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  statCardPurple: { borderLeftWidth: 4, borderLeftColor: '#8b5cf6' },
  iconBoxBase: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconBoxGreen: { backgroundColor: '#dcfce7' },
  iconBoxBlue: { backgroundColor: '#dbeafe' },
  iconBoxAmber: { backgroundColor: '#fef3c7' },
  iconBoxPurple: { backgroundColor: '#ede9fe' },
  iconText: { fontSize: 18 },
  statTextGroup: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  ordersContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#eef2f6',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: 13,
  },
  statusDelivered: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'capitalize',
  },
  orderRetailer: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyOrders: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptyIcon: {
    fontSize: 30,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
});

export default DashboardScreen;