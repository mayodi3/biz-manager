import type { Models } from "node-appwrite";
import { State } from "./states/state";

interface User extends Models.Document {
  phone: string;
  name: string;
  business: string;
  location: string;
}

interface StockModel {
  total: number;
  documents: Stock[];
}

interface Stock extends Models.Document {
  $id: string;
  name: string;
  quantity: number;
  amount_per_unit: number;
  measurement_scale: string;
  userId: string;
}

interface UserData {
  name?: string;
  businessType?: string;
  location?: string;
  selectedStock?: Stock;
  revenueAmount?: string;
  revenueQuantity?: string;
  expenseType?: string;
  expenseTypeAmount?: string;
  stockName?: string;
  stockQuantity?: string;
  stockUnitType?: string;
  stockUnitPrice?: string;
  goalAmount?: string;
  reminderAmout?: string;
  remiderInterval?: string;
}

interface SessionData {
  state?: State;
  userData?: UserData;
}

interface Transaction extends Models.Document {
  userId: string;
  type: "income" | "expense";
  amount: number;
  timeStamp: string;
}

export type { User, SessionData, Stock, StockModel, Transaction };
