// navigation/BottomTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Import your screens
import DashboardScreen from '../screens/DashboardScreen';
import MyProductsScreen from '../screens/MyProductsScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',  // Same as CustomerApp
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Products"
        component={MyProductsScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📦</Text>,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderDetailsScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;