import 'react-native-gesture-handler';
import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import HomeScreen from './app/HomeScreen';
import SearchScreen from './app/SearchScreen';
import ProfileScreen from './app/ProfileScreen';
import DetailsScreen from './app/DetailsScreen';
import LoginScreen from './app/LoginScreen';
import NotificationsScreen from './app/NotificationsScreen';
import AddMovieScreen from './app/AddMovieScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FF8A00",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 82 : 70,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? -8 : -10,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'Home') iconName = 'home';
          if (route.name === 'Search') iconName = 'search';
          if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="AddMovie" component={AddMovieScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
