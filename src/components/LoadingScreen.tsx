import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/**
 * Shown while the fridge contents are first loaded from storage. Uses the same
 * background as the native splash screen (app.json) so the handoff is seamless.
 */
export function LoadingScreen({ onLayout }: { onLayout?: () => void }) {
  return (
    <View style={styles.container} onLayout={onLayout}>
      <Text style={styles.logo}>🧊</Text>
      <Text style={styles.title}>My Fridge</Text>
      <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
      <Text style={styles.subtitle}>Caricamento del frigo...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontSize: 64,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 12,
  },
  spinner: {
    marginTop: 32,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 12,
  },
});
