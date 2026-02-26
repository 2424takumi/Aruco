import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { APP_CONFIG } from "@/constants/config";
import { useFeedStore } from "@/stores/feed-store";
import { useAuthStore } from "@/stores/auth-store";
import type { WalkFeedItem } from "@/types/database";

interface Props {
  item: WalkFeedItem;
}

export function WalkCard({ item }: Props) {
  const router = useRouter();
  const { addReaction, removeReaction } = useFeedStore();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const timeAgo = formatDistanceToNow(new Date(item.started_at), {
    addSuffix: true,
    locale: ja,
  });

  const durationMinutes = item.duration_seconds
    ? Math.floor(item.duration_seconds / 60)
    : 0;

  const myReaction = item.reactions?.find((r) => r.user_id === currentUserId);

  const handleReaction = (emoji: string) => {
    if (myReaction?.emoji === emoji) {
      removeReaction(item.walk_id, emoji);
    } else {
      addReaction(item.walk_id, emoji);
    }
  };

  return (
    <View className="bg-white rounded-2xl mb-3 overflow-hidden">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <View className="w-9 h-9 rounded-full bg-forest-100 items-center justify-center mr-2.5">
          <Text className="text-sm font-medium">
            {item.display_name?.charAt(0) ?? "?"}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-forest-700 text-sm font-semibold">
            {item.display_name}
          </Text>
          <Text className="text-gray-400 text-xs">
            {timeAgo} ・ {durationMinutes}分のおさんぽ
          </Text>
        </View>
        <Text className="text-gray-300 text-xs">{item.photo_count}枚</Text>
      </View>

      {/* ひとことメモ */}
      {item.note && (
        <Text className="px-4 pb-2 text-forest-600 text-sm">{item.note}</Text>
      )}

      {/* 写真プレビュー */}
      {item.preview_photos && item.preview_photos.length > 0 && (
        <View className="flex-row px-3 pb-3 gap-1">
          {item.preview_photos.slice(0, 3).map((photo, index) => (
            <View
              key={photo.id}
              className={`overflow-hidden rounded-lg ${
                item.preview_photos.length === 1
                  ? "flex-1 aspect-[4/3]"
                  : "flex-1 aspect-square"
              }`}
            >
              <Image
                source={{
                  uri: photo.thumbnail_key,
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
              {index === 2 && item.preview_photos.length > 3 && (
                <View className="absolute inset-0 bg-black/40 items-center justify-center">
                  <Text className="text-white text-lg font-bold">
                    +{item.preview_photos.length - 3}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* リアクション */}
      <View className="flex-row px-4 pb-3 gap-2">
        {APP_CONFIG.REACTIONS.map((emoji) => {
          const isActive = myReaction?.emoji === emoji;
          const count =
            item.reactions?.filter((r) => r.emoji === emoji).length ?? 0;
          return (
            <Pressable
              key={emoji}
              onPress={() => handleReaction(emoji)}
              className={`flex-row items-center px-3 py-1.5 rounded-full ${
                isActive ? "bg-forest-100" : "bg-sand-100"
              }`}
            >
              <Text className="text-base mr-1">{emoji}</Text>
              {count > 0 && (
                <Text
                  className={`text-xs ${
                    isActive ? "text-forest-600" : "text-gray-400"
                  }`}
                >
                  {count}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
