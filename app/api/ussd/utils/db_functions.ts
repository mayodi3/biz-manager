import {
  database,
  databaseId,
  expenseCollectionId,
  Query,
  stockCollectionId,
  userCollectionId,
} from "@/appwrite";
import { Stock, Transaction, User } from "../types";

export async function checkUserRegistration(phoneNumber: string) {
  const user = await database.listDocuments<User>(
    databaseId,
    userCollectionId,
    [Query.equal("phone", phoneNumber)]
  );

  return {
    userExists: user.total > 0,
    currentUser: user.documents[0],
  };
}

export async function fetchTransactions(userId: string, period: string) {
  try {
    let startDate;
    const today = new Date();

    switch (period) {
      case "today":
        startDate = today.toISOString().split("T")[0];
        break;
      case "week":
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        startDate = lastWeek.toISOString();
        break;
      case "month":
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        startDate = firstDayOfMonth.toISOString();
        break;
    }

    if (!startDate) {
      throw new Error("Invalid period provided");
    }

    const transactions = await database.listDocuments<Transaction>(
      databaseId,
      expenseCollectionId,
      [
        Query.equal("userId", userId),
        Query.greaterThanEqual("timeStamp", startDate),
      ]
    );

    return transactions.documents;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export function calculateSummary(transactions: Transaction[]) {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
    } else if (transaction.type === "expense") {
      totalExpenses += transaction.amount;
    }
  });

  const profit = totalIncome - totalExpenses;
  const savingsSuggestion = profit > 0 ? profit * 0.1 : 0;

  return { totalIncome, totalExpenses, profit, savingsSuggestion };
}

export function formatSummaryResponse(
  totalIncome: number,
  totalExpenses: number,
  profit: number,
  savingsSuggestion: number,
  period: string
) {
  return `END ${period.toUpperCase()}'s Summary:

          Total Income: Ksh ${totalIncome}
          Total Expenses: Ksh ${totalExpenses}
          Net Profit / Loss: Ksh ${profit}
          Suggested Savings: Ksh ${savingsSuggestion}`;
}

export async function getCurrentStocks(userId: string) {
  try {
    const stocks = await database.listDocuments<Stock>(
      databaseId,
      stockCollectionId,
      [Query.equal("userId", [userId])]
    );
    return stocks;
  } catch (error) {
    console.error(error);
  }
}
