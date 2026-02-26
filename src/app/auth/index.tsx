import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { Colors } from "@/constants/colors";

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithApple, signInWithGoogle } = useAuthStore();

  const handleSignIn = async (provider: "apple" | "google") => {
    try {
      if (provider === "apple") {
        await signInWithApple();
      } else {
        await signInWithGoogle();
      }
      router.back();
    } catch {
      // エラーは静かに処理
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-sand-50">
      <View className="flex-1 px-8 justify-center items-center">
        {/* ロゴエリア */}
        <View className="items-center mb-12">
          <Text className="text-6xl mb-4">🚶</Text>
          <Text
            className="text-3xl font-bold mb-2"
            style={{ color: Colors.forest[700] }}
          >
            あるこ
          </Text>
          <Text className="text-forest-400 text-sm text-center leading-5">
            散歩中の写真が、親しい人のもとに{"\n"}自然と届くアプリ
          </Text>
        </View>

        {/* サインインボタン */}
        <View className="w-full gap-3">
          <Pressable
            onPress={() => handleSignIn("apple")}
            className="bg-forest-800 flex-row items-center justify-center py-4 rounded-2xl active:opacity-80"
          >
            <Text className="text-white text-base font-semibold">
              Apple でサインイン
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSignIn("google")}
            className="bg-white border border-sand-300 flex-row items-center justify-center py-4 rounded-2xl active:opacity-80"
          >
            <Text className="text-forest-700 text-base font-semibold">
              Google でサインイン
            </Text>
          </Pressable>
        </View>

        {/* フッター */}
        <Text className="text-gray-400 text-xs text-center mt-8 px-4 leading-4">
          サインインすると利用規約とプライバシーポリシーに同意したものとみなされます
        </Text>
      </View>

      {/* 閉じるボタン */}
      <Pressable
        onPress={() => router.back()}
        className="absolute top-16 right-5"
      >
        <Text className="text-forest-400 text-base">閉じる</Text>
      </Pressable>
    </SafeAreaView>
  );
}
