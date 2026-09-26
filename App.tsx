import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FoodProvider } from "./src/context/FoodContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <FoodProvider>
        <RootNavigator />
      </FoodProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
