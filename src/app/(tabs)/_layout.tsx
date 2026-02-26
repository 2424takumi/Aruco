import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { Colors } from "@/constants/colors";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: "🏠",
    circles: "👥",
    profile: "👤",
  };
  return (
    <View className="items-center justify-center">
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>
        {icons[name] ?? "?"}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.sand[200],
          height: 85,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.forest[600],
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ホーム",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="index" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: "サークル",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="circles" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "プロフィール",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
