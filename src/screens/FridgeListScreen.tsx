import React, { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useFood } from "../context/FoodContext";
import { FoodListItem } from "../components/FoodListItem";

type Props = NativeStackScreenProps<RootStackParamList, "FridgeList">;

export function FridgeListScreen({ navigation }: Props) {
  const { items, loading, refresh } = useFood();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        item.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [items, query]
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Cerca alimento..."
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.iconButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Il tuo frigo è vuoto. Aggiungi il primo alimento con "+".
          </Text>
        }
        renderItem={({ item }) => (
          <FoodListItem
            item={item}
            onPress={() => navigation.navigate("ItemForm", { itemId: item.id })}
          />
        )}
      />

      <View style={styles.fabRow}>
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => navigation.navigate("Scanner")}
        >
          <Text style={styles.fabText}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("ItemForm", {})}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  search: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconButtonText: {
    fontSize: 20,
  },
  empty: {
    textAlign: "center",
    marginTop: 48,
    color: "#888",
    paddingHorizontal: 24,
  },
  fabRow: {
    position: "absolute",
    right: 20,
    bottom: 24,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabSecondary: {
    backgroundColor: "#455A64",
  },
  fabText: {
    color: "#fff",
    fontSize: 26,
    lineHeight: 28,
  },
});
