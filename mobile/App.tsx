import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { StatusBar } from 'react-native';

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surfaceContainerLow,
    text: colors.onSurface,
    border: colors.outlineVariant,
    primary: colors.primary,
  },
};

const App = () => {
  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;
