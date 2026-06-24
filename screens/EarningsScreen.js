import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EarningsScreen = ({ navigation }) => {
  const { wholesaler } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    received: 0,
  });

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders'); // returns expanded groups for this wholesaler
      const orders = data || [];

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let todaySum = 0;
      let weekSum = 0;
      let monthSum = 0;
      let receivedSum = 0;

      for (const order of orders) {
        const orderDate = new Date(order.createdAt || order.date);
        const amount = order.payment?.amount || 0;

        if (orderDate >= startOfToday) {
          todaySum += amount;
        }
        if (orderDate >= startOfWeek) {
          weekSum += amount;
        }
        if (orderDate >= startOfMonth) {
          monthSum += amount;
        }

        // Received = orders where the group is marked paid (wholesalerPaid)
        if (order.wholesalerPaid) {
          receivedSum += amount;
        }
      }

      setEarnings({
        today: todaySum,
        week: weekSum,
        month: monthSum,
        received: receivedSum,
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.cardRow}>
            <View style={[styles.card, { borderLeftColor: '#22c55e' }]}>
              <Text style={styles.cardLabel}>Today</Text>
              <Text style={styles.cardAmount}>Rs. {earnings.today.toFixed(0)}</Text>
            </View>
            <View style={[styles.card, { borderLeftColor: '#3b82f6' }]}>
              <Text style={styles.cardLabel}>This Week</Text>
              <Text style={styles.cardAmount}>Rs. {earnings.week.toFixed(0)}</Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <View style={[styles.card, { borderLeftColor: '#f59e0b' }]}>
              <Text style={styles.cardLabel}>This Month</Text>
              <Text style={styles.cardAmount}>Rs. {earnings.month.toFixed(0)}</Text>
            </View>
            <View style={[styles.card, { borderLeftColor: '#14b8a6' }]}>
              <Text style={styles.cardLabel}>Received</Text>
              <Text style={styles.cardAmount}>Rs. {earnings.received.toFixed(0)}</Text>
            </View>
          </View>

          {/* Request Withdrawal Button (placeholder) */}
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => alert('Withdrawal request will be available soon.')}
          >
            <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
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
  cardRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#eef2f6',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  cardAmount: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  withdrawButton: {
    backgroundColor: '#1e40af',
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});

export default EarningsScreen;