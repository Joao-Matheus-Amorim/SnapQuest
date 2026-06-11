/**
 * Reflete a preferencia "Reduzir movimento" do sistema (acessibilidade).
 * Toda animacao de enfeite deve checar isto e cair para um fallback
 * estatico/instantaneo quando true.
 */
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => {
        if (mounted) setReduced(Boolean(value));
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => {
      setReduced(Boolean(value));
    });

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
