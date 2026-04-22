import { Redirect } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/signin" />;
  }

  return <Redirect href="/(tabs)" />;
}