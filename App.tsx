import React, { useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { FoodProvider, useFood } from "./src/context/FoodContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { LoadingScreen } from "./src/components/LoadingScreen";

// Keep the native splash visible until the first JS screen is on screen.
SplashScreen.preventAutoHideAsync().catch(() => {});

function AppContent() {
  const { ready } = useFood();

  const hideSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <>
      {ready ? <RootNavigator /> : <LoadingScreen onLayout={hideSplash} />}
      <StatusBar style={ready ? "auto" : "light"} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FoodProvider>
        <AppContent />
      </FoodProvider>
    </SafeAreaProvider>
  );
}
