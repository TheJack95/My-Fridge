import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { foodApi } from "../api";
import { parseProductQuantity } from "../utils/quantity";

type Props = NativeStackScreenProps<RootStackParamList, "Scanner">;

export function ScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Serve il permesso della fotocamera per scansionare un codice a barre.
        </Text>
        <Text style={styles.link} onPress={requestPermission}>
          Concedi permesso
        </Text>
      </View>
    );
  }

  const handleScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    let prefill: NonNullable<RootStackParamList["ItemForm"]["prefill"]> = {
      barcode: data,
    };
    try {
      const product = await foodApi.lookupBarcode(data);
      if (product) {
        const brandMissing =
          product.brand &&
          !product.name.toLowerCase().includes(product.brand.toLowerCase());
        prefill = {
          ...prefill,
          name: product.name
            ? brandMissing
              ? `${product.name} (${product.brand})`
              : product.name
            : product.brand,
          photoUri: product.imageUrl,
          ...parseProductQuantity(product.quantity),
        };
      } else {
        Alert.alert(
          "Prodotto non trovato",
          "Il codice è stato letto ma il prodotto non è nel database. Inserisci il nome a mano."
        );
      }
    } catch (error) {
      // Offline or timeout: don't leave the user stuck on the scanner.
      console.warn("Ricerca barcode fallita", error);
      Alert.alert(
        "Ricerca non riuscita",
        "Non è stato possibile cercare il prodotto (connessione assente?). Inserisci il nome a mano."
      );
    } finally {
      setLoading(false);
    }
    navigation.replace("ItemForm", { prefill });
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
        }}
        onBarcodeScanned={scanned ? undefined : handleScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>Inquadra il codice a barre del prodotto</Text>
        {loading && <ActivityIndicator color="#fff" style={{ marginTop: 12 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  message: { textAlign: "center", color: "#333" },
  link: { color: "#2E7D32", fontWeight: "600" },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
  },
  hint: { color: "#fff", marginTop: 16 },
});
