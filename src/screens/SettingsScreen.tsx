import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFood } from "../context/FoodContext";
import { requestNotificationPermissions } from "../services/notificationService";

export function SettingsScreen() {
  const { settings, updateSettings } = useFood();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [first, setFirst] = useState(String(settings.firstReminderDaysBefore));
  const [second, setSecond] = useState(String(settings.secondReminderDaysBefore));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const handleSave = async () => {
    const firstDays = parseInt(first, 10);
    const secondDays = parseInt(second, 10);

    if (Number.isNaN(firstDays) || Number.isNaN(secondDays) || firstDays < 0 || secondDays < 0) {
      Alert.alert("Valori non validi", "Inserisci numeri di giorni interi e non negativi.");
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        enabled,
        firstReminderDaysBefore: firstDays,
        secondReminderDaysBefore: secondDays,
      });
      Alert.alert("Salvato", "Le notifiche sono state aggiornate.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Notifiche di scadenza attive</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>

      <Text style={styles.sectionTitle}>Promemoria (giorni prima della scadenza)</Text>

      <Text style={styles.label}>Primo promemoria</Text>
      <TextInput
        style={styles.input}
        value={first}
        onChangeText={setFirst}
        keyboardType="number-pad"
        editable={enabled}
      />

      <Text style={styles.label}>Secondo promemoria</Text>
      <TextInput
        style={styles.input}
        value={second}
        onChangeText={setSecond}
        keyboardType="number-pad"
        editable={enabled}
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? "Salvataggio..." : "Salva impostazioni"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  sectionTitle: { fontWeight: "700", marginTop: 16, marginBottom: 4 },
  label: { fontWeight: "600", marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },
  saveButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
