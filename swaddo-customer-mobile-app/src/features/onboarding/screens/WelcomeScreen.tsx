import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import IllustrationWrapper from '../components/illustrations/IllustrationWrapper';
import { tokens } from '../../../theme/tokens';
import { responsive } from '../../../utils/responsive';

interface WelcomeScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext, onSkip }) => {
  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.skipButton} onPress={onSkip}>Skip</Text>
      </View>
      
      <View style={styles.illustrationContainer}>
        <IllustrationWrapper 
          type="png" 
          source={require('../../../assets/images/onboarding_scooter.png')} 
          width={responsive.scale(280)} 
          height={responsive.scale(280)} 
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Welcome to <Text style={styles.highlight}>Swaddo</Text>
        </Text>
        <Text style={styles.description}>
          Delicious food from your{'\n'}favorite restaurants,{'\n'}delivered to your door.
        </Text>
      </View>

      <View style={styles.footer}>
        {/* Placeholder for NextButton */}
        <Text style={styles.nextText} onPress={handleNext}>Next</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
  },
  skipButton: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.bold,
    fontSize: tokens.typography.size.sm,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: tokens.spacing.xl,
    alignItems: 'center',
    marginBottom: tokens.spacing.xxxl,
  },
  title: {
    fontFamily: tokens.typography.fontFamily.black,
    fontSize: tokens.typography.size.display,
    color: tokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  highlight: {
    color: tokens.colors.primary.base,
  },
  description: {
    fontFamily: tokens.typography.fontFamily.medium,
    fontSize: tokens.typography.size.lg,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: tokens.typography.size.lg * tokens.typography.lineHeight.relaxed,
  },
  footer: {
    paddingHorizontal: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xl,
    alignItems: 'center',
  },
  nextText: {
    color: tokens.colors.primary.base,
    fontFamily: tokens.typography.fontFamily.bold,
    fontSize: tokens.typography.size.lg,
  }
});

export default memo(WelcomeScreen);
