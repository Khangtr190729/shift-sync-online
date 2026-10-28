import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import AdminAppNavigator from './AdminAppNavigator';
import JoinStoreScreen from '../screens/JoinStoreScreen';
import CreateStoreScreen from '../screens/admin/CreateStoreScreen';
import SplashLoadingView from '../components/SplashLoadingView';

export const RootNavigator = () => {
  const { user, store, roleInStore, isAdmin, isLoading } = useAuth();

  // Loading Splash
  if (isLoading) {
    return <SplashLoadingView statusText="Đang kết nối hệ thống..." />;
  }

  // Not logged in -> Auth flow
  if (!user) {
    return <AuthNavigator />;
  }

  // Logged in but not joined / created any store yet
  if (!store) {
    if (isAdmin || user.systemRole === 'ADMIN') {
      return <CreateStoreScreen />;
    }
    return <JoinStoreScreen />;
  }

  // Authenticated and has a store
  const canManage = isAdmin || roleInStore === 'MANAGER';
  if (canManage) {
    return <AdminAppNavigator />;
  }

  return <AppNavigator />;
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    fontWeight: '500',
  },
  spinner: {
    marginTop: 36,
  },
});

export default RootNavigator;
