import React from 'react';
import { StyleSheet, View } from 'react-native';
import WelcomeScreen from './src/features/onboarding/screens/WelcomeScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <WelcomeScreen 
        onNext={() => console.log('Next')} 
        onSkip={() => console.log('Skip')} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
