import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { daysUntil, isExpired, isExpiringSoon } from "../utils/date";

export function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const days = daysUntil(expiryDate);
  const expired = isExpired(expiryDate);
  const soon = isExpiringSoon(expiryDate);

  const label = expired
    ? `Scaduto da ${Math.abs(days)}g`
    : days === 0
      ? "Scade oggi"
      : `Scade tra ${days}g`;

  const color = expired ? "#B00020" : soon ? "#C77700" : "#2E7D32";
  const background = expired ? "#FDE7E9" : soon ? "#FFF3E0" : "#E8F5E9";

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
