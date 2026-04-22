import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export default function ClergyScreen() {
  const parish = useQuery(api.parishes.getMyParish);
  const clergy = useQuery(
    api.clergy.list,
    parish ? { parishId: parish._id } : "skip"
  );

  if (!parish || !clergy) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clergy</Text>
      <FlatList
        data={clergy}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No clergy added yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <View style={styles.tags}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.type}</Text>
                </View>
                <View
                  style={[
                    styles.tag,
                    item.status === "active" ? styles.tagGreen : styles.tagYellow,
                  ]}
                >
                  <Text style={styles.tagText}>{item.status}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  list: { paddingHorizontal: 20, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  name: { fontSize: 16, fontWeight: "600" },
  email: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  tags: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  tag: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  tagGreen: { backgroundColor: "#f0fdf4" },
  tagYellow: { backgroundColor: "#fefce8" },
  tagText: { fontSize: 12, color: "#374151" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
});