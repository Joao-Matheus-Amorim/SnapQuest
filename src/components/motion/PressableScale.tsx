/**
 * Botao base com feedback de toque: mola de escala na thread de UI (Reanimated)
 * + haptic semantico. Respeita "Reduzir movimento" (sem escala, mantem haptic).
 * Substitui Pressable cru nas telas gamificadas. Encaminha ref para funcionar
 * dentro de <Link asChild> do expo-router.
 */
import { forwardRef } from "react";
import { Pressable, View, type PressableProps, type ViewStyle, type StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { SPRING } from "../../theme/tokens";
import { fireHaptic, type HapticEvent } from "../../lib/haptics";
import { useReducedMotion } from "../../lib/useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Escala alvo enquanto pressionado. */
  scaleTo?: number;
  /** Evento tatil disparado no toque. null desliga. */
  haptic?: HapticEvent | null;
};

export const PressableScale = forwardRef<View, Props>(function PressableScale(
  { style, scaleTo = 0.96, haptic = "tap", onPressIn, onPressOut, children, ...rest },
  ref
) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      ref={ref}
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        if (haptic) fireHaptic(haptic);
        if (!reduced) scale.value = withSpring(scaleTo, SPRING.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) scale.value = withSpring(1, SPRING.press);
        onPressOut?.(e);
      }}
    >
      {children as React.ReactNode}
    </AnimatedPressable>
  );
});
