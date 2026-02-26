import { useEffect, useCallback } from "react";
import { View, Text, Pressable, FlatList, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as MediaLibrary from "expo-media-library";
import { useWalkStore } from "@/stores/walk-store";
import { useElapsedTime } from "@/hooks/useElapsedTime";
import { Colors } from "@/constants/colors";

export default function WalkSessionScreen() {
  const router = useRouter();
  const {
    isWalking,
    startTime,
    detectedPhotos,
    startWalk,
    endWalk,
    cancelWalk,
    togglePhotoExclusion,
  } = useWalkStore();

  const { formatted: elapsedFormatted } = useElapsedTime(isWalking, startTime);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "写真へのアクセス",
          "散歩中の写真を自動で取得するために、写真ライブラリへのアクセスを許可してください",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }
      await startWalk();
    })();
  }, []);

  const handleEndWalk = useCallback(async () => {
    await endWalk();
    router.replace("/walk/confirm");
  }, [endWalk, router]);

  const handleCancel = useCallback(() => {
    Alert.alert("おさんぽをやめる", "記録は保存されません。よろしいですか？", [
      { text: "続ける", style: "cancel" },
      {
        text: "やめる",
        style: "destructive",
        onPress: () => {
          cancelWalk();
          router.back();
        },
      },
    ]);
  }, [cancelWalk, router]);

  const activePhotos = detectedPhotos.filter((p) => !p.excluded);

  return (
    <SafeAreaView className="flex-1 bg-sand-50">
      {/* ヘッダー */}
      <View className="px-5 pt-3 flex-row items-center justify-between">
        <Pressable onPress={handleCancel}>
          <Text className="text-forest-400 text-base">やめる</Text>
        </Pressable>
        <View className="flex-row items-center">
          <View className="w-2.5 h-2.5 rounded-full bg-red-400 mr-2" />
          <Text className="text-forest-700 font-semibold">おさんぽ中</Text>
        </View>
        <View className="w-12" />
      </View>

      {/* 経過時間 */}
      <View className="items-center mt-8 mb-6">
        <Text
          className="text-5xl font-light"
          style={{ color: Colors.forest[700], fontVariant: ["tabular-nums"] }}
        >
          {elapsedFormatted}
        </Text>
        <Text className="text-forest-400 text-sm mt-1">
          {activePhotos.length}枚の写真
        </Text>
      </View>

      {/* 写真プレビュー */}
      <FlatList
        data={detectedPhotos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        columnWrapperStyle={{ gap: 4 }}
        ItemSeparatorComponent={() => <View className="h-1" />}
        ListEmptyComponent={
          <View className="items-center pt-16">
            <Text className="text-5xl mb-4">📷</Text>
            <Text className="text-forest-400 text-sm text-center px-8">
              カメラで写真を撮ると{"\n"}ここに表示されます
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => togglePhotoExclusion(item.id)}
            className="flex-1 aspect-square rounded-lg overflow-hidden"
            style={{ opacity: item.excluded ? 0.3 : 1 }}
          >
            <Image source={{ uri: item.uri }} className="w-full h-full" />
            {item.excluded && (
              <View className="absolute inset-0 items-center justify-center bg-black/30">
                <Text className="text-white text-2xl">✕</Text>
              </View>
            )}
          </Pressable>
        )}
      />

      {/* おしまいボタン */}
      <View className="px-5 pb-8 pt-4">
        <Pressable
          onPress={handleEndWalk}
          className="bg-forest-500 py-4 rounded-2xl items-center active:opacity-80"
        >
          <Text className="text-white text-lg font-semibold">おしまい</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
