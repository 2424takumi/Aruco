import { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, FlatList, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useWalkStore } from "@/stores/walk-store";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";
import type { Circle } from "@/types/database";

export default function WalkConfirmScreen() {
  const router = useRouter();
  const { currentWalk, detectedPhotos, togglePhotoExclusion, shareWalk } =
    useWalkStore();
  const [note, setNote] = useState("");
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const activePhotos = detectedPhotos.filter((p) => !p.excluded);
  const durationMinutes = currentWalk?.duration_seconds
    ? Math.floor(currentWalk.duration_seconds / 60)
    : 0;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("circles").select("*");
      if (data && data.length > 0) {
        setCircles(data);
        setSelectedCircleId(data[0].id);
      }
    })();
  }, []);

  const handleShare = async () => {
    if (!selectedCircleId) {
      Alert.alert("サークルを選択", "共有先のサークルを選択してください");
      return;
    }

    setIsSharing(true);
    try {
      await shareWalk(selectedCircleId, note || undefined);
      router.dismissAll();
    } catch {
      Alert.alert("エラー", "共有に失敗しました");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert("記録を破棄", "このおさんぽの記録を破棄しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "破棄",
        style: "destructive",
        onPress: () => {
          useWalkStore.getState().cancelWalk();
          router.dismissAll();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-sand-50">
      {/* ヘッダー */}
      <View className="px-5 pt-3 pb-4 flex-row items-center justify-between">
        <Pressable onPress={handleDiscard}>
          <Text className="text-gray-400 text-base">破棄</Text>
        </Pressable>
        <Text className="text-forest-700 text-lg font-semibold">
          おさんぽの確認
        </Text>
        <View className="w-8" />
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            {/* サマリー */}
            <View className="bg-white rounded-2xl p-4 mb-4 flex-row justify-around">
              <View className="items-center">
                <Text className="text-forest-700 text-2xl font-bold">
                  {durationMinutes}
                </Text>
                <Text className="text-gray-400 text-xs">分</Text>
              </View>
              <View className="w-px bg-sand-200" />
              <View className="items-center">
                <Text className="text-forest-700 text-2xl font-bold">
                  {activePhotos.length}
                </Text>
                <Text className="text-gray-400 text-xs">枚</Text>
              </View>
            </View>

            {/* ひとことメモ */}
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="ひとことメモ（任意）"
              placeholderTextColor={Colors.gray[400]}
              className="bg-white px-4 py-3.5 rounded-2xl text-forest-700 mb-4"
              maxLength={100}
            />

            {/* サークル選択 */}
            {circles.length > 0 && (
              <View className="mb-4">
                <Text className="text-forest-500 text-sm font-medium mb-2 px-1">
                  共有先
                </Text>
                <View className="flex-row gap-2">
                  {circles.map((circle) => (
                    <Pressable
                      key={circle.id}
                      onPress={() => setSelectedCircleId(circle.id)}
                      className={`px-4 py-2.5 rounded-xl ${
                        selectedCircleId === circle.id
                          ? "bg-forest-500"
                          : "bg-white"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selectedCircleId === circle.id
                            ? "text-white"
                            : "text-forest-500"
                        }`}
                      >
                        {circle.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* 写真タイトル */}
            <Text className="text-forest-500 text-sm font-medium mb-2 px-1">
              写真（タップで除外）
            </Text>
          </>
        }
        data={detectedPhotos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 4 }}
        ItemSeparatorComponent={() => <View className="h-1" />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
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

      {/* 共有ボタン */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-sand-50">
        <Pressable
          onPress={handleShare}
          disabled={isSharing || activePhotos.length === 0}
          className={`py-4 rounded-2xl items-center ${
            isSharing || activePhotos.length === 0
              ? "bg-gray-300"
              : "bg-forest-500 active:opacity-80"
          }`}
        >
          <Text className="text-white text-lg font-semibold">
            {isSharing ? "共有中..." : "おさんぽを共有"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
