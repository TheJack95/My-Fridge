import AsyncStorage from "@react-native-async-storage/async-storage";
import { IFoodApi } from "./IFoodApi";
import {
  BarcodeProduct,
  CreateFoodItemInput,
  FoodItem,
  UpdateFoodItemInput,
} from "../types";
import { generateId } from "../utils/id";
import { lookupBarcodeOnline } from "../services/barcodeLookupService";

const STORAGE_KEY = "@my_fridge/items";

async function readAll(): Promise<FoodItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as FoodItem[]) : [];
}

async function writeAll(items: FoodItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * On-device implementation of the shared IFoodApi contract, used until the
 * real backend (docs/openapi.yaml) is available. Replacing this with an
 * HTTP-backed `RemoteFoodApi` should require no changes outside src/api.
 */
export class LocalFoodApi implements IFoodApi {
  async listItems(): Promise<FoodItem[]> {
    const items = await readAll();
    return items.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }

  async getItem(id: string): Promise<FoodItem | null> {
    const items = await readAll();
    return items.find((item) => item.id === id) ?? null;
  }

  async createItem(input: CreateFoodItemInput): Promise<FoodItem> {
    const items = await readAll();
    const now = new Date().toISOString();
    const newItem: FoodItem = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await writeAll([...items, newItem]);
    return newItem;
  }

  async updateItem(id: string, input: UpdateFoodItemInput): Promise<FoodItem> {
    const items = await readAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Alimento con id ${id} non trovato`);
    }
    const updated: FoodItem = {
      ...items[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    await writeAll(items);
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    const items = await readAll();
    await writeAll(items.filter((item) => item.id !== id));
  }

  async lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
    return lookupBarcodeOnline(barcode);
  }
}

export const foodApi = new LocalFoodApi();
