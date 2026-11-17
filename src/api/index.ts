import { IFoodApi } from "./IFoodApi";
import { LocalFoodApi } from "./LocalFoodApi";

/**
 * The single IFoodApi instance used by the app. When the backend exists,
 * swap this for `new RemoteFoodApi(baseUrl)`: nothing else needs to change.
 */
export const foodApi: IFoodApi = new LocalFoodApi();

export type { IFoodApi };
