import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Rota" }} />
      <Tabs.Screen name="schedule" options={{ title: "My Schedule" }} />
      <Tabs.Screen name="availability" options={{ title: "Availability" }} />
    </Tabs>
  );
}