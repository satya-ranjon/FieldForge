import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { store } from './store/store';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <View style={styles.rootContainer}>
        <StatusBar style="light" />
        <AppNavigator />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0f172a'
  }
});
