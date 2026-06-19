// screens/LoginScreen.js – FIXED
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');

  const handleLogin = async () => {
    if (loginMethod === 'email' && !email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (loginMethod === 'phone' && !phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    const result = await login(
      loginMethod === 'email' ? email.trim() : '',
      loginMethod === 'phone' ? phone.trim() : '',
      password
    );
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.headerGradient}>
              <Text style={styles.appName}>🏭 Groxo</Text>
              <Text style={styles.subtitle}>Wholesaler Login</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, loginMethod === 'email' && styles.toggleActive]}
                onPress={() => setLoginMethod('email')}>
                <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, loginMethod === 'phone' && styles.toggleActive]}
                onPress={() => setLoginMethod('phone')}>
                <Text style={[styles.toggleText, loginMethod === 'phone' && styles.toggleTextActive]}>Phone</Text>
              </TouchableOpacity>
            </View>

            {loginMethod === 'email' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="wholesaler@example.com"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}

            {loginMethod === 'phone' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 234 567 890"
                  placeholderTextColor="#aaa"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.link}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  headerGradient: {
    backgroundColor: '#FF6B00',
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: screenWidth - 48,      // ← now a number, not a string
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#777',
  },
  toggleTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fafbfc',
    color: '#1a202c',
  },
  button: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '700',
  },
});

export default LoginScreen;