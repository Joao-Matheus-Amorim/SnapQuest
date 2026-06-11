import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";

const TABS = [
  { href: "/", label: "Base", mark: "I" },
  { href: "/camera", label: "Captura", mark: "II" },
  { href: "/inventory", label: "Deck", mark: "III" },
  { href: "/battle", label: "Duelo", mark: "IV" },
] as const;

export const BOTTOM_NAV_HEIGHT = 76;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={s.shell}>
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
    </View>
  );
}

const s = StyleSheet.create({
  shell: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_NAV_HEIGHT,
    backgroundColor: "#0b050f",
    borderTopWidth: 2,
    borderTopColor: "rgba(247,201,72,.42)",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  bar: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,247,214,.12)",
    backgroundColor: "#1b1023",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  activeTab: {
    borderColor: "rgba(247,201,72,.88)",
    backgroundColor: "#2d2110",
  },
  mark: {
    minWidth: 28,
    height: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,247,214,.08)",
    paddingHorizontal: 5,
  },
  activeMark: { backgroundColor: "#f7c948" },
  markText: { color: "rgba(255,247,214,.55)", fontSize: 10, fontWeight: "900" },
  activeMarkText: { color: "#1b1023" },
  label: { color: "rgba(255,247,214,.62)", fontSize: 10, fontWeight: "900" },
  activeLabel: { color: "#fff7d6" },
});
