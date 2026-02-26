import { create } from "zustand";
import * as MediaLibrary from "expo-media-library";
import { supabase } from "@/lib/supabase";
import { APP_CONFIG } from "@/constants/config";
import type { Walk, WalkPhoto } from "@/types/database";

interface DetectedPhoto {
  id: string;
  uri: string;
  width: number;
  height: number;
  creationTime: number;
  filename: string;
  excluded: boolean;
}

interface WalkState {
  // 散歩セッション
  currentWalk: Walk | null;
  isWalking: boolean;
  startTime: number | null;
  elapsedSeconds: number;

  // 検知した写真
  detectedPhotos: DetectedPhoto[];
  pollIntervalId: ReturnType<typeof setInterval> | null;

  // アクション
  startWalk: () => Promise<void>;
  endWalk: () => Promise<void>;
  cancelWalk: () => void;
  togglePhotoExclusion: (photoId: string) => void;
  shareWalk: (circleId: string, note?: string) => Promise<void>;

  // 内部
  _startPhotoMonitoring: () => void;
  _stopPhotoMonitoring: () => void;
  _checkForNewPhotos: () => Promise<void>;
  _updateElapsed: () => void;
}

export const useWalkStore = create<WalkState>((set, get) => ({
  currentWalk: null,
  isWalking: false,
  startTime: null,
  elapsedSeconds: 0,
  detectedPhotos: [],
  pollIntervalId: null,

  startWalk: async () => {
    const { data, error } = await supabase
      .from("walks")
      .insert({
        status: "active",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const now = Date.now();
    set({
      currentWalk: data,
      isWalking: true,
      startTime: now,
      elapsedSeconds: 0,
      detectedPhotos: [],
    });

    get()._startPhotoMonitoring();
  },

  endWalk: async () => {
    const { currentWalk } = get();
    if (!currentWalk) return;

    get()._stopPhotoMonitoring();

    const endedAt = new Date().toISOString();
    const durationSeconds = get().elapsedSeconds;
    const photoCount = get().detectedPhotos.filter((p) => !p.excluded).length;

    const { error } = await supabase
      .from("walks")
      .update({
        status: "completed",
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        photo_count: photoCount,
      })
      .eq("id", currentWalk.id);

    if (error) throw error;

    set((state) => ({
      isWalking: false,
      currentWalk: state.currentWalk
        ? {
            ...state.currentWalk,
            status: "completed" as const,
            ended_at: endedAt,
            duration_seconds: durationSeconds,
            photo_count: photoCount,
          }
        : null,
    }));
  },

  cancelWalk: () => {
    const { currentWalk } = get();
    get()._stopPhotoMonitoring();

    if (currentWalk) {
      supabase
        .from("walks")
        .update({ status: "cancelled" })
        .eq("id", currentWalk.id);
    }

    set({
      currentWalk: null,
      isWalking: false,
      startTime: null,
      elapsedSeconds: 0,
      detectedPhotos: [],
    });
  },

  togglePhotoExclusion: (photoId: string) => {
    set((state) => ({
      detectedPhotos: state.detectedPhotos.map((p) =>
        p.id === photoId ? { ...p, excluded: !p.excluded } : p
      ),
    }));
  },

  shareWalk: async (circleId: string, note?: string) => {
    const { currentWalk, detectedPhotos } = get();
    if (!currentWalk) return;

    if (note) {
      await supabase
        .from("walks")
        .update({ note })
        .eq("id", currentWalk.id);
    }

    // 写真のアップロード（除外されていないもの）
    const photosToUpload = detectedPhotos.filter((p) => !p.excluded);
    for (let i = 0; i < photosToUpload.length; i++) {
      const photo = photosToUpload[i];
      await supabase.from("walk_photos").insert({
        walk_id: currentWalk.id,
        storage_key: `walks/${currentWalk.id}/${photo.id}.jpg`,
        width: photo.width,
        height: photo.height,
        file_size_bytes: 0,
        taken_at: new Date(photo.creationTime).toISOString(),
        sort_order: i,
        upload_status: "pending",
      });
    }

    // サークルに共有
    await supabase.from("walk_shares").insert({
      walk_id: currentWalk.id,
      circle_id: circleId,
    });

    // リセット
    set({
      currentWalk: null,
      isWalking: false,
      startTime: null,
      elapsedSeconds: 0,
      detectedPhotos: [],
    });
  },

  _startPhotoMonitoring: () => {
    const intervalId = setInterval(() => {
      get()._checkForNewPhotos();
      get()._updateElapsed();
    }, APP_CONFIG.WALK.PHOTO_POLL_INTERVAL_MS);

    set({ pollIntervalId: intervalId });
  },

  _stopPhotoMonitoring: () => {
    const { pollIntervalId } = get();
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      set({ pollIntervalId: null });
    }
  },

  _checkForNewPhotos: async () => {
    const { startTime, detectedPhotos } = get();
    if (!startTime) return;

    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 50,
        mediaType: "photo",
        sortBy: [MediaLibrary.SortBy.creationTime],
        createdAfter: startTime,
      });

      const existingIds = new Set(detectedPhotos.map((p) => p.id));
      const newPhotos: DetectedPhoto[] = assets
        .filter((a) => !existingIds.has(a.id))
        .map((a) => ({
          id: a.id,
          uri: a.uri,
          width: a.width,
          height: a.height,
          creationTime: a.creationTime,
          filename: a.filename,
          excluded: false,
        }));

      if (newPhotos.length > 0) {
        set((state) => ({
          detectedPhotos: [...state.detectedPhotos, ...newPhotos],
        }));
      }
    } catch {
      // 権限エラーなどは静かに無視
    }
  },

  _updateElapsed: () => {
    const { startTime } = get();
    if (!startTime) return;
    set({ elapsedSeconds: Math.floor((Date.now() - startTime) / 1000) });
  },
}));
