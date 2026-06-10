const OWNER_EMAIL = process.env.EXPO_PUBLIC_OWNER_EMAIL ?? "";

export function isOwner(email: string | null | undefined): boolean {
  return Boolean(email && email === OWNER_EMAIL);
}
