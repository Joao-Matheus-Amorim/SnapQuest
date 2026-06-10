import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export function LegendaryAura({ children, width, height }: {
  children: React.ReactNode;
  width: number;
  height: number;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, [pulse]);

  const shadowRadius = pulse.interpolate({ inputRange: [0, 1], outputRange: [22, 42] });
  const shadowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
  const outerOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const outerScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.025] });

  return (
    <View style={s.wrapper}>
      {/* Anel externo pulsante */}
      <Animated.View style={[
        s.outerRing,
        {
          width: width + 8,
          height: height + 8,
          borderRadius: 20,
          opacity: outerOpacity,
          transform: [{ scale: outerScale }],
        },
      ]} />

      {/* Card com sombra animada */}
      <Animated.View style={{
        shadowColor: "#ff9800",
        shadowRadius,
        shadowOpacity,
        shadowOffset: { width: 0, height: 0 },
        elevation: 20,
      }}>
        {children}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#ff9800",
    backgroundColor: "transparent",
  },
});
