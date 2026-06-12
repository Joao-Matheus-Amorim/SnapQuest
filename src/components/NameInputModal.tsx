import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function NameInputModal({
  visible,
  kind,
  suggestedName,
  aiLoading,
  aiNote,
  onRequestAI,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  kind: "fighter" | "card";
  suggestedName: string;
  aiLoading: boolean;
  aiNote: string;
  onRequestAI: (currentName: string) => void;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(suggestedName);

  useEffect(() => {
    if (visible) setName(suggestedName);
  }, [visible, suggestedName]);

  const label = kind === "fighter" ? "Fighter" : "Carta";
  const canCreate = name.trim().length > 0 && !aiLoading;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <View style={s.box}>
          <Text style={s.title}>Batize seu {label}</Text>
          <Text style={s.hint}>
            {kind === "fighter"
              ? "O nome inspira o golpe e o vacilo na batalha."
              : "De um nome ao efeito."}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            style={s.input}
            placeholder={`Nome do ${label.toLowerCase()}`}
            placeholderTextColor="#6b7280"
            autoFocus
            selectTextOnFocus
            maxLength={40}
            editable={!aiLoading}
            onSubmitEditing={() => canCreate && onConfirm(name.trim())}
          />

          <Pressable style={[s.aiBtn, aiLoading && s.disabled]} disabled={aiLoading} onPress={() => onRequestAI(name.trim())}>
            {aiLoading ? (
              <View style={s.aiLoadingRow}>
                <ActivityIndicator size="small" color="#14b8a6" />
                <Text style={s.aiBtnText}>Consultando IA...</Text>
              </View>
            ) : (
              <Text style={s.aiBtnText}>Sugerir nome com IA</Text>
            )}
          </Pressable>
          {aiNote ? <Text style={s.aiNote}>{aiNote}</Text> : null}

          <View style={s.row}>
            <Pressable style={s.cancelBtn} onPress={onCancel}>
              <Text style={s.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[s.createBtn, !canCreate && s.disabled]}
              disabled={!canCreate}
              onPress={() => onConfirm(name.trim())}
            >
              <Text style={s.createText}>Criar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,13,24,.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  box: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#162033",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
    padding: 22,
  },
  title: { color: "#f8fafc", fontSize: 20, fontWeight: "900", textAlign: "center" },
  hint: { color: "rgba(248,250,252,.62)", fontSize: 13, textAlign: "center", marginTop: 6, marginBottom: 16 },
  input: {
    backgroundColor: "#101623",
    color: "#f8fafc",
    borderColor: "rgba(20,184,166,.45)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700",
  },
  aiBtn: {
    marginTop: 12,
    borderColor: "rgba(20,184,166,.55)",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
  },
  aiLoadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiBtnText: { color: "#8ff5e6", fontSize: 14, fontWeight: "900" },
  aiNote: { color: "rgba(248,250,252,.7)", fontSize: 12, textAlign: "center", marginTop: 8 },
  row: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1,
    borderColor: "rgba(255,255,255,.16)",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelText: { color: "rgba(248,250,252,.72)", fontSize: 15, fontWeight: "800" },
  createBtn: {
    flex: 1.4,
    backgroundColor: "#e11d48",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
  },
  disabled: { opacity: 0.4 },
  createText: { color: "#fff", fontSize: 15, fontWeight: "900" },
});
