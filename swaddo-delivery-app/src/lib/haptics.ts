import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    switch (style) {
      case 'success':
        await Haptics.impact({ style: ImpactStyle.Light });
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 100);
        break;
      case 'warning':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 150);
        break;
      case 'error':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 150);
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 300);
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'light':
      default:
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
    }
  } catch (error) {
    // Ignore errors on devices without haptic motors
  }
};
