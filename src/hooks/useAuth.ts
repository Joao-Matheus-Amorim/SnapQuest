import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { clearPlayerDeck } from "./usePlayerDeck";
import {
  describeSignUpOutcome,
  ensureProfileForUser,
  normalizeAuthError,
  type SnapQuestProfile,
} from "../services/accountProfile";

type SignUpResult = {
  requiresEmailConfirmation: boolean;
  message: string;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  profile: SnapQuestProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  canManageCatalog: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SnapQuestProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const hydrateProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const nextProfile = await ensureProfileForUser(nextUser);
      setProfile(nextProfile);
    } catch (error) {
      setProfile(null);
      setProfileError(normalizeAuthError(error));
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      await hydrateProfile(nextUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      await hydrateProfile(nextUser);
    });

    return () => subscription.unsubscribe();
  }, [hydrateProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(normalizeAuthError(error));
  }, []);

  const signUp = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) throw new Error(normalizeAuthError(error));

      if (data.session?.user) {
        await hydrateProfile(data.session.user);
      }

      return describeSignUpOutcome(normalizedEmail, Boolean(data.session));
    },
    [hydrateProfile]
  );

  const refreshProfile = useCallback(async () => {
    await hydrateProfile(user);
  }, [hydrateProfile, user]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(normalizeAuthError(error));

    setProfile(null);
    setProfileError(null);
    setProfileLoading(false);

    await clearPlayerDeck();
  }, []);

  return {
    user,
    loading,
    profile,
    profileLoading,
    profileError,
    canManageCatalog: profile?.canManageCatalog === true,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };
}
