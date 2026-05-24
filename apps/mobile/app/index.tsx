import { SENTIENT_PROJECT } from "@sentient/shared";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Phase 0</Text>
      <Text style={styles.title}>{SENTIENT_PROJECT.name}</Text>
      <Text style={styles.body}>Human approval workflows will start here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F7F8FA",
  },
  eyebrow: {
    marginBottom: 12,
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    marginBottom: 16,
    color: "#111827",
    fontSize: 48,
    fontWeight: "800",
  },
  body: {
    color: "#4B5563",
    fontSize: 18,
    lineHeight: 28,
  },
});
