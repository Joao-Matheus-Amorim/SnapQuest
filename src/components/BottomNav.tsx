import { Pressable, View, Text, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";

const TABS = [
  { href: "/", label: "Inicio", mark: "IN" },
  { href: "/camera", label: "Camera", mark: "CA" },
  { href: "/inventory", label: "Deck", mark: "DK" },
  { href: "/battle", label: "Batalha", mark: "BT" },
] as const;

export const BOTTOM_NAV_HEIGHT = 72;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={s.bar}>
      {TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
        return (
          <Pressable key={tab.href} style={[s.tab, active && s.activeTab]} onPress={() => router.replace(tab.href)}>
            <View style={[s.mark, active && s.activeMark]}>
              <Text style={[s.markText, active && s.activeMarkText]}>{tab.mark}</Text>
            </View>
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
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,.08)",
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "rgba(20,184,166,.12)",
  },
  mark: {
    width: 28,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
  },
  activeMark: {
    backgroundColor: "#14b8a6",
    borderColor: "#14b8a6",
  },
  markText: { color: "rgba(255,255,255,.5)", fontSize: 10, fontWeight: "900" },
  activeMarkText: { color: "#06131f" },
  label: { fontSize: 10, color: "rgba(255,255,255,.52)", fontWeight: "800" },
  activeLabel: { color: "#dffcf6" },
});
