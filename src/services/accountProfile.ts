import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type SnapQuestProfile = {
  id: string;
  displayName: string | null;
  canManageCatalog: boolean;
  level: number;
  xp: number;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  can_manage_catalog: boolean | null;
  level: number | null;
  xp: number | null;
};

const profileRequests = new Map<string, Promise<SnapQuestProfile>>();

function normalizeProfile(row: ProfileRow): SnapQuestProfile {
  return {
    id: row.id,
    displayName: row.display_name ?? null,
    canManageCatalog: row.can_manage_catalog === true,
    level: row.level ?? 1,
    xp: row.xp ?? 0,
  };
}

export function deriveDisplayName(user: User): string | null {
  const metadataName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  const raw = metadataName?.trim() || user.email?.split("@")[0]?.trim() || "";
  return raw ? raw.slice(0, 60) : null;
}

export function normalizeAuthError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Nao foi possivel concluir a autenticacao agora.";
  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Email ou senha invalidos.";
  }

  if (message.includes("email not confirmed")) {
    return "Confirme o email antes de entrar.";
  }

  if (message.includes("user already registered")) {
    return "Esse email ja esta cadastrado. Entre com a senha.";
  }

  if (message.includes("password should be at least")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Muitas tentativas agora. Aguarde um pouco e tente de novo.";
  }

  return raw;
}

export function describeSignUpOutcome(email: string, hasSession: boolean) {
  if (hasSession) {
    return {
      requiresEmailConfirmation: false,
      message: `Conta criada e conectada como ${email}.`,
    };
  }

  return {
    requiresEmailConfirmation: true,
    message: `Conta criada para ${email}. Confirme o email antes de entrar.`,
  };
}

export async function ensureProfileForUser(user: User): Promise<SnapQuestProfile> {
  const displayName = deriveDisplayName(user);
  const cached = profileRequests.get(user.id);
  if (cached) return cached;

  const request = (async () => {
    const { data: existing, error: selectError } = await supabase
      .from("snapquest_profiles")
      .select("id, display_name, can_manage_catalog, level, xp")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>();

    if (selectError) {
      throw selectError;
    }

    if (existing) {
      return normalizeProfile(existing);
    }

    const { error: insertError } = await supabase.from("snapquest_profiles").insert({
      id: user.id,
      display_name: displayName,
    });

    if (insertError) {
      throw insertError;
    }

    return {
      id: user.id,
      displayName,
      canManageCatalog: false,
      level: 1,
      xp: 0,
    };
  })();

  profileRequests.set(user.id, request);

  try {
    return await request;
  } finally {
    profileRequests.delete(user.id);
  }
}
