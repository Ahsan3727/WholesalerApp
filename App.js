import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import usePushNotifications from './hooks/usePushNotifications';
import * as Notifications from 'expo-notifications';   // ← added
import { useNavigation } from '@react-navigation/native'; // ← added

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyProductsScreen from './screens/MyProductsScreen';
import AddProductScreen from './screens/AddProductScreen';
import OrdersScreen from './screens/OrdersScreen';
import EarningsScreen from './screens/EarningsScreen';
import MapScreen from './screens/MapScreen';
import { ActivityIndicator, View } from 'react-native';
import ProductManagementScreen from './screens/ProductManagementScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';


const Stack = createNativeStackNavigator();

// ---------- Set how notifications are shown when the app is in foreground ----------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigation = useNavigation();   // ← added

  // Register for push tokens & save to backend
  usePushNotifications(isAuthenticated);

  // ---------- Handle notification tap (app in background) ----------
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      // Navigate to order detail when a new order notification is tapped
      if (data?.type === 'new_order' && data?.orderId) {
        navigation.navigate('Orders', { orderId: data.orderId });
      }
    });

    return () => subscription.remove();
  }, [navigation]);

  // ---------- Handle notification that opened the app from killed state ----------
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (lastNotificationResponse) {
      const { data } = lastNotificationResponse.notification.request.content;
      if (data?.type === 'new_order' && data?.orderId) {
        navigation.navigate('Orders', { orderId: data.orderId });
      }
    }
  }, [lastNotificationResponse]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Products" component={MyProductsScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
          <Stack.Screen name="Earnings" component={EarningsScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="ProductManagement" component={ProductManagementScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}