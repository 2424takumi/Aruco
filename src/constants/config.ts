export const APP_CONFIG = {
  // 散歩セッション
  WALK: {
    PHOTO_POLL_INTERVAL_MS: 3000,
    BACKGROUND_POLL_INTERVAL_MS: 30000,
    MAX_DURATION_MS: 4 * 60 * 60 * 1000, // 4時間
    MAX_PHOTOS_FREE: 10,
    MAX_PHOTOS_PREMIUM: 30,
  },

  // グループ
  CIRCLE: {
    MAX_MEMBERS: 10,
    INVITE_EXPIRY_DAYS: 7,
  },

  // 画像
  IMAGE: {
    THUMBNAIL_SIZE: 400,
    MEDIUM_SIZE: 1200,
    THUMBNAIL_QUALITY: 0.6,
    MEDIUM_QUALITY: 0.8,
  },

  // 通知
  NOTIFICATION: {
    MAX_PER_DAY: 3,
  },

  // リアクション
  REACTIONS: ["❤️", "👣", "☀️", "🎉"] as const,
  REACTION_LABELS: {
    "❤️": "すき",
    "👣": "おつかれさま",
    "☀️": "きもちいい",
    "🎉": "いいおさんぽ！",
  } as Record<string, string>,
} as const;
