import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import AdminAppNavigator from './AdminAppNavigator';
import JoinStoreScreen from '../screens/JoinStoreScreen';
import CreateStoreScreen from '../screens/admin/CreateStoreScreen';
import SplashLoadingView from '../components/SplashLoadingView';

const MainStack = createNativeStackNavigator();

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
    if (isAdmin || user?.systemRole === 'ADMIN') {
      return <CreateStoreScreen />;
    }
    return <JoinStoreScreen />;
  }

  const isManager = roleInStore === 'MANAGER' || user?.role === 'MANAGER';
  const canManage = isAdmin || isManager;

  // Reset stack configuration whenever active store or user management role changes
  const stackKey = `${store?._id || 'none'}-${isAdmin ? 'admin' : isManager ? 'manager' : 'employee'}`;

  return (
    <MainStack.Navigator
      key={stackKey}
      initialRouteName={isAdmin ? 'AdminTabs' : 'AppTabs'}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <MainStack.Screen name="AppTabs" component={AppNavigator} />
      {canManage && (
        <MainStack.Screen name="AdminTabs" component={AdminAppNavigator} />
      )}
    </MainStack.Navigator>
  );
};

export default RootNavigator;
