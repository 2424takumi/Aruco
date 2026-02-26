import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { Colors } from "@/constants/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-sand-50 items-center justify-center">
        <Pressable
          onPress={() => router.push("/auth")}
          className="bg-forest-500 px-8 py-4 rounded-2xl active:opacity-80"
        >
          <Text className="text-white text-base font-semibold">ログイン</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-sand-50" edges={["top"]}>
      <View className="px-5 pt-3 pb-4">
        <Text className="text-2xl font-bold" style={{ color: Colors.forest[700] }}>
          プロフィール
        </Text>
      </View>

      <View className="px-5">
        {/* プロフィールカード */}
        <View className="bg-white rounded-2xl p-5 mb-4 items-center">
          <View className="w-20 h-20 rounded-full bg-forest-100 items-center justify-center mb-3">
            <Text className="text-3xl">
              {user?.display_name?.charAt(0) ?? "?"}
            </Text>
          </View>
          <Text className="text-forest-700 text-xl font-bold">
            {user?.display_name ?? "名無し"}
          </Text>
        </View>

        {/* メニュー */}
        <View className="bg-white rounded-2xl overflow-hidden">
          <MenuItem label="表示名を変更" icon="✏️" onPress={() => {}} />
          <MenuItem label="通知設定" icon="🔔" onPress={() => {}} />
          <MenuItem label="プライバシー" icon="🔒" onPress={() => {}} />
          <View className="h-px bg-sand-200" />
          <MenuItem
            label="ログアウト"
            icon="👋"
            onPress={signOut}
            danger
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  label,
  icon,
  onPress,
  danger,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 active:bg-sand-50"
    >
      <Text className="text-lg mr-3">{icon}</Text>
      <Text
        className={`text-base ${danger ? "text-red-500" : "text-forest-700"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
