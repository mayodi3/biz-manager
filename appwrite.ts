import { Account, Client, Databases } from "node-appwrite";

export const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY!);

const database = new Databases(client);
const account = new Account(client);

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const userCollectionId = process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID!;
const expenseCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_EXPENSE_COLLECTION_ID!;
const stockCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STOCK_COLLECTION_ID!;
const revenueCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_REVENUE_COLLECTION_ID!;

export { ID, Query } from "node-appwrite";
export {
  account,
  database,
  databaseId,
  userCollectionId,
  expenseCollectionId,
  revenueCollectionId,
  stockCollectionId,
};
