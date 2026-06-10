import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// As fotos da câmera/galeria ficam em cache temporário, que o sistema limpa
// entre sessões (imagem fica preta). Copiamos pra document directory, que é
// permanente. E antes comprimimos (720px/JPEG) pra não pesar no aparelho:
// ~80-150 KB em vez dos 2-4 MB da foto original.
const FOLDER = "snapquest-photos";

function ensureDir(): Directory {
  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export async function persistPhoto(uri: string, id: string): Promise<string> {
  if (Platform.OS === "web") return uri; // web: blob/data URIs, não aplicável
  if (!uri) return uri;

  // Caminho principal: redimensiona + comprime, depois move pra pasta permanente.
  try {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ width: 720 });
    const ref = await context.renderAsync();
    const compressed = await ref.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });

    const dir = ensureDir();
    const dest = new File(dir, `${id}.jpg`);
    if (dest.exists) dest.delete();
    new File(compressed.uri).move(dest); // move o arquivo temporário do cache pra cá
    return dest.uri;
  } catch (e) {
    console.warn("[photoStorage] compressão falhou, tentando cópia direta:", String(e));
  }

  // Fallback: copia a original sem comprimir (melhor pesar do que ficar preta).
  try {
    if (!uri.startsWith("file://")) return uri;
    const dir = ensureDir();
    const dest = new File(dir, `${id}.jpg`);
    if (dest.exists) dest.delete();
    new File(uri).copy(dest);
    return dest.uri;
  } catch (e) {
    console.warn("[photoStorage] não consegui persistir a foto, mantendo original:", String(e));
    return uri;
  }
}
