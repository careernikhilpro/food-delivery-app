import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size: number) => (width / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = width * pixelDensity;
  const adjustedHeight = height * pixelDensity;
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  } else if (pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920)) {
    return true;
  }
  return false;
};

export const getLayoutClass = () => {
  if (width < 375) return 'compact';
  if (width >= 768 || isTablet()) return 'expanded';
  return 'medium';
};

export const responsive = {
  scale,
  verticalScale,
  moderateScale,
  isTablet,
  getLayoutClass,
  deviceWidth: width,
  deviceHeight: height,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};
