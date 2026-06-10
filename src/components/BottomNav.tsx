import { Pressable, View, Text, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";

const TABS = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/camera", label: "Câmera", icon: "📷" },
  { href: "/inventory", label: "Inventário", icon: "🎴" },
  { href: "/battle", label: "Batalha", icon: "⚔️" },
] as const;

export const BOTTOM_NAV_HEIGHT = 64;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={s.bar}>
      {TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
        return (
          <Pressable key={tab.href} style={s.tab} onPress={() => router.replace(tab.href)}>
            <Text style={[s.icon, active && s.activeIcon]}>{tab.icon}</Text>
            <Text style={[s.label, active && s.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_NAV_HEIGHT,
    backgroundColor: "#0d1117",
    borderTopWidth: 1,
    borderTopColor: "rgba(245,166,35,.2)",
    flexDirection: "row",
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  icon: { fontSize: 20, opacity: 0.45 },
  activeIcon: { opacity: 1 },
  label: { fontSize: 10, color: "rgba(245,166,35,.45)", fontWeight: "700" },
  activeLabel: { color: "#f5a623" },
});
