import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUnauthorizedHandler } from './src/api/client';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import VehiclesScreen from './src/screens/VehiclesScreen';
import VehicleCardScreen from './src/screens/VehicleCardScreen';
import AddVehicleScreen from './src/screens/AddVehicleScreen';
import AddMaintenanceScreen from './src/screens/AddMaintenanceScreen';
import CompaniesScreen from './src/screens/CompaniesScreen';
import TasksScreen from './src/screens/TasksScreen';
import { AuthContext } from './src/context/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Ana Ekran' }} />
      <Tab.Screen name="Vehicles" component={VehiclesScreen} options={{ title: 'Araçlar' }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ title: 'İşler' }} />
      <Tab.Screen name="Companies" component={CompaniesScreen} options={{ title: 'Firmalar' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('user').then(data => {
      if (data) setUser(JSON.parse(data));
      setLoading(false);
    });
    // Token süresi dolduğunda (401) veya sunucu reddettiğinde uygulamayı da giriş ekranına döndür.
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="VehicleCard" component={VehicleCardScreen} options={{ title: 'Araç Kartı' }} />
              <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ title: 'Yeni Araç' }} />
              <Stack.Screen name="AddMaintenance" component={AddMaintenanceScreen} options={{ title: 'Bakım Kaydı' }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}