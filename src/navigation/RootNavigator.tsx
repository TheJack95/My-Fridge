import React, { useEffect, useState } from "react";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FridgeListScreen } from "../screens/FridgeListScreen";
import { ItemFormScreen } from "../screens/ItemFormScreen";
import { ScannerScreen } from "../screens/ScannerScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useFood } from "../context/FoodContext";

export type RootStackParamList = {
  FridgeList: undefined;
  ItemForm: {
    itemId?: string;
    prefill?: {
      name?: string;
      barcode?: string;
      photoUri?: string;
      quantity?: number;
      unit?: string;
    };
  };
  Scanner: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * On Android the last response can survive app restarts: remember which
 * one was handled so reopening the app doesn't jump to the item again.
 */
const HANDLED_RESPONSE_KEY = "@my_fridge/last_handled_notification";

/** Opens the item a tapped expiry reminder refers to (also on cold start). */
function useOpenItemFromNotification(navReady: boolean) {
  const { items } = useFood();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!navReady || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const { identifier, content } = response.notification.request;
    const responseKey = `${identifier}@${response.notification.date}`;
    const itemId = content.data?.itemId;
    let cancelled = false;

    (async () => {
      const handled = await AsyncStorage.getItem(HANDLED_RESPONSE_KEY);
      if (cancelled || handled === responseKey) return;
      await AsyncStorage.setItem(HANDLED_RESPONSE_KEY, responseKey);
      if (typeof itemId === "string" && items.some((item) => item.id === itemId)) {
        navigationRef.navigate("ItemForm", { itemId });
      }
    })().catch((error) => console.warn("Apertura da notifica fallita", error));

    return () => {
      cancelled = true;
    };
    // `items` is read only to skip reminders for deleted items; re-running
    // on every list change isn't needed (the handled key prevents repeats).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navReady, response]);
}

export function RootNavigator() {
  const [navReady, setNavReady] = useState(false);
  useOpenItemFromNotification(navReady);

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)}>
      <Stack.Navigator initialRouteName="FridgeList">
        <Stack.Screen
          name="FridgeList"
          component={FridgeListScreen}
          options={{ title: "Il mio frigo" }}
        />
        <Stack.Screen name="ItemForm" component={ItemFormScreen} />
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{ title: "Scansiona codice a barre" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Notifiche" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
