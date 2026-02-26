import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { WalkFeedItem } from "@/types/database";

interface FeedState {
  items: WalkFeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;

  fetchFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  addReaction: (walkId: string, emoji: string) => Promise<void>;
  removeReaction: (walkId: string, emoji: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  items: [],
  isLoading: false,
  isRefreshing: false,

  fetchFeed: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("walk_feed")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      set({ items: (data as WalkFeedItem[]) ?? [] });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshFeed: async () => {
    set({ isRefreshing: true });
    await get().fetchFeed();
    set({ isRefreshing: false });
  },

  addReaction: async (walkId: string, emoji: string) => {
    const { error } = await supabase
      .from("photo_reactions")
      .insert({ walk_id: walkId, emoji });

    if (!error) {
      await get().fetchFeed();
    }
  },

  removeReaction: async (walkId: string, emoji: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("photo_reactions")
      .delete()
      .eq("walk_id", walkId)
      .eq("user_id", user.id)
      .eq("emoji", emoji);

    await get().fetchFeed();
  },
}));
