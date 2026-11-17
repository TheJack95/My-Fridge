import { IFoodApi } from "./IFoodApi";
import {
  BarcodeProduct,
  CreateFoodItemInput,
  FoodItem,
  UpdateFoodItemInput,
} from "../types";

/**
 * Placeholder for the future HTTP client implementing IFoodApi against the
 * real backend described in docs/openapi.yaml. Not wired up yet: the app
 * currently uses LocalFoodApi. Fill this in once the backend exists and
 * swap the instance exported by src/api/index.ts.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string
  ) {
    super(`API error ${status} on ${path}`);
  }
}

export class RemoteFoodApi implements IFoodApi {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!response.ok) {
      throw new ApiError(response.status, path);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }

  listItems(): Promise<FoodItem[]> {
    return this.request<FoodItem[]>("/items");
  }

  async getItem(id: string): Promise<FoodItem | null> {
    try {
      return await this.request<FoodItem>(`/items/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  createItem(input: CreateFoodItemInput): Promise<FoodItem> {
    return this.request<FoodItem>("/items", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateItem(id: string, input: UpdateFoodItemInput): Promise<FoodItem> {
    return this.request<FoodItem>(`/items/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteItem(id: string): Promise<void> {
    return this.request<void>(`/items/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
    try {
      return await this.request<BarcodeProduct>(
        `/barcode/${encodeURIComponent(barcode)}`
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }
}
