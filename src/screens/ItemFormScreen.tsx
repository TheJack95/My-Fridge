import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useFood } from "../context/FoodContext";
import { FoodItem } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ItemForm">;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function ItemFormScreen({ route, navigation }: Props) {
  const { itemId, prefill } = route.params ?? {};
  const { items, addItem, editItem, removeItem } = useFood();
  const existing = items.find((item) => item.id === itemId);

  const [name, setName] = useState(existing?.name ?? prefill?.name ?? "");
  const [quantity, setQuantity] = useState(String(existing?.quantity ?? 1));
  const [unit, setUnit] = useState(existing?.unit ?? "pz");
  const [expiryDate, setExpiryDate] = useState<Date>(
    existing ? new Date(existing.expiryDate) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>(
    existing?.photoUri ?? prefill?.photoUri
  );
  const [barcode] = useState<string | undefined>(existing?.barcode ?? prefill?.barcode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: existing ? "Modifica alimento" : "Nuovo alimento" });
  }, [existing, navigation]);

  const pickPhoto = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permesso negato", "Serve il permesso per continuare.");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true });

    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Nome mancante", "Inserisci il nome dell'alimento.");
      return;
    }
    const parsedQuantity = Number(quantity.replace(",", "."));
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("Quantità non valida", "Inserisci un numero maggiore di zero.");
      return;
    }

    setSaving(true);
    try {
      const payload: Omit<FoodItem, "id" | "createdAt" | "updatedAt"> = {
        name: name.trim(),
        quantity: parsedQuantity,
        unit: unit.trim() || "pz",
        expiryDate: toIsoDate(expiryDate),
        photoUri,
        barcode,
      };

      if (existing) {
        await editItem(existing.id, payload);
      } else {
        await addItem(payload);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Errore", "Non è stato possibile salvare l'alimento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert("Eliminare alimento?", `Rimuovere "${existing.name}" dal frigo?`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          await removeItem(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.photoBox} onPress={() => pickPhoto(true)}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.photoPlaceholder}>Tocca per scattare una foto</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => pickPhoto(false)}>
        <Text style={styles.link}>Scegli dalla libreria</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Es. Latte" />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>Quantità</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.label}>Unità</Text>
          <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="pz, g, l..." />
        </View>
      </View>

      <Text style={styles.label}>Data di scadenza</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text>{toIsoDate(expiryDate)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={expiryDate}
          mode="date"
          onChange={(_, selected) => {
            setShowDatePicker(false);
            if (selected) setExpiryDate(selected);
          }}
        />
      )}

      {barcode && <Text style={styles.barcodeText}>Codice a barre: {barcode}</Text>}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? "Salvataggio..." : "Salva"}</Text>
      </TouchableOpacity>

      {existing && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Elimina alimento</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  photoBox: {
    height: 160,
    borderRadius: 12,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  photoPlaceholder: { color: "#888" },
  link: { color: "#2E7D32", textAlign: "center", marginBottom: 8 },
  label: { fontWeight: "600", marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    justifyContent: "center",
  },
  row: { flexDirection: "row", gap: 12 },
  flex1: { flex: 1 },
  barcodeText: { color: "#666", marginTop: 8 },
  saveButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: { color: "#fff", fontWeight: "700" },
  deleteButton: { padding: 14, alignItems: "center" },
  deleteButtonText: { color: "#B00020", fontWeight: "600" },
  disabled: { opacity: 0.6 },
});
