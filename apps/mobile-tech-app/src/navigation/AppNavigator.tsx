import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { JobListScreen } from '../screens/JobListScreen';
import { ActiveJobScreen } from '../screens/ActiveJobScreen';

export type ScreenType = 'JOB_LIST' | 'ACTIVE_JOB';

export const AppNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('ACTIVE_JOB');

  const handleSelectJob = () => {
    setCurrentScreen('ACTIVE_JOB');
  };

  const handleBackToList = () => {
    setCurrentScreen('JOB_LIST');
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'JOB_LIST' ? (
        <JobListScreen onSelectJob={handleSelectJob} />
      ) : (
        <ActiveJobScreen onBack={handleBackToList} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  }
});
