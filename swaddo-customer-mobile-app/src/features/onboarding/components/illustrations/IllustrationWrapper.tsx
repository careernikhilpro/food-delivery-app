import React, { memo } from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

// Placeholders for actual libraries
// import LottieView from 'lottie-react-native';
// import { SvgUri } from 'react-native-svg';

type IllustrationType = 'lottie' | 'svg' | 'png';

interface IllustrationWrapperProps {
  type: IllustrationType;
  source: string | ImageSourcePropType;
  width?: number | string;
  height?: number | string;
  autoPlay?: boolean;
  loop?: boolean;
  testID?: string;
}

const IllustrationWrapper: React.FC<IllustrationWrapperProps> = ({
  type,
  source,
  width = 200,
  height = 200,
  autoPlay = true,
  loop = true,
  testID = 'illustration-wrapper',
}) => {
  const containerStyle = { width, height };

  if (type === 'lottie') {
    return (
      <View style={[styles.container, containerStyle]} testID={`${testID}-lottie`}>
        {/* <LottieView source={source} autoPlay={autoPlay} loop={loop} style={styles.fluid} /> */}
        <View style={styles.placeholder}>
          <Image source={source as ImageSourcePropType} style={styles.fluid} resizeMode="contain" />
        </View>
      </View>
    );
  }

  if (type === 'svg') {
    return (
      <View style={[styles.container, containerStyle]} testID={`${testID}-svg`}>
        {/* <SvgUri uri={source as string} width="100%" height="100%" /> */}
        <View style={styles.placeholder}>
          <Image source={source as ImageSourcePropType} style={styles.fluid} resizeMode="contain" />
        </View>
      </View>
    );
  }

  // Fallback to PNG
  return (
    <View style={[styles.container, containerStyle]} testID={`${testID}-png`}>
      <Image source={source as ImageSourcePropType} style={styles.fluid} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fluid: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default memo(IllustrationWrapper);
