import { NextRequest, NextResponse } from "next/server";
import {
  database,
  Query,
  ID,
  userCollectionID,
  databaseID,
  recordsCollectionID,
} from "@/appwrite";

import { type Models } from "node-appwrite";

// Define interfaces for type safety
interface User extends Models.Document {
  phone: string;
  name: string;
  business: string;
  location: string;
}

interface RecordsData extends Models.Document {
  userId: string;
  type: string;
  amount: number;
  timestamp: string;
}

// Function to check user registration
async function checkUserRegistration(phoneNumber: string) {
  const user = await database.listDocuments(databaseID, userCollectionID, [
    Query.equal("phone", phoneNumber),
  ]);
  return {
    userExists: user.total > 0,
    currentUser: user.documents[0] as User,
  };
}

// Function to fetch transactions
async function fetchTransactions(userId: string, period: string) {
  try {
    let startDate: string | undefined;
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

    const transactions = await database.listDocuments(
      databaseID,
      recordsCollectionID,
      [
        Query.equal("userId", userId),
        Query.greaterThanEqual("timeStamp", startDate),
      ]
    );

    return transactions.documents as RecordsData[];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// Function to calculate summary
function calculateSummary(transactions: RecordsData[]) {
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

// Function to format summary response
function formatSummaryResponse(
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
  Suggested Savings: Ksh ${savingsSuggestion}
  `;
}

// Function to display the main menu
function mainMenu() {
  return `CON Welcome to [App Name]
  1. User Profile
  2. Record Keeping
  3. Business Health Summary
  4. Financial Goals & Tips
  5. Reminders
  6. Export Data/Support
  7. Loans (Coming Soon)
  0. Exit`;
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);
    const phoneNumber = params.get("phoneNumber");
    const text = params.get("text");
    const userInputs = text?.split("*");

    // Initialize state
    let currentState = "start";

    // Check user registration
    const { userExists, currentUser } = await checkUserRegistration(
      phoneNumber!
    );

    let response = "";

    if (!userExists) {
      // Handle new user registration
      const user_data = {
        phone: phoneNumber,
        name: userInputs![1] || "",
        business: userInputs![2] || "",
        location: userInputs![3] || "",
      };

      switch (currentState) {
        case "start":
          if (text === "") {
            currentState = "registration";
            response = `CON Welcome to Vihiga Business Assistant

              1. Register
              2. About Us`;
          }
          break;

        case "registration":
          if (text === "1") {
            currentState = "registerName";
            response = `CON Please enter you name: `;
          } else if (text === "2") {
            currentState = "aboutUs";
            response = `END We support MSME's in managing their finances and record keeping`;
          }
          break;

        case "registerName":
          if (userInputs!.length === 2) {
            currentState = "registerBusiness";
            response = `CON Welcome ${user_data.name},
              Please enter you business type: `;
          }
          break;

        case "registerBusiness":
          if (userInputs!.length === 3) {
            currentState = "registerLocation";
            response = `CON Please enter you location: `;
          }
          break;

        case "registerLocation":
          if (userInputs!.length === 4) {
            await database.createDocument(
              databaseID,
              userCollectionID,
              ID.unique(),
              user_data
            );

            response = `END Registration complete please dial *384*123123123# to access our services`;
          }
          break;

        default:
          response = "END Invalid Input!";
      }
    } else {
      // Handle existing user interactions
      switch (currentState) {
        case "start":
          if (text === "") {
            currentState = "mainMenu";
            response = mainMenu();
          }
          break;

        case "mainMenu":
          // Main Menu Options
          switch (userInputs![0]) {
            case "1":
              currentState = "userProfile";
              response = `CON User Profile:
                1. Enter/Edit Basic Info
                2. View Profile
                0. Back to Main Menu`;
              break;
            case "2":
              currentState = "recordKeeping";
              response = `CON Record Keeping:
                1. Log Revenue
                2. Log Expenses
                3. Inventory Management
                0. Back to Main Menu`;
              break;
            case "3":
              currentState = "businessHealthSummary";
              response = `CON Business Health Summary:
                1. View Profit/Loss
                2. Financial Health Score
                0. Main Menu`;
              break;
            case "4":
              currentState = "financialGoalsAndTips";
              response = `CON Financial Goals & Tips:
                1. Set Financial Goals
                2. Savings Advice
                3. Financial Tips
                0. Main Menu`;
              break;
            case "5":
              currentState = "reminders";
              response = `CON Reminders:
                1. Set Recurring Expense Reminder
                2. Set Custom Reminder
                0. Main Menu`;
              break;
            case "6":
              currentState = "exportDataSupport";
              response = `CON Data Export/Support:
                1. Export Data
                2. Help & Support
                0. Main Menu`;
              break;
            case "7":
              currentState = "loans";
              response = `CON Loan Information:
                This feature will be available soon.
                1. Eligibility Checker
                2. Loan Overview
                0. Main Menu`;
              break;
            case "8":
              currentState = "exit";
              response = "END Thank you for using our service!";
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "userProfile":
          // User Profile Options
          switch (userInputs![1]) {
            case "1":
              currentState = "editBasicInfo";
              response = `CON Enter your Name:`;
              break;
            case "2":
              currentState = "viewProfile";
              response = `CON User Details
                Name : ${currentUser.name}
                Business Type : ${currentUser.business}
                Location : ${currentUser.location}
                0. Back to Main Menu`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "editBasicInfo":
          if (userInputs!.length === 2) {
            currentState = "editBusiness";
            response = `CON Enter your Business Type (e.g., Retail, Farming, etc.):`;
          }
          break;

        case "editBusiness":
          if (userInputs!.length === 3) {
            currentState = "editLocation";
            response = `CON Enter your Location:`;
          }
          break;

        case "editLocation":
          if (userInputs!.length === 4) {
            currentState = "profileSaved";
            // Update user data in database
            await database.updateDocument(
              databaseID,
              userCollectionID,
              currentUser.$id,
              {
                name: userInputs![1],
                business: userInputs![2],
                location: userInputs![3],
              }
            );
            response = `CON Profile Saved!
                1. Back to Profile
                0. Main Menu`;
          }
          break;

        case "profileSaved":
          switch (userInputs![1]) {
            case "1":
              currentState = "userProfile";
              response = `CON User Profile:
                  1. Enter/Edit Basic Info
                  2. View Profile
                  0. Back to Main Menu`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "viewProfile":
          if (userInputs![1] === "0") {
            currentState = "mainMenu";
            response = mainMenu();
          } else {
            response = "END Invalid Input!";
          }
          break;

        case "recordKeeping":
          // Record Keeping Options
          switch (userInputs![1]) {
            case "1":
              currentState = "logRevenue";
              response = `CON Enter Revenue Amount (in KSh):`;
              break;
            case "2":
              currentState = "logExpenses";
              response = `CON Enter Expense Amount (in KSh):`;
              break;
            case "3":
              currentState = "inventoryManagement";
              response = `CON Inventory Management:
                  1. Add Stock
                  2. Check Inventory Levels
                  0. Back to Record Keeping`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "logRevenue":
          if (userInputs!.length === 2) {
            const amount = parseFloat(userInputs![1]);
            if (isNaN(amount) || amount <= 0) {
              response = `END Invalid amount. Please enter a positive number.`;
            } else {
              try {
                await database.createDocument(
                  databaseID,
                  recordsCollectionID,
                  ID.unique(),
                  {
                    userId: currentUser.$id,
                    type: "income",
                    amount,
                    timeStamp: new Date().toISOString(),
                  }
                );
                currentState = "revenueLogged";
                response = `CON Revenue of KSh ${amount} logged.
                    1. Back to Record Keeping
                    0. Main Menu`;
              } catch (error) {
                console.error("Error recording revenue:", error);
                response = `END Error recording revenue. Please try again later.`;
              }
            }
          }
          break;

        case "revenueLogged":
          switch (userInputs![1]) {
            case "1":
              currentState = "recordKeeping";
              response = `CON Record Keeping:
                  1. Log Revenue
                  2. Log Expenses
                  3. Inventory Management
                  0. Back to Main Menu`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "logExpenses":
          // Similar logic to logRevenue, but record as "expense" type
          // ...
          break;

        case "inventoryManagement":
          // Inventory Management Options
          switch (userInputs![1]) {
            case "1":
              currentState = "addStock";
              response = `CON Enter Stock Amount (e.g., 50 units):`;
              break;
            case "2":
              currentState = "checkInventoryLevels";
              // Implement logic to check inventory levels
              response = `END Feature not yet implemented.`;
              break;
            case "0":
              currentState = "recordKeeping";
              response = `CON Record Keeping:
                  1. Log Revenue
                  2. Log Expenses
                  3. Inventory Management
                  0. Back to Main Menu`;
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "logExpenses":
          if (userInputs!.length === 2) {
            const amount = parseFloat(userInputs![1]);
            if (isNaN(amount) || amount <= 0) {
              response = `END Invalid amount. Please enter a positive number.`;
            } else {
              try {
                await database.createDocument(
                  databaseID,
                  recordsCollectionID,
                  ID.unique(),
                  {
                    userId: currentUser.$id,
                    type: "expense", // Record as expense
                    amount,
                    timeStamp: new Date().toISOString(),
                  }
                );
                currentState = "expenseLogged";
                response = `CON Expense of KSh ${amount} logged.
                    1. Back to Record Keeping
                    0. Main Menu`;
              } catch (error) {
                console.error("Error recording expense:", error);
                response = `END Error recording expense. Please try again later.`;
              }
            }
          }
          break;

        case "expenseLogged":
          switch (userInputs![1]) {
            case "1":
              currentState = "recordKeeping";
              response = `CON Record Keeping:
                  1. Log Revenue
                  2. Log Expenses
                  3. Inventory Management
                  0. Back to Main Menu`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "inventoryManagement":
          // Inventory Management Options
          switch (userInputs![1]) {
            case "1":
              currentState = "addStock";
              response = `CON Enter Stock Amount (e.g., 50 units):`;
              break;
            case "2":
              currentState = "checkInventoryLevels";
              // Implement logic to check inventory levels
              response = `END Feature not yet implemented.`;
              break;
            case "0":
              currentState = "recordKeeping";
              response = `CON Record Keeping:
                  1. Log Revenue
                  2. Log Expenses
                  3. Inventory Management
                  0. Back to Main Menu`;
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "addStock":
          if (userInputs!.length === 2) {
            const amount = parseInt(userInputs![1], 10); // Parse to integer
            if (isNaN(amount) || amount <= 0) {
              response = `END Invalid amount. Please enter a positive number.`;
            } else {
              // Here you would typically update your inventory in the database
              // For now, let's just simulate the success message
              currentState = "stockAdded";
              response = `CON ${amount} units added to inventory.
                  1. Back to Inventory
                  0. Main Menu`;
            }
          }
          break;

        case "stockAdded":
          switch (userInputs![1]) {
            case "1":
              currentState = "inventoryManagement";
              response = `CON Inventory Management:
                  1. Add Stock
                  2. Check Inventory Levels
                  0. Back to Record Keeping`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "businessHealthSummary":
          switch (userInputs![1]) {
            case "1":
              currentState = "viewProfitLoss";
              // Fetch transactions and calculate summary
              const transactions = await fetchTransactions(
                currentUser.$id,
                "month"
              ); // Fetch for the current month
              const { totalIncome, totalExpenses, profit } =
                calculateSummary(transactions);
              response = formatSummaryResponse(
                totalIncome,
                totalExpenses,
                profit,
                0, // No savings suggestion here
                "month"
              );
              break;
            case "2":
              currentState = "financialHealthScore";
              // Implement logic to calculate and display financial health score
              response = `END Feature not yet implemented.`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;
        case "financialGoalsAndTips":
          switch (userInputs![1]) {
            case "1":
              currentState = "setFinancialGoals";
              response = `CON Enter Savings Target (in KSh):`;
              break;
            case "2":
              currentState = "savingsAdvice";
              // Calculate savings advice based on user's profit
              const transactions = await fetchTransactions(
                currentUser.$id,
                "month"
              );
              const { savingsSuggestion } = calculateSummary(transactions);
              response = `END Suggested Savings: KSh ${savingsSuggestion}
                Advice: "Save at least 10% of your profit each week."
                1. Back to Financial Goals
                0. Main Menu`;
              break;
            case "3":
              currentState = "financialTips";
              response = `END Financial Tip:
                "Track expenses closely to maximize savings."
                1. More Tips
                0. Main Menu`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "setFinancialGoals":
          if (userInputs!.length === 2) {
            const amount = parseFloat(userInputs![1]);
            if (isNaN(amount) || amount <= 0) {
              response = `END Invalid amount. Please enter a positive number.`;
            } else {
              // Here you would typically store the financial goal in the database
              currentState = "goalSet";
              response = `CON Goal of KSh ${amount} set.
                1. Back to Financial Goals
                0. Main Menu`;
            }
          }
          break;

        case "goalSet":
          switch (userInputs![1]) {
            case "1":
              currentState = "financialGoalsAndTips";
              response = `CON Financial Goals & Tips:
                1. Set Financial Goals
                2. Savings Advice
                3. Financial Tips
                0. Main Menu`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "financialTips":
          switch (userInputs![1]) {
            case "1":
              // You can add more financial tips here
              response = `END Another Financial Tip:
                "Diversify your income streams to reduce risk."
                1. More Tips
                0. Main Menu`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "reminders":
          switch (userInputs![1]) {
            case "1":
              currentState = "setRecurringExpenseReminder";
              response = `CON Enter amount for recurring expense (in KSh):`;
              break;
            case "2":
              currentState = "setCustomReminder";
              // Implement logic for setting custom reminders
              response = `END Feature not yet implemented.`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "setRecurringExpenseReminder":
          if (userInputs!.length === 2) {
            const amount = parseFloat(userInputs![1]);
            if (isNaN(amount) || amount <= 0) {
              response = `END Invalid amount. Please enter a positive number.`;
            } else {
              currentState = "setReminderInterval";
              response = `CON Enter interval (e.g., weekly, monthly):`;
            }
          }
          break;

        case "setReminderInterval":
          if (userInputs!.length === 3) {
            const interval = userInputs![2]; // You'll need to validate this input
            // Here you would store the reminder in the database
            currentState = "reminderSet";
            response = `CON Recurring reminder set for KSh ${
              userInputs![1]
            } ${interval}.
              1. Back to Reminders
              0. Main Menu`;
          }
          break;

        case "reminderSet":
          switch (userInputs![1]) {
            case "1":
              currentState = "reminders";
              response = `CON Reminders:
                1. Set Recurring Expense Reminder
                2. Set Custom Reminder
                0. Main Menu`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "exportDataSupport":
          switch (userInputs![1]) {
            case "1":
              currentState = "exportData";
              // Implement logic to export data (e.g., send data via SMS)
              response = `END Data export requested. You will receive an SMS with your data in CSV format.
                1. Back to Support
                0. Main Menu`;
              break;
            case "2":
              currentState = "helpAndSupport";
              // Implement logic for help and support
              response = `END Feature not yet implemented.`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;

        case "loans":
          switch (userInputs![1]) {
            case "1":
              currentState = "eligibilityChecker";
              response = `CON Answer a few questions to check eligibility.
                Q1: Do you have regular income? (1 for Yes, 2 for No)`;
              break;
            case "2":
              currentState = "loanOverview";
              // Implement logic for loan overview
              response = `END Feature not yet implemented.`;
              break;
            case "0":
              currentState = "mainMenu";
              response = mainMenu();
              break;
            default:
              response = "END Invalid Input!";
          }
          break;
        default:
          response = "END Invalid Input!";
      }
    }

    return new NextResponse(response, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    return new NextResponse("END An error occurred. Please try again later.", {
      headers: { "Content-Type": "text/plain" },
    });
  }
}
