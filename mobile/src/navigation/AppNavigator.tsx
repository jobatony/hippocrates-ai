import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import { HomeScreen } from '../screens/HomeScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { colors } from '../theme/colors';
import { View, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLow,
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'QuizTab') iconName = 'zap';
          else if (route.name === 'Calendar') iconName = 'calendar';
          else if (route.name === 'Account') iconName = 'user';

          return (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activePill} />}
              <Icon name={iconName} size={24} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="QuizTab" 
        component={QuizScreen} 
        options={{ 
          title: 'Quiz',
          tabBarStyle: { display: 'none' } // Hide tab bar when in Quiz session
        }} 
      />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 30,
  },
  activePill: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryContainer,
  }
});
