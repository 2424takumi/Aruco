import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types/database";

interface AuthState {
  user: User | null;
  session: { access_token: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  initialize: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Pick<User, "display_name" | "avatar_url">>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        set({
          session: { access_token: session.access_token },
          user: profile,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          set({
            session: { access_token: session.access_token },
            user: profile,
            isAuthenticated: true,
          });
        } else if (event === "SIGNED_OUT") {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
          });
        }
      });
    } catch {
      set({ isLoading: false });
    }
  },

  signInWithApple: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
    });
    if (error) throw error;
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isAuthenticated: false });
  },

  updateProfile: async (data) => {
    const user = get().user;
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) throw error;
    set({ user: { ...user, ...data } });
  },
}));
