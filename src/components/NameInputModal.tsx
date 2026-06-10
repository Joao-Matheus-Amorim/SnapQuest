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
  onRequestAI: () => void;
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
              : "Dê um nome ao efeito."}
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

          {/* IA sob demanda — gasta 1 chamada só quando o usuário pede */}
          <Pressable style={[s.aiBtn, aiLoading && s.disabled]} disabled={aiLoading} onPress={onRequestAI}>
            {aiLoading ? (
              <View style={s.aiLoadingRow}>
                <ActivityIndicator size="small" color="#8e44ad" />
                <Text style={s.aiBtnText}>Consultando IA...</Text>
              </View>
            ) : (
              <Text style={s.aiBtnText}>✨ Sugerir nome com IA</Text>
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
    backgroundColor: "rgba(10,12,22,.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  box: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#16213e",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,.4)",
    padding: 22,
  },
  title: { color: "#f5a623", fontSize: 20, fontWeight: "800", textAlign: "center" },
  hint: { color: "rgba(255,255,255,.6)", fontSize: 13, textAlign: "center", marginTop: 6, marginBottom: 16 },
  input: {
    backgroundColor: "#0d1117",
    color: "#fff",
    borderColor: "rgba(245,166,35,.5)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700",
  },
  aiBtn: {
    marginTop: 12,
    borderColor: "#8e44ad",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  aiLoadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiBtnText: { color: "#b06fd6", fontSize: 14, fontWeight: "800" },
  aiNote: { color: "rgba(255,255,255,.7)", fontSize: 12, textAlign: "center", marginTop: 8 },
  row: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1,
    borderColor: "rgba(255,255,255,.25)",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelText: { color: "rgba(255,255,255,.7)", fontSize: 15, fontWeight: "700" },
  createBtn: {
    flex: 1.4,
    backgroundColor: "#e94560",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  disabled: { opacity: 0.4 },
  createText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
