import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { foodApi } from "../api/LocalFoodApi";

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
    try {
      const product = await foodApi.lookupBarcode(data);
      navigation.replace("ItemForm", {
        prefill: {
          barcode: data,
          name: product?.name,
        },
      });
    } finally {
      setLoading(false);
    }
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
