import { ObjectId } from "mongoose";
import {
  ProductCollection,
  ProductSize,
  ProductStatus,
} from "../enums/product.enum";

export interface Product {
  _id: ObjectId;
  productStatus: ProductStatus;
  productCollection: ProductCollection;
  productName: string;
  productPrice: number;
  productLeftCount: number;
  productSize: ProductSize;
  productVolume: number;
  productDesc?: string;
  productImages: string[];
  productViews: number;
  productLikes: number;
  createdAt: Date;
  updatedAt: Date;
}

/** SPA: menyu so'rovi */
export interface ProductInquiry {
  order: ProductOrder;
  page: number;
  limit: number;
  productCollection?: ProductCollection;
  search?: string;
}

export type ProductOrder = "createdAt" | "productPrice" | "productViews" | "productLikes";
export const PRODUCT_ORDERS: readonly ProductOrder[] = [
  "createdAt",
  "productPrice",
  "productViews",
  "productLikes",
];

export interface ProductList {
  list: Product[];
  total: number;
}

/** Tafsilot sahifasi: a'zo like bosganmi */
export interface ProductDetail extends Product {
  meLiked: boolean;
}

export interface ProductInput {
  productStatus?: ProductStatus;
  productCollection: ProductCollection;
  productName: string;
  productPrice: number;
  productLeftCount: number;
  productSize?: ProductSize;
  productVolume?: number;
  productDesc?: string;
  productImages?: string[];
}

export interface ProductUpdateInput {
  productStatus?: ProductStatus;
  productCollection?: ProductCollection;
  productName?: string;
  productPrice?: number;
  productLeftCount?: number;
  productSize?: ProductSize;
  productVolume?: number;
  productDesc?: string;
}

/** Admin yangilay oladigan maydonlar (views, likes, images — yo'q) */
export const PRODUCT_UPDATABLE_FIELDS = [
  "productStatus",
  "productCollection",
  "productName",
  "productPrice",
  "productLeftCount",
  "productSize",
  "productVolume",
  "productDesc",
] as const;
