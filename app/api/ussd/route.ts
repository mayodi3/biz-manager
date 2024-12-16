import { NextRequest, NextResponse } from "next/server";
import {
  database,
  ID,
  userCollectionId,
  databaseId,
  expenseCollectionId,
  revenueCollectionId,
  stockCollectionId,
} from "@/appwrite";
import {
  registrationMenu,
  endMenu,
  mainMenu,
  profileMenu,
  recordKeepingMenu,
  businessHealthSummaryMenu,
  financialGoalsAndTipsMenu,
  remindersMenu,
  exportDataSupportMenu,
  loansMenu,
  editMenu,
  stockRevenueMenu,
  inventoryMenu,
} from "./menus/menus";
import { State } from "./states/state";
import {
  checkUserRegistration,
  getCurrentStocks,
  fetchTransactions,
  calculateSummary,
  formatSummaryResponse,
} from "./utils/db_functions";
import { SessionData, StockModel } from "./types";

let sessionData: Record<string, SessionData> = {};

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);

    const { sessionId, text, phoneNumber } = Object.fromEntries(params);

    const userInput = text.split("*").pop();

    let response = "";

    let currentSession = sessionData[sessionId] || {};

    if (!currentSession) currentSession = { state: State.START, userData: {} };

    let userData = currentSession.userData;

    // state management
    const getState = () => currentSession.state;
    const setState = (newState: State) => {
      currentSession.state = newState;
    };

    const { userExists, currentUser } = await checkUserRegistration(
      phoneNumber
    );

    if (!userExists) {
      switch (getState()) {
        case State.START:
          setState(State.REGISTRATION);
          response = registrationMenu();
          break;
        case State.REGISTRATION:
          switch (userInput) {
            case "1":
              setState(State.REGISTERNAME);
              response = `CON Great! Let's begin the registration process.

                              What's your name?`;
              break;
            case "2":
              setState(State.ABOUTUS);
              response = `CON BizManager is your partner in managing finances and records for MSMEs. We empower businesses like yours to thrive. 

                              Press 0 to go back.`;
              break;
            case "0":
              setState(State.ENDMENU);
              response = endMenu(currentSession);
              break;
            default:
              response = `CON Invalid input. Please try again
                    1. Register
                    2. About Us
                    0. Quit`;
              break;
          }
          break;
        case State.ABOUTUS:
          if (userInput === "0") {
            setState(State.REGISTRATION);
            response = registrationMenu();
          } else {
            response = `CON Invalid option. 
            
                            Please press 0 to go back.`;
          }
          break;
        case State.REGISTERNAME:
          userData!.name = userInput;
          setState(State.REGISTERBUSINESS);
          response = `CON Nice to meet you, ${currentSession.userData?.name}!

                          What type of business do you run? (e.g., Retail, Trade, School, etc.)`;
          break;
        case State.REGISTERBUSINESS:
          userData!.businessType = userInput;
          setState(State.REGISTERLOCATION);
          response = `CON Got it! Managing a ${
            userData!.businessType
          } business is exciting, ${userData!.name}. 

                          Now, please share your business location.`;
          break;
        case State.REGISTERLOCATION:
          userData!.location = userInput;
          await database.createDocument(
            databaseId,
            userCollectionId,
            ID.unique(),
            {
              phone: phoneNumber,
              name: userData!.name,
              business: userData!.businessType,
              location: userData!.location,
            }
          );
          setState(State.REGISTRATIONEND);

          response = `CON Registration complete, ${userData!.name}! 

                          You're now set to manage your ${
                            userData!.businessType
                          } business effectively. 
                          What would you like to do next?
                          1. Go to Main Menu
                          2. Quit`;
          break;
        default:
          response = "END Invalid input";
          break;
      }
    } else {
      switch (currentSession.state) {
        case State.START:
          setState(State.MAINMENU);
          response = mainMenu(currentSession);
          break;
        case State.MAINMENU:
          switch (userInput) {
            case "1":
              setState(State.USERPROFILE);
              response = profileMenu();
              break;
            case "2":
              setState(State.RECORDKEEPING);
              response = recordKeepingMenu();
              break;
            case "3":
              setState(State.BUSINESSHEALTHSUMMARY);
              response = businessHealthSummaryMenu();
              break;
            case "4":
              setState(State.FINANCIALGOALSANDTIPS);
              response = financialGoalsAndTipsMenu();
              break;
            case "5":
              setState(State.REMINDERS);
              response = remindersMenu();
              break;
            case "6":
              setState(State.EXPORTDATASUPPORT);
              response = exportDataSupportMenu();
              break;
            case "7":
              setState(State.LOANS);
              response = loansMenu();
              break;
            case "0":
              setState(State.ENDMENU);
              response = endMenu(currentSession);
              break;
            default:
              response = "END Invalid Input!";
          }
          break;
        // Profile Management
        case State.USERPROFILE:
          switch (userInput) {
            case "1":
              setState(State.VIEWPROFILE);
              response = `CON User Details

                            Name : ${currentUser.name}
                            Business Type : ${currentUser.business}
                            Location : ${currentUser.location}

                            0. Back`;
              break;
            case "2":
              setState(State.EDITBASICINFO);
              response = editMenu();
              break;
            case "0":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
          }
          break;
        case State.VIEWPROFILE:
          if (userInput === "0") {
            setState(State.USERPROFILE);
            response = profileMenu();
          } else {
            response = `CON Invalid Input !

                            Name : ${currentUser.name}
                            Business Type : ${currentUser.business}
                            Location : ${currentUser.location}
                            
                            0. Back`;
          }
          break;
        case State.EDITBASICINFO:
          switch (userInput) {
            case "1":
              setState(State.EDITNAME);
              response = `CON Enter name to update:`;
              break;
            case "2":
              setState(State.EDITBUSINESS);
              response = `CON Enter new business type:`;
              break;
            case "3":
              setState(State.EDITLOCATION);
              response = `CON Enter the new location:`;
              break;
            case "0":
              setState(State.USERPROFILE);
              response = profileMenu();
              break;
          }
          break;
        case State.EDITNAME:
          userData!.name = userInput;
          setState(State.PROFILESAVED);
          await database.updateDocument(
            databaseId,
            userCollectionId,
            currentUser.$id,
            { name: userData!.name }
          );
          response = `CON Your name has been updated to ${userData!.name}
          
                          0. Back to Main Menu`;
          break;
        case State.EDITBUSINESS:
          userData!.businessType = userInput;
          setState(State.PROFILESAVED);
          await database.updateDocument(
            databaseId,
            userCollectionId,
            currentUser.$id,
            { business: userData!.businessType }
          );
          response = `CON Your business type has been updated to ${
            userData!.businessType
          }
          
                          0. Back to Main Menu`;
          break;
        case State.EDITLOCATION:
          userData!.location = userInput;
          setState(State.PROFILESAVED);
          await database.updateDocument(
            databaseId,
            userCollectionId,
            currentUser.$id,
            { location: userData!.location }
          );
          response = `CON Your location has been updated to ${
            userData!.location
          }
          
                          0. Back to Main Menu`;
          break;
        case State.PROFILESAVED:
          setState(State.MAINMENU);
          response = mainMenu(currentSession);
        // Record Keeping
        case State.RECORDKEEPING:
          switch (userInput) {
            case "1":
              setState(State.LOGREVENUE);
              const stocks: StockModel | undefined = await getCurrentStocks(
                currentUser.$id
              );
              response = stockRevenueMenu(stocks!);
              break;
            case "2":
              setState(State.LOGEXPENSES);
              response = `CON What type of expense did you have today? (e.g., Food, Tax, Water, Electricity):`;
              break;
            case "3":
              setState(State.INVENTORYMANAGEMENT);
              response = inventoryMenu();
              break;
            case "0":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
            default:
              response = `CON Invalid Input
              
              Record Keeping:
              (To be done daily)
              1. Log Revenue
              2. Log Expenses
              3. Inventory Management
              0. Back to Main Menu`;
          }
          break;
        case State.LOGREVENUE:
          const stocks: StockModel | undefined = await getCurrentStocks(
            currentUser.$id
          );
          if (stocks!.total === 0)
            response = `No stocks to lo revenue for please go back to record keeping menu and select (3. Inventory Management) to start adding stocks`;

          const stockIndex = parseInt(userInput!) - 1;

          if (userInput === "0") {
            setState(State.RECORDKEEPING);
            response = recordKeepingMenu();
          } else if (
            isNaN(stockIndex) ||
            stockIndex < 0 ||
            stockIndex >= stocks!.documents.length
          ) {
            // res = stockRevenueMenu(stocks).replace("CON ", "");
            response = `CON Invalid Input! 

                ${stockRevenueMenu(stocks!)}`;
          } else {
            userData!.selectedStock = stocks!.documents[stockIndex];
            setState(State.REVENUEAMOUNT);
            response = `CON Enter the revenue amount for ${
              stocks!.documents[stockIndex].name
            }:`;
          }
          break;
        case State.REVENUEAMOUNT:
          setState(State.REVENUEQUANTITY);
          userData!.revenueAmount = userInput;
          response = `CON Got it! Now, how much of ${
            userData!.selectedStock!.name
          } have you sold today in quantity? 

                          Enter the quantity or amount:`;
          break;
        case State.REVENUEQUANTITY:
          setState(State.REVENUELOGGED);
          userData!.revenueQuantity = userInput;

          try {
            await database.createDocument(
              databaseId,
              revenueCollectionId,
              ID.unique(),
              {
                userId: currentUser.$id,
                type: userData!.selectedStock!.name,
                amount: parseInt(userData!.revenueAmount!),
                revenueQuantity: parseInt(userData!.revenueQuantity!),
              }
            );

            const stock = userData!.selectedStock;
            const currentQuantity = stock!.quantity;

            if (currentQuantity < parseInt(userData!.revenueQuantity!)) {
              response = `END Error: You only have ${currentQuantity} ${
                stock!.name
              }(s) in stock. Cannot deduct ${stock!.revenueQuantity}.`;
              break;
            }
            if (currentQuantity === 0) {
              response = `END Error: You are out of stock for ${stock!.name}`;
              break;
            }

            const updatedQuantity =
              currentQuantity - parseInt(userData!.revenueQuantity!);

            await database.updateDocument(
              databaseId,
              stockCollectionId,
              stock!.$id,
              {
                quantity: updatedQuantity,
              }
            );

            response = `CON Revenue of Ksh. ${
              userData!.revenueAmount
            } logged successfully! ${userData!.revenueQuantity} ${
              stock!.name
            }(s) deducted from inventory.

                            1. Back to revenue logging menu
                            2. Back to Main Menu`;
          } catch (error) {
            console.error(error);
            response = `CON An error occurred while saving revenue. Please try again later`;
          }
          break;
        case State.REVENUELOGGED:
          switch (userInput) {
            case "1":
              const stocks: StockModel | undefined = await getCurrentStocks(
                currentUser.$id
              );
              setState(State.LOGREVENUE);
              response = stockRevenueMenu(stocks!);
              break;
            case "2":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
          }
          break;
        case State.LOGEXPENSES:
          userData!.expenseType = userInput;
          setState(State.EXPENSETYPE);
          response = `CON Got it! Please enter the amount you spent today on ${
            userData!.expenseType
          }:`;
          break;
        case State.EXPENSETYPE:
          userData!.expenseTypeAmount = userInput;
          setState(State.EXPENSELOGGED);
          try {
            await database.createDocument(
              databaseId,
              expenseCollectionId,
              ID.unique(),
              {
                amount: parseInt(userData!.expenseTypeAmount!),
                type: userData!.expenseType,
                userId: currentUser.$id,
              }
            );
          } catch (error) {
            console.error(error);
          }
          response = `CON Awesome! Your expense of ${
            userData!.expenseType
          } has been recorded successfully. 
              
                          What would you like to do next?
                          1. Log another expense
                          2. Back to Record Keeping`;
          break;
        case State.EXPENSELOGGED:
          switch (userInput) {
            case "1":
              setState(State.LOGEXPENSES);
              response = `CON Great! Let's log another expense. 

                              What type of expense did you have today? (e.g., Food, Tax, Water, Electricity):`;
              break;
            case "2":
              setState(State.RECORDKEEPING);
              response = recordKeepingMenu();
              break;
            default:
              response = `CON Hmm, that doesn't seem right. Let's try again. 

                              Would you like to:
                              1. Log another expense
                              2. Go back to Record Keeping`;
          }
          break;
        case State.INVENTORYMANAGEMENT:
          switch (userInput) {
            case "1":
              setState(State.STOCKNAME);
              response = `CON Let's add a new stock to your inventory. 

                              Please enter the stock name:`;
              break;
            case "2":
              setState(State.CHECKINVENTORYLEVELS);
              response = `CON Checking inventory levels isn't ready yet, but we're working on it! 

                              What would you like to do next?
                              1. Back to Inventory Management
                              2. Quit`;
              break;
            case "0":
              setState(State.RECORDKEEPING);
              response = recordKeepingMenu();
              break;
            default:
              response = `CON Hmm, I didn't get that. What would you like to do?

                              1. Add Stock
                              2. Check Inventory Levels
                              0. Back to Record Keeping`;
          }
          break;
        case State.STOCKNAME:
          setState(State.STOCKAMOUNT);
          userData!.stockName = userInput;
          response = `CON Got it! Now, how much of ${
            userData!.stockName
          } are you adding? 

                          Enter the quantity or amount:`;
          break;
        case State.STOCKAMOUNT:
          setState(State.STOCKUNITTYPE);
          userData!.stockQuantity = userInput;
          response = `CON Great! Now, what's the unit type for ${
            userData!.stockName
          }? 

                          For example:
                          - Use 'kg', 'tonnes', or 'grams' for weights.
                          - Use 'shirts', 'bricks', or 'onions' for specific items.`;
          break;
        case State.STOCKUNITTYPE:
          setState(State.STOCKUNITPRICE);
          userData!.stockUnitType = userInput;
          response = `CON Almost done! Please enter the price per ${
            userData!.stockUnitType
          }. 

                          For example:
                          - If the price is Ksh. 400 per ${
                            userData!.stockUnitType
                          }, enter 400.`;
          break;
        case State.STOCKUNITPRICE:
          setState(State.STOCKADDED);
          userData!.stockUnitPrice = userInput;
          const totalStockPrice =
            parseInt(userData!.stockQuantity!) *
            parseInt(userData!.stockUnitPrice!);
          // Record Stock in the database
          try {
            await database.createDocument(
              databaseId,
              stockCollectionId,
              ID.unique(),
              {
                name: userData!.stockName,
                quantity: parseInt(userData!.stockQuantity!),
                amount_per_unit: parseInt(userData!.stockUnitPrice!),
                measurement_scale: userData!.stockUnitType,
                userId: currentUser.$id,
              }
            );
          } catch (error) {
            console.error(error);
          }
          response = `CON Success! Your stock has been added. 

                          Details:
                          - Stock Name: ${userData!.stockName}
                          - Quantity: ${userData!.stockQuantity} ${
            userData!.stockUnitType
          }
                          - Price per ${userData!.stockUnitType}: Ksh. ${
            userData!.stockUnitPrice
          }
                          - Total Value: Ksh. ${totalStockPrice}

                          What would you like to do next?
                          1. Back to Inventory
                          0. Main Menu`;
          break;
        case State.STOCKADDED:
          if (userInput === "1") {
            setState(State.INVENTORYMANAGEMENT);
            response = inventoryMenu();
          } else if (userInput === "0") {
            setState(State.MAINMENU);
            response = mainMenu(currentSession);
          } else {
            response = `CON Hmm, I didn’t understand that. 

                            1. Add another stock
                            0. Main Menu`;
          }
          break;
        case State.CHECKINVENTORYLEVELS:
          if (userInput === "1") {
            setState(State.INVENTORYMANAGEMENT);
            response = inventoryMenu();
          } else if (userInput === "0") {
            setState(State.ENDMENU);
            response = endMenu(currentSession);
          } else {
            response = `CON Hmm, I didn't get that. What would you like to do?

                            1. Back to Inventory Management
                            2. Quit`;
          }
          break;
        // Summaries
        case State.BUSINESSHEALTHSUMMARY:
          switch (userInput) {
            case "1":
              setState(State.VIEWPROFITLOSS);
              const transactions = await fetchTransactions(
                currentUser.$id,
                "month"
              );
              const { totalIncome, totalExpenses, profit } =
                calculateSummary(transactions);
              response = formatSummaryResponse(
                totalIncome,
                totalExpenses,
                profit,
                0,
                "month"
              );
              break;
            case "2":
              setState(State.FINANCIALHEALTHSCORE);
              response = "END Feature not yet implemented";
              break;
            case "0":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
            default:
              response = "END Invalid Input";
          }
          break;
        // Goals and Tips
        case State.FINANCIALGOALSANDTIPS:
          switch (userInput) {
            case "1":
              setState(State.SETFINANCIALGOALS);
              response = `CON Enter Savings Target (in Ksh)`;
              break;
            case "2":
              setState(State.SAVINGSADVICE);
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
              setState(State.FINANCIALTIPS);
              response = `END Financial Tip:
                "Track expenses closely to maximize savings."
                1. More Tips
                0. Main Menu`;
              break;
            case "0":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
            default:
              response = `END Invalid Input!`;
              break;
          }
          break;
        case State.SETFINANCIALGOALS:
          userData!.goalAmount = userInput;
          // Save to the database
          setState(State.GOALSET);
          response = response = `CON Goal of KSh ${userData?.goalAmount} set.
                1. Back to Financial Goals
                0. Main Menu`;
          break;
        case State.GOALSET:
          switch (userInput) {
            case "1":
              setState(State.FINANCIALGOALSANDTIPS);
              response = financialGoalsAndTipsMenu();
              break;
            case "0":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
            default:
              response = "END Invalid Input!";
              break;
          }
          break;
        case State.FINANCIALTIPS:
          switch (userInput) {
            case "1":
              response = `END Another Financial Tip:
                "Diversify your income streams to reduce risk."
                1. More Tips
                0. Main Menu`;
              break;
            case "0":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
            default:
              response = "END Invalid Input!";
              break;
          }
          break;
        // Reminders
        case State.REMINDERS:
          switch (userInput) {
            case "1":
              setState(State.SETRECURRINGEXPENSEREMINDER);
              response = `CON Enter amount for recurring expense (in KSh):`;
              break;
            case "2":
              setState(State.SETCUSTOMREMINDER);
              response = `END Feature not yet implemented`;
              break;
            case "0":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
            default:
              response = `END Invalid Input!`;
          }
          break;
        case State.SETRECURRINGEXPENSEREMINDER:
          userData!.reminderAmout = userInput;
          setState(State.SETREMINDERINTERVAL);
          // Save to the database
          response = `CON Enter interval (e.g., weekly, monthly):`;
          break;
        case State.SETREMINDERINTERVAL:
          userData!.remiderInterval = State.REMINDERSET;
          response = `CON Recurring reminder set for KSh ${
            userData?.reminderAmout
          } ${userData!.remiderInterval}.
              1. Back to Reminders
              0. Main Menu`;
          break;
        case State.REMINDERSET:
          switch (userInput) {
            case "1":
              setState(State.REMINDERS);
              response = `CON Reminders:
                1. Set Recurring Expense Reminder
                2. Set Custom Reminder
                0. Main Menu`;
              break;
            case "0":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
            default:
              response = "END Invalid Input!";
              break;
          }
          break;
        // Export Data and Support
        case State.EXPORTDATASUPPORT:
          switch (userInput) {
            case "1":
              setState(State.EXPORTDATA);
              // Implement logic to export data (e.g., send data via SMS)
              response = `END Data export requested. You will receive an SMS with your data in CSV format.
                1. Back to Support
                0. Main Menu`;
              break;
            case "2":
              setState(State.HELPANDSUPPORT);
              // Implement logic for help and support
              response = `END Feature not yet implemented.`;
              break;
            case "0":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
            default:
              response = `END Invalid Input!`;
              break;
          }
          break;
        // Loans
        case State.LOANS:
          switch (userInput) {
            case "1":
              setState(State.ELIGIBILITYCHECKER);
              // To be continued with questions
              response = `CON Answer a few questions to check eligibility.
                Q1: Do you have regular income? (1 for Yes, 2 for No)`;
              break;
            case "2":
              setState(State.LOANOVERVIEW);
              response = `END Feature not yet Implemented`;
              break;
            case "0":
              setState(State.MAINMENU);
              response = mainMenu(currentSession);
              break;
            default:
              response = "END Invalid Input!";
              break;
          }
          break;
        // End of registration
        case State.REGISTRATIONEND:
          if (userInput === "1") {
            setState(State.MAINMENU);
            response = mainMenu(currentSession);
          } else if (userInput === "2") {
            setState(State.ENDMENU);
            response = endMenu(currentSession);
          } else {
            response = `CON Invalid option. Please try again:
                          0. Main Menu`;
          }
          break;
        case State.ENDMENU:
          setState(State.START);
          response = endMenu(currentSession);
          break;
        default:
          response = `END Invalid Input`;
          break;
      }
    }

    return new NextResponse(response, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error handling request:", error);
    return new NextResponse("END Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
