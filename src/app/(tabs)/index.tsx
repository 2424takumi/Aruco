import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFeedStore } from "@/stores/feed-store";
import { useAuthStore } from "@/stores/auth-store";
import { WalkCard } from "@/components/timeline/WalkCard";
import { Colors } from "@/constants/colors";
import type { WalkFeedItem } from "@/types/database";

export default function HomeScreen() {
  const router = useRouter();
  const { items, isLoading, isRefreshing, fetchFeed, refreshFeed } =
    useFeedStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    }
  }, [isAuthenticated, fetchFeed]);

  const handleStartWalk = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    router.push("/walk/session");
  }, [isAuthenticated, router]);

  const renderItem = useCallback(
    ({ item }: { item: WalkFeedItem }) => <WalkCard item={item} />,
    []
  );

  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-sand-50 items-center justify-center">
        <Text className="text-forest-400 text-lg">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-sand-50" edges={["top"]}>
      {/* ヘッダー */}
      <View className="px-5 pt-3 pb-2">
        <Text className="text-2xl font-bold" style={{ color: Colors.forest[700] }}>
          あるこ
        </Text>
      </View>

      {/* タイムライン */}
      {isAuthenticated ? (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.walk_id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshFeed}
              tintColor={Colors.forest[400]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center pt-20">
              <Text className="text-5xl mb-4">🚶</Text>
              <Text className="text-forest-500 text-base font-medium mb-2">
                まだおさんぽがありません
              </Text>
              <Text className="text-gray-400 text-sm text-center px-8">
                下のボタンからおさんぽを始めてみましょう
              </Text>
            </View>
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-6">👋</Text>
          <Text className="text-forest-700 text-xl font-bold mb-3 text-center">
            あるこへようこそ
          </Text>
          <Text className="text-forest-500 text-sm text-center mb-8 leading-5">
            散歩中の写真が、親しい人のもとに{"\n"}自然と届くアプリです
          </Text>
          <Pressable
            onPress={() => router.push("/auth")}
            className="bg-forest-500 px-8 py-4 rounded-2xl active:opacity-80"
          >
            <Text className="text-white text-base font-semibold">
              はじめる
            </Text>
          </Pressable>
        </View>
      )}

      {/* おさんぽボタン */}
      {isAuthenticated && (
        <View className="absolute bottom-28 left-0 right-0 items-center">
          <Pressable
            onPress={handleStartWalk}
            className="bg-forest-500 w-20 h-20 rounded-full items-center justify-center shadow-lg active:scale-95"
            style={{
              shadowColor: Colors.forest[600],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-white text-xs font-bold mt-0.5">
              おさんぽ
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
