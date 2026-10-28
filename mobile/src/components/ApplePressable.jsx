import React, { useRef } from 'react';
import { Pressable, Animated } from 'react-native';

/**
 * ApplePressable: Component cảm ứng với hiệu ứng nén đàn hồi chuẩn iOS
 * - 100% Hardware Accelerated qua Animated useNativeDriver: true
 * - Không gây tắc nghẽn JS Thread hay đơ giao diện khi bấm liên tục
 */
export const ApplePressable = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  activeScale = 0.96,
  style,
  contentStyle,
  hitSlop,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        hitSlop={hitSlop}
        style={contentStyle}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default ApplePressable;

