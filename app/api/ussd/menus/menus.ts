import { SessionData, Stock, StockModel } from "../types";

export function mainMenu(session: SessionData) {
  const name = session.userData!.name || "there";
  return `CON Hi ${name}! Let's take care of your business today:
          1. My Profile
          2. Record Keeping
          3. Business Health Check
          4. Financial Goals & Tips
          5. Reminders
          6. Data Export/Support
          7. Loans (Coming Soon)
          0. Exit`;
}

export function registrationMenu() {
  return `CON Welcome to BizManager!
          
          I'm excited to help you manage and grow your business. Let's get started:
          1. Register Now
          2. Learn About Us
          0. Quit`;
}

export function endMenu(session: SessionData) {
  const name = session.userData!.name || "there";
  return `END Thanks so much, ${name}, for letting us be part of your business journey! 

          Whenever you're ready, dial *384*68949# to get back to your personal business assistant. 
          
          Have a wonderful day ahead!`;
}

export function profileMenu() {
  return `CON Let's look at your profile:
          1. View My Profile
          2. Update My Details
          0. Back to Main Menu`;
}

export function editMenu() {
  return `CON What would you like to update?
          1. My Name
          2. My Business Type
          3. My Location
          0. Back to Profile`;
}

export function recordKeepingMenu() {
  return `CON Let's keep your records in check:
          1. Log My Revenue
          2. Log My Expenses
          3. Manage My Inventory
          0. Back to Main Menu`;
}

export function stockRevenueMenu(stocks: StockModel) {
  if (stocks.total === 0) {
    return `CON Oops! You don’t have any stocks yet. 

            Add or update your inventory to start logging revenue. 
            
            0. Back to Record Keeping`;
  }

  let response = `CON Pick a stock to log today's revenue:\n`;
  stocks.documents.forEach((stock: Stock, index: number) => {
    response += `${index + 1}. ${stock.name}\n`;
  });
  return (response += `0. Back to Record Keeping`);
}

export function inventoryMenu() {
  return `CON Let's manage your inventory:
          1. Add New Stock
          2. Check Inventory Levels
          0. Back to Record Keeping`;
}

export function businessHealthSummaryMenu() {
  return `CON How's your business doing? Let's find out:
          1. View Profit or Loss
          2. Check Financial Health
          0. Back to Main Menu`;
}

export function financialGoalsAndTipsMenu() {
  return `CON Let's set some goals or get tips to grow:
          1. Set My Financial Goals
          2. Get Savings Advice
          3. Learn Financial Tips
          0. Back to Main Menu`;
}

export function remindersMenu() {
  return `CON Never miss a beat! Set a reminder:
          1. Add Recurring Expense Reminder
          2. Add Custom Reminder
          0. Back to Main Menu`;
}

export function exportDataSupportMenu() {
  return `CON Need your data or help? We’re here:
          1. Export My Data
          2. Help & Support
          0. Back to Main Menu`;
}

export function loansMenu() {
  return `CON Loans are coming soon!
          
          1. Check My Eligibility (Coming Soon)
          2. Learn About Loans (Coming Soon)
          0. Back to Main Menu`;
}
