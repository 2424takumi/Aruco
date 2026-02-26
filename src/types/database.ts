export type MemberRole = "owner" | "admin" | "member";
export type WalkStatus = "active" | "completed" | "cancelled";
export type InviteStatus = "pending" | "accepted" | "declined" | "expired";
export type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

export interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Circle {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface CircleInvite {
  id: string;
  circle_id: string;
  invited_by: string;
  invite_code: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
}

export interface Walk {
  id: string;
  user_id: string;
  title: string | null;
  note: string | null;
  status: WalkStatus;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  photo_count: number;
  created_at: string;
  updated_at: string;
}

export interface WalkShare {
  id: string;
  walk_id: string;
  circle_id: string;
  shared_at: string;
}

export interface WalkPhoto {
  id: string;
  walk_id: string;
  user_id: string;
  storage_key: string;
  thumbnail_key: string | null;
  medium_key: string | null;
  width: number;
  height: number;
  file_size_bytes: number;
  mime_type: string;
  taken_at: string;
  sort_order: number;
  upload_status: UploadStatus;
  created_at: string;
}

export interface PhotoReaction {
  id: string;
  walk_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface PhotoComment {
  id: string;
  walk_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface WalkFeedItem {
  walk_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  title: string | null;
  note: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  photo_count: number;
  circle_id: string;
  circle_name: string;
  preview_photos: {
    id: string;
    thumbnail_key: string;
    width: number;
    height: number;
  }[];
  reactions: {
    emoji: string;
    user_id: string;
    display_name: string;
  }[];
}
