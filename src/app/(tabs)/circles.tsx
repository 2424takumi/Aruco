import { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { Colors } from "@/constants/colors";
import type { Circle, CircleMember, User } from "@/types/database";

interface CircleWithMembers extends Circle {
  members: (CircleMember & { user: User })[];
}

export default function CirclesScreen() {
  const [circles, setCircles] = useState<CircleWithMembers[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) fetchCircles();
  }, [isAuthenticated]);

  const fetchCircles = async () => {
    const { data } = await supabase
      .from("circles")
      .select(`
        *,
        members:circle_members(
          *,
          user:users(*)
        )
      `);
    if (data) setCircles(data as CircleWithMembers[]);
  };

  const createCircle = async () => {
    if (!newCircleName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("circles")
      .insert({ name: newCircleName.trim(), created_by: user.id })
      .select()
      .single();

    if (error) {
      Alert.alert("エラー", "サークルの作成に失敗しました");
      return;
    }

    // 作成者をメンバーに追加
    await supabase.from("circle_members").insert({
      circle_id: data.id,
      user_id: user.id,
      role: "owner",
    });

    setNewCircleName("");
    setShowCreate(false);
    fetchCircles();
  };

  const createInviteLink = async (circleId: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase.from("circle_invites").insert({
      circle_id: circleId,
      invited_by: (await supabase.auth.getUser()).data.user?.id,
      invite_code: code,
    });

    if (!error) {
      Alert.alert("招待コード", `招待コード: ${code}\nこのコードを相手に伝えてください`);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-sand-50 items-center justify-center">
        <Text className="text-forest-500 text-base">
          ログインしてサークルを管理しましょう
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-sand-50" edges={["top"]}>
      <View className="px-5 pt-3 pb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold" style={{ color: Colors.forest[700] }}>
          サークル
        </Text>
        <Pressable
          onPress={() => setShowCreate(true)}
          className="bg-forest-500 px-4 py-2 rounded-xl active:opacity-80"
        >
          <Text className="text-white text-sm font-semibold">作成</Text>
        </Pressable>
      </View>

      {showCreate && (
        <View className="mx-4 mb-4 bg-white p-4 rounded-2xl">
          <Text className="text-forest-700 font-semibold mb-2">
            新しいサークル
          </Text>
          <TextInput
            value={newCircleName}
            onChangeText={setNewCircleName}
            placeholder="サークル名（例: 家族、まちあるき部）"
            placeholderTextColor={Colors.gray[400]}
            className="bg-sand-100 px-4 py-3 rounded-xl text-forest-800 mb-3"
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setShowCreate(false)}
              className="flex-1 py-3 rounded-xl bg-sand-200 items-center"
            >
              <Text className="text-forest-500">キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={createCircle}
              className="flex-1 py-3 rounded-xl bg-forest-500 items-center active:opacity-80"
            >
              <Text className="text-white font-semibold">作成</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={circles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-5xl mb-4">👥</Text>
            <Text className="text-forest-500 text-base font-medium mb-2">
              サークルがありません
            </Text>
            <Text className="text-gray-400 text-sm text-center px-8">
              サークルを作成して、親しい人を招待しましょう
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-forest-700 text-lg font-semibold">
                {item.name}
              </Text>
              <Text className="text-gray-400 text-xs">
                {item.members?.length ?? 0}人
              </Text>
            </View>

            {/* メンバーアイコン */}
            <View className="flex-row mb-3">
              {item.members?.slice(0, 5).map((m) => (
                <View
                  key={m.id}
                  className="w-8 h-8 rounded-full bg-forest-100 items-center justify-center -mr-1 border-2 border-white"
                >
                  <Text className="text-xs">
                    {m.user?.display_name?.charAt(0) ?? "?"}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => createInviteLink(item.id)}
              className="bg-sand-100 py-2.5 rounded-xl items-center active:opacity-80"
            >
              <Text className="text-forest-500 text-sm font-medium">
                招待する
              </Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
