import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Options */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => alert('Change Password will be available soon.')}
        >
          <Text style={styles.optionText}>🔒 Change Password</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.option}
          onPress={() => alert('Notification preferences will be available soon.')}
        >
          <Text style={styles.optionText}>🔔 Notification Preferences</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.option}
          onPress={() => alert('Groxo Wholesaler v1.0.0')}
        >
          <Text style={styles.optionText}>ℹ️ About</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 40 },
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
  card: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#eef2f6',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  optionText: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
  optionArrow: { fontSize: 22, color: '#94a3b8', fontWeight: '300' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 28,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});

export default SettingsScreen;