import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FridgeListScreen } from "../screens/FridgeListScreen";
import { ItemFormScreen } from "../screens/ItemFormScreen";
import { ScannerScreen } from "../screens/ScannerScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

export type RootStackParamList = {
  FridgeList: undefined;
  ItemForm: {
    itemId?: string;
    prefill?: { name?: string; barcode?: string; photoUri?: string };
  };
  Scanner: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
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
