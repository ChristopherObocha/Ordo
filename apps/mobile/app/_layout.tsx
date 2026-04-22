import { ConvexReactClient, useQuery } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Stack, useRouter, useSegments } from "expo-router";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const user = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (user === undefined) return;

    const inTabs = segments[0] === "(tabs)";
    const inAuth = segments[0] === "signin" || segments[0] === "otp";

    if (!user && inTabs) {
      router.replace("/signin");
    }

    if (user && inAuth) {
      router.replace("/(tabs)");
    }
  }, [user, segments, router]);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <AuthGate />
    </ConvexAuthProvider>
  );
}