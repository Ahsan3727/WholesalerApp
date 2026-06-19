// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './context/AuthContext';
import BottomTabNavigator from './navigation/BottomTabNavigator';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}