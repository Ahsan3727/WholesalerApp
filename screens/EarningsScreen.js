import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';   // keep if you'll use real API later

const EarningsScreen = ({ navigation }) => {
  const { wholesaler } = useAuth();
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    totalWithdrawn: 0,
  });
  const [loading, setLoading] = useState(true);

  // Simulate fetching earnings – replace with actual API call when ready
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        // Example: const { data } = await api.get('/earnings');
        // setEarnings(data);
        // For now, mock data after a short delay
        setTimeout(() => {
          setEarnings({
            today: 3500,
            week: 24500,
            month: 98000,
            totalWithdrawn: 50000,
          });
          setLoading(false);
        }, 800);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const handleWithdrawal = () => {
    Alert.alert(
      'Withdrawal Request',
      `Are you sure you want to request a withdrawal of Rs. ${earnings.month.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Call withdrawal API here if available
            Alert.alert('Success', 'Withdrawal request submitted');
            // Optionally update the available balance
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Today</Text>
              <Text style={styles.summaryAmount}>Rs. {earnings.today.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>This Week</Text>
              <Text style={styles.summaryAmount}>Rs. {earnings.week.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>This Month</Text>
              <Text style={styles.summaryAmount}>Rs. {earnings.month.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Withdrawn</Text>
              <Text style={styles.summaryAmount}>Rs. {earnings.totalWithdrawn.toLocaleString()}</Text>
            </View>
          </View>

          {/* Withdrawal Button */}
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={handleWithdrawal}
            activeOpacity={0.8}
          >
            <Text style={styles.withdrawText}>Request Withdrawal</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  // Header
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
  backArrow: {
    fontSize: 20,
    color: '#1e293b',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  placeholder: {
    width: 40,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  // Summary Cards
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eef2f6',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  // Withdraw Button
  withdrawButton: {
    backgroundColor: '#1e40af',
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  withdrawText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default EarningsScreen;